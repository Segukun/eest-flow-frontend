import { useEffect, useRef, useState } from "react";

import { useApp, PRIORITIES } from "../context/AppContext";

import { IoPencil } from "react-icons/io5";
import { FiPaperclip } from "react-icons/fi";

import TaskAttachmentsModal from "./TaskAttachmentsModal";

import "../styles/components/task-detail-modal.css";
import "../styles/components/task-attachments-modal.css";

export default function TaskDetailModal({
  taskId,
  onClose,
  onEdit,
}) {
  const {
    tasks,
    users,
    labels,
    columns,
    updateTask,
    uploadTaskAttachments,
    deleteTaskAttachment,
  } = useApp();

  const task = tasks.find(
    (item) => String(item.id) === String(taskId)
  );

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);

  const titleRef = useRef(null);

  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);

  const [showAttachments, setShowAttachments] = useState(false);

  // Ajusta automáticamente la altura del textarea del título.
  useEffect(() => {
    const element = titleRef.current;

    if (!editingTitle || !element) return;

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [titleDraft, editingTitle]);

  if (!task) return null;

  const priority =
    PRIORITIES[task.priority] ?? PRIORITIES.medium;

  const column = columns.find(
    (item) => item.id === task.column
  );

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

  /* ---------- edición del título ---------- */

  const startEditTitle = () => {
    if (savingDescription) return;

    setEditingDescription(false);
    setDescriptionDraft("");

    setTitleDraft(task.title);
    setEditingTitle(true);
  };

  const saveTitle = async () => {
    const trimmed = titleDraft.trim();

    if (!trimmed || trimmed === task.title) {
      setEditingTitle(false);
      return;
    }

    setSavingTitle(true);

    try {
      await updateTask(task.id, {
        title: trimmed,
      });

      setEditingTitle(false);
    } finally {
      setSavingTitle(false);
    }
  };

  /* ---------- edición de la descripción ---------- */

  const startEditDescription = () => {
    if (savingTitle) return;

    setEditingTitle(false);
    setTitleDraft("");

    setDescriptionDraft(task.description || "");
    setEditingDescription(true);
  };

  const saveDescription = async () => {
    const trimmed = descriptionDraft.trim();

    if (trimmed === (task.description || "")) {
      setEditingDescription(false);
      return;
    }

    setSavingDescription(true);

    try {
      await updateTask(task.id, {
        description: trimmed,
      });

      setEditingDescription(false);
    } finally {
      setSavingDescription(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal task-detail"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__head">
          <span className="modal__eyebrow">
            <span
              className="task-detail__priority-dot"
              style={{ background: priority.color }}
            />

            {column?.title}
          </span>

          <div className="modal__head-actions">
            <button
              className="icon-btn"
              title="Más opciones"
              onClick={() => onEdit(task.id)}
            >
              ✎
            </button>

            <button
              className="icon-btn"
              onClick={onClose}
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="modal__body task-detail__body">

          {/* Etiquetas */}

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
                  {label.title}
                </span>
              ))}
            </div>
          )}

          {/* Título */}

          {editingTitle ? (
            <div className="task-detail__editable">
              <textarea
                ref={titleRef}
                className="input task-detail__title-input"
                value={titleDraft}
                rows={1}
                autoFocus
                onChange={(event) =>
                  setTitleDraft(
                    event.target.value.replace(/\n/g, " ")
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    saveTitle();
                  }

                  if (event.key === "Escape") {
                    setEditingTitle(false);
                  }
                }}
              />

              <div className="task-detail__editable-actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setEditingTitle(false)}
                  disabled={savingTitle}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={saveTitle}
                  disabled={!titleDraft.trim() || savingTitle}
                >
                  {savingTitle
                    ? "Guardando…"
                    : "Guardar cambios"}
                </button>
              </div>
            </div>
          ) : (
            <button
              className="task-detail__title-btn"
              onClick={startEditTitle}
            >
              <h2 className="task-detail__title">
                {task.title}
              </h2>

              <IoPencil className="task-detail__edit-icon" />
            </button>
          )}

          {/* Descripción */}

          <div className="task-detail__section">
            <span className="field__label">
              Descripción
            </span>

            {editingDescription ? (
              <div className="task-detail__editable">
                <textarea
                  className="input task-detail__description-input"
                  value={descriptionDraft}
                  onChange={(event) =>
                    setDescriptionDraft(event.target.value)
                  }
                  rows={4}
                  maxLength={500}
                  autoFocus
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setEditingDescription(false);
                    }
                  }}
                />

                <div className="task-detail__editable-actions">
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => setEditingDescription(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    className="btn btn--primary btn--sm"
                    onClick={saveDescription}
                    disabled={savingDescription}
                  >
                    {savingDescription
                      ? "Guardando…"
                      : "Guardar cambios"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="task-detail__description-btn"
                onClick={startEditDescription}
              >
                <p className="task-detail__description">
                  {task.description ||
                    "Sin descripción todavía. Tocá para agregar una."}
                </p>

                <IoPencil className="task-detail__edit-icon" />
              </button>
            )}
          </div>

          {/* Archivos adjuntos */}

          <section className="task-detail__attachments">
            <div className="task-detail__attachments-heading">
              <div>
                <span className="field__label">
                  Archivos adjuntos
                </span>

                <span className="task-detail__attachments-count">
                  {attachments.length}{" "}
                  {attachments.length === 1
                    ? "archivo"
                    : "archivos"}
                </span>
              </div>

              <button
                type="button"
                className="task-detail__attachments-trigger"
                onClick={() => setShowAttachments(true)}
              >
                <FiPaperclip />
                Administrar archivos
              </button>
            </div>

            {attachments.length > 0 && (
              <div className="task-detail__attachment-preview-list">
                {attachments.slice(0, 3).map((file) => (
                  <span
                    className="task-detail__attachment-chip"
                    key={file.id}
                    title={file.originalName || file.name}
                  >
                    <FiPaperclip />

                    <span>
                      {file.originalName || file.name}
                    </span>
                  </span>
                ))}

                {attachments.length > 3 && (
                  <span className="task-detail__attachment-more">
                    +{attachments.length - 3} más
                  </span>
                )}
              </div>
            )}
          </section>

          {/* Prioridad y fecha límite */}

          <div className="task-detail__grid">
            <div className="task-detail__section">
              <span className="field__label">
                Prioridad
              </span>

              <span
                className="pill pill--on"
                style={{
                  background: priority.color,
                  borderColor: priority.color,
                }}
              >
                <span
                  className="pill__dot"
                  style={{ background: "#fff" }}
                />

                {priority.label}
              </span>
            </div>

            <div className="task-detail__section">
              <span className="field__label">
                Fecha límite
              </span>

              <span className="task-detail__value">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString(
                      "es-AR",
                      {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      },
                    )
                  : "Sin definir"}
              </span>
            </div>
          </div>

          {/* Asignados */}

          <div className="task-detail__section">
            <span className="field__label">
              Asignados
            </span>

            {members.length > 0 ? (
              <div className="member-grid member-grid--static">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="member member--static"
                  >
                    <span
                      className="avatar avatar--sm"
                      style={{
                        background: "var(--color-green)",
                      }}
                    >
                      {member.initials}
                    </span>

                    <span className="member__name">
                      {member.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="task-detail__value">
                Sin asignar
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modal independiente de administración de archivos */}

      {showAttachments && (
        <TaskAttachmentsModal
          task={task}
          onClose={() => setShowAttachments(false)}
          onUpload={(files) =>
            uploadTaskAttachments(task.id, files)
          }
          onDelete={(attachment) =>
            deleteTaskAttachment(task.id, attachment.id)
          }
        />
      )}
    </div>
  );
}