
import { useState } from "react";

import { useApp } from "../context/AppContext";
import useTaskFromUrl from "../hooks/useTaskFromUrl";

import Column from "./Column";
import TaskDetailModal from "./TaskDetailModal";
import TaskActionsModal from "./taskmodal/TaskActionsModal.jsx";

import "../styles/components/board.css";

export default function Board() {
  const {
    columns,
    visibleTasks,
    moveTask,
    taskBatchBusy,

    tasksLoading,
    tasksError,
    reloadTasks,

    categoriesLoading,
    categoriesError,
    reloadCategories,
  } = useApp();

  const [dragging, setDragging] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [addingTaskColumnId, setAddingTaskColumnId] = useState(null);

  const [retrying, setRetrying] = useState(false);

  // Los hooks van antes de cualquier return anticipado.
  const clearTaskParam = useTaskFromUrl(setViewingId);

  /* =====================================================
     CERRAR DETALLE DE TAREA
     ===================================================== */

  const closeViewing = () => {
    setViewingId(null);
    clearTaskParam();
  };

  /* =====================================================
     REINTENTAR CARGA DEL TABLERO
     ===================================================== */

  const handleRetry = async () => {
    if (retrying || tasksLoading || categoriesLoading) {
      return;
    }

    setRetrying(true);

    try {
      // Reintentar ambas cargas para resolver cualquier error.
      await Promise.all([
        reloadTasks(),
        reloadCategories(),
      ]);
    } finally {
      setRetrying(false);
    }
  };

  /* =====================================================
     ARRASTRAR Y MOVER TAREAS
     ===================================================== */

  const handleDrop = async (
    columnId,
    beforeId = null,
  ) => {
    if (!dragging || taskBatchBusy) return;

    const id = dragging;

    setDragging(null);

    try {
      await moveTask(id, columnId, beforeId);
    } catch {
      // El estado local solo cambia después
      // de la confirmación del servidor.
    }
  };

  /* =====================================================
     ESTADO DE CARGA
     ===================================================== */

  if (categoriesLoading || tasksLoading || retrying) {
    return (
      <div className="board-scroll">
        <div className="board board--loading">
          {columns.map((col) => (
            <div
              key={col.id}
              className="column column--skeleton"
            >
              <div className="skeleton-line skeleton-line--title" />
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR Y REINTENTO
     ===================================================== */

  if (categoriesError || tasksError) {
    const errorMessage = [
      categoriesError,
      tasksError,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="board-error">
        <strong>
          No se pudo cargar el tablero
        </strong>

        <p>
          {errorMessage ||
            "Ocurrió un error al cargar la información."}
        </p>

        <button
          className="btn btn--primary"
          type="button"
          onClick={handleRetry}
          disabled={retrying}
        >
          {retrying ? "Reintentando..." : "Reintentar"}
        </button>
      </div>
    );
  }

  /* =====================================================
     TABLERO
     ===================================================== */

  return (
    <div className="board-scroll">
      <div className="board">
        {columns.map((col) => (
          <Column
            key={col.id}
            column={col}
            tasks={visibleTasks.filter(
              (task) => task.column === col.id,
            )}
            dragging={dragging}
            onDragStart={setDragging}
            onDragEnd={() => setDragging(null)}
            onDrop={handleDrop}
            onView={setViewingId}
            onEdit={setEditingId}
            addingTaskColumnId={addingTaskColumnId}
            onAddTaskOpen={setAddingTaskColumnId}
            onAddTaskClose={(columnId) =>
              setAddingTaskColumnId((actual) =>
                actual === columnId ? null : actual,
              )
            }
          />
        ))}
      </div>

      {/* ---------- DETALLE DE TAREA ---------- */}

      {viewingId && (
        <TaskDetailModal
          taskId={viewingId}
          onClose={closeViewing}
          onEdit={(id) => {
            closeViewing();
            setEditingId(id);
          }}
        />
      )}

      {/* ---------- ACCIONES DE TAREA ---------- */}

      {editingId && (
        <TaskActionsModal
          taskId={editingId}
          onClose={() => setEditingId(null)}
          onView={(id) => {
            setEditingId(null);
            setViewingId(id);
          }}
        />
      )}
    </div>
  );
}
