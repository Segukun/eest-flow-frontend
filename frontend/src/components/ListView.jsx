import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PRIORITIES, LABEL_COLORS } from "../mock/db";
import TaskModal from "./TaskModal";
import "../styles/components/list-view.css";

export default function ListView() {
  const { visibleTasks, columns, users } = useApp();
  const [editingId, setEditingId] = useState(null);

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
              {rows.map((t) => (
                <button key={t.id} className="list-row" onClick={() => setEditingId(t.id)}>
                  <span className="list-row__priority" style={{ background: PRIORITIES[t.priority].color }} />
                  <span className="list-row__title">{t.title}</span>
                  <span className="list-row__labels">
                    {t.labels.map((l) => (
                      <span key={l} className="label" style={{ color: LABEL_COLORS[l] }}>{l}</span>
                    ))}
                  </span>
                  <span className="avatars">
                    {t.members.map((id) => {
                      const u = users.find((x) => x.id === id);
                      return u ? (
                        <span key={id} className="avatar avatar--sm" style={{ background: u.color }}>{u.initials}</span>
                      ) : null;
                    })}
                  </span>
                  <span className="list-row__due">{t.dueDate || "—"}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
      {editingId && <TaskModal taskId={editingId} onClose={() => setEditingId(null)} />}
    </>
  );
}