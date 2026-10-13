import { useApp, PRIORITIES } from "../context/AppContext";

export default function TaskCard({ task, isDragging, onDragStart, onDragEnd, onDropBefore, onView, onEdit }) {
  const { users, labels } = useApp();
  const priority = PRIORITIES[task.priority];
  const members = task.members.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  const taskLabels = task.labelIds.map((id) => labels.find((l) => l.id === id)).filter(Boolean);

  return (
    <article
      className={"task-card" + (isDragging ? " task-card--dragging" : "")}
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(task.id); }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDropBefore(task.id); }}
      onClick={() => onView(task.id)}
    >
      <span className="task-card__priority" style={{ background: priority.color }} />

      <button className="task-card__edit" title="Editar tarjeta" onClick={(e) => { e.stopPropagation(); onEdit(task.id); }}>
        ✎
      </button>

      {taskLabels.length > 0 && (
        <div className="task-card__labels">
          {taskLabels.map((l) => (
            <span key={l.id} className="label" style={{ color: l.color, background: `color-mix(in srgb, ${l.color} 14%, transparent)` }}>
              {l.title || "·"}
            </span>
          ))}
        </div>
      )}

      <h4 className="task-card__title">{task.title}</h4>

      <div className="task-card__foot">
        <div className="avatars">
          {members.slice(0, 3).map((m) => (
            <span key={m.id} className="avatar avatar--sm" style={{ background: "var(--color-green)" }} title={m.name}>
              {m.initials}
            </span>
          ))}
          {members.length > 3 && <span className="avatar avatar--sm avatar--more">+{members.length - 3}</span>}
        </div>
        {task.dueDate && (
          <span className="task-card__due">
            {new Date(task.dueDate).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
          </span>
        )}
      </div>
    </article>
  );
}