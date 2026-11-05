import AssignedUsersPreview from "./AssignedUsersPreview";
import TaskQuickActions from "./TaskQuickActions";
import { colorChipStyle } from "../colorPresets.js";
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

  // Fecha límite y si la tarea está vencida (anterior al día de hoy)
  const dueDate = task.dueDate
    ? parseLocalDate(task.dueDate)
    : null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const isOverdue = Boolean(
    dueDate && dueDate.getTime() < startOfToday.getTime()
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

      <div className="task-card__heading">
        {taskLabels.length > 0 ? (
          <div className="task-card__labels">
            {taskLabels.map((label) => (
              <span
                key={label.id}
                className="label"
                style={colorChipStyle(label.color)}
              >
                {label.title || "·"}
              </span>
            ))}
          </div>
        ) : (
          <h4 className="task-card__title">{task.title}</h4>
        )}
        <TaskQuickActions taskId={task.id} onEdit={onEdit} />
      </div>

      {taskLabels.length > 0 && (
        <h4 className="task-card__title">{task.title}</h4>
      )}

      <div className="task-card__foot">
        <div className="task-card__foot-left">
          <AssignedUsersPreview members={members} />

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

        {dueDate && (
          <span
            className={
              "task-card__due" +
              (isOverdue ? " task-card__due--overdue" : "")
            }
            title={isOverdue ? "Tarea vencida" : undefined}
          >
            {dueDate.toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "short",
            })}
          </span>
        )}
      </div>
    </article>
  );
}
