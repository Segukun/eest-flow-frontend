
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { useApp } from "../context/AppContext";
import { useToast } from "../components/Toast.jsx";

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";

import {
  resolveSectorJoinRequest,
} from "../api/sectors";

import { formatRelativeDate } from "../components/ForoHelpers.js";
import { notificationPresentation } from "../notificationPresentation.js";

import "../styles/pages/notificaciones.css";

const PAGE_SIZE = 20;

const FILTROS = [
  { id: "all", label: "Todas" },
  { id: "unread", label: "No leídas" },
  { id: "system", label: "Sistema" },
  { id: "forum", label: "Foro" },
  { id: "task", label: "Tareas" },
];

const mapNotification = (notification) => ({
  id: notification._id,
  type: notification.type,
  titulo: notification.title,

  descripcion: [
    notification.type === "sector_join_request"
      ? null
      : notification.actor?.name,
    notification.description,
  ]
    .filter(Boolean)
    .join(" · "),

  tiempo: formatRelativeDate(notification.createdAt),
  categoria: notification.category,
  leida: notification.read,
  link: notification.link || "",

  joinRequestId:
    notification.joinRequest?._id ??
    notification.joinRequest ??
    null,

  actionStatus: notification.actionStatus ?? null,

  requestedUser: notification.joinRequest?.user ?? null,
  requestedSector: notification.joinRequest?.sector ?? null,
});

