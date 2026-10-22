import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/notification";
import { useNotifications } from "../context/NotificationsContext";
import "../styles/pages/notificaciones.css";

const POLL_INTERVAL_MS = 10000;

const TYPE_LABELS = {
  task_assigned: "Tarea asignada",
  task_due_soon: "Vencimiento próximo",
  task_overdue: "Vencimiento",
  sector_changed: "Gestión de sectores",
  post_pinned: "Comunidad escolar",
  post_comment: "Foro",
  comment_reply: "Foro",
  post_like: "Foro",
};

const FILTERS = ["Todas", "No leídas", "Tareas", "Sistema", "Foro"];
const CATEGORY_OF_FILTER = { Tareas: "task", Sistema: "system", Foro: "forum" };

function formatRelative(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} d`;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const Notificaciones = () => {
  const navigate = useNavigate();
  const { refreshUnreadCount } = useNotifications();

  const [filtroActivo, setFiltroActivo] = useState("Todas");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const signature = useRef("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const result = await fetchNotifications({ filter: "all", limit: 50 });
      const sig = JSON.stringify(result.notifications);
      if (silent && sig === signature.current) return; // sin cambios: no re-renderiza
      signature.current = sig;
      setNotifications(result.notifications);
    } catch (err) {
      if (!silent) {
        setError(err?.response?.data?.message || "No se pudieron cargar las notificaciones.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const refresh = () => {
      if (document.visibilityState === "visible") load({ silent: true });
    };
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  const cantidadNoLeidas = notifications.filter((n) => !n.read).length;

  const filtradas = notifications.filter((n) => {
    if (filtroActivo === "Todas") return true;
    if (filtroActivo === "No leídas") return !n.read;
    return n.category === CATEGORY_OF_FILTER[filtroActivo];
  });

  const handleVer = async (notification) => {
    if (!notification.read) {
      // actualización optimista y luego confirmamos con el backend
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n)),
      );
      try {
        await markNotificationRead(notification._id);
      } catch {
        // si falla, el próximo polling restaura el estado real
      }
      refreshUnreadCount();
    }
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAll = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      load({ silent: true });
    }
    refreshUnreadCount();
  };

  return (
    <div id="contenedorNotificaciones">
      <main id="paginaNotificaciones">
        <div className="encabezadoNotificaciones">
          <div>
            <p className="marcaNotificaciones">EEST FLOW</p>
            <h1>Notificaciones</h1>
          </div>
          {cantidadNoLeidas > 0 && (
            <button className="filtroNotificacion" onClick={handleMarkAll}>
              Marcar todas como leídas
            </button>
          )}
        </div>

        <div id="filtrosNotificaciones">
          {FILTERS.map((nombre) => (
            <button
              key={nombre}
              className={`filtroNotificacion ${filtroActivo === nombre ? "activo" : ""}`}
              onClick={() => setFiltroActivo(nombre)}
            >
              {nombre}
              {nombre === "No leídas" && cantidadNoLeidas > 0 && (
                <span className="contadorNoLeidas">{cantidadNoLeidas}</span>
              )}
            </button>
          ))}
        </div>

        <section className="listaNotificaciones">
          {loading ? (
            <div className="sinNotificaciones"><p>Cargando notificaciones…</p></div>
          ) : error ? (
            <div className="sinNotificaciones">
              <h2>No se pudieron cargar</h2>
              <p>{error}</p>
              <button className="filtroNotificacion" style={{ margin: "14px auto 0" }} onClick={() => load()}>
                Reintentar
              </button>
            </div>
          ) : filtradas.length > 0 ? (
            filtradas.map((n) => (
              <article key={n._id} className={`notificacion ${!n.read ? "noLeida" : ""}`}>
                <div className="contenidoNotificacion">
                  <div className="cabeceraNotificacion">
                    <span className="tipoNotificacion">{TYPE_LABELS[n.type] ?? "Sistema"}</span>
                    <span className="tiempoNotificacion">{formatRelative(n.createdAt)}</span>
                  </div>
                  <h2>{n.title}</h2>
                  {n.description && <p className="descripcionNotificacion">{n.description}</p>}
                </div>

                <button className="botonVerNotificacion" onClick={() => handleVer(n)}>
                  Ver <span>›</span>
                </button>
              </article>
            ))
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