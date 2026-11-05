import { IoTrashBin } from "react-icons/io5";
import "../styles/components/archived-tasks-modal.css";

export default function DeleteArchivedTaskModal({
  task,
  loading = false,
  error = null,
  onClose,
  onConfirm,
}) {
  const files = task.attachmentCount ?? 0;

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

        <h2 id="delete-archived-title">Eliminar definitivamente</h2>

        <p>
          Vas a eliminar <strong>permanentemente</strong> la tarea{" "}
          <strong className="delete-archived-modal__name">{task.title}</strong>.
        </p>

        <p className="delete-archived-modal__warning">
          Esta acción no se puede deshacer
          {files > 0
            ? ` y también se borrarán ${files} ${files === 1 ? "archivo adjunto" : "archivos adjuntos"}.`
            : "."}
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
            {loading ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}