const Notificaciones = () => {
  const navigate = useNavigate();

  const { reloadUnreadCount } = useApp();

  const toast = useToast();

  const openingIds = useRef(new Set());
  const resolvingRequestIds = useRef(new Set());

  const [resolvingRequest, setResolvingRequest] =
    useState(null);

  const [filtroActivo, setFiltroActivo] = useState("all");

  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [marking, setMarking] = useState(false);

  const [error, setError] = useState("");

  /* ---------------------------------------------------------
     ACTUALIZAR ESTADO GLOBAL
  --------------------------------------------------------- */

  const applyResponse = useCallback(
    (payload, { append }) => {
      const items = (payload.notifications ?? []).map(
        mapNotification
      );

      setNotificaciones((prev) =>
        append ? [...prev, ...items] : items
      );

      setNoLeidas(payload.unreadCount ?? 0);

      setPagination(
        payload.pagination ?? {
          page: 1,
          totalPages: 1,
        }
      );

      setError("");

      // Sincroniza el globito del sidebar.
      reloadUnreadCount();
    },
    [reloadUnreadCount]
  );

  /* ---------------------------------------------------------
     CARGAR NOTIFICACIONES
  --------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetchNotifications({
          filter: filtroActivo,
          page: 1,
          limit: PAGE_SIZE,
        });

        if (cancelled) return;

        applyResponse(response?.data ?? {}, {
          append: false,
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "No se pudieron cargar las notificaciones."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [filtroActivo, applyResponse]);

  /* ---------------------------------------------------------
     SINCRONIZACIÓN AUTOMÁTICA
  --------------------------------------------------------- */

  const refreshNotifications = useCallback(async () => {
    // Sincroniza todas las páginas que el administrador
    // ya había abierto, sin devolverlo a la primera.

    const pagesToRefresh = Array.from(
      {
        length: Math.max(1, pagination.page),
      },
      (_, index) => index + 1
    );

    const responses = await Promise.all(
      pagesToRefresh.map((page) =>
        fetchNotifications({
          filter: filtroActivo,
          page,
          limit: PAGE_SIZE,
        })
      )
    );

    const payloads = responses.map(
      (response) => response?.data ?? {}
    );

    const latestPayload =
      payloads[payloads.length - 1] ?? {};

    applyResponse(
      {
        notifications: payloads.flatMap(
          (payload) => payload.notifications ?? []
        ),

        unreadCount: payloads[0]?.unreadCount ?? 0,

        pagination:
          latestPayload.pagination ?? {
            page: 1,
            totalPages: 1,
          },
      },
      {
        append: false,
      }
    );
  }, [
    filtroActivo,
    pagination.page,
    applyResponse,
  ]);

  // Mantiene sincronizadas las solicitudes que otro
  // administrador pudo resolver desde otra sesión.
  useEffect(() => {
    if (loading) return undefined;

    const intervalId = setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      refreshNotifications().catch((error) => {
        console.warn(
          "No se pudieron sincronizar las notificaciones:",
          error
        );
      });
    }, 10000);

    return () => clearInterval(intervalId);
  }, [loading, refreshNotifications]);

  /* ---------------------------------------------------------
     ACEPTAR / RECHAZAR SOLICITUD
  --------------------------------------------------------- */

  const handleSectorRequestDecision = async (
    notification,
    decision
  ) => {
    const requestId = notification.joinRequestId;

    if (
      !requestId ||
      resolvingRequestIds.current.has(requestId)
    ) {
      return;
    }

    resolvingRequestIds.current.add(requestId);
    setResolvingRequest(requestId);

    try {
      await resolveSectorJoinRequest(
        requestId,
        decision
      );

      toast.success(
        decision === "approved"
          ? "Solicitud aceptada. Se agregó al usuario al sector."
          : "Solicitud rechazada."
      );

      await refreshNotifications();
      await reloadUnreadCount();
    } catch (error) {
      if (error.response?.status === 409) {
        toast.info(
          "Otro administrador ya resolvió esta solicitud. Se actualizó la notificación."
        );
      } else {
        toast.error(
          error.response?.data?.message ||
            "No se pudo resolver la solicitud. Intentá nuevamente."
        );
      }

      // Si otro administrador ganó la operación,
      // mostramos el estado actualizado del servidor.
      await refreshNotifications().catch(() => {});
    } finally {
      resolvingRequestIds.current.delete(requestId);
      setResolvingRequest(null);
    }
  };

  /* ---------------------------------------------------------
     FILTROS
  --------------------------------------------------------- */

  const handleFiltro = (id) => {
    if (id === filtroActivo) return;

    setError("");
    setLoading(true);
    setFiltroActivo(id);
  };

  /* ---------------------------------------------------------
     PAGINACIÓN
  --------------------------------------------------------- */

  const handleCargarMas = async () => {
    if (
      loadingMore ||
      pagination.page >= pagination.totalPages
    ) {
      return;
    }

    setLoadingMore(true);
    setError("");

    try {
      const response = await fetchNotifications({
        filter: filtroActivo,
        page: pagination.page + 1,
        limit: PAGE_SIZE,
      });

      applyResponse(response?.data ?? {}, {
        append: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "No se pudieron cargar las notificaciones."
      );
    } finally {
      setLoadingMore(false);
    }
  };

  /* ---------------------------------------------------------
     VER NOTIFICACIÓN
  --------------------------------------------------------- */

  const handleVer = async (notificacion) => {
    if (openingIds.current.has(notificacion.id)) {
      return;
    }

    openingIds.current.add(notificacion.id);

    try {
      if (!notificacion.leida) {
        try {
          await markNotificationRead(notificacion.id);

          setNotificaciones((prev) =>
            prev.map((n) =>
              n.id === notificacion.id
                ? { ...n, leida: true }
                : n
            )
          );

          setNoLeidas((count) =>
            Math.max(0, count - 1)
          );

          // La sincronización global no debe demorar
          // la navegación.
          void reloadUnreadCount();
        } catch (err) {
          console.error(
            "No se pudo marcar la notificación como leída:",
            err
          );

          toast.error(
            "No se pudo marcar la notificación como leída. Podés volver a intentarlo desde Notificaciones."
          );
        }
      }

      if (notificacion.link) {
        navigate(notificacion.link);
      }
    } finally {
      openingIds.current.delete(notificacion.id);
    }
  };

  /* ---------------------------------------------------------
     MARCAR TODAS COMO LEÍDAS
  --------------------------------------------------------- */

  const handleMarcarTodas = async () => {
    if (marking) return;

    setMarking(true);
    setError("");

    try {
      await markAllNotificationsRead();

      setNotificaciones((prev) =>
        prev.map((n) => ({
          ...n,
          leida: true,
        }))
      );

      setNoLeidas(0);

      await reloadUnreadCount();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "No se pudieron marcar como leídas."
      );
    } finally {
      setMarking(false);
    }
  };

  const notificacionesVisibles =
    filtroActivo === "unread"
      ? notificaciones.filter(
          (notificacion) => !notificacion.leida
        )
      : notificaciones;

  /* ---------------------------------------------------------
     RENDER
  --------------------------------------------------------- */

  return (
    <div id="contenedorNotificaciones">
      <main id="paginaNotificaciones">

        {/* Encabezado */}

        <div className="encabezadoNotificaciones">
          <div>
            <h1>Notificaciones</h1>
          </div>

          {noLeidas > 0 && (
            <button
              className="botonMarcarLeidas"
              onClick={handleMarcarTodas}
              disabled={marking}
              type="button"
            >
              {marking
                ? "Marcando…"
                : "Marcar todas como leídas"}
            </button>
          )}
        </div>

        {/* Filtros */}

        <div id="filtrosNotificaciones">
          {FILTROS.map((filtro) => (
            <button
              key={filtro.id}
              className={
                `filtroNotificacion ${
                  filtroActivo === filtro.id ? "activo" : ""
                }`
              }
              onClick={() => handleFiltro(filtro.id)}
              type="button"
            >
              {filtro.label}

              {filtro.id === "unread" && noLeidas > 0 && (
                <span className="contadorNoLeidas">
                  {noLeidas}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lista */}

        <section className="listaNotificaciones">
          {loading ? (
            <div className="sinNotificaciones">
              <h2>Cargando notificaciones…</h2>
            </div>
          ) : error ? (
            <div className="sinNotificaciones">
              <h2>Algo salió mal</h2>
              <p>{error}</p>
            </div>
          ) : (
            notificacionesVisibles.length > 0 ||
            pagination.page < pagination.totalPages
          ) ? (
            <>
              {notificacionesVisibles.map((notificacion) => {
                const presentation =
                  notificationPresentation(
                    notificacion.categoria,
                    notificacion.type,
                    notificacion.leida
                  ) ?? {};

                return (
                  <article
                    className={
                      presentation.className || "notificacion"
                    }
                    key={notificacion.id}
                  >
                    <div className="contenidoNotificacion">
                      <div className="cabeceraNotificacion">
                        <span className="tipoNotificacion">
                          {notificacion.type === "sector_join_request"
                            ? "SOLICITUD DE ACCESO"
                            : notificacion.type === "movement"
                              ? "MOVIMIENTO"
                              : presentation.label || "SISTEMA"}
                        </span>

                        {!notificacion.leida && (
                          <span className="indicadorNoLeida">
                            No leída
                          </span>
                        )}

                        <span className="tiempoNotificacion">
                          {notificacion.tiempo}
                        </span>
                      </div>

                      <h2>{notificacion.titulo}</h2>

                      {notificacion.descripcion && (
                        <p className="descripcionNotificacion">
                          {notificacion.descripcion}
                        </p>
                      )}

                      {/* Acciones de solicitudes */}

                      {notificacion.type === "sector_join_request" &&
                        notificacion.actionStatus === "pending" && (
                          <div className="accionesSolicitudSector">
                            <button
                              type="button"
                              className="accionSolicitudSector accionSolicitudSector--reject"
                              onClick={() =>
                                handleSectorRequestDecision(
                                  notificacion,
                                  "rejected"
                                )
                              }
                              disabled={resolvingRequest !== null}
                            >
                              {resolvingRequest ===
                              notificacion.joinRequestId
                                ? "Procesando…"
                                : "Rechazar"}
                            </button>

                            <button
                              type="button"
                              className="accionSolicitudSector accionSolicitudSector--approve"
                              onClick={() =>
                                handleSectorRequestDecision(
                                  notificacion,
                                  "approved"
                                )
                              }
                              disabled={resolvingRequest !== null}
                            >
                              {resolvingRequest ===
                              notificacion.joinRequestId
                                ? "Procesando…"
                                : "Aceptar"}
                            </button>
                          </div>
                        )}

                      {/* Estado después de resolver */}

                      {notificacion.type === "sector_join_request" &&
                        notificacion.actionStatus &&
                        notificacion.actionStatus !== "pending" && (
                          <p className="estadoSolicitudSector">
                            {notificacion.actionStatus === "approved"
                              ? "Solicitud aceptada"
                              : notificacion.actionStatus === "rejected"
                                ? "Solicitud rechazada"
                                : "Solicitud cancelada"}
                          </p>
                        )}
                    </div>

                    <button
                      className="botonVerNotificacion"
                      onClick={() => handleVer(notificacion)}
                      type="button"
                    >
                      Ver <span>›</span>
                    </button>
                  </article>
                );
              })}

              {pagination.page < pagination.totalPages && (
                <button
                  className="botonCargarMas"
                  onClick={handleCargarMas}
                  disabled={loadingMore}
                  type="button"
                >
                  {loadingMore
                    ? "Cargando…"
                    : "Cargar más"}
                </button>
              )}
            </>
          ) : (
            <div className="sinNotificaciones">
              <h2>No hay notificaciones</h2>

              <p>
                No se encontraron notificaciones en esta categoría.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Notificaciones;
