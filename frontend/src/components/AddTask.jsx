import { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";

export default function AddTask({ columnId, variant = "default" }) {
  const { addTask } = useApp();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const confirm = () => {
    const t = title.trim();
    if (!t) return;
    addTask(columnId, t);
    setTitle("");
    inputRef.current?.focus();
  };

  if (!open) {
    if (variant === "empty") {
      return (
        <button className="add-task__empty" onClick={() => setOpen(true)}>
          <span className="add-task__empty-icon">+</span>
          <strong>Aún no hay tareas</strong>
          <small>Tocá para crear la primera, o arrastrá una tarea acá</small>
        </button>
      );
    }

    return (
      <button className="add-task__trigger" onClick={() => setOpen(true)}>
        <span className="add-task__plus">+</span> Agregar tarea
      </button>
    );
  }

  return (
    <div className="add-task">
      <input
        ref={inputRef}
        className="add-task__input"
        placeholder="Título de la tarea…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirm();
          if (e.key === "Escape") { setOpen(false); setTitle(""); }
        }}
      />
      <div className="add-task__actions">
        <button className="btn btn--primary btn--sm" onClick={confirm}>✓</button>
        <button className="btn btn--ghost btn--sm" onClick={() => { setOpen(false); setTitle(""); }}>✕</button>
      </div>
    </div>
  );
}