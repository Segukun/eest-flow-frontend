import { useState } from "react";
import { useApp, PRIORITIES } from "../context/AppContext";
import TaskDetailModal from "./TaskDetailModal";
import TaskActionsModal from "./taskmodal/TaskActionsModal.jsx";
import "../styles/components/list-view.css";

export default function ListView() {
  const { visibleTasks, columns, users, labels, tasksLoading, categoriesLoading } = useApp();
  const [viewingId, setViewingId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  if (tasksLoading || categoriesLoading) {
    return <div className="list-view list-view--loading" />;
  }

  return (
    <>
      <div className="list-view">
        {columns.map((col) => {
          const rows = visibleTasks.filter((t) => t.column === col.id);
          if (!rows.length) return null;
          return (
            <div key={col.id} className="list-group">
              <h3 className="list-group__title">
                <span className="column__dot" style={{ background: col.dot }} />
                {col.title} <span className="column__count">{rows.length}</span>
              </h3>
              {rows.map((t) => {
                const taskLabels = t.labelIds.map((id) => labels.find((l) => l.id === id)).filter(Boolean);
                return (
                  <button key={t.id} className="list-row" onClick={() => setViewingId(t.id)}>
                    <span className="list-row__priority" style={{ background: PRIORITIES[t.priority].color }} />
                    <span className="list-row__title">{t.title}</span>
                    <span className="list-row__labels">
                      {taskLabels.map((l) => (
                        <span key={l.id} className="label" style={{ color: l.color }}>{l.title || "·"}</span>
                      ))}
                    </span>
                    <span className="avatars">
                      {t.members.map((id) => {
                        const u = users.find((x) => x.id === id);
                        return u ? (
                          <span key={id} className="avatar avatar--sm" style={{ background: "var(--color-green)" }}>{u.initials}</span>
                        ) : null;
                      })}
                    </span>
                    <span className="list-row__due">{t.dueDate || "—"}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {viewingId && (
        <TaskDetailModal
          taskId={viewingId}
          onClose={() => setViewingId(null)}
          onEdit={(id) => { setViewingId(null); setEditingId(id); }}
        />
      )}
      {editingId && (
        <TaskActionsModal
          taskId={editingId}
          onClose={() => setEditingId(null)}
          onView={(id) => { setEditingId(null); setViewingId(id); }}
        />
      )}
    </>
  );
}