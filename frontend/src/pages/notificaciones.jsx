import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useApp } from "../context/AppContext";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";
import { formatRelativeDate } from "../components/ForoHelpers.js";
import "../styles/pages/notificaciones.css";

const PAGE_SIZE = 20;

const FILTROS = [
  { id: "all", label: "Todas" },
  { id: "unread", label: "No leídas" },
  { id: "system", label: "Sistema" },
  { id: "forum", label: "Foro" },
];

const TYPE_LABELS = {
  post_like: "Me gusta",
  post_comment: "Comentario",
  comment_reply: "Respuesta",
};

const mapNotification = (notification) => ({
  id: notification._id,
  tipo:
    TYPE_LABELS[notification.type] ??
    (notification.category === "forum" ? "Foro" : "Sistema"),
  titulo: notification.title,
  descripcion: [notification.actor?.name, notification.description]
    .filter(Boolean)
    .join(" · "),
  tiempo: formatRelativeDate(notification.createdAt),
  categoria: notification.category,
  leida: notification.read,
  link: notification.link || "",
});

const Notificaciones = () => {
  const navigate = useNavigate();
  const { reloadUnreadCount } = useApp();

  const [filtroActivo, setFiltroActivo] = useState("all");
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");

  const applyResponse = useCallback((payload, { append }) => {
    const items = (payload.notifications ?? []).map(mapNotification);

    setNotificaciones((prev) => (append ? [...prev, ...items] : items));
    setNoLeidas(payload.unreadCount ?? 0);
    setPagination(payload.pagination ?? { page: 1, totalPages: 1 });
    setError("");
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const response = await fetchNotifications({
          filter: filtroActivo,
          page: 1,
          limit: PAGE_SIZE,
        });
        if (cancelled) return;
        applyResponse(response?.data ?? {}, { append: false });
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "No se pudieron cargar las notificaciones.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [filtroActivo, applyResponse]);

  const handleFiltro = (id) => {
    if (id === filtroActivo) return;
    setLoading(true);
    setFiltroActivo(id);
  };

  const handleCargarMas = async () => {
    setLoadingMore(true);
    try {
      const response = await fetchNotifications({
        filter: filtroActivo,
        page: pagination.page + 1,
        limit: PAGE_SIZE,
      });
      applyResponse(response?.data ?? {}, { append: true });
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar las notificaciones.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleVer = async (notificacion) => {
    if (!notificacion.leida) {
      try {
        await markNotificationRead(notificacion.id);
        setNotificaciones((prev) =>
          prev.map((n) => (n.id === notificacion.id ? { ...n, leida: true } : n)),
        );
        setNoLeidas((count) => Math.max(0, count - 1));
        reloadUnreadCount();
      } catch {
        // si no se puede marcar, igual dejamos navegar
      }
    }

    if (notificacion.link) navigate(notificacion.link);
  };

  const handleMarcarTodas = async () => {
    setMarking(true);
    setError("");
    try {
      await markAllNotificationsRead();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
      reloadUnreadCount();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron marcar como leídas.");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div id="contenedorNotificaciones">
      <main id="paginaNotificaciones">
        <div className="encabezadoNotificaciones">
          <div>
            <p className="marcaNotificaciones">EEST FLOW</p>
            <h1>Notificaciones</h1>
          </div>

          {noLeidas > 0 && (
            <button
              className="botonMarcarLeidas"
              onClick={handleMarcarTodas}
              disabled={marking}
              type="button"
            >
              {marking ? "Marcando…" : "Marcar todas como leídas"}
            </button>
          )}
        </div>

        <div id="filtrosNotificaciones">
          {FILTROS.map((filtro) => (
            <button
              key={filtro.id}
              className={`filtroNotificacion ${
                filtroActivo === filtro.id ? "activo" : ""
              }`}
              onClick={() => handleFiltro(filtro.id)}
              type="button"
            >
              {filtro.label}
              {filtro.id === "unread" && noLeidas > 0 && (
                <span className="contadorNoLeidas">{noLeidas}</span>
              )}
            </button>
          ))}
        </div>

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
          ) : notificaciones.length > 0 ? (
            <>
              {notificaciones.map((notificacion) => (
                <article
                  className={`notificacion ${!notificacion.leida ? "noLeida" : ""}`}
                  key={notificacion.id}
                >
                  <div className="contenidoNotificacion">
                    <div className="cabeceraNotificacion">
                      <span className="tipoNotificacion">{notificacion.tipo}</span>

                      <span className="tiempoNotificacion">{notificacion.tiempo}</span>
                    </div>

                    <h2>{notificacion.titulo}</h2>

                    {notificacion.descripcion && (
                      <p className="descripcionNotificacion">
                        {notificacion.descripcion}
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
              ))}

              {pagination.page < pagination.totalPages && (
                <button
                  className="botonCargarMas"
                  onClick={handleCargarMas}
                  disabled={loadingMore}
                  type="button"
                >
                  {loadingMore ? "Cargando…" : "Cargar más"}
                </button>
              )}
            </>
          ) : (
            <div className="sinNotificaciones">
              <h2>No hay notificaciones</h2>
              <p>No se encontraron notificaciones en esta categoría.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Notificaciones;
