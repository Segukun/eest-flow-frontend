import { useState } from "react";
import { useApp, PRIORITIES } from "../../context/AppContext";
import "../../styles/components/task-actions-modal.css";

import { IoEnterOutline, IoList, IoPricetagOutline, IoCalendarClear, IoTrashBinOutline } from "react-icons/io5";
import { HiMiniArrowsRightLeft } from "react-icons/hi2";

const OPTIONS = [
  { id: "open", label: "Abrir tarjeta", icon: <IoEnterOutline />, tone: "neutral" },
  { id: "priority", label: "Asignar prioridad", icon: <IoList />, tone: "green" },
  { id: "labels", label: "Etiquetas", icon: <IoPricetagOutline />, tone: "neutral" },
  { id: "members", label: "Asignar personal", icon: "＋", tone: "neutral" },
  { id: "due", label: "Asignar fecha límite", icon: <IoCalendarClear />, tone: "neutral" },
  { id: "move", label: "Mover", icon: <HiMiniArrowsRightLeft />, tone: "orange" },
  { id: "delete", label: "Borrar", icon: <IoTrashBinOutline />, tone: "danger" },
];

const LABEL_COLOR_PRESETS = [
  "var(--color-green)", "var(--color-orange)", "var(--color-terracotta)",
  "var(--color-graphite)", "#6c4ae0", "#1f9fb8",
];

