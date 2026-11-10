import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";

import {
  fetchTasks,
  createTaskRequest,
  updateTaskRequest,
  moveTaskRequest,
  deleteTaskRequest,
  uploadTaskAttachmentsRequest,
  deleteTaskAttachmentRequest,
  restoreTaskRequest,
  restoreArchivedTasksRequest,
} from "../api/tasks";

import {
  fetchCategories,
  createCategoryRequest,
  updateCategoryRequest,
  deleteCategoryRequest,
} from "../api/categories";

import {
  fetchLabels,
  createLabelRequest,
  updateLabelRequest,
  deleteLabelRequest,
} from "../api/labels";

import { fetchSectors } from "../api/sectors";
import {
  fetchUsers,
  uploadProfilePicture as uploadProfilePictureRequest,
  deleteProfilePicture as deleteProfilePictureRequest,
} from "../api/users";
import { fetchNotifications } from "../api/notifications";
import { updateTaskDrafts } from "../taskDrafts.js";
import { applyTaskMove, executeTaskBatch } from "../taskSelection.js";

const AppContext = createContext(null);

const POLL_INTERVAL_MS = 10000;

export const COLUMNS = [
  { id: "pending", title: "Pendiente", dot: "#E2E8F0" },
  { id: "in_progress", title: "En curso", dot: "#BAE6FD" },
  { id: "review", title: "En revisión", dot: "#FEF08A" },
  { id: "completed", title: "Terminado", dot: "#BBF7D0" },
];

export const PRIORITIES = {
  low: { id: "low", label: "Baja", color: "#15803D" },
  medium: { id: "medium", label: "Media", color: "#FFAA00" },
  high: { id: "high", label: "Alta", color: "#DC2626" },
};

function getId(value) {
  if (value && typeof value === "object") {
    return value._id ?? value.id ?? value;
  }

  return value;
}

function normalizeIdList(values) {
  return (Array.isArray(values) ? values : [])
    .map(getId)
    .filter((value) => value !== null && value !== undefined)
    .map(String);
}

function unwrapEntity(raw, key) {
  if (!raw || typeof raw !== "object") return {};

  return raw[key] ?? raw.data?.[key] ?? raw.data ?? raw;
}

/**
 * Normaliza los archivos adjuntos que llegan desde MongoDB.
 *
 * La información de los adjuntos permanece separada
 * de las etiquetas y de los usuarios asignados.
 */
function normalizeAttachments(values) {
  return (Array.isArray(values) ? values : []).map((file) => ({
    id: String(getId(file) ?? file.path ?? file.url ?? ""),

    originalName:
      file.originalName ?? file.originalname ?? file.name ?? "Archivo adjunto",

    name:
      file.originalName ?? file.originalname ?? file.name ?? "Archivo adjunto",

    path: file.path ?? "",

    url: file.url ?? file.signedUrl ?? file.publicUrl ?? "",

    mimeType: file.mimeType ?? file.mimetype ?? file.type ?? "",

    size: Number(file.size ?? 0),

    uploadedAt: file.uploadedAt ?? file.createdAt ?? null,
  }));
}

function normalizeTask(raw, fallback = {}) {
  const source = unwrapEntity(raw, "task");

  const dueDate = source.dueDate ?? fallback.dueDate ?? "";

  return {
    id: source._id ?? source.id ?? fallback.id,

    title: source.title ?? fallback.title ?? "",

    description: source.description ?? fallback.description ?? "",

    priority: source.priority ?? fallback.priority ?? "medium",

    column: source.state ?? source.column ?? fallback.column ?? "pending",

    categoryId: getId(
      source.category ?? source.categoryId ?? fallback.categoryId,
    ),

    members: normalizeIdList(
      source.assignedUser ?? source.members ?? fallback.members,
    ),

    labelIds: normalizeIdList(
      source.labels ?? source.labelIds ?? fallback.labelIds,
    ),

    dueDate: dueDate ? String(dueDate).slice(0, 10) : "",

    order: source.position ?? source.order ?? fallback.order ?? 0,

    // Campo adicional para archivos adjuntos.
    attachments: normalizeAttachments(
      source.attachments ?? fallback.attachments,
    ),
  };
}

