import { FiX } from "react-icons/fi";
import { CiMapPin } from "react-icons/ci";
import "../styles/components/ConfirmPinModal.css";

export default function ConfirmPinModal({
  open,
  pinned,
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  const title = pinned
    ? "¿Anclar esta publicación?"
    : "¿Desanclar esta publicación?";

  const description = pinned
    ? "Esta publicación quedará fijada al principio del foro. Si hay otra publicación anclada, se desanclará automáticamente."
    : "La publicación dejará de estar anclada y volverá a ordenarse junto con las demás.";

  return (
    <div
      className="foro-pin-backdrop"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <section
        className="foro-pin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="foro-pin-title"
      >
        <button
          type="button"
          className="foro-pin-close"
          onClick={onClose}
          disabled={loading}
          aria-label="Cerrar"
        >
          <FiX />
        </button>

        <div className="foro-pin-icon">
          <CiMapPin />
        </div>

        <h2 id="foro-pin-title">
          {title}
        </h2>

        <p>{description}</p>

        <div className="foro-pin-actions">
          <button
            type="button"
            className="foro-pin-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="foro-pin-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? "Guardando..."
              : pinned
                ? "Pinear publicación"
                : "Quitar pin"}
          </button>
        </div>
      </section>
    </div>
  );
}