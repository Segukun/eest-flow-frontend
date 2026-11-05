import { IoTrashBin } from "react-icons/io5";
import "../styles/components/archived-tasks-modal.css";

/**
 * target: { mode: "single" | "selected" | "all", count, title, attachmentCount }
 */
export default function DeleteArchivedTaskModal({
  target,
  categoryName,
  loading = false,
  error = null,
  onClose,
  onConfirm,
}) {
  const { mode, count, title, attachmentCount = 0 } = target;

  const heading =
    mode === "all"
      ? "Vaciar archivero"
      : mode === "selected"
        ? "Eliminar tareas seleccionadas"
        : "Eliminar definitivamente";

  const confirmLabel =
    mode === "all"
      ? "Vaciar"
      : mode === "selected"
        ? `Eliminar ${count}`
        : "Eliminar";

  const loadingLabel = mode === "all" ? "Vaciando…" : "Eliminando…";

  const files =
    attachmentCount > 0
      ? ` y también se borrarán ${attachmentCount} ${attachmentCount === 1 ? "archivo adjunto" : "archivos adjuntos"}.`
      : ".";

  return (
    <div
      className="modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <div
        className="delete-archived-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-archived-title"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="delete-archived-modal__icon">
          <IoTrashBin />
        </span>

        <h2 id="delete-archived-title">{heading}</h2>

        {mode === "single" && (
          <p>
            Vas a eliminar <strong>permanentemente</strong> la tarea{" "}
            <strong className="delete-archived-modal__name">{title}</strong>.
          </p>
        )}

        {mode === "selected" && (
          <p>
            Vas a eliminar{" "}
            <strong className="delete-archived-modal__name">
              todas las tareas seleccionadas
            </strong>{" "}
            ({count}) de forma <strong>permanente</strong>.
          </p>
        )}

        {mode === "all" && (
          <p>
            Vas a vaciar el archivero
            {categoryName ? (
              <>
                {" "}de <strong className="delete-archived-modal__name">{categoryName}</strong>
              </>
            ) : null}
            : se eliminarán <strong>permanentemente</strong> las {count} tareas archivadas.
          </p>
        )}

        <p className="delete-archived-modal__warning">
          Esta acción no se puede deshacer{files}
        </p>

        {error && (
          <p className="delete-archived-modal__error" role="alert">
            {error}
          </p>
        )}

        <div className="delete-archived-modal__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="btn btn--danger-solid"
            onClick={onConfirm}
            disabled={loading}
          >
            <IoTrashBin />
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}