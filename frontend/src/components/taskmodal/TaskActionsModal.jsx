import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { PRIORITIES, ALL_LABELS, LABEL_COLORS } from "../../mock/db";
import "../../styles/components/task-actions-modal.css";

import { IoEnterOutline, IoList, IoPricetagOutline, IoCalendarClear, IoTrashBinOutline } from "react-icons/io5";
import { HiMiniArrowsRightLeft } from "react-icons/hi2";

const OPTIONS = [
  { id: "open", label: "Abrir tarjeta", icon: <IoEnterOutline/>, tone: "neutral" },
  { id: "priority", label: "Asignar prioridad", icon: <IoList/>, tone: "green" },
  { id: "labels", label: "Agregar etiqueta", icon: <IoPricetagOutline/>, tone: "neutral" },
  { id: "members", label: "Asignar personal", icon: "＋", tone: "neutral" },
  { id: "due", label: "Asignar fecha límite", icon: <IoCalendarClear/>, tone: "neutral" },
  { id: "move", label: "Mover", icon: <HiMiniArrowsRightLeft/>, tone: "orange" },
  { id: "delete", label: "Borrar", icon: <IoTrashBinOutline/>, tone: "danger" },
];

export default function TaskActionsModal({ taskId, onClose, onView }) {
  const { tasks, users, columns, updateTask, deleteTask } = useApp();
  const [panel, setPanel] = useState(null); // null = lista de opciones
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const priority = PRIORITIES[task.priority];
  const members = task.members.map((id) => users.find((u) => u.id === id)).filter(Boolean);

  const toggleArrayField = (key, value) =>
    updateTask(task.id, {
      [key]: task[key].includes(value)
        ? task[key].filter((v) => v !== value)
        : [...task[key], value],
    });

  const handleOptionClick = (id) => {
    if (id === "open") return onView(task.id);
    if (id === "delete") { deleteTask(task.id); onClose(); return; }
    setPanel(id);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="actions-modal" onClick={(e) => e.stopPropagation()}>
        {/* preview de la tarjeta afectada */}
        <div className="actions-modal__preview">
          <span className="task-card__priority" style={{ background: priority.color, position: "static", height: 4, borderRadius: 4, marginBottom: 10, display: "block" }} />
          {task.labels.length > 0 && (
            <div className="task-card__labels">
              {task.labels.map((l) => (
                <span
                  key={l}
                  className="label"
                  style={{
                    color: LABEL_COLORS[l] || "var(--color-graphite)",
                    background: `color-mix(in srgb, ${LABEL_COLORS[l] || "#888"} 14%, transparent)`,
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          )}
          <h4 className="actions-modal__preview-title">{task.title}</h4>
          <div className="task-card__foot">
            <div className="avatars">
              {members.slice(0, 4).map((m) => (
                <span key={m.id} className="avatar avatar--sm" style={{ background: m.color }}>{m.initials}</span>
              ))}
            </div>
            {task.dueDate && (
              <span className="task-card__due">
                {new Date(task.dueDate).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
              </span>
            )}
          </div>
        </div>

        {/* globo de opciones */}
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
              <PanelHead title="Agregar etiqueta" onBack={() => setPanel(null)} />
              <div className="chip-grid chip-grid--wrap">
                {ALL_LABELS.map((l) => (
                  <button
                    key={l}
                    className={"label label--btn" + (task.labels.includes(l) ? " label--on" : "")}
                    style={{
                      color: LABEL_COLORS[l],
                      background: task.labels.includes(l)
                        ? `color-mix(in srgb, ${LABEL_COLORS[l]} 18%, transparent)`
                        : "transparent",
                      borderColor: LABEL_COLORS[l],
                    }}
                    onClick={() => toggleArrayField("labels", l)}
                  >
                    {l}
                  </button>
                ))}
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
                    onClick={() => toggleArrayField("members", u.id)}
                  >
                    <span className="avatar avatar--sm" style={{ background: u.color }}>{u.initials}</span>
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