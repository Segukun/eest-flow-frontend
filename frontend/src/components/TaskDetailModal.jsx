import { useState } from "react";
import { useApp, PRIORITIES } from "../context/AppContext";
import { IoPencil, IoCheckmark, IoClose } from "react-icons/io5";
import "../styles/components/task-detail-modal.css";

export default function TaskDetailModal({ taskId, onClose, onEdit }) {
  const { tasks, users, labels, columns, updateTask } = useApp();
  const task = tasks.find((t) => t.id === taskId);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);

  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);

  if (!task) return null;

  const priority = PRIORITIES[task.priority];
  const column = columns.find((c) => c.id === task.column);
  const members = task.members.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  const taskLabels = task.labelIds.map((id) => labels.find((l) => l.id === id)).filter(Boolean);

  const startEditTitle = () => {
    setTitleDraft(task.title);
    setEditingTitle(true);
  };

  const saveTitle = async () => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === task.title) { setEditingTitle(false); return; }
    setSavingTitle(true);
    try {
      await updateTask(task.id, { title: trimmed });
      setEditingTitle(false);
    } finally {
      setSavingTitle(false);
    }
  };

  const startEditDescription = () => {
    setDescriptionDraft(task.description || "");
    setEditingDescription(true);
  };

  const saveDescription = async () => {
    const trimmed = descriptionDraft.trim();
    if (trimmed === (task.description || "")) { setEditingDescription(false); return; }
    setSavingDescription(true);
    try {
      await updateTask(task.id, { description: trimmed });
      setEditingDescription(false);
    } finally {
      setSavingDescription(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-detail" onClick={(e) => e.stopPropagation()}>
        <header className="modal__head">
          <span className="modal__eyebrow">
            <span className="task-detail__priority-dot" style={{ background: priority.color }} />
            {column?.title}
          </span>
          <div className="modal__head-actions">
            <button className="icon-btn" title="Más opciones" onClick={() => onEdit(task.id)}>✎</button>
            <button className="icon-btn" onClick={onClose}>✕</button>
          </div>
        </header>

        <div className="modal__body task-detail__body">
          {taskLabels.length > 0 && (
            <div className="task-card__labels">
              {taskLabels.map((l) => (
                <span key={l.id} className="label" style={{ color: l.color, background: `color-mix(in srgb, ${l.color} 14%, transparent)` }}>
                  {l.title}
                </span>
              ))}
            </div>
          )}

          {/* ---- título editable ---- */}
          {editingTitle ? (
            <div className="task-detail__editable">
              <input
                className="input task-detail__title-input"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                autoFocus
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") setEditingTitle(false);
                }}
              />
              <div className="task-detail__editable-actions">
                <button className="icon-btn" onClick={() => setEditingTitle(false)}><IoClose /></button>
                <button
                  className="icon-btn icon-btn--primary"
                  onClick={saveTitle}
                  disabled={!titleDraft.trim() || savingTitle}
                >
                  <IoCheckmark />
                </button>
              </div>
            </div>
          ) : (
            <button className="task-detail__title-btn" onClick={startEditTitle}>
              <h2 className="task-detail__title">{task.title}</h2>
              <IoPencil className="task-detail__edit-icon" />
            </button>
          )}

          {/* ---- descripción editable ---- */}
          <div className="task-detail__section">
            <span className="field__label">Descripción</span>

            {editingDescription ? (
              <div className="task-detail__editable">
                <textarea
                  className="input task-detail__description-input"
                  value={descriptionDraft}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  rows={4}
                  maxLength={500}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditingDescription(false);
                  }}
                />
                <div className="task-detail__editable-actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => setEditingDescription(false)}>Cancelar</button>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={saveDescription}
                    disabled={savingDescription}
                  >
                    {savingDescription ? "Guardando…" : "Guardar cambios"}
                  </button>
                </div>
              </div>
            ) : (
              <button className="task-detail__description-btn" onClick={startEditDescription}>
                <p className="task-detail__description">
                  {task.description || "Sin descripción todavía. Tocá para agregar una."}
                </p>
                <IoPencil className="task-detail__edit-icon" />
              </button>
            )}
          </div>

          <div className="task-detail__grid">
            <div className="task-detail__section">
              <span className="field__label">Prioridad</span>
              <span className="pill pill--on" style={{ background: priority.color, borderColor: priority.color }}>
                <span className="pill__dot" style={{ background: "#fff" }} />
                {priority.label}
              </span>
            </div>

            <div className="task-detail__section">
              <span className="field__label">Fecha límite</span>
              <span className="task-detail__value">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
                  : "Sin definir"}
              </span>
            </div>
          </div>

          <div className="task-detail__section">
            <span className="field__label">Asignados</span>
            {members.length > 0 ? (
              <div className="member-grid member-grid--static">
                {members.map((m) => (
                  <div key={m.id} className="member member--static">
                    <span className="avatar avatar--sm" style={{ background: "var(--color-green)" }}>{m.initials}</span>
                    <span className="member__name">{m.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="task-detail__value">Sin asignar</span>
            )}
          </div>
        </div>

        <footer className="modal__foot">
          <button className="btn btn--ghost" onClick={onClose}>Cerrar</button>
          <button className="btn btn--primary" onClick={() => onEdit(task.id)}>Editar</button>
        </footer>
      </div>
    </div>
  );
}