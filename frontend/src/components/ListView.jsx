import { colorChipStyle } from "../colorPresets.js";
import { useState } from "react";
import { FiMenu, FiPaperclip } from "react-icons/fi";
import { useApp, PRIORITIES } from "../context/AppContext";
import useTaskFromUrl from "../hooks/useTaskFromUrl";
import TaskDetailModal from "./TaskDetailModal";
import TaskActionsModal from "./taskmodal/TaskActionsModal.jsx";
import AssignedUsersPreview from "./AssignedUsersPreview";
import TaskQuickActions from "./TaskQuickActions";
import "../styles/components/list-view.css";

const hasRealDescription = (description) => {
  const value = String(description ?? "").trim();
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return value.length > 0 && normalized !== "sin descripcion";
};

export default function ListView() {
  const { visibleTasks, columns, users, labels, tasksLoading, categoriesLoading } = useApp();
  const [viewingId, setViewingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
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
          const rows = visibleTasks.filter((task) => task.column === col.id);
          if (!rows.length) return null;

          return (
            <section key={col.id} className="list-group">
              <h3 className="list-group__title">
                <span className="column__dot" style={{ background: col.dot }} />
                {col.title}
                <span className="column__count">{rows.length}</span>
              </h3>
              <div className="list-header" aria-hidden="true">
                <span>Tarea</span><span>Asignados</span><span>Etiquetas</span><span>Fecha</span><span>Acciones</span>
              </div>
              {rows.map((task) => {
                const taskLabels = (task.labelIds ?? []).map((id) => labels.find((label) => label.id === id)).filter(Boolean);
                const members = (task.members ?? []).map((id) => users.find((user) => user.id === id)).filter(Boolean);
                const attachmentCount = Array.isArray(task.attachments) ? task.attachments.length : 0;
                return (
                  <article key={task.id} className="list-row" onClick={() => setViewingId(task.id)}>
                    <div className="list-row__task">
                      <span className="list-row__priority" style={{ background: PRIORITIES[task.priority]?.color ?? PRIORITIES.medium.color }} />
                      <div className="list-row__task-content">
                        <button type="button" className="list-row__title" onClick={() => setViewingId(task.id)}>
                          {task.title}
                        </button>
                        <span className="list-row__indicators">
                          {hasRealDescription(task.description) && <span title="Esta tarea tiene una descripción" aria-label="Tiene descripción"><FiMenu /></span>}
                          {attachmentCount > 0 && (
                            <span title={`${attachmentCount} archivo(s) adjunto(s)`} aria-label={`${attachmentCount} archivos adjuntos`}>
                              <FiPaperclip /> {attachmentCount}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="list-row__members" aria-label="Asignados">
                      {members.length ? <AssignedUsersPreview members={members} /> : <span className="list-row__empty">—</span>}
                    </div>
                    <div className="list-row__labels" aria-label="Etiquetas">
                      {taskLabels.length ? taskLabels.map((label) => (
                        <span key={label.id} className="label" style={colorChipStyle(label.color)}>{label.title || "·"}</span>
                      )) : <span className="list-row__empty">—</span>}
                    </div>
                    <span className="list-row__due" aria-label="Fecha límite">{task.dueDate || "—"}</span>
                    <TaskQuickActions taskId={task.id} onEdit={setEditingId} />
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
      {viewingId && (
        <TaskDetailModal taskId={viewingId} onClose={closeViewing} onEdit={(id) => { closeViewing(); setEditingId(id); }} />
      )}
      {editingId && (
        <TaskActionsModal taskId={editingId} onClose={() => setEditingId(null)} onView={(id) => { setEditingId(null); setViewingId(id); }} />
      )}
    </>
  );
}
