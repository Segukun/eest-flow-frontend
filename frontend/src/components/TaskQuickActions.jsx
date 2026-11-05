import { useRef, useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { IoFileTrayFull } from "react-icons/io5";
import { useApp } from "../context/AppContext";
import { useToast } from "./Toast";
import "../styles/components/task-quick-actions.css";

export default function TaskQuickActions({ taskId, onEdit }) {
  const { currentUser, deleteTask } = useApp();
  const toast = useToast();
  const pending = useRef(false);
  const [archiving, setArchiving] = useState(false);
  const canArchive = ["admin", "collaborator"].includes(currentUser?.accountType);

  const archive = async () => {
    if (!canArchive || pending.current) return;
    pending.current = true;
    setArchiving(true);
    try {
      await deleteTask(taskId);
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo archivar la tarea. Intentá nuevamente.");
    } finally {
      pending.current = false;
      setArchiving(false);
    }
  };

  return (
    <span
      className="task-quick-actions"
      onClick={(event) => event.stopPropagation()}
      onDragStart={(event) => { event.preventDefault(); event.stopPropagation(); }}
    >
      <button type="button" title="Editar tarea" aria-label="Editar tarea" onClick={() => onEdit(taskId)} disabled={archiving}>
        <FiEdit2 aria-hidden="true" />
      </button>
      {canArchive && (
        <button type="button" title="Archivar tarea" aria-label="Archivar tarea" onClick={archive} disabled={archiving} aria-busy={archiving}>
          <IoFileTrayFull aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
