import { useEffect, useRef, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { useApp } from "../context/AppContext";
import useSubmitGuard from "../hooks/useSubmitGuard";
import { MAX_TASK_TITLE_LENGTH, taskDraftKey } from "../taskDrafts.js";

export default function AddTask({
  columnId,
  variant = "default",
  isOpen = false,
  onOpen,
  onClose,
}) {
  const { addTask, activeCategory, taskDrafts, setTaskDraft } = useApp();
  const draftKey = taskDraftKey(activeCategory, columnId);
  const title = taskDrafts[draftKey] ?? "";
  const [error, setError] = useState(null);
  const errorMessage = error?.key === draftKey ? error.message : "";
  const inputRef = useRef(null);
  const formRef = useRef(null);
  const categoryRef = useRef(activeCategory);
  const guard = useSubmitGuard(1000);

  useEffect(() => {
    categoryRef.current = activeCategory;
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen, activeCategory]);

  useEffect(() => {
    if (!isOpen || guard.pending) return;
    const closeOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        onClose?.();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [isOpen, guard.pending, onClose]);

  useEffect(() => {
    const input = inputRef.current;
    if (!isOpen || !input) return;
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }, [isOpen, title]);

  const close = () => {
    if (guard.pending) return;

    setError(null);
    onClose?.();
  };

  const confirm = async () => {
    const taskTitle = title.trim();
    if (!taskTitle || title.length > MAX_TASK_TITLE_LENGTH || !activeCategory) return;

    // si ya hay un envío en curso o en cooldown, run() lo ignora
    await guard.run(async () => {
      try {
        setError(null);
        await addTask(columnId, taskTitle);

        setTaskDraft(activeCategory, columnId, "");
        if (categoryRef.current === activeCategory) onClose?.();
      } catch (error) {
        console.error("No se pudo crear la tarea:", error);

        setError({
          key: draftKey,
          message: error?.response?.data?.message ||
            "No se pudo crear la tarea. Intentá nuevamente.",
        });
      }
    });
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
    <div className="add-task" ref={formRef} aria-busy={guard.pending}>
      <textarea
        ref={inputRef}
        className="add-task__input"
        placeholder="Título de la tarea…"
        aria-label="Título de la nueva tarea"
        value={title}
        maxLength={MAX_TASK_TITLE_LENGTH}
        rows={2}
        wrap="soft"
        onChange={(event) => {
          setTaskDraft(activeCategory, columnId, event.target.value);
          setError(null);
        }}
        disabled={guard.pending}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
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
        <small
          className="add-task__remaining"
          aria-label={`${MAX_TASK_TITLE_LENGTH - title.length} caracteres restantes`}
        >
          {MAX_TASK_TITLE_LENGTH - title.length}
        </small>
        <button
          className="add-task__confirm"
          type="button"
          aria-label={guard.pending ? "Creando tarea" : "Crear tarea"}
          title="Crear tarea"
          onClick={confirm}
          disabled={guard.busy || !title.trim() || !activeCategory}
        >
          <FiCheck aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
