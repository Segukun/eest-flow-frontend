import { useCallback, useEffect, useMemo, useState } from "react";
import { IoFileTrayFull, IoTrashBin } from "react-icons/io5";
import { FiX, FiSearch, FiRotateCcw, FiPaperclip, FiAlertCircle } from "react-icons/fi";

import { useApp, PRIORITIES } from "../context/AppContext";
import { fetchArchivedTasks, permanentlyDeleteTaskRequest } from "../api/tasks";
import DeleteArchivedTaskModal from "./DeleteArchivedTaskModal";
import "../styles/components/archived-tasks-modal.css";

const normalizeArchived = (raw) => ({
  id: raw._id,
  title: raw.title,
  priority: raw.priority,
  column: raw.state,
  categoryId: raw.category ? String(raw.category) : null,
  deletedAt: raw.deletedAt,
  deletedByName: raw.deletedBy?.name ?? null,
  attachmentCount: raw.attachments?.length ?? 0,
});

const formatDeletedAt = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ArchivedTasksModal({ onClose }) {
  const { categories, activeCategory, columns, currentUser, restoreArchivedTask } = useApp();

  // El backend solo permite eliminar definitivamente a administradores.
  const canDelete = currentUser?.accountType === "admin";

  const category = categories.find((c) => c.id === activeCategory);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const load = useCallback(async () => {
    if (!activeCategory) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const raw = await fetchArchivedTasks(activeCategory);

      // El backend ya filtra por categoría; esto es una segunda protección
      // por si llegara alguna tarea de otra categoría.
      setItems(
        raw
          .map(normalizeArchived)
          .filter((item) => item.categoryId === String(activeCategory)),
      );
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo cargar el archivero.");
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    load();
  }, [load]);

  // Escape cierra primero la confirmación y, si no hay, el archivero.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;

      if (confirmTarget) {
        if (!busyId) setConfirmTarget(null);
      } else {
        onClose();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, confirmTarget, busyId]);

  const visibleItems = useMemo(() => {
    const text = search.trim().toLowerCase();
    return text ? items.filter((i) => i.title.toLowerCase().includes(text)) : items;
  }, [items, search]);

  const handleRestore = async (item) => {
    if (busyId) return;

    setBusyId(item.id);
    setActionError(null);

    try {
      await restoreArchivedTask(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      setActionError(err?.response?.data?.message || "No se pudo restaurar la tarea.");
    } finally {
      setBusyId(null);
    }
  };

  const openDeleteConfirm = (item) => {
    if (busyId || !canDelete) return;
    setActionError(null);
    setDeleteError(null);
    setConfirmTarget(item);
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget || busyId) return;

    setBusyId(confirmTarget.id);
    setDeleteError(null);

    try {
      await permanentlyDeleteTaskRequest(confirmTarget.id);
      setItems((prev) => prev.filter((i) => i.id !== confirmTarget.id));
      setConfirmTarget(null);
    } catch (err) {
      // el modal de confirmación queda abierto mostrando el error
      setDeleteError(err?.response?.data?.message || "No se pudo eliminar la tarea.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div
        className="modal-overlay"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="archive-modal" onClick={(e) => e.stopPropagation()}>
          <header className="archive-modal__head">
            <div className="archive-modal__title">
              <span className="archive-modal__icon">
                <IoFileTrayFull />
              </span>

              <div>
                <h2>Archivero</h2>
                <p>
                  {category && (
                    <span className="archive-modal__category">
                      <span className="cat-dot" style={{ background: category.color }} />
                      {category.name}
                    </span>
                  )}
                  {loading
                    ? "Cargando…"
                    : `${items.length} ${items.length === 1 ? "tarea archivada" : "tareas archivadas"}`}
                </p>
              </div>
            </div>

            <button type="button" className="archive-modal__close" onClick={onClose} title="Cerrar">
              <FiX />
            </button>
          </header>

          <div className="archive-modal__search">
            <FiSearch />
            <input
              type="search"
              placeholder="Buscar en el archivero"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {actionError && (
            <p className="archive-modal__error" role="alert">
              <FiAlertCircle /> {actionError}
            </p>
          )}

          <div className="archive-modal__body">
            {loading ? (
              <p className="archive-modal__empty">Cargando tareas archivadas…</p>
            ) : error ? (
              <div className="archive-modal__empty">
                <p>{error}</p>
                <button type="button" className="btn btn--primary btn--sm" onClick={load}>
                  Reintentar
                </button>
              </div>
            ) : visibleItems.length === 0 ? (
              <p className="archive-modal__empty">
                {items.length === 0
                  ? `No hay tareas archivadas${category ? ` en "${category.name}"` : ""}. Las que elimines aparecerán acá.`
                  : "No hay resultados para esa búsqueda."}
              </p>
            ) : (
              <ul className="archive-modal__list">
                {visibleItems.map((item) => {
                  const priority = PRIORITIES[item.priority] ?? PRIORITIES.medium;
                  const column = columns.find((c) => c.id === item.column);
                  const busy = busyId === item.id;

                  return (
                    <li key={item.id} className="archive-item">
                      <span className="archive-item__bar" style={{ background: priority.color }} />

                      <div className="archive-item__info">
                        <strong className="archive-item__title">{item.title}</strong>

                        <div className="archive-item__meta">
                          {column && <span className="archive-item__chip">{column.title}</span>}
                          {item.attachmentCount > 0 && (
                            <span className="archive-item__chip">
                              <FiPaperclip /> {item.attachmentCount}
                            </span>
                          )}
                        </div>

                        <small className="archive-item__date">
                          Archivada el {formatDeletedAt(item.deletedAt)}
                          {item.deletedByName ? ` por ${item.deletedByName}` : ""}
                        </small>
                      </div>

                      <div className="archive-item__actions">
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => handleRestore(item)}
                          disabled={Boolean(busyId)}
                        >
                          <FiRotateCcw /> {busy ? "Restaurando…" : "Restaurar"}
                        </button>

                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          onClick={() => openDeleteConfirm(item)}
                          disabled={Boolean(busyId) || !canDelete}
                          title={
                            canDelete
                              ? "Eliminar definitivamente"
                              : "Solo un administrador puede eliminar definitivamente"
                          }
                        >
                          <IoTrashBin /> Eliminar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* se renderiza después, así queda por encima del archivero */}
      {confirmTarget && (
        <DeleteArchivedTaskModal
          task={confirmTarget}
          loading={busyId === confirmTarget.id}
          error={deleteError}
          onClose={() => setConfirmTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}