import { useRef, useState } from "react";
import TaskCard from "./TaskCard";
import AddTask from "./AddTask";

export default function Column({
  column,
  tasks,
  dragging,
  onDragStart,
  onDragEnd,
  onDrop,
  onView,
  onEdit,
  addingTaskColumnId,
  onAddTaskOpen,
  onAddTaskClose,
}) {
  const [over, setOver] = useState(false);
  // Posición donde caería la tarea: 0 = antes de la primera, tasks.length = al final
  const [overIndex, setOverIndex] = useState(null);
  const bodyRef = useRef(null);
  const isEmpty = tasks.length === 0;
  const isAddingTask = addingTaskColumnId === column.id;

  // Calcula la posición según la altura (Y) del mouse, comparándola con la
  // mitad de cada tarjeta. Así funciona en cualquier lugar de la columna
  // (sobre una tarjeta, en el espacio entre tarjetas o abajo de todo).
  const indexFromY = (clientY) => {
    const cards = bodyRef.current ? bodyRef.current.querySelectorAll(".task-card") : [];
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }
    return cards.length;
  };

  const reset = () => {
    setOver(false);
    setOverIndex(null);
  };

  // No marcamos posiciones donde la tarea quedaría igual que ahora
  const draggingIndex = tasks.findIndex((t) => t.id === dragging);
  const isNoop =
    draggingIndex !== -1 && (overIndex === draggingIndex || overIndex === draggingIndex + 1);
  const showMarker = overIndex !== null && !isNoop;

  const markerFor = (i) => {
    if (!showMarker) return null;
    if (overIndex === i) return "before";
    if (overIndex === tasks.length && i === tasks.length - 1) return "after";
    return null;
  };

  return (
    <section
      className={"column" + (over ? " column--over" : "")}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
        setOverIndex(indexFromY(e.clientY));
      }}
      onDragLeave={(e) => {
        // solo se limpia al salir de la columna, no al pasar entre sus hijos
        if (!e.currentTarget.contains(e.relatedTarget)) reset();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const index = indexFromY(e.clientY);
        reset();
        // onDrop(columnId, beforeId): beforeId = tarea ANTES de la cual se inserta
        // (null = al final de la columna)
        onDrop(column.id, tasks[index]?.id ?? null);
      }}
    >
      <header className="column__head">
        <div className="column__title">
          <span className="column__dot" style={{ background: column.dot }} />
          {column.title}
          <span className="column__count">{tasks.length}</span>
        </div>
        <button className="column__more">···</button>
      </header>

      <div className="column__body" ref={bodyRef}>
        {tasks.map((task, i) => (
          <TaskCard
            key={task.id}
            task={task}
            isDragging={dragging === task.id}
            dropMarker={markerFor(i)}
            onDragStart={onDragStart}
            onDragEnd={() => {
              reset();
              onDragEnd();
            }}
            onView={onView}
            onEdit={onEdit}
          />
        ))}

        <AddTask
          columnId={column.id}
          variant={isEmpty ? "empty" : "default"}
          isOpen={isAddingTask}
          onOpen={onAddTaskOpen}
          onClose={() => onAddTaskClose?.(column.id)}
        />
      </div>
    </section>
  );
}