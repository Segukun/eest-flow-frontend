import { colorChipStyle } from "../colorPresets.js";
import { useEffect, useId, useRef, useState } from "react";

import { useApp, PRIORITIES } from "../context/AppContext";
import { MAX_TASK_TITLE_LENGTH } from "../taskDrafts.js";
import { formatLongDate } from "./dates";

import { IoPencil } from "react-icons/io5";

import {
  FiPaperclip,
  FiMenu,
  FiCalendar,
  FiFlag,
  FiUsers,
  FiImage,
  FiFileText,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";

import TaskAttachmentsModal from "./TaskAttachmentsModal";
import UserAvatar from "./layout/UserAvatar.jsx";

import "../styles/components/task-detail-modal.css";
import "../styles/components/task-attachments-modal.css";

const MAX_FILE_PREVIEWS = 4;

// "2026-09-18" -> fecha local.
// Evita que new Date("2026-09-18") interprete la fecha en UTC
// y en Argentina termine mostrando el día anterior.
const parseLocalDate = (value) =>
  value
    ? new Date(`${String(value).slice(0, 10)}T00:00:00`)
    : null;

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
  const titleCounterId = useId();

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

  const hasDescription =
    task.hasDescription ??
    Boolean((task.description || "").trim());

  const dueDate = parseLocalDate(task.dueDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isOverdue =
    Boolean(dueDate) &&
    dueDate < today &&
    task.column !== "completed";

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
    if (titleDraft.length > MAX_TASK_TITLE_LENGTH) return;

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

    setDescriptionDraft(
      hasDescription ? task.description : ""
    );

    setEditingDescription(true);
  };

  const saveDescription = async () => {
    const trimmed = descriptionDraft.trim();

    if (
      trimmed ===
      (hasDescription ? task.description : "")
    ) {
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
        {/* Franja superior según prioridad */}

        <span
          className="task-detail__accent"
          style={{ background: priority.color }}
        />

        {/* Encabezado */}

        <header className="task-detail__head">
          <span className="task-detail__status">
            <span
              className="task-detail__status-dot"
              style={{
                background: column?.dot ?? priority.color,
              }}
            />

            {column?.title}
          </span>

          <div className="task-detail__head-actions">
            <button
              type="button"
              className="task-detail__round-btn"
              title="Acciones de la tarjeta"
              onClick={() => onEdit(task.id)}
            >
              ✎
            </button>

            <button
              type="button"
              className="task-detail__round-btn"
              title="Cerrar"
              onClick={onClose}
            >
              <FiX />
            </button>
          </div>
        </header>

        {/* Cuerpo con scroll */}

        <div className="task-detail__scroll">
          <div className="task-detail__layout">

            {/* ================= COLUMNA PRINCIPAL ================= */}

            <div className="task-detail__main">

              {/* Etiquetas */}

              {taskLabels.length > 0 && (
                <div className="task-detail__labels">
                  {taskLabels.map((label) => (
                    <span
                      key={label.id}
                      className="label"
                      style={colorChipStyle(label.color)}
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
                    maxLength={MAX_TASK_TITLE_LENGTH}
                    aria-describedby={titleCounterId}
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
                    <span id={titleCounterId} className="task-detail__counter">
                      {titleDraft.length}/{MAX_TASK_TITLE_LENGTH}
                    </span>

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
                      disabled={!titleDraft.trim() || savingTitle || titleDraft.length > MAX_TASK_TITLE_LENGTH}
                    >
                      {savingTitle
                        ? "Guardando…"
                        : "Guardar cambios"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="task-detail__title-btn"
                  onClick={startEditTitle}
                  title="Editar título"
                >
                  <h2 className="task-detail__title">
                    {task.title}
                  </h2>

                  <IoPencil className="task-detail__edit-icon" />
                </button>
              )}

              {/* Descripción */}

              <section className="task-detail__block">
                <div className="task-detail__block-head">
                  <h3 className="task-detail__block-title">
                    <FiMenu />
                    Descripción
                  </h3>
                </div>

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
                      placeholder="Agregá una descripción…"
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setEditingDescription(false);
                        }
                      }}
                    />

                    <div className="task-detail__editable-actions">
                      <span className="task-detail__counter">
                        {descriptionDraft.length}/500
                      </span>

                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() =>
                          setEditingDescription(false)
                        }
                        disabled={savingDescription}
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={saveDescription}
                        disabled={savingDescription || descriptionDraft == ""}
                      >
                        {savingDescription
                          ? "Guardando…"
                          : "Guardar cambios"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={
                      "task-detail__description-btn" +
                      (hasDescription
                        ? ""
                        : " task-detail__description-btn--empty")
                    }
                    onClick={startEditDescription}
                    title="Editar descripción"
                  >
                    <p className="task-detail__description">
                      {hasDescription
                        ? task.description
                        : "Todavía no hay descripción. Tocá para agregar una."}
                    </p>

                    <IoPencil className="task-detail__edit-icon" />
                  </button>
                )}
              </section>

              {/* Archivos adjuntos */}

              <section className="task-detail__block">
                <div className="task-detail__block-head">
                  <h3 className="task-detail__block-title">
                    <FiPaperclip />

                    Archivos adjuntos

                    {attachments.length > 0 && (
                      <span className="task-detail__count">
                        {attachments.length}
                      </span>
                    )}
                  </h3>

                  <button
                    type="button"
                    className="task-detail__link-btn"
                    onClick={() => setShowAttachments(true)}
                  >
                    Administrar
                  </button>
                </div>

                {attachments.length > 0 ? (
                  <ul className="task-detail__files">
                    {attachments
                      .slice(0, MAX_FILE_PREVIEWS)
                      .map((file) => {
                        const name =
                          file.originalName ||
                          file.name ||
                          "Archivo";

                        const isImage =
                          file.type === "image" ||
                          file.mimeType?.startsWith("image/") ||
                          file.mimeType?.startsWith("image");

                        return (
                          <li
                            key={file.id}
                            className="task-detail__file"
                            title={name}
                          >
                            <span className="task-detail__file-icon">
                              {isImage ? (
                                <FiImage />
                              ) : (
                                <FiFileText />
                              )}
                            </span>

                            <span className="task-detail__file-name">
                              {name}
                            </span>
                          </li>
                        );
                      })}

                    {attachments.length > MAX_FILE_PREVIEWS && (
                      <li className="task-detail__file task-detail__file--more">
                        +{attachments.length - MAX_FILE_PREVIEWS} más
                      </li>
                    )}
                  </ul>
                ) : (
                  <button
                    type="button"
                    className="task-detail__empty"
                    onClick={() => setShowAttachments(true)}
                  >
                    <FiPaperclip />

                    <span>
                      Todavía no hay archivos. Tocá para agregar.
                    </span>
                  </button>
                )}
              </section>
            </div>

            {/* ================= COLUMNA LATERAL ================= */}

            <aside className="task-detail__side">

              {/* Prioridad */}

              <div className="task-detail__card">
                <span className="task-detail__card-label">
                  <FiFlag />
                  Prioridad
                </span>

                <span
                  className="pill pill--on task-detail__priority"
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

              {/* Fecha límite */}

              <div className="task-detail__card">
                <span className="task-detail__card-label">
                  <FiCalendar />
                  Fecha límite
                </span>

                {dueDate ? (
                  <>
                    <span className="task-detail__value">
                      {formatLongDate(task.dueDate)}
                    </span>

                    {isOverdue && (
                      <span className="task-detail__overdue">
                        <FiAlertCircle />
                        Vencida
                      </span>
                    )}
                  </>
                ) : (
                  <span className="task-detail__muted">
                    Sin definir
                  </span>
                )}
              </div>

              {/* Miembros asignados */}

              <div className="task-detail__card">
                <span className="task-detail__card-label">
                  <FiUsers />

                  Asignados

                  {members.length > 0 && (
                    <span className="task-detail__count">
                      {members.length}
                    </span>
                  )}
                </span>

                {members.length > 0 ? (
                  <ul
                    className="task-detail__members"
                    aria-label="Personal asignado a la tarea"
                  >
                    {members.map((member) => (
                      <li
                        key={member.id}
                        className="task-detail__member"
                      >
                        <UserAvatar
                          user={member}
                          className="avatar avatar--sm task-detail__member-avatar"
                          title={member.name}
                        />

                        <span className="task-detail__member-name">
                          {member.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="task-detail__muted">
                    Sin asignar
                  </span>
                )}
              </div>
            </aside>
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
            deleteTaskAttachment(
              task.id,
              attachment.id
            )
          }
        />
      )}
    </div>
  );
}
