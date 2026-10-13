import { useState } from "react";
import { useApp } from "../context/AppContext";
import Column from "./Column";
import TaskDetailModal from "./TaskDetailModal";
import TaskActionsModal from "./taskmodal/TaskActionsModal.jsx";
import "../styles/components/board.css";

export default function Board() {
  const {
    columns, visibleTasks, moveTask,
    tasksLoading, tasksError, reloadTasks,
    categoriesLoading, categoriesError,
  } = useApp();
  const [dragging, setDragging] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const handleDrop = async (columnId) => {
    if (!dragging) return;
    const id = dragging;
    setDragging(null);
    try {
      await moveTask(id, columnId);
    } catch {
      // moveTask ya revierte
    }
  };

  if (categoriesLoading || tasksLoading) {
    return (
      <div className="board-scroll">
        <div className="board board--loading">
          {columns.map((col) => (
            <div key={col.id} className="column column--skeleton">
              <div className="skeleton-line skeleton-line--title" />
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (categoriesError || tasksError) {
    return (
      <div className="board-error">
        <strong>No se pudo cargar el tablero</strong>
        <p>{categoriesError || tasksError}</p>
        <button className="btn btn--primary" onClick={reloadTasks}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="board-scroll">
      <div className="board">
        {columns.map((col) => (
          <Column
            key={col.id}
            column={col}
            tasks={visibleTasks.filter((t) => t.column === col.id)}
            dragging={dragging}
            onDragStart={setDragging}
            onDragEnd={() => setDragging(null)}
            onDrop={handleDrop}
            onView={setViewingId}
            onEdit={setEditingId}
          />
        ))}
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
    </div>
  );
}