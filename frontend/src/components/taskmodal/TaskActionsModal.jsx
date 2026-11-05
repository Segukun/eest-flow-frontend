import { useState } from "react";

import {
  useApp,
  PRIORITIES,
} from "../../context/AppContext";

import "../../styles/components/task-actions-modal.css";

import {
  IoEnterOutline,
  IoList,
  IoPricetagOutline,
  IoCalendarClear,
  IoFileTrayFull,
  IoPencil,
  IoClose,
  IoCheckmark,
  IoSearch,
  IoTrashBinOutline
} from "react-icons/io5";

import {
  FiPaperclip,
  FiMenu,
} from "react-icons/fi";

import { HiMiniArrowsRightLeft } from "react-icons/hi2";

import TaskAttachmentsModal from "../TaskAttachmentsModal";

const OPTIONS = [
  {
    id: "open",
    label: "Abrir tarjeta",
    icon: <IoEnterOutline />,
    tone: "neutral",
  },
  {
    id: "priority",
    label: "Asignar prioridad",
    icon: <IoList />,
    tone: "green",
  },
  {
    id: "labels",
    label: "Etiquetas",
    icon: <IoPricetagOutline />,
    tone: "neutral",
  },
  {
    id: "members",
    label: "Asignar personal",
    icon: "＋",
    tone: "neutral",
  },
  {
    id: "due",
    label: "Asignar fecha límite",
    icon: <IoCalendarClear />,
    tone: "neutral",
  },
  {
    id: "attachments",
    label: "Archivos adjuntos",
    icon: <FiPaperclip />,
    tone: "neutral",
  },
  {
    id: "move",
    label: "Mover",
    icon: <HiMiniArrowsRightLeft />,
    tone: "orange",
  },
  {
    id: "delete",
    label: "Archivar",
    icon: <IoFileTrayFull />,
    tone: "danger",
  },
];

const LABEL_COLOR_PRESETS = [
  "var(--color-green)",
  "var(--color-orange)",
  "var(--color-terracotta)",
  "var(--color-graphite)",
  "#6c4ae0",
  "#1f9fb8",
  "#e0342b",
  "#2563eb",
];

// Convierte los colores de las etiquetas en clases CSS.
const LABEL_COLOR_VARIANTS = {
  "var(--color-green)": "green",
  "var(--color-orange)": "orange",
  "var(--color-terracotta)": "terracotta",
  "var(--color-graphite)": "graphite",
  "#6c4ae0": "purple",
  "#1f9fb8": "cyan",
  "#e0342b": "red",
  "#2563eb": "blue",
};

const getLabelColorVariant = (color) => {
  return LABEL_COLOR_VARIANTS[color] ?? "default";
};

// Comprueba si existe una descripción real.
const hasRealDescription = (description) => {
  const value = String(description ?? "").trim();

  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return value.length > 0 && normalized !== "sin descripcion";
};

