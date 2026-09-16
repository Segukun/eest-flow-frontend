import { useState } from "react";
import { useApp } from "../context/AppContext";
import Column from "./Column";
import TaskModal from "./TaskModal";
import "../styles/components/board.css";

export default function Board() {
  const { columns, visibleTasks, moveTask } = useApp();
  const [dragging, setDragging] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const handleDrop = (columnId, beforeId) => {
    if (!dragging) return;
    moveTask(dragging, columnId, beforeId);
    setDragging(null);
  };

  return (
    <>
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
            onEdit={setEditingId}
          />
        ))}
      </div>

      {editingId && <TaskModal taskId={editingId} onClose={() => setEditingId(null)} />}
    </>
  );
}