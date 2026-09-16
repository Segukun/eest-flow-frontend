import { useApp } from "../context/AppContext";
import { PRIORITIES, ALL_LABELS, LABEL_COLORS } from "../mock/db";
import "../styles/components/task-modal.css";

export default function TaskModal({ taskId, onClose }) {
  const { tasks, users, columns, sectors, updateTask, deleteTask } = useApp();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const toggle = (key, value) =>
    updateTask(task.id, {
      [key]: task[key].includes(value)
        ? task[key].filter((v) => v !== value)
        : [...task[key], value],
    });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal__head">
          <span className="modal__eyebrow"><span className="sync-dot" /> Acciones de tarjeta</span>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </header>

        <div className="modal__body">
          <label className="field">
            <span className="field__label">Título</span>
            <input
              className="input input--title"
              value={task.title}
              onChange={(e) => updateTask(task.id, { title: e.target.value })}
            />
          </label>

          <div className="field">
            <span className="field__label">Asignar prioridad</span>
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

          <div className="field">
            <span className="field__label">Agregar etiqueta</span>
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
                  onClick={() => toggle("labels", l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field__label">Asignar personal</span>
            <div className="member-grid">
              {users.map((u) => (
                <button
                  key={u.id}
                  className={"member" + (task.members.includes(u.id) ? " member--on" : "")}
                  onClick={() => toggle("members", u.id)}
                >
                  <span className="avatar avatar--sm" style={{ background: u.color }}>{u.initials}</span>
                  <span className="member__name">{u.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Asignar fecha límite</span>
              <input
                type="date"
                className="input"
                value={task.dueDate || ""}
                onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
              />
            </label>

            <label className="field">
              <span className="field__label">Sector</span>
              <select
                className="select"
                value={task.sector}
                onChange={(e) => updateTask(task.id, { sector: e.target.value })}
              >
                {sectors.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <div className="field">
            <span className="field__label">Mover a</span>
            <div className="chip-grid chip-grid--4">
              {columns.map((c) => (
                <button
                  key={c.id}
                  className={"pill pill--outline" + (task.column === c.id ? " pill--outline-on" : "")}
                  onClick={() => updateTask(task.id, { column: c.id })}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer className="modal__foot">
          <button
            className="btn btn--danger"
            onClick={() => { deleteTask(task.id); onClose(); }}
          >
            Borrar tarjeta
          </button>
          <button className="btn btn--primary" onClick={onClose}>Guardar</button>
        </footer>
      </div>
    </div>
  );
}