import { useApp } from "../context/AppContext";
import { PRIORITIES, LABEL_COLORS } from "../mock/db";

export default function TaskCard({ task, isDragging, onDragStart, onDragEnd, onDropBefore, onView, onEdit }) {
  const { users } = useApp();
  const priority = PRIORITIES[task.priority];
  const members = task.members.map((id) => users.find((u) => u.id === id)).filter(Boolean);

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

      <button
        className="task-card__edit"
        title="Editar tarjeta"
        onClick={(e) => { e.stopPropagation(); onEdit(task.id); }}
      >
        ✎
      </button>

      {task.labels.length > 0 && (
        <div className="task-card__labels">
          {task.labels.map((l) => (
            <span
              key={l}
              className="label"
              style={{ color: LABEL_COLORS[l] || "var(--color-graphite)",
                       background: `color-mix(in srgb, ${LABEL_COLORS[l] || "#888"} 14%, transparent)` }}
            >
              {l}
            </span>
          ))}
        </div>
      )}

      <h4 className="task-card__title">{task.title}</h4>

      <div className="task-card__foot">
        <div className="avatars">
          {members.slice(0, 3).map((m) => (
            <span key={m.id} className="avatar avatar--sm" style={{ background: m.color }} title={m.name}>
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