function normalizeCategory(raw, fallback = {}) {
  const source = unwrapEntity(raw, "category");

  return {
    id: source._id ?? source.id ?? fallback.id,

    name: source.name ?? fallback.name ?? "",

    color: source.color ?? fallback.color ?? "#05903e",

    sectors: source.sectors ?? fallback.sectors ?? [],
  };
}

function normalizeLabel(raw) {
  return {
    id: raw._id,
    title: raw.title,
    color: raw.color,
    categoryId: raw.category,
  };
}

function normalizeSector(raw) {
  return {
    id: raw._id,
    name: raw.name,
    color: raw.color,
  };
}

function normalizeUser(raw) {
  const initials = (raw.name || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const profilePicture =
    raw.profilePicture && typeof raw.profilePicture === "object"
      ? {
          path: raw.profilePicture.path ?? null,
          url: raw.profilePicture.url ?? null,
        }
      : null;

  return {
    id: raw._id ?? raw.id,
    name: raw.name,
    email: raw.email,
    initials,
    accountType: raw.accountType,
    sectors: raw.sectors ?? [],
    active: raw.active,
    profilePicture,
  };
}

export function AppProvider({ children }) {
  // ---- sesión ----
  const [sessionUser, setSessionUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // ---- categorías ----
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  // ---- sectores / usuarios ----
  const [sectors, setSectors] = useState([]);
  const [users, setUsers] = useState([]);
  const usersVersion = useRef(0);

  // ---- etiquetas ----
  const [labels, setLabels] = useState([]);
  const [labelsLoading, setLabelsLoading] = useState(false);

  // ---- tareas ----
  const [tasks, setTasks] = useState([]);
  const [taskDrafts, setTaskDrafts] = useState({});
  const setTaskDraft = useCallback((categoryId, columnId, title) => {
    setTaskDrafts((prev) =>
      updateTaskDrafts(prev, categoryId, columnId, title),
    );
  }, []);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);

  // ---- notificaciones ----
  const [unreadCount, setUnreadCount] = useState(0);

  const [view, setView] = useState("tablero");
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    onlyMine: false,
    priorities: [],
    sector: "",
    due: "",
  });

  const currentUser = sessionUser
    ? (users.find((u) => String(u.id) === String(sessionUser._id)) ?? {
        id: sessionUser._id,
        name: sessionUser.name,
        email: sessionUser.email,
        initials:
          (sessionUser.name || "")
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "?",

        accountType: undefined,
        profilePicture: null,
      })
    : null;

  /* ---------- categorías ---------- */

  const reloadUsers = useCallback(async () => {
    const version = usersVersion.current;
    const raw = await fetchUsers();

    if (version === usersVersion.current) {
      setUsers(raw.map(normalizeUser));
    }

    return raw;
  }, []);

  /**
   * Sincroniza un usuario actualizado con el estado global.
   *
   * También actualiza la sesión local cuando se trata
   * del usuario autenticado.
   */
  const syncUpdatedUser = (updatedUser) => {
    const id = updatedUser?._id ?? updatedUser?.id;

    if (!id) return null;

    const normalized = normalizeUser(updatedUser);

    usersVersion.current += 1;

    setUsers((prev) => {
      const exists = prev.some((user) => String(user.id) === String(id));

      return exists
        ? prev.map((user) =>
            String(user.id) === String(id) ? { ...user, ...normalized } : user,
          )
        : [...prev, normalized];
    });

    // Si es el usuario autenticado, sincronizamos su sesión.
    if (sessionUser && String(id) === String(sessionUser._id)) {
      const nextSession = {
        ...sessionUser,
        _id: normalized.id,
        name: normalized.name,
        email: normalized.email,
        accountType: normalized.accountType,
        sectors: normalized.sectors,
        active: normalized.active,
      };

      setSessionUser(nextSession);

      try {
        localStorage.setItem("user", JSON.stringify(nextSession));
      } catch {
        // La actualización visual funciona aunque localStorage falle.
      }
    }

    return normalized;
  };

  /**
   * Actualiza los datos del usuario autenticado.
   */
  const updateCurrentUser = (updatedUser) => {
    const id = updatedUser?._id ?? updatedUser?.id;

    if (!sessionUser || String(id) !== String(sessionUser._id)) {
      return;
    }

    return syncUpdatedUser({
      ...currentUser,
      ...updatedUser,
    });
  };

  /**
   * Sube o reemplaza la imagen de perfil de un usuario.
   */
  const uploadUserProfilePicture = async (userId, file) => {
    const updatedUser = await uploadProfilePictureRequest(userId, file);

    return syncUpdatedUser(updatedUser);
  };

  /**
   * Elimina la imagen de perfil de un usuario.
   */
  const deleteUserProfilePicture = async (userId) => {
    const updatedUser = await deleteProfilePictureRequest(userId);

    return syncUpdatedUser(updatedUser);
  };

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);

    try {
      const raw = await fetchCategories();

      const normalized = raw.map((category) => normalizeCategory(category));

      setCategories(normalized);

      setActiveCategory((prev) =>
        normalized.some((category) => category.id === prev)
          ? prev
          : (normalized[0]?.id ?? null),
      );
    } catch (err) {
      setCategoriesError(
        err?.response?.data?.message || "No se pudieron cargar las categorías.",
      );
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  /* ---------- notificaciones ---------- */

  const reloadUnreadCount = useCallback(async () => {
    if (!sessionUser) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetchNotifications({
        filter: "all",
        page: 1,
        limit: 1,
      });

      const count = response?.data?.unreadCount;

      if (typeof count === "number" && Number.isFinite(count)) {
        setUnreadCount(Math.max(0, count));
      }
    } catch (err) {
      console.error(
        "No se pudo actualizar el contador de notificaciones:",
        err,
      );
    }
  }, [sessionUser]);

  useEffect(() => {
    if (!sessionUser) {
      setUnreadCount(0);
      return;
    }

    reloadUnreadCount();

    const refreshNotifications = () => {
      if (document.visibilityState === "visible") {
        reloadUnreadCount();
      }
    };

    const intervalId = setInterval(refreshNotifications, POLL_INTERVAL_MS);

    document.addEventListener("visibilitychange", refreshNotifications);

    return () => {
      clearInterval(intervalId);

      document.removeEventListener("visibilitychange", refreshNotifications);
    };
  }, [sessionUser, reloadUnreadCount]);

  /* ---------- actualización de tareas ---------- */

  const mutationsInFlight = useRef(0);
  const taskBatchLock = useRef(false);
  const [taskBatchBusy, setTaskBatchBusy] = useState(false);
  const mutationVersion = useRef(0);
  const tasksSignature = useRef("");

  const track = async (fn) => {
    mutationsInFlight.current += 1;

    try {
      return await fn();
    } finally {
      mutationsInFlight.current -= 1;
      mutationVersion.current += 1;
    }
  };

  const loadTasks = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setTasksLoading(true);
      setTasksError(null);
    }

    const versionAtStart = mutationVersion.current;

    try {
      const raw = await fetchTasks();

      if (
        silent &&
        (mutationsInFlight.current > 0 ||
          mutationVersion.current !== versionAtStart)
      ) {
        return;
      }

      const signature = JSON.stringify(raw);

      if (silent && signature === tasksSignature.current) {
        return;
      }

      tasksSignature.current = signature;

      setTasks(raw.map((task) => normalizeTask(task)));
    } catch (err) {
      if (!silent) {
        setTasksError(
          err?.response?.data?.message || "No se pudieron cargar las tareas.",
        );
      }
    } finally {
      if (!silent) {
        setTasksLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadTasks();

    fetchSectors()
      .then((raw) => setSectors(raw.map(normalizeSector)))
      .catch(() => setSectors([]));

    reloadUsers().catch(() => setUsers([]));
  }, [loadCategories, loadTasks, reloadUsers]);

  /* ---------- actualización automática de tareas ---------- */

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        loadTasks({ silent: true });
      }
    };

    const intervalId = setInterval(refresh, POLL_INTERVAL_MS);

    document.addEventListener("visibilitychange", refresh);

    return () => {
      clearInterval(intervalId);

      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadTasks]);

  /* ---------- etiquetas ---------- */

  const loadLabels = useCallback(async () => {
    if (!activeCategory) {
      setLabels([]);
      return;
    }

    setLabelsLoading(true);

    try {
      const raw = await fetchLabels(activeCategory);

      setLabels(raw.map(normalizeLabel));
    } catch {
      setLabels([]);
    } finally {
      setLabelsLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  /* ---------- filtros ---------- */

  const activeFiltersCount = useMemo(() => {
    let n = 0;

    if (filters.onlyMine) n++;

    n += filters.priorities.length;

    if (filters.sector) n++;
    if (filters.due) n++;

    return n;
  }, [filters]);

  const sectorIdOf = (s) => (s && typeof s === "object" ? (s._id ?? s.id) : s);

  const visibleTasks = useMemo(() => {
    const now = new Date();

    const diffDays = (d) => (new Date(d) - now) / 86400000;

    return tasks
      .filter((t) => {
        if (t.categoryId !== activeCategory) {
          return false;
        }

        if (search && !t.title.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }

        if (
          filters.priorities.length &&
          !filters.priorities.includes(t.priority)
        ) {
          return false;
        }

        if (
          filters.onlyMine &&
          currentUser &&
          !t.members.includes(currentUser.id)
        ) {
          return false;
        }

        if (filters.sector) {
          const category = categories.find((c) => c.id === t.categoryId);

          const ids = (category?.sectors ?? []).map(sectorIdOf);

          if (!ids.includes(filters.sector)) {
            return false;
          }
        }

        if (filters.due && t.dueDate) {
          const d = diffDays(t.dueDate);

          if (filters.due === "hoy" && !(d >= -1 && d < 1)) {
            return false;
          }

          if (filters.due === "48" && !(d < 2)) {
            return false;
          }

          if (filters.due === "7" && !(d < 7)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => a.order - b.order);
  }, [tasks, categories, activeCategory, search, filters, currentUser]);

  /* ---------- acciones: tareas ---------- */

  const addTask = (columnId, title) =>
    track(async () => {
      if (!activeCategory) return;

      const sameColumn = tasks.filter(
        (t) => t.column === columnId && t.categoryId === activeCategory,
      );

      const nextOrder = sameColumn.length
        ? Math.max(...sameColumn.map((t) => t.order)) + 1
        : 0;

      const created = await createTaskRequest({
        title,
        description: "",
        priority: "medium",
        state: columnId,
        category: activeCategory,
        order: nextOrder,
      });

      setTasks((prev) => [...prev, normalizeTask(created)]);
    });

  const updateTask = (id, patch) =>
    track(async () => {
      const payload = {};

      if (patch.title !== undefined) {
        payload.title = patch.title;
      }

      if (patch.description !== undefined) {
        payload.description = patch.description;
      }

      if (patch.priority !== undefined) {
        payload.priority = patch.priority;
      }

      if (patch.column !== undefined) {
        payload.state = patch.column;
      }

      if (patch.members !== undefined) {
        payload.assignedUser = patch.members;
      }

      if (patch.labelIds !== undefined) {
        payload.labels = patch.labelIds;
      }

      if (patch.dueDate !== undefined) {
        payload.dueDate = patch.dueDate || null;
      }

      if (patch.order !== undefined) {
        payload.order = patch.order;
      }

      const existing = tasks.find((task) => String(task.id) === String(id));

      const updated = await updateTaskRequest(id, payload);

      const normalized = normalizeTask(updated, {
        ...existing,
        ...patch,
        id,
      });

      setTasks((prev) =>
        prev.map((task) =>
          String(task.id) === String(id) ? normalized : task,
        ),
      );

      return normalized;
    });

  // Archiva la tarea (soft delete): sale del tablero y pasa al archivero.
  const deleteTask = (id) =>
    track(async () => {
      await deleteTaskRequest(id);

      setTasks((prev) => prev.filter((t) => t.id !== id));
    });

  // ARCHIVERO: restaura una tarea archivada y la vuelve a mostrar en el tablero.
  const restoreArchivedTask = (id) =>
    track(async () => {
      const restored = await restoreTaskRequest(id);
      const normalized = normalizeTask(restored);

      setTasks((prev) => [
        ...prev.filter((task) => String(task.id) !== String(normalized.id)),
        normalized,
      ]);

      return normalized;
    });

  // ARCHIVERO: restaura varias tareas y las vuelve a mostrar en el tablero.
  const restoreArchivedTasks = (ids) =>
    track(async () => {
      const result = await restoreArchivedTasksRequest(ids);
      const restored = (result?.restored ?? []).map((task) =>
        normalizeTask(task),
      );

      if (restored.length > 0) {
        const restoredIds = new Set(restored.map((task) => String(task.id)));

        setTasks((prev) => [
          ...prev.filter((task) => !restoredIds.has(String(task.id))),
          ...restored,
        ]);
      }

      return { restored, failed: result?.failed ?? [] };
    });

  /* ---------- acciones: adjuntos de tareas ---------- */

  /**
   * Sube archivos y actualiza solamente la tarea correspondiente.
   */
  const uploadTaskAttachments = (id, files) =>
    track(async () => {
      const existing = tasks.find((task) => String(task.id) === String(id));

      const updated = await uploadTaskAttachmentsRequest(id, files);

      const normalized = normalizeTask(updated, {
        ...existing,
        id,
      });

      setTasks((prev) =>
        prev.map((task) =>
          String(task.id) === String(id) ? normalized : task,
        ),
      );

      return normalized;
    });

  /**
   * Elimina un adjunto específico sin reemplazar
   * el resto de la información de la tarea.
   */
  const deleteTaskAttachment = (taskId, attachmentId) =>
    track(async () => {
      const existing = tasks.find((task) => String(task.id) === String(taskId));

      const updated = await deleteTaskAttachmentRequest(taskId, attachmentId);

      const normalized = normalizeTask(updated, {
        ...existing,
        id: taskId,
      });

      setTasks((prev) =>
        prev.map((task) =>
          String(task.id) === String(taskId) ? normalized : task,
        ),
      );

      return normalized;
    });

  const moveTask = (id, columnId, beforeId = null) =>
    track(async () => {
      if (id === beforeId) return;
      const updated = await moveTaskRequest(id, { state: columnId, beforeId });
      setTasks((prev) => applyTaskMove(prev, id, columnId, beforeId));
      return updated;
    });

  const runTaskBatch = async (ids, action, destination) => {
    if (taskBatchLock.current || mutationsInFlight.current > 0) throw new Error("Ya hay una operación en curso. Intentá nuevamente cuando termine.");
    if (!currentUser || (action === "archive" &&
      !["admin", "collaborator"].includes(currentUser.accountType))) {
      throw new Error("No tenés permisos para esta acción.");
    }
    if (!["move", "archive"].includes(action) ||
      (action === "move" && !COLUMNS.some((column) => column.id === destination))) {
      throw new Error("Acción o destino no válido.");
    }
    taskBatchLock.current = true;
    setTaskBatchBusy(true);
    try {
      return await track(async () => {
        const result = await executeTaskBatch({
          ids, tasks, action, destination, move: moveTask, archive: deleteTask,
        });
        // Reconcile positions and ambiguous network failures with server state.
        try {
          const raw = await fetchTasks();
          setTasks(raw.map((task) => normalizeTask(task)));
          tasksSignature.current = JSON.stringify(raw);
        } catch {
          result.syncError = "No se pudo actualizar el tablero. Se conservan los cambios confirmados; reintentá la sincronización.";
        }
        return result;
      });
    } finally {
      taskBatchLock.current = false;
      setTaskBatchBusy(false);
    }
  };

  /* ---------- acciones: categorías ---------- */

  const addCategory = async ({ name, color, sectors: sectorIds }) => {
    const created = await createCategoryRequest({
      name,
      color,
      sectors: sectorIds,
    });

    const normalized = normalizeCategory(created, {
      name,
      color,
      sectors: sectorIds,
    });

    setCategories((prev) => [...prev, normalized]);

    setActiveCategory(normalized.id);

    return normalized.id;
  };

  const updateCategory = async (id, { name, color, sectors: sectorIds }) => {
    const existing = categories.find(
      (category) => String(category.id) === String(id),
    );

    const updated = await updateCategoryRequest(id, {
      name,
      color,
      sectors: sectorIds,
    });

    const normalized = normalizeCategory(updated, {
      id,
      name: name ?? existing?.name,
      color: color ?? existing?.color,
      sectors: sectorIds ?? existing?.sectors,
    });

    setCategories((prev) =>
      prev.map((category) =>
        String(category.id) === String(id) ? normalized : category,
      ),
    );

    return normalized.id;
  };

  const deleteCategory = async (id) => {
    if (categories.length <= 1) return;

    await deleteCategoryRequest(id);

    setCategories((prev) => prev.filter((c) => c.id !== id));

    if (activeCategory === id) {
      const fallback = categories.find((c) => c.id !== id);

      setActiveCategory(fallback?.id ?? null);
    }
  };

  /* ---------- acciones: etiquetas ---------- */

  const addLabel = async ({ title, color }) => {
    if (!activeCategory) {
      throw new Error("No hay categoría activa");
    }

    const created = await createLabelRequest({
      title,
      color,
      category: activeCategory,
    });

    const normalized = normalizeLabel(created);

    setLabels((prev) => [...prev, normalized]);

    return normalized;
  };

  const updateLabel = async (id, { title, color }) => {
    const updated = await updateLabelRequest(id, {
      title,
      color,
    });

    const normalized = normalizeLabel(updated);

    setLabels((prev) => prev.map((l) => (l.id === id ? normalized : l)));

    return normalized;
  };

  const deleteLabel = async (id) => {
    await deleteLabelRequest(id);

    setLabels((prev) => prev.filter((l) => l.id !== id));

    setTasks((prev) =>
      prev.map((t) =>
        t.labelIds.includes(id)
          ? {
              ...t,
              labelIds: t.labelIds.filter((lid) => lid !== id),
            }
          : t,
      ),
    );
  };

  /* ---------- contexto global ---------- */

  const value = {
    currentUser,
    reloadUsers,
    updateCurrentUser,
    uploadUserProfilePicture,
    deleteUserProfilePicture,

    categories,
    categoriesLoading,
    categoriesError,
    activeCategory,
    setActiveCategory,
    addCategory,
    updateCategory,
    deleteCategory,

    columns: COLUMNS,
    sectors,
    users,

    labels,
    labelsLoading,
    addLabel,
    updateLabel,
    deleteLabel,

    tasks,
    visibleTasks,
    tasksLoading,
    tasksError,
    reloadTasks: () => loadTasks(),

    addTask,
    taskDrafts,
    setTaskDraft,
    updateTask,
    deleteTask,
    restoreArchivedTask,
    restoreArchivedTasks,
    moveTask,
    runTaskBatch,
    taskBatchBusy,

    // Operaciones de adjuntos.
    uploadTaskAttachments,
    deleteTaskAttachment,

    view,
    setView,
    search,
    setSearch,

    filters,
    setFilters,
    activeFiltersCount,

    // Notificaciones.
    unreadCount,
    reloadUnreadCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
