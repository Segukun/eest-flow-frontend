
import { useEffect, useId, useRef, useState } from "react";

import {
  FiArrowRight,
  FiX,
} from "react-icons/fi";

import { IoFileTrayFull } from "react-icons/io5";

import { useApp } from "../context/AppContext";
import { useToast } from "./Toast.jsx";

import { TaskSelectionContext } from "../hooks/useTaskSelection";

import {
  retainTaskSelection,
  toggleTaskSelection,
} from "../taskSelection.js";

import "../styles/components/task-selection.css";

/* =========================================================
   DIÁLOGO PARA MOVER TAREAS
   ========================================================= */

function MoveTasksDialog({
  count,
  columns,
  busy,
  onClose,
  onMove,
}) {
  const dialog = useRef(null);
  const headingId = useId();

  const [destination, setDestination] = useState(
    columns[0]?.id || "",
  );

  useEffect(() => {
    const element = dialog.current;

    if (!element) return undefined;

    element.showModal();

    return () => {
      if (element.open) {
        element.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="task-move-dialog"
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();

        if (!busy) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onMove(destination);
        }}
      >
        <h2 id={headingId}>
          Mover {count} {count === 1 ? "tarea" : "tareas"} a:
        </h2>

        <fieldset disabled={busy}>
          <legend>Columna de destino</legend>

          {columns.map((column) => (
            <label key={column.id}>
              <input
                type="radio"
                name="destination"
                value={column.id}
                checked={destination === column.id}
                onChange={() =>
                  setDestination(column.id)
                }
              />

              {column.title}
            </label>
          ))}
        </fieldset>

        <div className="task-move-dialog__actions">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={busy || !destination}
          >
            {busy ? "Moviendo…" : "Mover tareas"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

/* =========================================================
   SELECCIÓN MÚLTIPLE DE TAREAS
   ========================================================= */

export default function TaskSelection({ children }) {
  const {
    visibleTasks,
    columns,
    currentUser,
    runTaskBatch,
    taskBatchBusy,
  } = useApp();

  const toast = useToast();

  const mounted = useRef(true);
  const pending = useRef(false);

  const [selectedTaskIds, setSelectedTaskIds] = useState(
    () => new Set(),
  );

  const [previousTasks, setPreviousTasks] = useState(
    visibleTasks,
  );

  const [moveOpen, setMoveOpen] = useState(false);
  const [action, setAction] = useState(null);

  const canMove = Boolean(currentUser);

  const canArchive = [
    "admin",
    "collaborator",
  ].includes(currentUser?.accountType);

  /* =====================================================
     CONTROL DE MONTAJE
     ===================================================== */

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  /* =====================================================
     MANTENER SELECCIÓN VÁLIDA
     ===================================================== */

  // Elimina los IDs de tareas archivadas, eliminadas
  // o que dejaron de estar visibles por los filtros.
  if (previousTasks !== visibleTasks) {
    setPreviousTasks(visibleTasks);

    setSelectedTaskIds((previous) =>
      retainTaskSelection(previous, visibleTasks),
    );
  }

  const selected = retainTaskSelection(
    selectedTaskIds,
    visibleTasks,
  );

  const count = selected.size;

  const busy = taskBatchBusy || action !== null;

  /* =====================================================
     SELECCIONAR / DESELECCIONAR
     ===================================================== */

  const toggle = (id) => {
    if (busy || pending.current || !canMove) {
      return;
    }

    setSelectedTaskIds((previous) =>
      toggleTaskSelection(previous, id),
    );
  };

  /* =====================================================
     MENSAJES DE RESULTADO
     ===================================================== */

  const notifyOutcome = (
    outcome,
    nextAction,
  ) => {
    const succeeded = outcome?.succeeded ?? [];
    const failed = outcome?.failed ?? [];
    const skipped = outcome?.skipped ?? [];

    const verb = nextAction === "move"
      ? "movidas"
      : "archivadas";

    const singularVerb = nextAction === "move"
      ? "movida"
      : "archivada";

    const succeededMessage =
      succeeded.length === 1
        ? `1 tarea ${singularVerb}`
        : `${succeeded.length} tareas ${verb}`;

    const failedMessage =
      failed.length === 1
        ? "1 tarea no pudo procesarse"
        : `${failed.length} tareas no pudieron procesarse`;

    // Error parcial o error de sincronización.
    if (failed.length > 0 || outcome?.syncError) {
      const parts = [];

      if (succeeded.length > 0) {
        parts.push(`${succeededMessage} correctamente`);
      }

      if (failed.length > 0) {
        parts.push(failedMessage);
      }

      if (skipped.length > 0) {
        parts.push(
          `${skipped.length} ya estaban en el destino`,
        );
      }

      if (outcome?.syncError) {
        parts.push(outcome.syncError);
      } else if (failed.length > 0) {
        parts.push(
          "Las tareas pendientes siguen seleccionadas para reintentarlas.",
        );
      }

      toast.error(
        parts.join(". ") + ".",
      );

      return;
    }

    // Operación exitosa.
    if (succeeded.length > 0) {
      let message = `${succeededMessage} correctamente`;

      if (skipped.length > 0) {
        message += `. ${skipped.length} ya estaban en el destino`;
      }

      toast.success(message + ".");
      return;
    }

    // No hubo cambios porque las tareas ya estaban en destino.
    if (skipped.length > 0) {
      toast.info(
        skipped.length === 1
          ? "La tarea seleccionada ya estaba en el destino."
          : `${skipped.length} tareas ya estaban en el destino.`,
      );

      return;
    }

    toast.info("No había tareas para procesar.");
  };

  /* =====================================================
     EJECUTAR ACCIONES EN LOTE
     ===================================================== */

  const execute = async (
    nextAction,
    destination,
  ) => {
    if (
      !count ||
      busy ||
      pending.current
    ) {
      return;
    }

    pending.current = true;

    setAction(nextAction);

    try {
      /*
       * Mantiene el orden del tablero independientemente
       * del orden en que se seleccionaron las tareas.
       */
      const ids = columns.flatMap((column) =>
        visibleTasks
          .filter(
            (task) =>
              selected.has(task.id) &&
              task.column === column.id,
          )
          .map((task) => task.id),
      );

      const outcome = await runTaskBatch(
        ids,
        nextAction,
        destination,
      );

      const failed = outcome?.failed ?? [];

      const failedIds = new Set(
        failed.map((failure) => String(failure.id)),
      );

      /*
       * Las tareas correctas desaparecen de la selección.
       * Las que fallaron permanecen seleccionadas para
       * que el usuario pueda reintentarlas.
       */
      if (mounted.current) {
        setSelectedTaskIds(
          new Set(
            [...selected]
              .filter((id) => failedIds.has(String(id))),
          ),
        );
      }

      /*
       * El feedback se muestra siempre con Toast.
       * Ya no depende de que el componente se haya desmontado.
       */
      notifyOutcome(outcome, nextAction);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "No se pudo completar la operación.",
      );
    } finally {
      pending.current = false;

      if (mounted.current) {
        setAction(null);
        setMoveOpen(false);
      }
    }
  };

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <TaskSelectionContext.Provider
      value={{
        selectedTaskIds: selected,
        toggle,
        busy,
        canSelect: canMove,
      }}
    >
      {/* Estado de procesamiento cuando ya no hay tareas seleccionadas */}
      {busy && count === 0 && (
        <p role="status">
          Procesando tareas seleccionadas…
        </p>
      )}

      {/* Barra de acciones */}
      {count > 0 && (
        <section
          className="task-selection-toolbar"
          aria-label="Acciones de tareas seleccionadas"
          aria-busy={busy}
        >
          <strong aria-live="polite">
            {count}{" "}
            {count === 1
              ? "tarea seleccionada"
              : "tareas seleccionadas"}
          </strong>

          <div className="task-selection-toolbar__actions">
            {canMove && (
              <button
                type="button"
                disabled={busy}
                aria-label="Mover tareas seleccionadas"
                onClick={() => setMoveOpen(true)}
              >
                <FiArrowRight />
                Mover
              </button>
            )}

            {canArchive && (
              <button
                type="button"
                disabled={busy}
                aria-label="Archivar tareas seleccionadas"
                onClick={() => execute("archive")}
              >
                <IoFileTrayFull />

                {action === "archive"
                  ? "Archivando…"
                  : "Archivar"}
              </button>
            )}

            <button
              type="button"
              disabled={busy}
              aria-label="Cancelar selección"
              onClick={() =>
                setSelectedTaskIds(new Set())
              }
            >
              <FiX />
              Cancelar selección
            </button>
          </div>
        </section>
      )}

      {children}

      {/* Diálogo para mover tareas */}
      {moveOpen && count > 0 && (
        <MoveTasksDialog
          count={count}
          columns={columns}
          busy={busy}
          onClose={() => setMoveOpen(false)}
          onMove={(destination) =>
            execute("move", destination)
          }
        />
      )}
    </TaskSelectionContext.Provider>
  );
}
