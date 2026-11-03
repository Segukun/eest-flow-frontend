import { useState } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import "../styles/components/ConfirmacionQuitarMiembroModal.css";

export default function ConfirmacionQuitarMiembroModal({
  miembro,
  sectorNombre,
  onClose,
  onConfirm,
}) {
  const [quitando, setQuitando] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (quitando) return;

    try {
      setQuitando(true);
      setError("");
      await onConfirm();
    } catch (err) {
      const status = err.response?.status;

      setError(
        status === 401
          ? "Tu sesión expiró. Volvé a iniciar sesión."
          : status === 403
            ? "No tenés permisos para modificar este usuario."
            : status === 404
              ? "No se encontró el miembro. Actualizá la página e intentá nuevamente."
              : err.response?.data?.message ||
                err.message ||
                "No se pudo quitar el miembro del sector."
      );
    } finally {
      setQuitando(false);
    }
  };

  return (
    <div
      className="quitar-miembro-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !quitando) onClose?.();
      }}
    >
      <section
        className="quitar-miembro-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quitar-miembro-titulo"
        aria-describedby="quitar-miembro-descripcion"
      >
        <button
          type="button"
          className="quitar-miembro-cerrar"
          aria-label="Cerrar confirmación"
          onClick={onClose}
          disabled={quitando}
        >
          <FiX />
        </button>

        <div className="quitar-miembro-icono">
          <FiAlertTriangle aria-hidden="true" />
        </div>

        <h2 id="quitar-miembro-titulo">¿Quitar miembro?</h2>

        <p id="quitar-miembro-descripcion">
          ¿Quitar a <strong>{miembro.nombre}</strong> de este sector
          {sectorNombre ? (
            <>
              {" "}
              (<strong>{sectorNombre}</strong>)
            </>
          ) : null}
          ?
        </p>

        {error && (
          <p className="quitar-miembro-error" role="alert">
            {error}
          </p>
        )}

        <div className="quitar-miembro-acciones">
          <button
            type="button"
            className="quitar-miembro-cancelar"
            onClick={onClose}
            disabled={quitando}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="quitar-miembro-confirmar"
            onClick={handleConfirm}
            disabled={quitando}
          >
            {quitando ? "Quitando..." : "Sí, quitar miembro"}
          </button>
        </div>
      </section>
    </div>
  );
}