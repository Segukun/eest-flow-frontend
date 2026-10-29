import { useEffect, useState } from "react";
import "../styles/components/DeleteForoPostModal.css";

export default function DeleteForoPostModal({ open, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Al abrir: limpia el estado y bloquea el scroll del fondo
  useEffect(() => {
    if (!open) return undefined;

    setDeleting(false);
    setError(null);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Cerrar con Escape (si no está eliminando)
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !deleting) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, deleting, onClose]);

  if (!open) return null;

  const confirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.message || "No se pudo eliminar la publicación.",
      );
      setDeleting(false);
    }
  };

  return (
    <div
      className="delete-post-overlay"
      onClick={() => {
        if (!deleting) onClose();
      }}
    >
      <div
        className="delete-post-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-post-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="delete-post-modal__icon">⚠</span>
        <h2 id="delete-post-title">Eliminar publicación</h2>
        <p>
          ¿Está seguro que desea eliminar <strong>esta publicación</strong>?
          Esta acción no se puede deshacer.
        </p>

        {error && <p className="delete-post-modal__error">{error}</p>}

        <div className="delete-post-modal__actions">
          <button
            type="button"
            className="delete-post-modal__btn delete-post-modal__btn--ghost"
            onClick={onClose}
            disabled={deleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="delete-post-modal__btn delete-post-modal__btn--danger"
            onClick={confirm}
            disabled={deleting}
          >
            {deleting ? "Eliminando…" : "🗑 Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}