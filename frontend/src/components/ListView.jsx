import { colorChipStyle } from "../colorPresets.js";
import { useState } from "react";

import { FiMenu, FiPaperclip } from "react-icons/fi";

import {
  useApp,
  PRIORITIES,
} from "../context/AppContext";

import useTaskFromUrl from "../hooks/useTaskFromUrl";

import TaskDetailModal from "./TaskDetailModal";
import TaskActionsModal from "./taskmodal/TaskActionsModal.jsx";

import "../styles/components/list-view.css";

// Comprueba si existe una descripción real.
// "Sin descripción" funciona como indicador, no como contenido.
const hasRealDescription = (description) => {
  const value = String(description ?? "").trim();

  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return value.length > 0 && normalized !== "sin descripcion";
};

export default function ListView() {
  const {
    visibleTasks,
    columns,
    users,
    labels,
    tasksLoading,
    categoriesLoading,
  } = useApp();

  const [viewingId, setViewingId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Abre la tarjeta si la URL trae ?task=<id>.
  const clearTaskParam = useTaskFromUrl(setViewingId);

  const closeViewing = () => {
    setViewingId(null);
    clearTaskParam();
  };

  if (tasksLoading || categoriesLoading) {
    return <div className="list-view list-view--loading" />;
  }

  return (
    <>
      <div className="list-view">
        {columns.map((col) => {
          const rows = visibleTasks.filter(
            (t) => t.column === col.id
          );

          if (!rows.length) return null;

          return (
            <div key={col.id} className="list-group">

              {/* Encabezado de columna */}

              <h3 className="list-group__title">
                <span
                  className="column__dot"
                  style={{ background: col.dot }}
                />

                {col.title}

                <span className="column__count">
                  {rows.length}
                </span>
              </h3>

              {/* Tareas */}

              {rows.map((t) => {
                const taskLabels = (t.labelIds ?? [])
                  .map((id) =>
                    labels.find((l) => l.id === id)
                  )
                  .filter(Boolean);

                const taskMembers = (t.members ?? [])
                  .map((id) =>
                    users.find((u) => u.id === id)
                  )
                  .filter(Boolean);

                const attachments = Array.isArray(t.attachments)
                  ? t.attachments
                  : [];

                const attachmentsCount = attachments.length;

                const hasDescription = hasRealDescription(
                  t.description
                );

                const priorityColor =
                  PRIORITIES[t.priority]?.color ??
                  PRIORITIES.medium.color;

                return (
                  <button
                    key={t.id}
                    type="button"
                    className="list-row"
                    onClick={() => setViewingId(t.id)}
                  >
                    {/* Prioridad */}

                    <span
                      className="list-row__priority"
                      style={{ background: priorityColor }}
                    />

                    {/* Título */}

                    <span className="list-row__title">
                      {t.title}
                    </span>

                    {/* Etiquetas */}

                    {taskLabels.length > 0 && (
                      <span className="list-row__labels">
                        {taskLabels.map((l) => (
                          <span
                            key={l.id}
                            className="label"
                            style={colorChipStyle(l.color)}
                          >
                            {l.title || "·"}
                          </span>
                        ))}
                      </span>
                    )}

                    {/* Miembros */}

                    {taskMembers.length > 0 && (
                      <span className="avatars list-row__avatars">
                        {taskMembers.map((u) => (
                          <span
                            key={u.id}
                            className="avatar avatar--sm"
                            style={{
                              background: "var(--color-green)",
                            }}
                            title={u.name}
                          >
                            {u.initials}
                          </span>
                        ))}
                      </span>
                    )}

                    {/* Indicadores de descripción y archivos */}

                    {(hasDescription || attachmentsCount > 0) && (
                      <span className="list-row__indicators">

                        {hasDescription && (
                          <span
                            className="list-row__indicator"
                            title="Esta tarea tiene una descripción"
                            aria-label="Tiene descripción"
                          >
                            <FiMenu />
                          </span>
                        )}

                        {attachmentsCount > 0 && (
                          <span
                            className="list-row__indicator list-row__indicator--attachments"
                            title={`${attachmentsCount} archivo(s) adjunto(s)`}
                            aria-label={`${attachmentsCount} archivos adjuntos`}
                          >
                            <FiPaperclip />

                            <span className="list-row__attachment-count">
                              {attachmentsCount}
                            </span>
                          </span>
                        )}

                      </span>
                    )}

                    {/* Fecha límite */}

                    <span className="list-row__due">
                      {t.dueDate || "-/-/-"}
                    </span>

                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Modal de detalle */}

      {viewingId && (
        <TaskDetailModal
          taskId={viewingId}
          onClose={closeViewing}
          onEdit={(id) => {
            closeViewing();
            setEditingId(id);
          }}
        />
      )}

      {/* Modal de acciones */}

      {editingId && (
        <TaskActionsModal
          taskId={editingId}
          onClose={() => setEditingId(null)}
          onView={(id) => {
            setEditingId(null);
            setViewingId(id);
          }}
        />
      )}
    </>
  );
}