export default function TaskActionsModal({ taskId, onClose, onView }) {
  const { tasks, users, labels, columns, currentUser, updateTask, deleteTask, addLabel } = useApp();
  const [panel, setPanel] = useState(null);
  const [newLabelTitle, setNewLabelTitle] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLOR_PRESETS[0]);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [labelError, setLabelError] = useState(null);

  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const priority = PRIORITIES[task.priority];
  const members = task.members.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  const taskLabels = task.labelIds.map((id) => labels.find((l) => l.id === id)).filter(Boolean);

  const toggleMember = (userId) =>
    updateTask(task.id, {
      members: task.members.includes(userId)
        ? task.members.filter((v) => v !== userId)
        : [...task.members, userId],
    });

  const toggleLabel = (labelId) =>
    updateTask(task.id, {
      labelIds: task.labelIds.includes(labelId)
        ? task.labelIds.filter((v) => v !== labelId)
        : [...task.labelIds, labelId],
    });

  const handleCreateLabel = async () => {
    setLabelError(null);
    setCreatingLabel(true);
    try {
      const created = await addLabel({ title: newLabelTitle.trim(), color: newLabelColor });
      // la aplica directo a la tarea actual
      await updateTask(task.id, { labelIds: [...task.labelIds, created.id] });
      setNewLabelTitle("");
    } catch (err) {
      // el backend exige admin para crear etiquetas; si falla por permisos,
      // avisamos explícitamente en vez de fallar en silencio
      const message = err?.response?.status === 403
        ? "Solo un administrador puede crear etiquetas nuevas."
        : err?.response?.data?.message || "No se pudo crear la etiqueta.";
      setLabelError(message);
    } finally {
      setCreatingLabel(false);
    }
  };

  const handleOptionClick = (id) => {
    if (id === "open") return onView(task.id);
    if (id === "delete") { deleteTask(task.id); onClose(); return; }
    setPanel(id);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="actions-modal" onClick={(e) => e.stopPropagation()}>
        <div className="actions-modal__preview">
          <span
            className="task-card__priority"
            style={{ background: priority.color, position: "static", height: 4, borderRadius: 4, marginBottom: 10, display: "block" }}
          />
          {taskLabels.length > 0 && (
            <div className="task-card__labels">
              {taskLabels.map((l) => (
                <span key={l.id} className="label" style={{ color: l.color, background: `color-mix(in srgb, ${l.color} 14%, transparent)` }}>
                  {l.title || "·"}
                </span>
              ))}
            </div>
          )}
          <h4 className="actions-modal__preview-title">{task.title}</h4>
          <div className="task-card__foot">
            <div className="avatars">
              {members.slice(0, 4).map((m) => (
                <span key={m.id} className="avatar avatar--sm" style={{ background: "var(--color-green)" }}>{m.initials}</span>
              ))}
            </div>
            {task.dueDate && (
              <span className="task-card__due">
                {new Date(task.dueDate).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
              </span>
            )}
          </div>
        </div>

        <div className="actions-modal__bubble">
          <div className="actions-modal__bubble-head">
            <span className="sync-dot" /> Acciones de tarjeta
            <button className="icon-btn" onClick={onClose}>✕</button>
          </div>

          {panel === null && (
            <ul className="actions-modal__list">
              {OPTIONS.map((opt) => (
                <li key={opt.id}>
                  <button
                    className={"actions-modal__item" + (opt.tone === "danger" ? " is-danger" : "")}
                    onClick={() => handleOptionClick(opt.id)}
                  >
                    <span className={"actions-modal__icon actions-modal__icon--" + opt.tone}>{opt.icon}</span>
                    <span className="actions-modal__label">{opt.label}</span>
                    <span className="actions-modal__chevron">›</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {panel === "priority" && (
            <div className="actions-modal__panel">
              <PanelHead title="Asignar prioridad" onBack={() => setPanel(null)} />
              <div className="chip-grid">
                {Object.values(PRIORITIES).map((p) => (
                  <button
                    key={p.id}
                    className={"pill" + (task.priority === p.id ? " pill--on" : "")}
                    onClick={() => updateTask(task.id, { priority: p.id })}
                  >
                    <span className="pill__dot" style={{ background: p.color }} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {panel === "labels" && (
            <div className="actions-modal__panel">
              <PanelHead title="Etiquetas" onBack={() => setPanel(null)} />

              {labels.length > 0 ? (
                <div className="chip-grid chip-grid--wrap">
                  {labels.map((l) => (
                    <button
                      key={l.id}
                      className={"label label--btn" + (task.labelIds.includes(l.id) ? " label--on" : "")}
                      style={{
                        color: l.color,
                        background: task.labelIds.includes(l.id)
                          ? `color-mix(in srgb, ${l.color} 18%, transparent)`
                          : "transparent",
                        borderColor: l.color,
                      }}
                      onClick={() => toggleLabel(l.id)}
                    >
                      {l.title || "·"}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="actions-modal__empty-hint">Esta categoría todavía no tiene etiquetas.</p>
              )}

              <div className="label-creator">
                <span className="field__label">Crear nueva</span>
                <div className="label-creator__row">
                  <input
                    className="input"
                    placeholder="Nombre (opcional)"
                    value={newLabelTitle}
                    onChange={(e) => setNewLabelTitle(e.target.value)}
                    maxLength={30}
                  />
                  <div className="label-creator__colors">
                    {LABEL_COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={"label-creator__swatch" + (newLabelColor === c ? " is-selected" : "")}
                        style={{ background: c }}
                        onClick={() => setNewLabelColor(c)}
                      />
                    ))}
                  </div>
                </div>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={handleCreateLabel}
                  disabled={creatingLabel}
                >
                  {creatingLabel ? "Creando…" : "+ Crear etiqueta"}
                </button>
                {labelError && <p className="label-creator__error">{labelError}</p>}
              </div>
            </div>
          )}

          {panel === "members" && (
            <div className="actions-modal__panel">
              <PanelHead title="Asignar personal" onBack={() => setPanel(null)} />
              <div className="member-grid">
                {users.map((u) => (
                  <button
                    key={u.id}
                    className={"member" + (task.members.includes(u.id) ? " member--on" : "")}
                    onClick={() => toggleMember(u.id)}
                  >
                    <span className="avatar avatar--sm" style={{ background: "var(--color-green)" }}>{u.initials}</span>
                    <span className="member__name">{u.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {panel === "due" && (
            <div className="actions-modal__panel">
              <PanelHead title="Asignar fecha límite" onBack={() => setPanel(null)} />
              <input
                type="date"
                className="input"
                value={task.dueDate || ""}
                onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
              />
            </div>
          )}

          {panel === "move" && (
            <div className="actions-modal__panel">
              <PanelHead title="Mover a" onBack={() => setPanel(null)} />
              <div className="chip-grid">
                {columns.map((c) => (
                  <button
                    key={c.id}
                    className={"pill pill--outline" + (task.column === c.id ? " pill--outline-on" : "")}
                    onClick={() => { updateTask(task.id, { column: c.id }); setPanel(null); }}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PanelHead({ title, onBack }) {
  return (
    <div className="actions-modal__panel-head">
      <button className="actions-modal__back" onClick={onBack}>‹</button>
      <strong>{title}</strong>
    </div>
  );
}