import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useApp } from "../context/AppContext";
import Column from "./Column";
import TaskModal from "./TaskModal";
import "../styles/components/board-mobile.css";

export default function BoardMobile() {
  const { columns, visibleTasks, moveTask } = useApp();
  const [editingId, setEditingId] = useState(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  return (
    <>
      <div className="board-mobile">
        <div className="board-mobile__nav">
          <button
            className="board-mobile__arrow"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={selected === 0}
          >
            ‹
          </button>
          <span className="board-mobile__current">{columns[selected]?.title}</span>
          <button
            className="board-mobile__arrow"
            onClick={() => emblaApi?.scrollNext()}
            disabled={selected === columns.length - 1}
          >
            ›
          </button>
        </div>

        <div className="board-mobile__viewport" ref={emblaRef}>
          <div className="board-mobile__container">
            {columns.map((col) => (
              <div className="board-mobile__slide" key={col.id}>
                <Column
                  column={col}
                  tasks={visibleTasks.filter((t) => t.column === col.id)}
                  onEdit={setEditingId}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="board-mobile__dots">
          {columns.map((c, i) => (
            <button
              key={c.id}
              className={"board-mobile__dot" + (i === selected ? " is-active" : "")}
              style={i === selected ? { background: c.dot } : undefined}
              onClick={() => emblaApi?.scrollTo(i)}
            />
          ))}
        </div>
      </div>

      {editingId && <TaskModal taskId={editingId} onClose={() => setEditingId(null)} />}
    </>
  );
}