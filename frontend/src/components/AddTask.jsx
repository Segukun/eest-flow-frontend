
import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";

export default function AddTask({
  columnId,
  variant = "default",
  isOpen = false,
  onOpen,
  onClose,
}) {
  const { addTask } = useApp();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      return;
    }

    setTitle("");
    setErrorMessage("");
  }, [isOpen]);

  const close = () => {
    if (saving) return;

    setTitle("");
    setErrorMessage("");
    onClose?.();
  };

  const confirm = async () => {
    const taskTitle = title.trim();

    if (!taskTitle || saving) return;

    try {
      setSaving(true);
      setErrorMessage("");

      await addTask(columnId, taskTitle);

      setTitle("");
      onClose?.();
    } catch (error) {
      console.error("No se pudo crear la tarea:", error);

      setErrorMessage(
        error?.response?.data?.message ||
          "No se pudo crear la tarea. Intentá nuevamente."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    if (variant === "empty") {
      return (
        <button
          className="add-task__empty"
          type="button"
          onClick={() => onOpen?.(columnId)}
        >
          <span className="add-task__empty-icon">+</span>
          <strong>Aún no hay tareas</strong>
          <small>
            Tocá para crear la primera, o arrastrá una tarea acá
          </small>
        </button>
      );
    }

    return (
      <button
        className="add-task__trigger"
        type="button"
        onClick={() => onOpen?.(columnId)}
      >
        <span className="add-task__plus">+</span> Agregar tarea
      </button>
    );
  }

  return (
    <div className="add-task">
      <textarea
        ref={inputRef}
        className="add-task__input"
        placeholder="Título de la tarea…"
        aria-label="Título de la nueva tarea"
        value={title}
        rows={2}
        wrap="soft"
        onChange={(event) => {
          setTitle(event.target.value);
          setErrorMessage("");

          event.target.style.height = "auto";
          event.target.style.height =
            `${event.target.scrollHeight}px`;
        }}
        disabled={saving}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey)
          ) {
            event.preventDefault();
            confirm();
          }

          if (event.key === "Escape") {
            close();
          }
        }}
      />

      {errorMessage && (
        <p className="add-task__error" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="add-task__actions">
        <button
          className="btn btn--primary btn--sm"
          type="button"
          onClick={confirm}
          disabled={saving || !title.trim()}
        >
          {saving ? "Guardando..." : "✓"}
        </button>

        <button
          className="btn btn--ghost btn--sm"
          type="button"
          onClick={close}
          disabled={saving}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