export default function TaskActionsModal({
  taskId,
  onClose,
  onView,
}) {
  const {
    currentUser,
    tasks,
    users,
    labels,
    columns,
    updateTask,
    deleteTask,
    addLabel,
    updateLabel,
    deleteLabel,
    uploadTaskAttachments,
    deleteTaskAttachment,
  } = useApp();

  const isAdmin = currentUser?.accountType === "admin";

  const [panel, setPanel] = useState(null);

  const [showAttachmentsModal, setShowAttachmentsModal] =
    useState(false);

  // ---- búsqueda de personal ----

  const [memberSearch, setMemberSearch] = useState("");

  // ---- creación de etiqueta nueva ----

  const [newLabelTitle, setNewLabelTitle] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(null);

  const [creatingLabel, setCreatingLabel] = useState(false);
  const [labelError, setLabelError] = useState(null);

  // ---- edición de una etiqueta existente ----

  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editColor, setEditColor] = useState(null);

  const [savingEdit, setSavingEdit] = useState(false);

  const task = tasks.find((t) => t.id === taskId);

  if (!task) return null;

  const priorityClass = PRIORITIES[task.priority]
    ? task.priority
    : "medium";

  const taskMemberIds = Array.isArray(task.members)
    ? task.members
    : [];

  const taskLabelIds = Array.isArray(task.labelIds)
    ? task.labelIds
    : [];

  const attachments = Array.isArray(task.attachments)
    ? task.attachments
    : [];

  const members = taskMemberIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);

  const taskLabels = taskLabelIds
    .map((id) => labels.find((l) => l.id === id))
    .filter(Boolean);

  // ---- indicadores de la tarjeta ----

  const hasDescription = hasRealDescription(task.description);

  const attachmentsCount = attachments.length;

  // ---- usuarios filtrados por nombre o email ----

  const searchText = memberSearch.trim().toLowerCase();

  const filteredUsers = searchText
    ? users.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(searchText) ||
          (u.email || "").toLowerCase().includes(searchText)
      )
    : users;

  const toggleMember = (userId) => {
    updateTask(task.id, {
      members: taskMemberIds.includes(userId)
        ? taskMemberIds.filter((v) => v !== userId)
        : [...taskMemberIds, userId],
    });
  };

  // ---- etiquetas ----

  const toggleLabel = (labelId) => {
    updateTask(task.id, {
      labelIds: taskLabelIds.includes(labelId)
        ? taskLabelIds.filter((v) => v !== labelId)
        : [...taskLabelIds, labelId],
    });
  };

  const canCreateLabel =
    newLabelTitle.trim().length > 0 &&
    newLabelColor !== null;

  const handleCreateLabel = async () => {
    if (!isAdmin || !canCreateLabel) return;

    setLabelError(null);
    setCreatingLabel(true);

    try {
      await addLabel({
        title: newLabelTitle.trim(),
        color: newLabelColor,
      });

      setNewLabelTitle("");
      setNewLabelColor(null);
    } catch (err) {
      const message =
        err?.response?.status === 403
          ? "Solo un administrador puede crear etiquetas nuevas."
          : err?.response?.data?.message ||
            "No se pudo crear la etiqueta.";

      setLabelError(message);
    } finally {
      setCreatingLabel(false);
    }
  };

  const startEditLabel = (label) => {
    if (!isAdmin) return;

    setEditingLabelId(label.id);
    setEditTitle(label.title || "");
    setEditColor(label.color);
    setLabelError(null);
  };

  const cancelEditLabel = () => {
    setEditingLabelId(null);
    setEditTitle("");
    setEditColor(null);
  };

  const canSaveEdit =
    editTitle.trim().length > 0 &&
    editColor !== null;

  const saveEditLabel = async () => {
    if (!isAdmin || !canSaveEdit) return;

    setSavingEdit(true);
    setLabelError(null);

    try {
      await updateLabel(editingLabelId, {
        title: editTitle.trim(),
        color: editColor,
      });

      cancelEditLabel();
    } catch (err) {
      const message =
        err?.response?.status === 403
          ? "Solo un administrador puede editar etiquetas."
          : err?.response?.data?.message ||
            "No se pudo guardar la etiqueta.";

      setLabelError(message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteLabel = async (labelId) => {
    if (!isAdmin) return;

    setLabelError(null);

    try {
      await deleteLabel(labelId);

      if (editingLabelId === labelId) {
        cancelEditLabel();
      }
    } catch (err) {
      const message =
        err?.response?.status === 403
          ? "Solo un administrador puede borrar etiquetas."
          : err?.response?.data?.message ||
            "No se pudo borrar la etiqueta.";

      setLabelError(message);
    }
  };

  // ---- acciones del menú ----

  const handleOptionClick = (id) => {
    if (id === "open") {
      return onView(task.id);
    }

    if (id === "attachments") {
      setShowAttachmentsModal(true);
      return;
    }

    if (id === "delete") {
      deleteTask(task.id);
      onClose();
      return;
    }

    setPanel(id);

    if (id === "labels") {
      cancelEditLabel();
      setLabelError(null);
    }

    if (id === "members") {
      setMemberSearch("");
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
        className="actions-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Vista previa de la tarjeta */}

        <div className="actions-modal__preview">

          <span
            className={
              `task-card__priority actions-modal__preview-priority
              actions-modal__preview-priority--${priorityClass}`
            }
          />

          {/* Etiquetas */}

          {taskLabels.length > 0 && (
            <div className="task-card__labels">
              {taskLabels.map((l) => (
                <span
                  key={l.id}
                  className={
                    `label actions-modal__preview-label
                    actions-modal__preview-label--${getLabelColorVariant(l.color)}`
                  }
                >
                  {l.title || "·"}
                </span>
              ))}
            </div>
          )}

          {/* Título */}

          <h4 className="task-card__title actions-modal__preview-title">
            {task.title}
          </h4>

          {/* Pie de tarjeta */}

          <div className="task-card__foot actions-modal__preview-foot">

            <div className="actions-modal__preview-meta">

              {/* Miembros */}

              <div className="avatars">
                {members.slice(0, 3).map((m) => (
                  <span
                    key={m.id}
                    className="avatar avatar--sm actions-modal__preview-avatar"
                    title={m.name}
                  >
                    {m.initials}
                  </span>
                ))}

                {members.length > 3 && (
                  <span className="avatar avatar--sm avatar--more">
                    +{members.length - 3}
                  </span>
                )}
              </div>

              {/* Indicadores */}

              {(hasDescription || attachmentsCount > 0) && (
                <div className="actions-modal__preview-indicators">

                  {hasDescription && (
                    <span
                      className="actions-modal__preview-indicator"
                      title="Esta tarea tiene una descripción"
                      aria-label="Tiene descripción"
                    >
                      <FiMenu />
                    </span>
                  )}

                  {attachmentsCount > 0 && (
                    <span
                      className="actions-modal__preview-indicator actions-modal__preview-attachment"
                      title={`${attachmentsCount} archivo(s) adjunto(s)`}
                      aria-label={`${attachmentsCount} archivos adjuntos`}
                    >
                      <FiPaperclip />
                      <span>{attachmentsCount}</span>
                    </span>
                  )}

                </div>
              )}

            </div>

            {/* Fecha límite */}

            {task.dueDate && (
              <span className="task-card__due">
                {new Date(task.dueDate).toLocaleDateString(
                  "es-AR",
                  {
                    day: "2-digit",
                    month: "short",
                  }
                )}
              </span>
            )}

          </div>
        </div>

        {/* Menú de acciones */}

        <div className="actions-modal__bubble">

          <div className="actions-modal__bubble-head">
            <span className="sync-dot" />

            Acciones de tarjeta

            <button
              className="icon-btn"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {panel === null && (
            <ul className="actions-modal__list">
              {OPTIONS.map((opt) => (
                <li key={opt.id}>
                  <button
                    className={
                      "actions-modal__item" +
                      (opt.tone === "danger" ? " is-danger" : "")
                    }
                    onClick={() => handleOptionClick(opt.id)}
                  >
                    <span
                      className={
                        "actions-modal__icon actions-modal__icon--" +
                        opt.tone
                      }
                    >
                      {opt.icon}
                    </span>

                    <span className="actions-modal__label">
                      {opt.label}
                    </span>

                    <span className="actions-modal__chevron">
                      ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Prioridad */}

          {panel === "priority" && (
            <div className="actions-modal__panel">
              <PanelHead
                title="Asignar prioridad"
                onBack={() => setPanel(null)}
              />

              <div className="chip-grid">
                {Object.values(PRIORITIES).map((p) => (
                  <button
                    key={p.id}
                    className={
                      "pill" +
                      (task.priority === p.id ? " pill--on" : "")
                    }
                    onClick={() =>
                      updateTask(task.id, {
                        priority: p.id,
                      })
                    }
                  >
                    <span
                      className="pill__dot"
                      data-priority={p.id}
                    />

                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Etiquetas */}

          {panel === "labels" && (
            <div className="actions-modal__panel">
              <PanelHead
                title="Etiquetas"
                onBack={() => {
                  setPanel(null);
                  cancelEditLabel();
                }}
              />

              <div className="label-manager__list">
                {labels.length === 0 && (
                  <p className="actions-modal__empty-hint">
                    Esta categoría todavía no tiene etiquetas.
                  </p>
                )}

                {labels.map((l) => {
                  const isEditing = editingLabelId === l.id;
                  const isOnTask = taskLabelIds.includes(l.id);

                  if (isAdmin && isEditing) {
                    return (
                      <div
                        key={l.id}
                        className="label-manager__row label-manager__row--editing"
                      >
                        <input
                          className="input label-manager__edit-input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Nombre de la etiqueta"
                          maxLength={30}
                          autoFocus
                        />

                        <div className="label-manager__colors">
                          {LABEL_COLOR_PRESETS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={
                                "label-manager__swatch" +
                                (editColor === c ? " is-selected" : "")
                              }
                              data-color={getLabelColorVariant(c)}
                              onClick={() => setEditColor(c)}
                            />
                          ))}
                        </div>

                        <div className="label-manager__row-actions">
                          <button
                            className="icon-btn icon-btn--danger"
                            title="Borrar etiqueta"
                            onClick={() => handleDeleteLabel(l.id)}
                          >
                            <IoTrashBinOutline />
                          </button>

                          <button
                            className="icon-btn"
                            title="Cancelar"
                            onClick={cancelEditLabel}
                          >
                            <IoClose />
                          </button>

                          <button
                            className="icon-btn icon-btn--primary"
                            title="Guardar"
                            onClick={saveEditLabel}
                            disabled={!canSaveEdit || savingEdit}
                          >
                            <IoCheckmark />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={l.id}
                      className="label-manager__row"
                    >
                      <button
                        className={
                          "label-manager__chip" +
                          (isOnTask ? " is-on" : "")
                        }
                        data-color={getLabelColorVariant(l.color)}
                        onClick={() => toggleLabel(l.id)}
                        title={
                          isOnTask
                            ? "Quitar de la tarea"
                            : "Agregar a la tarea"
                        }
                      >
                        {l.title}
                      </button>

                      {isAdmin && (
                        <button
                          className="label-manager__edit-btn"
                          title="Editar etiqueta"
                          onClick={() => startEditLabel(l)}
                        >
                          <IoPencil />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Crear nueva etiqueta */}

              {isAdmin && editingLabelId === null && (
                <div className="label-creator">
                  <span className="field__label">
                    Crear etiqueta
                  </span>

                  <input
                    className="input"
                    placeholder="Nombre de la etiqueta"
                    value={newLabelTitle}
                    onChange={(e) => setNewLabelTitle(e.target.value)}
                    maxLength={30}
                  />

                  <div className="label-creator__colors">
                    {LABEL_COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={
                          "label-creator__swatch" +
                          (newLabelColor === c ? " is-selected" : "")
                        }
                        data-color={getLabelColorVariant(c)}
                        onClick={() => setNewLabelColor(c)}
                      />
                    ))}
                  </div>

                  <button
                    className="btn btn--primary btn--sm"
                    onClick={handleCreateLabel}
                    disabled={!canCreateLabel || creatingLabel}
                  >
                    {creatingLabel
                      ? "Creando…"
                      : "+ Agregar etiqueta"}
                  </button>
                </div>
              )}

              {labelError && (
                <p className="label-creator__error">
                  {labelError}
                </p>
              )}
            </div>
          )}

          {/* Asignar personal */}

          {panel === "members" && (
            <div className="actions-modal__panel">
              <PanelHead
                title="Asignar personal"
                onBack={() => setPanel(null)}
              />

              <div className="member-search">
                <IoSearch />

                <input
                  type="search"
                  placeholder="Buscar por nombre o email"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>

              <div className="member-list">
                {filteredUsers.length === 0 ? (
                  <p className="member-empty">
                    No hay miembros disponibles.
                  </p>
                ) : (
                  filteredUsers.map((u) => {
                    const selected = taskMemberIds.includes(u.id);

                    return (
                      <button
                        key={u.id}
                        type="button"
                        className={
                          "member-option" +
                          (selected ? " member-option--on" : "")
                        }
                        onClick={() => toggleMember(u.id)}
                      >
                        <span className="member-option__avatar">
                          {u.initials}
                        </span>

                        <span className="member-option__info">
                          <strong>{u.name || "Sin nombre"}</strong>

                          {u.email && <small>{u.email}</small>}
                        </span>

                        {selected && (
                          <span className="member-option__check">
                            <IoCheckmark />
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Fecha límite */}

          {panel === "due" && (
            <div className="actions-modal__panel">
              <PanelHead
                title="Asignar fecha límite"
                onBack={() => setPanel(null)}
              />

              <input
                type="date"
                className="input"
                value={task.dueDate || ""}
                onChange={(e) =>
                  updateTask(task.id, {
                    dueDate: e.target.value,
                  })
                }
              />
            </div>
          )}

          {/* Modal independiente de adjuntos */}

          {showAttachmentsModal && (
            <TaskAttachmentsModal
              task={task}
              onClose={() => setShowAttachmentsModal(false)}
              onUpload={(files) =>
                uploadTaskAttachments(task.id, files)
              }
              onDelete={(attachment) =>
                deleteTaskAttachment(
                  task.id,
                  attachment.id ?? attachment._id
                )
              }
            />
          )}

          {/* Mover tarea */}

          {panel === "move" && (
            <div className="actions-modal__panel">
              <PanelHead
                title="Mover a"
                onBack={() => setPanel(null)}
              />

              <div className="chip-grid">
                {columns.map((c) => (
                  <button
                    key={c.id}
                    className={
                      "pill pill--outline" +
                      (task.column === c.id
                        ? " pill--outline-on"
                        : "")
                    }
                    onClick={() => {
                      updateTask(task.id, {
                        column: c.id,
                      });

                      setPanel(null);
                    }}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function PanelHead({ title, onBack }) {
  return (
    <div className="actions-modal__panel-head">
      <button
        className="actions-modal__back"
        onClick={onBack}
      >
        ‹
      </button>

      <strong>{title}</strong>
    </div>
  );
}