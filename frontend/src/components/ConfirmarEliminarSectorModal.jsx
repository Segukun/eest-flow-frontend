import { useState } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import "../styles/components/ConfirmarEliminarSectorModal.css";

const obtenerMensajeError = (err) => {
  const status = err.response?.status;

  switch (status) {
    case 401:
      return "Tu sesión expiró. Volvé a iniciar sesión.";
    case 403:
      return "No tenés permisos para eliminar este sector.";
    case 404:
      return "No se encontró el sector. Actualizá la página e intentá nuevamente.";
    case 409:
      return "No se puede eliminar un sector que todavía tiene miembros activos. Reasignalos primero.";
    default:
      return "No se pudo eliminar el sector. Intentá nuevamente.";
  }
};

export default function ConfirmarEliminarSectorModal({
  sector,
  onClose,
  onConfirm,
}) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (eliminando) return;

    try {
      setEliminando(true);
      setError("");
      await onConfirm();
    } catch (err) {
      console.error("Error al eliminar sector:", err);
      setError(obtenerMensajeError(err));
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div
      className="eliminar-sector-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !eliminando) onClose?.();
      }}
    >
      <section
        className="eliminar-sector-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="eliminar-sector-titulo"
        aria-describedby="eliminar-sector-descripcion"
      >
        <button
          type="button"
          className="eliminar-sector-cerrar"
          aria-label="Cerrar confirmación"
          onClick={onClose}
          disabled={eliminando}
        >
          <FiX />
        </button>

        <div className="eliminar-sector-icono">
          <FiAlertTriangle aria-hidden="true" />
        </div>

        <h2 id="eliminar-sector-titulo">¿Eliminar sector?</h2>

        <p id="eliminar-sector-descripcion">
          ¿Eliminar el sector <strong>{sector.nombre}</strong>?
        </p>

        {error && (
          <p className="eliminar-sector-error" role="alert">
            {error}
          </p>
        )}

        <div className="eliminar-sector-acciones">
          <button
            type="button"
            className="eliminar-sector-cancelar"
            onClick={onClose}
            disabled={eliminando}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="eliminar-sector-confirmar"
            onClick={handleConfirm}
            disabled={eliminando}
          >
            {eliminando ? "Eliminando..." : "Sí, eliminar sector"}
          </button>
        </div>
      </section>
    </div>
  );
}