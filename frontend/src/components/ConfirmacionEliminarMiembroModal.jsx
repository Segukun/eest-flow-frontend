import { useState } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import api from "../api.js";
import ".././styles/components/ConfirmacionEliminarMiembroModal.css";

export default function ConfirmacionEliminarMiembroModal({
  miembro,
  onClose,
  onEliminado,
}) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");

  const eliminarMiembro = async () => {
    if (eliminando) return;

    try {
      setEliminando(true);
      setError("");
      await api.delete(`/api/users/${miembro.id || miembro._id}`);
      await onEliminado?.();
    } catch (err) {
      const status = err.response?.status;
      setError(
        status === 401
          ? "Tu sesión expiró. Volvé a iniciar sesión."
          : status === 403
            ? "No tenés permisos para eliminar miembros. Solo un administrador puede realizar esta acción."
            : status === 404
              ? "No se encontró el miembro. Actualizá la página e intentá nuevamente."
              : err.response?.data?.message || "No se pudo eliminar el miembro. Intentá nuevamente."
      );
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div
      className="confirmar-eliminar-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !eliminando) onClose?.();
      }}
    >
      <section
        className="confirmar-eliminar-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-eliminar-titulo"
        aria-describedby="confirmar-eliminar-descripcion"
      >
        <button
          type="button"
          className="confirmar-eliminar-cerrar"
          aria-label="Cerrar confirmación"
          onClick={onClose}
          disabled={eliminando}
        >
          <FiX />
        </button>

        <div className="confirmar-eliminar-icono">
          <FiAlertTriangle aria-hidden="true" />
        </div>
        <h2 id="confirmar-eliminar-titulo">¿Eliminar miembro?</h2>
        <p id="confirmar-eliminar-descripcion">
          ¿Seguro que querés desactivar la cuenta de <strong>{miembro.nombre || miembro.name}</strong>? <br />
          El miembro dejará de aparecer entre los integrantes activos. Esta acción no elimina físicamente sus datos.
        </p>

        {error && <p className="confirmar-eliminar-error" role="alert">{error}</p>}

        <div className="confirmar-eliminar-acciones">
          <button
            type="button"
            className="confirmar-eliminar-cancelar"
            onClick={onClose}
            disabled={eliminando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="confirmar-eliminar-confirmar"
            onClick={eliminarMiembro}
            disabled={eliminando}
          >
            {eliminando ? "Eliminando..." : "Sí, eliminar miembro"}
          </button>
        </div>
      </section>
    </div>
  );
}
