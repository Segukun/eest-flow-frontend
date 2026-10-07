import { useState } from "react";
import { useApp, PRIORITIES } from "../../context/AppContext";
import "../../styles/components/task-actions-modal.css";

import { IoEnterOutline, IoList, IoPricetagOutline, IoCalendarClear, IoTrashBinOutline, IoPencil, IoClose, IoCheckmark } from "react-icons/io5";
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
  "var(--color-graphite)", "#6c4ae0", "#1f9fb8", "#e0342b", "#2563eb",
];

export default function TaskActionsModal({ taskId, onClose, onView }) {
  const { tasks, users, labels, columns, updateTask, deleteTask, addLabel, updateLabel, deleteLabel } = useApp();
  const [panel, setPanel] = useState(null);

  // ---- creación de etiqueta nueva ----
  const [newLabelTitle, setNewLabelTitle] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(null); // sin default: el usuario debe elegir
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [labelError, setLabelError] = useState(null);

  // ---- edición de una etiqueta existente ----
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editColor, setEditColor] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

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

  const canCreateLabel = newLabelTitle.trim().length > 0 && newLabelColor !== null;

  const handleCreateLabel = async () => {
    if (!canCreateLabel) return;
    setLabelError(null);
    setCreatingLabel(true);
    try {
      await addLabel({ title: newLabelTitle.trim(), color: newLabelColor });
      setNewLabelTitle("");
      setNewLabelColor(null);
    } catch (err) {
      const message = err?.response?.status === 403
        ? "Solo un administrador puede crear etiquetas nuevas."
        : err?.response?.data?.message || "No se pudo crear la etiqueta.";
      setLabelError(message);
    } finally {
      setCreatingLabel(false);
    }
  };

  const startEditLabel = (label) => {
    setEditingLabelId(label.id);
    setEditTitle(label.title || "");
    setEditColor(label.color);
    setLabelError(null);
  };

  const cancelEditLabel = () => {
    setEditingLabelId(null);
    setEditTitle("");
    setEditColor(null);
  };

  const canSaveEdit = editTitle.trim().length > 0 && editColor !== null;

  const saveEditLabel = async () => {
    if (!canSaveEdit) return;
    setSavingEdit(true);
    setLabelError(null);
    try {
      await updateLabel(editingLabelId, { title: editTitle.trim(), color: editColor });
      cancelEditLabel();
    } catch (err) {
      const message = err?.response?.status === 403
        ? "Solo un administrador puede editar etiquetas."
        : err?.response?.data?.message || "No se pudo guardar la etiqueta.";
      setLabelError(message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteLabel = async (labelId) => {
    setLabelError(null);
    try {
      await deleteLabel(labelId);
      if (editingLabelId === labelId) cancelEditLabel();
    } catch (err) {
      const message = err?.response?.status === 403
        ? "Solo un administrador puede borrar etiquetas."
        : err?.response?.data?.message || "No se pudo borrar la etiqueta.";
      setLabelError(message);
    }
  };

  const handleOptionClick = (id) => {
    if (id === "open") return onView(task.id);
    if (id === "delete") { deleteTask(task.id); onClose(); return; }
    setPanel(id);
    if (id === "labels") { cancelEditLabel(); setLabelError(null); }
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
                  {l.title}
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
              <PanelHead title="Etiquetas" onBack={() => { setPanel(null); cancelEditLabel(); }} />

              {/* columna de etiquetas existentes, una abajo de la otra, estilo Trello */}
              <div className="label-manager__list">
                {labels.length === 0 && (
                  <p className="actions-modal__empty-hint">Esta categoría todavía no tiene etiquetas.</p>
                )}

                {labels.map((l) => {
                  const isEditing = editingLabelId === l.id;
                  const isOnTask = task.labelIds.includes(l.id);

                  if (isEditing) {
                    return (
                      <div key={l.id} className="label-manager__row label-manager__row--editing">
                        <input
                          className="input label-manager__edit-input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Nombre de la etiqueta"
                          maxLength={30}
                          autoFocus
                        />
                        <div className="label-manager__colors">
                          {LABEL_COLOR_PRESETS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={"label-manager__swatch" + (editColor === c ? " is-selected" : "")}
                              style={{ background: c }}
                              onClick={() => setEditColor(c)}
                            />
                          ))}
                        </div>
                        <div className="label-manager__row-actions">
                          <button
                            className="icon-btn icon-btn--danger"
                            title="Borrar etiqueta"
                            onClick={() => handleDeleteLabel(l.id)}
                          >
                            <IoTrashBinOutline />
                          </button>
                          <button className="icon-btn" title="Cancelar" onClick={cancelEditLabel}>
                            <IoClose />
                          </button>
                          <button
                            className="icon-btn icon-btn--primary"
                            title="Guardar"
                            onClick={saveEditLabel}
                            disabled={!canSaveEdit || savingEdit}
                          >
                            <IoCheckmark />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={l.id} className="label-manager__row">
                      <button
                        className={"label-manager__chip" + (isOnTask ? " is-on" : "")}
                        style={{
                          background: isOnTask ? l.color : `color-mix(in srgb, ${l.color} 16%, transparent)`,
                          color: isOnTask ? "#fff" : l.color,
                        }}
                        onClick={() => toggleLabel(l.id)}
                        title={isOnTask ? "Quitar de la tarea" : "Agregar a la tarea"}
                      >
                        {l.title}
                      </button>
                      <button
                        className="label-manager__edit-btn"
                        title="Editar etiqueta"
                        onClick={() => startEditLabel(l)}
                      >
                        <IoPencil />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* crear nueva etiqueta, siempre al final de la columna */}
              {editingLabelId === null && (
                <div className="label-creator">
                  <span className="field__label">Crear etiqueta</span>
                  <input
                    className="input"
                    placeholder="Nombre de la etiqueta"
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
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={handleCreateLabel}
                    disabled={!canCreateLabel || creatingLabel}
                  >
                    {creatingLabel ? "Creando…" : "+ Agregar etiqueta"}
                  </button>
                </div>
              )}

              {labelError && <p className="label-creator__error">{labelError}</p>}
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