import { useState } from "react";
import { useApp } from "../context/AppContext";
import useTaskFromUrl from "../hooks/useTaskFromUrl";
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
  const [addingTaskColumnId, setAddingTaskColumnId] = useState(null);

  // los hooks van antes de cualquier return anticipado
  const clearTaskParam = useTaskFromUrl(setViewingId);

  const closeViewing = () => {
    setViewingId(null);
    clearTaskParam();
  };

  const handleDrop = async (columnId, beforeId = null) => {
    if (!dragging) return;
    const id = dragging;
    setDragging(null);
    try {
      await moveTask(id, columnId, beforeId);
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
            addingTaskColumnId={addingTaskColumnId}
            onAddTaskOpen={setAddingTaskColumnId}
            onAddTaskClose={(columnId) =>
              setAddingTaskColumnId((actual) => (actual === columnId ? null : actual))
            }
          />
        ))}
      </div>

      {viewingId && (
        <TaskDetailModal
          taskId={viewingId}
          onClose={closeViewing}
          onEdit={(id) => { closeViewing(); setEditingId(id); }}
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