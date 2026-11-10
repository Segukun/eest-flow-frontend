import { useEffect, useId, useRef, useState } from "react";
import { FiArrowRight, FiX } from "react-icons/fi";
import { IoFileTrayFull } from "react-icons/io5";
import { useApp } from "../context/AppContext";
import { useToast } from "./Toast";
import { TaskSelectionContext } from "../hooks/useTaskSelection";
import { retainTaskSelection, toggleTaskSelection } from "../taskSelection.js";
import "../styles/components/task-selection.css";

function MoveTasksDialog({ count, columns, busy, onClose, onMove }) {
  const dialog = useRef(null);
  const headingId = useId();
  const [destination, setDestination] = useState(columns[0]?.id || "");
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  return (
    <dialog ref={dialog} className="task-move-dialog" aria-labelledby={headingId}
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
      <form onSubmit={(event) => { event.preventDefault(); onMove(destination); }}>
        <h2 id={headingId}>Mover {count} {count === 1 ? "tarea" : "tareas"} a:</h2>
        <fieldset disabled={busy}>
          <legend>Columna de destino</legend>
          {columns.map((column) => (
            <label key={column.id}>
              <input type="radio" name="destination" value={column.id}
                checked={destination === column.id} onChange={() => setDestination(column.id)} />
              {column.title}
            </label>
          ))}
        </fieldset>
        <div className="task-move-dialog__actions">
          <button type="button" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="submit" disabled={busy || !destination}>{busy ? "Moviendo…" : "Mover tareas"}</button>
        </div>
      </form>
    </dialog>
  );
}

export default function TaskSelection({ children }) {
  const { visibleTasks, columns, currentUser, runTaskBatch, taskBatchBusy, reloadTasks } = useApp();
  const toast = useToast();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const [selectedTaskIds, setSelectedTaskIds] = useState(() => new Set());
  const [previousTasks, setPreviousTasks] = useState(visibleTasks);
  const [moveOpen, setMoveOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [result, setResult] = useState(null);
  const pending = useRef(false);
  const canMove = Boolean(currentUser);
  const canArchive = ["admin", "collaborator"].includes(currentUser?.accountType);

  // Remove archived/deleted/filtered-out IDs instead of silently selecting them
  // again when a filter is cleared. Navigation resets this provider via its key.
  if (previousTasks !== visibleTasks) {
    setPreviousTasks(visibleTasks);
    setSelectedTaskIds(retainTaskSelection(selectedTaskIds, visibleTasks));
  }
  const selected = retainTaskSelection(selectedTaskIds, visibleTasks);
  const count = selected.size;
  const busy = taskBatchBusy || action !== null;

  const toggle = (id) => {
    if (busy || pending.current || !canMove) return;
    setResult(null);
    setSelectedTaskIds((prev) => toggleTaskSelection(prev, id));
  };

  const execute = async (nextAction, destination) => {
    if (!count || busy || pending.current) return;
    pending.current = true;
    setAction(nextAction);
    setResult(null);
    try {
      // Board/column order, independent of the order of clicks.
      const ids = columns.flatMap((column) => visibleTasks
        .filter((task) => selected.has(task.id) && task.column === column.id)
        .map((task) => task.id));
      const outcome = await runTaskBatch(ids, nextAction, destination);
      const failedIds = new Set(outcome.failed.map((failure) => failure.id));
      setSelectedTaskIds((prev) => new Set([...prev].filter((id) => failedIds.has(id))));
      setResult({ ...outcome, action: nextAction });
      if (!mounted.current) {
        const message = `${outcome.succeeded.length} tareas ${nextAction === "move" ? "movidas" : "archivadas"}; ${outcome.failed.length} fallidas.`;
        if (outcome.failed.length || outcome.syncError) toast.error(`${message} ${outcome.syncError || "Revisá las tareas pendientes."}`);
        else toast.success(message);
      }
    } catch (error) {
      setResult({ error: error.message || "No se pudo completar la operación." });
    } finally {
      setAction(null);
      setMoveOpen(false);
      pending.current = false;
    }
  };

  return (
    <TaskSelectionContext.Provider value={{ selectedTaskIds: selected, toggle, busy, canSelect: canMove }}>
      {busy && count === 0 && <p role="status">Procesando tareas seleccionadas…</p>}
      {count > 0 && (
        <section className="task-selection-toolbar" aria-label="Acciones de tareas seleccionadas" aria-busy={busy}>
          <strong aria-live="polite">{count} {count === 1 ? "tarea seleccionada" : "tareas seleccionadas"}</strong>
          <div className="task-selection-toolbar__actions">
            {canMove && <button type="button" disabled={busy} aria-label="Mover tareas seleccionadas" onClick={() => setMoveOpen(true)}><FiArrowRight />Mover</button>}
            {canArchive && <button type="button" disabled={busy} aria-label="Archivar tareas seleccionadas" onClick={() => execute("archive")}><IoFileTrayFull />{action === "archive" ? "Archivando…" : "Archivar"}</button>}
            <button type="button" disabled={busy} aria-label="Cancelar selección" onClick={() => { setSelectedTaskIds(new Set()); setResult(null); }}><FiX />Cancelar selección</button>
          </div>
        </section>
      )}
      {result && (
        <div className="task-selection-result" role={result.error || result.failed?.length || result.syncError ? "alert" : "status"}>
          {result.error || <>
            <p>{result.succeeded.length} {result.succeeded.length === 1 ? "tarea" : "tareas"} {result.action === "move"
              ? (result.succeeded.length === 1 ? "movida" : "movidas")
              : (result.succeeded.length === 1 ? "archivada" : "archivadas")}.
              {result.skipped.length > 0 && ` ${result.skipped.length} ya estaban en el destino.`}
              {result.failed.length > 0 && ` ${result.failed.length} fallaron. Reintentá las tareas que siguen seleccionadas.`}</p>
            {result.failed.length > 0 && <details><summary>Ver tareas con errores</summary><ul>{result.failed.map((failure) => <li key={failure.id}>{failure.title}: {failure.message}</li>)}</ul></details>}
            {result.syncError && <p>{result.syncError} <button type="button" disabled={busy} onClick={reloadTasks}>Actualizar tablero</button></p>}
          </>}
        </div>
      )}
      {children}
      {moveOpen && count > 0 && <MoveTasksDialog count={count} columns={columns} busy={busy} onClose={() => setMoveOpen(false)} onMove={(destination) => execute("move", destination)} />}
    </TaskSelectionContext.Provider>
  );
}
