import AssignedUsersPreview from "./AssignedUsersPreview";
import TaskQuickActions from "./TaskQuickActions";
import useTaskSelection from "../hooks/useTaskSelection";
import { colorChipStyle } from "../colorPresets.js";
import { useApp, PRIORITIES } from "../context/AppContext";
import { getTaskDueStatus } from "../taskDueStatus.js";
import { parseLocalDate } from "./dates";

import {
  FiMenu,
  FiPaperclip,
  FiClock,
  FiAlertCircle,
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
} from "react-icons/fi";

import "../styles/components/task-card-attachments.css";
import "../styles/components/task-card-status.css";

const TONE_ICONS = {
  overdue: FiAlertCircle,
  imminent: FiAlertTriangle,
  soon: FiCalendar,
  done: FiCheckCircle,
};

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
  const selection = useTaskSelection();

  const priority = PRIORITIES[task.priority] ?? PRIORITIES.medium;

  const members = (task.members ?? [])
    .map((id) => users.find((user) => user.id === id))
    .filter(Boolean);

  const taskLabels = (task.labelIds ?? [])
    .map((id) => labels.find((label) => label.id === id))
    .filter(Boolean);

  const attachments = Array.isArray(task.attachments) ? task.attachments : [];

  const description = (task.description ?? "").trim();
  const hasDescription = Boolean(description);

  const isCompleted = task.column === "completed";
  const isReview = task.column === "review";

  // Fecha límite y su estado visual (vencida, hoy, mañana, en revisión, completada)
  const dueDate = task.dueDate ? parseLocalDate(task.dueDate) : null;
  const dueStatus = getTaskDueStatus({ dueDate, column: task.column });
  const DueIcon = dueStatus ? TONE_ICONS[dueStatus.tone] : null;

  const markerStyle = dropMarker
    ? {
        boxShadow: `0 ${
          dropMarker === "before" ? "-4px" : "4px"
        } 0 0 var(--color-orange)`,
      }
    : undefined;

  // En "Terminado" la franja superior pasa a verde.
  const barColor = priority.color;

  const titleNode = (
    <h4 className="task-card__title">
      {isReview && (
        <span
          className="task-card__review-icon"
          role="img"
          aria-label="En revisión"
          title="En revisión"
        >
          <FiClock aria-hidden="true" />
        </span>
      )}
      {task.title}
    </h4>
  );

  return (
    <article
      className={
        "task-card" +
        (isDragging ? " task-card--dragging" : "") +
        (isCompleted ? " task-card--completed" : "") +
        (isReview ? " task-card--review" : "") +
        (selection?.selectedTaskIds.has(task.id) ? " task-card--selected" : "")
      }
      style={markerStyle}
      draggable={!selection?.busy}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart(task.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => {
        if (!selection?.busy) onView(task.id);
      }}
    >
      <span
        className="task-card__priority"
        style={{ background: barColor }}
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
          titleNode
        )}
        <TaskQuickActions
          taskId={task.id}
          onEdit={onEdit}
          selection={selection}
          taskTitle={task.title}
        />
      </div>

      {taskLabels.length > 0 && titleNode}

      <div className="task-card__foot">
        <div className="task-card__foot-left">
          <AssignedUsersPreview members={members} />

          <div className="task-card__indicators" aria-label="Detalles de la tarea">
            {attachments.length > 0 && (
              <span title={`${attachments.length} archivos adjuntos`}>
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
            className="task-card__due"
            data-due-tone={dueStatus?.tone}
            title={dueStatus?.hint}
          >
            {DueIcon && <DueIcon aria-hidden="true" />}
            {dueStatus && (
              <span className="task-card__sr-only">{dueStatus.label}: </span>
            )}
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