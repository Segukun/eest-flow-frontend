import { useState } from "react";
import { useApp } from "../context/AppContext";
import Column from "./Column";
import TaskDetailModal from "./TaskDetailModal";
import TaskActionsModal from "../components/taskmodal/TaskActionsModal.jsx";
import "../styles/components/board.css";

export default function Board() {
  const { columns, visibleTasks, moveTask } = useApp();
  const [dragging, setDragging] = useState(null);
  const [viewingId, setViewingId] = useState(null); // click en la tarjeta
  const [editingId, setEditingId] = useState(null); // click en el lápiz

  const handleDrop = (columnId, beforeId) => {
    if (!dragging) return;
    moveTask(dragging, columnId, beforeId);
    setDragging(null);
  };

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