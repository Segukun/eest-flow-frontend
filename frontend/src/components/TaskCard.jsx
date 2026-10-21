import { useApp, PRIORITIES } from "../context/AppContext";

// dropMarker: "before" | "after" | null -> línea naranja que muestra dónde va a caer la tarea
export default function TaskCard({ task, isDragging, dropMarker, onDragStart, onDragEnd, onView, onEdit }) {
  const { users, labels } = useApp();
  const priority = PRIORITIES[task.priority];
  const members = task.members.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  const taskLabels = task.labelIds.map((id) => labels.find((l) => l.id === id)).filter(Boolean);

  // box-shadow no cambia el tamaño ni la posición de las tarjetas, así que
  // la línea no "mueve" nada mientras arrastrás
  const markerStyle = dropMarker
    ? { boxShadow: `0 ${dropMarker === "before" ? "-4px" : "4px"} 0 0 var(--color-orange)` }
    : undefined;

  // El drop ya no se maneja acá: se maneja en la columna (Column.jsx), que
  // calcula la posición exacta según la altura del mouse.
  return (
    <article
      className={"task-card" + (isDragging ? " task-card--dragging" : "")}
      style={markerStyle}
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(task.id); }}
      onDragEnd={onDragEnd}
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