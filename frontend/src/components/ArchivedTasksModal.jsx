import { useCallback, useEffect, useMemo, useState } from "react";
import { IoFileTrayFull, IoTrashBin } from "react-icons/io5";
import {
  FiX,
  FiSearch,
  FiRotateCcw,
  FiPaperclip,
  FiAlertCircle,
  FiCheck,
} from "react-icons/fi";

import { useApp, PRIORITIES } from "../context/AppContext";
import { fetchArchivedTasks, deleteArchivedTasksRequest } from "../api/tasks";
import DeleteArchivedTaskModal from "./DeleteArchivedTaskModal";
import "../styles/components/archived-tasks-modal.css";

const normalizeArchived = (raw) => ({
  id: String(raw._id),
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

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export default function ArchivedTasksModal({ onClose }) {
  const {
    categories,
    activeCategory,
    columns,
    currentUser,
    restoreArchivedTask,
    restoreArchivedTasks,
  } = useApp();

  // Solo los administradores pueden eliminar tareas archivadas.
  const canDelete = currentUser?.accountType === "admin";
  const category = categories.find((item) => item.id === activeCategory);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const load = useCallback(async () => {
    if (!activeCategory) {
      setItems([]);
      setSelectedIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedIds(new Set());

    try {
      const raw = await fetchArchivedTasks(activeCategory);

      // El backend ya filtra por categoría; esto funciona como segunda protección.
      setItems(
        raw
          .map(normalizeArchived)
          .filter((item) => item.categoryId === String(activeCategory)),
      );
    } catch (err) {
      setError(
        err?.response?.data?.message || "No se pudo cargar el archivero.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleItems = useMemo(() => {
    const text = search.trim().toLowerCase();

    return text
      ? items.filter((item) => (item.title ?? "").toLowerCase().includes(text))
      : items;
  }, [items, search]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  );

  const selectedCount = selectedItems.length;

  // El modo de selección depende de la cantidad seleccionada.
  // Al desmarcar o quitar la última tarea, vuelve automáticamente al modo normal.
  const selectionMode = selectedCount > 0;

  const allVisibleSelected =
    visibleItems.length > 0 &&
    visibleItems.every((item) => selectedIds.has(item.id));

  const someVisibleSelected = visibleItems.some((item) =>
    selectedIds.has(item.id),
  );

  /* ---------- teclado ---------- */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;

      if (confirmTarget) {
        if (!busy) setConfirmTarget(null);
        return;
      }

      if (selectedIds.size > 0) {
        setSelectedIds(new Set());
        return;
      }

      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, confirmTarget, busy, selectedIds]);

  /* ---------- selección ---------- */

  const enterSelectionMode = (id) => {
    if (busy) return;

    setSelectedIds((previous) => {
      if (previous.has(id)) return previous;

      const next = new Set(previous);
      next.add(id);
      return next;
    });
  };

  const toggleOne = (id) => {
    if (busy) return;

    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  };

  const toggleAllVisible = () => {
    if (busy || visibleItems.length === 0) return;

    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (allVisibleSelected) {
        visibleItems.forEach((item) => next.delete(item.id));
      } else {
        visibleItems.forEach((item) => next.add(item.id));
      }

      return next;
    });
  };

  const clearSelection = () => {
    if (!busy) setSelectedIds(new Set());
  };

  const handleItemClick = (event, item) => {
    if (!selectionMode || busy) return;
    if (event.target.closest("button, input, label, a")) return;

    toggleOne(item.id);
  };

  const handleItemDoubleClick = (event, item) => {
    if (selectionMode || busy) return;
    if (event.target.closest("button, input, label, a")) return;

    event.preventDefault();
    enterSelectionMode(item.id);
  };

  const removeItems = (ids) => {
    const removed = new Set(ids.map(String));

    setItems((previous) =>
      previous.filter((item) => !removed.has(item.id)),
    );

    setSelectedIds((previous) =>
      new Set([...previous].filter((id) => !removed.has(id))),
    );
  };

  /* ---------- restaurar ---------- */

  const handleRestore = async (item) => {
    if (busy) return;

    setBusy(item.id);
    setActionError(null);

    try {
      await restoreArchivedTask(item.id);
      removeItems([item.id]);
    } catch (err) {
      setActionError(
        err?.response?.data?.message || "No se pudo restaurar la tarea.",
      );
    } finally {
      setBusy(null);
    }
  };

  const handleRestoreSelected = async () => {
    if (busy || selectedCount === 0) return;

    setBusy("bulk");
    setActionError(null);

    try {
      const { restored = [], failed = [] } = await restoreArchivedTasks(
        selectedItems.map((item) => item.id),
      );

      removeItems(restored.map((task) => task.id));

      if (failed.length > 0) {
        setActionError(
          `${plural(
            failed.length,
            "tarea no se pudo restaurar",
            "tareas no se pudieron restaurar",
          )}: ${failed[0].message}`,
        );
      }
    } catch (err) {
      setActionError(
        err?.response?.data?.message ||
          "No se pudieron restaurar las tareas.",
      );
    } finally {
      setBusy(null);
    }
  };

  /* ---------- eliminar ---------- */

  const buildTarget = (mode, list) => ({
    mode,
    ids: list.map((item) => item.id),
    count: list.length,
    title: list[0]?.title,
    attachmentCount: list.reduce(
      (sum, item) => sum + item.attachmentCount,
      0,
    ),
  });

  const openDeleteConfirm = (mode, list) => {
    if (busy || !canDelete || list.length === 0) return;

    setActionError(null);
    setDeleteError(null);
    setConfirmTarget(buildTarget(mode, list));
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget || busy) return;

    setBusy("bulk");
    setDeleteError(null);

    try {
      const { deleted = [], failed = [] } =
        await deleteArchivedTasksRequest(confirmTarget.ids);

      removeItems(deleted);
      setConfirmTarget(null);

      if (failed.length > 0) {
        setActionError(
          `Se eliminaron ${deleted.length}; ${plural(
            failed.length,
            "no se pudo eliminar",
            "no se pudieron eliminar",
          )}.`,
        );
      }
    } catch (err) {
      // La confirmación permanece abierta para mostrar el error.
      setDeleteError(
        err?.response?.data?.message || "No se pudo eliminar.",
      );
    } finally {
      setBusy(null);
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
        <div
          className="archive-modal"
          onClick={(event) => event.stopPropagation()}
        >
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
                      <span
                        className="cat-dot"
                        style={{ background: category.color }}
                      />
                      {category.name}
                    </span>
                  )}
                  {loading
                    ? "Cargando…"
                    : plural(
                        items.length,
                        "tarea archivada",
                        "tareas archivadas",
                      )}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="archive-modal__close"
              onClick={onClose}
              title="Cerrar"
              aria-label="Cerrar archivero"
            >
              <FiX />
            </button>
          </header>

          <div className="archive-modal__search">
            <FiSearch />
            <input
              type="search"
              placeholder="Buscar en el archivero"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {!loading && !error && items.length > 0 && (
            <div
              className={`archive-modal__toolbar${
                selectionMode ? " archive-modal__toolbar--selecting" : ""
              }`}
            >
              <div className="archive-modal__toolbar-main">
                <label className="archive-check archive-check--master">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate =
                          someVisibleSelected && !allVisibleSelected;
                      }
                    }}
                    onChange={toggleAllVisible}
                    disabled={visibleItems.length === 0 || Boolean(busy)}
                    aria-label="Seleccionar todas las tareas visibles"
                  />
                  <span className="archive-check__box" aria-hidden="true">
                    <FiCheck />
                  </span>
                  <span className="archive-check__label">
                    Seleccionar todo
                  </span>
                </label>

                {selectionMode && (
                  <>
                    <span className="archive-modal__selected-count">
                      {plural(
                        selectedCount,
                        "tarea seleccionada",
                        "tareas seleccionadas",
                      )}
                    </span>
                    <button
                      type="button"
                      className="archive-modal__cancel-selection"
                      onClick={clearSelection}
                      disabled={Boolean(busy)}
                      title="Cancelar selección"
                      aria-label="Cancelar selección"
                    >
                      <FiX />
                    </button>
                  </>
                )}
              </div>

              <div className="archive-modal__toolbar-actions">
                {selectionMode ? (
                  <>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={handleRestoreSelected}
                      disabled={Boolean(busy)}
                    >
                      <FiRotateCcw />
                      {busy === "bulk"
                        ? "Restaurando…"
                        : `Restaurar (${selectedCount})`}
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() =>
                          openDeleteConfirm("selected", selectedItems)
                        }
                        disabled={Boolean(busy)}
                      >
                        <IoTrashBin /> Eliminar ({selectedCount})
                      </button>
                    )}
                  </>
                ) : (
                  canDelete && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm archive-modal__clear"
                      onClick={() => openDeleteConfirm("all", items)}
                      disabled={Boolean(busy)}
                    >
                      <IoTrashBin /> Vaciar archivero
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {actionError && (
            <p className="archive-modal__error" role="alert">
              <FiAlertCircle /> {actionError}
            </p>
          )}

          <div className="archive-modal__body">
            {loading ? (
              <p className="archive-modal__empty">
                Cargando tareas archivadas…
              </p>
            ) : error ? (
              <div className="archive-modal__empty">
                <p>{error}</p>
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={load}
                >
                  Reintentar
                </button>
              </div>
            ) : visibleItems.length === 0 ? (
              <p className="archive-modal__empty">
                {items.length === 0
                  ? `No hay tareas archivadas${
                      category ? ` en "${category.name}"` : ""
                    }. Las que elimines aparecerán acá.`
                  : "No hay resultados para esa búsqueda."}
              </p>
            ) : (
              <ul
                className={`archive-modal__list${
                  selectionMode ? " archive-modal__list--selecting" : ""
                }`}
              >
                {visibleItems.map((item) => {
                  const priority =
                    PRIORITIES[item.priority] ?? PRIORITIES.medium;
                  const column = columns.find(
                    (columnItem) => columnItem.id === item.column,
                  );
                  const selected = selectedIds.has(item.id);

                  return (
                    <li
                      key={item.id}
                      className={`archive-item${
                        selectionMode ? " archive-item--selectable" : ""
                      }${selected ? " archive-item--selected" : ""}`}
                      onClick={(event) => handleItemClick(event, item)}
                      onDoubleClick={(event) =>
                        handleItemDoubleClick(event, item)
                      }
                      title={
                        selectionMode
                          ? "Hacé clic para cambiar la selección"
                          : "Doble clic o acercá el cursor al lateral izquierdo para seleccionar"
                      }
                    >
                      <span
                        className="archive-item__bar"
                        style={{ background: priority.color }}
                        aria-hidden="true"
                      />

                      {!selectionMode ? (
                        <button
                          type="button"
                          className="archive-item__select-trigger"
                          onClick={(event) => {
                            event.stopPropagation();
                            enterSelectionMode(item.id);
                          }}
                          disabled={Boolean(busy)}
                          title={`Seleccionar ${item.title}`}
                          aria-label={`Seleccionar ${item.title}`}
                        >
                          <span
                            className="archive-item__select-dot"
                            aria-hidden="true"
                          />
                        </button>
                      ) : (
                        <label
                          className="archive-check archive-check--item archive-item__check"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleOne(item.id)}
                            disabled={Boolean(busy)}
                            aria-label={`Seleccionar ${item.title}`}
                          />
                          <span
                            className="archive-check__box"
                            aria-hidden="true"
                          >
                            <FiCheck />
                          </span>
                        </label>
                      )}

                      <div className="archive-item__info">
                        <strong className="archive-item__title">
                          {item.title}
                        </strong>

                        <div className="archive-item__meta">
                          {column && (
                            <span className="archive-item__chip">
                              {column.title}
                            </span>
                          )}
                          {item.attachmentCount > 0 && (
                            <span className="archive-item__chip">
                              <FiPaperclip /> {item.attachmentCount}
                            </span>
                          )}
                        </div>

                        <small className="archive-item__date">
                          Archivada el {formatDeletedAt(item.deletedAt)}
                          {item.deletedByName
                            ? ` por ${item.deletedByName}`
                            : ""}
                        </small>
                      </div>

                      {!selectionMode && (
                        <div className="archive-item__actions">
                          <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            onClick={() => handleRestore(item)}
                            disabled={Boolean(busy)}
                          >
                            <FiRotateCcw />
                            {busy === item.id
                              ? "Restaurando…"
                              : "Restaurar"}
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              onClick={() =>
                                openDeleteConfirm("single", [item])
                              }
                              disabled={Boolean(busy)}
                            >
                              <IoTrashBin /> Eliminar
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {confirmTarget && (
        <DeleteArchivedTaskModal
          target={confirmTarget}
          categoryName={category?.name}
          loading={busy === "bulk"}
          error={deleteError}
          onClose={() => setConfirmTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}