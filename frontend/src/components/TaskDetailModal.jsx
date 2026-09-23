import { useApp } from "../context/AppContext";
import { PRIORITIES, LABEL_COLORS } from "../mock/db";
import "../styles/components/task-detail-modal.css";

export default function TaskDetailModal({ taskId, onClose, onEdit }) {
  const { tasks, users, columns } = useApp();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const priority = PRIORITIES[task.priority];
  const column = columns.find((c) => c.id === task.column);
  const members = task.members.map((id) => users.find((u) => u.id === id)).filter(Boolean);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-detail" onClick={(e) => e.stopPropagation()}>
        <header className="modal__head">
          <span className="modal__eyebrow">
            <span className="task-detail__priority-dot" style={{ background: priority.color }} />
            {column?.title}
          </span>
          <div className="modal__head-actions">
            <button className="icon-btn" title="Editar" onClick={() => onEdit(task.id)}>✎</button>
            <button className="icon-btn" onClick={onClose}>✕</button>
          </div>
        </header>

        <div className="modal__body task-detail__body">
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

          <h2 className="task-detail__title">{task.title}</h2>

          <div className="task-detail__section">
            <span className="field__label">Descripción</span>
            <p className="task-detail__description">
              {task.description || "Sin descripción todavía."}
            </p>
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
              <span className="field__label">Sector</span>
              <span className="task-detail__value">{task.sector}</span>
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
                    <span className="avatar avatar--sm" style={{ background: m.color }}>{m.initials}</span>
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
          <button className="btn btn--primary" onClick={() => onEdit(task.id)}>Editar tarjeta</button>
        </footer>
      </div>
    </div>
  );
}