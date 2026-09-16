import { useState } from "react";
import TaskCard from "./TaskCard";
import AddTask from "./AddTask";

export default function Column({ column, tasks, dragging, onDragStart, onDragEnd, onDrop, onEdit }) {
  const [over, setOver] = useState(false);

  return (
    <section
      className={"column" + (over ? " column--over" : "")}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onDrop(column.id, null); }}
    >
      <header className="column__head">
        <div className="column__title">
          <span className="column__dot" style={{ background: column.dot }} />
          {column.title}
          <span className="column__count">{tasks.length}</span>
        </div>
        <button className="column__more">···</button>
      </header>

      <div className="column__body">
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            isDragging={dragging === t.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDropBefore={(beforeId) => onDrop(column.id, beforeId)}
            onEdit={onEdit}
          />
        ))}

        {tasks.length === 0 && (
          <div className="column__empty">
            <span className="column__empty-icon">+</span>
            <strong>Aún no hay tareas</strong>
            <small>Arrastrá una tarea o creá una nueva</small>
          </div>
        )}

        <AddTask columnId={column.id} />
      </div>
    </section>
  );
}