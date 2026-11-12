import { FiLogOut } from "react-icons/fi";

export default function LeaveSectorModal({
  sector,
  currentSectorCount,
  busy,
  onClose,
  onConfirm,
}) {
  if (!sector) return null;

  const onlySector = currentSectorCount <= 1;

  return (
    <div
      className="gs-leave-overlay"
      onClick={(event) => {
        if (
          event.target === event.currentTarget &&
          !busy
        ) {
          onClose();
        }
      }}
    >
      <div
        className="gs-leave-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gs-leave-title"
      >
        <div className="gs-leave-dialog__icon">
          <FiLogOut />
        </div>

        <h2 id="gs-leave-title">
          Abandonar sector
        </h2>

        <p>
          ¿Seguro que querés dejar{" "}
          <strong>{sector.nombre}</strong>?
          Podrías perder acceso a categorías y tareas
          vinculadas únicamente a este sector.
        </p>

        {onlySector && (
          <p className="gs-leave-dialog__warning">
            No podés abandonar tu único sector.
          </p>
        )}

        <div className="gs-leave-dialog__actions">
          <button
            type="button"
            className="gs-leave-dialog__cancel"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="gs-leave-dialog__confirm"
            onClick={onConfirm}
            disabled={busy || onlySector}
          >
            {busy ? "Procesando…" : "Sí, abandonar"}
          </button>
        </div>
      </div>
    </div>
  );
}