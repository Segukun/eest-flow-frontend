import { useApp, PRIORITIES } from "../context/AppContext";
import { parseLocalDate } from "./dates";

import {
  FiMenu,
  FiPaperclip,
} from "react-icons/fi";

import "../styles/components/task-card-attachments.css";

// dropMarker: "before" | "after" | null
// Línea naranja que indica dónde se insertará la tarea.
export default function TaskCard({
  task,
  isDragging,
  dropMarker,
  onDragStart,
  onDragEnd,
  onView,
  onEdit,
}) {
  const { users, labels } = useApp();

  const priority =
    PRIORITIES[task.priority] ?? PRIORITIES.medium;

  const members = (task.members ?? [])
    .map((id) =>
      users.find((user) => user.id === id)
    )
    .filter(Boolean);

  const taskLabels = (task.labelIds ?? [])
    .map((id) =>
      labels.find((label) => label.id === id)
    )
    .filter(Boolean);

  const attachments = Array.isArray(task.attachments)
    ? task.attachments
    : [];

  const description = (task.description ?? "").trim();

  // No mostrar indicador para la descripción predeterminada.
  const hasDescription = Boolean(
    description &&
    description.toLowerCase() !== ""
  );

  const markerStyle = dropMarker
    ? {
        boxShadow: `0 ${
          dropMarker === "before" ? "-4px" : "4px"
        } 0 0 var(--color-orange)`,
      }
    : undefined;

  return (
    <article
      className={
        "task-card" +
        (isDragging ? " task-card--dragging" : "")
      }
      style={markerStyle}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart(task.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onView(task.id)}
    >
      <span
        className="task-card__priority"
        style={{ background: priority.color }}
      />

      <button
        className="task-card__edit"
        title="Editar tarjeta"
        onClick={(event) => {
          event.stopPropagation();
          onEdit(task.id);
        }}
      >
        ✎
      </button>

      {taskLabels.length > 0 && (
        <div className="task-card__labels">
          {taskLabels.map((label) => (
            <span
              key={label.id}
              className="label"
              style={{
                color: label.color,
                background: `color-mix(in srgb, ${label.color} 14%, transparent)`,
              }}
            >
              {label.title || "·"}
            </span>
          ))}
        </div>
      )}

      <h4 className="task-card__title">
        {task.title}
      </h4>

      <div className="task-card__foot">
        <div className="task-card__foot-left">
          <div className="avatars">
            {members.slice(0, 3).map((member) => (
              <span
                key={member.id}
                className="avatar avatar--sm"
                style={{ background: "var(--color-green)" }}
                title={member.name}
              >
                {member.initials}
              </span>
            ))}

            {members.length > 3 && (
              <span className="avatar avatar--sm avatar--more">
                +{members.length - 3}
              </span>
            )}
          </div>

          <div
            className="task-card__indicators"
            aria-label="Detalles de la tarea"
          >
            {attachments.length > 0 && (
              <span
                title={`${attachments.length} archivos adjuntos`}
              >
                <FiPaperclip aria-hidden="true" />
                <span>{attachments.length}</span>
              </span>
            )}

            {hasDescription && (
              <span title="Esta tarea tiene descripción">
                <FiMenu aria-hidden="true" />
              </span>
            )}
          </div>
        </div>

        {task.dueDate && (
          <span className="task-card__due">
{parseLocalDate(task.dueDate)?.toLocaleDateString(            
              "es-AR",
              {
                day: "2-digit",
                month: "short",
              },
            )}
          </span>
        )}
      </div>
    </article>
  );
}