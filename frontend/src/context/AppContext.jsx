
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
  deleteTaskRequest,
} from "../api/tasks";

import {
  fetchCategories,
  createCategoryRequest,
  deleteCategoryRequest,
} from "../api/categories";

import {
  fetchLabels,
  createLabelRequest,
  updateLabelRequest,
  deleteLabelRequest,
} from "../api/labels";

import { fetchSectors } from "../api/sectors";
import { fetchUsers } from "../api/users";
import { fetchNotifications } from "../api/notifications";

const AppContext = createContext(null);

const POLL_INTERVAL_MS = 10000;

export const COLUMNS = [
  { id: "pending", title: "Pendiente", dot: "var(--color-orange)" },
  { id: "in_progress", title: "En curso", dot: "var(--color-green)" },
  { id: "review", title: "En revisión", dot: "var(--color-terracotta)" },
  { id: "completed", title: "Terminado", dot: "#9aa0a6" },
];

export const PRIORITIES = {
  low: { id: "low", label: "Baja", color: "#9aa0a6" },
  medium: { id: "medium", label: "Media", color: "var(--color-terracotta)" },
  high: { id: "high", label: "Alta", color: "var(--color-orange)" },
};

function normalizeTask(raw) {
  return {
    id: raw._id,
    title: raw.title,
    description: raw.description,
    priority: raw.priority,
    column: raw.state,
    categoryId: raw.category,
    members: raw.assignedUser ?? [],
    labelIds: raw.labels ?? [],
    dueDate: raw.dueDate ? raw.dueDate.slice(0, 10) : "",
    order: raw.order ?? 0,
  };
}

function normalizeCategory(raw) {
  return {
    id: raw._id,
    name: raw.name,
    color: raw.color,
    sectors: raw.sectors ?? [],
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

  return {
    id: raw._id,
    name: raw.name,
    email: raw.email,
    initials,
    accountType: raw.accountType,
  };
}

export function AppProvider({ children }) {
  // ---- sesión ----
  const [sessionUser] = useState(() => {
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

  // ---- etiquetas ----
  const [labels, setLabels] = useState([]);
  const [labelsLoading, setLabelsLoading] = useState(false);

  // ---- tareas ----
  const [tasks, setTasks] = useState([]);
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
    ? users.find((u) => u.id === sessionUser._id) ?? {
        id: sessionUser._id,
        name: sessionUser.name,
        initials: (sessionUser.name || "")
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "?",
        // El rol guardado puede estar obsoleto; esperar la consulta actual.
        accountType: undefined,
      }
    : null;

  /* ---------- categorías ---------- */

  const reloadUsers = useCallback(async () => {
    const raw = await fetchUsers();
    setUsers(raw.map(normalizeUser));
    return raw;
  }, []);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);

    try {
      const raw = await fetchCategories();
      const normalized = raw.map(normalizeCategory);

      setCategories(normalized);
      setActiveCategory((prev) => prev ?? normalized[0]?.id ?? null);
    } catch (err) {
      setCategoriesError(
        err?.response?.data?.message ||
          "No se pudieron cargar las categorías."
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
        err
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

    const intervalId = setInterval(
      refreshNotifications,
      POLL_INTERVAL_MS
    );

    document.addEventListener(
      "visibilitychange",
      refreshNotifications
    );

    return () => {
      clearInterval(intervalId);
      document.removeEventListener(
        "visibilitychange",
        refreshNotifications
      );
    };
  }, [sessionUser, reloadUnreadCount]);

  /* ---------- actualización de tareas ---------- */

  const mutationsInFlight = useRef(0);
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
      setTasks(raw.map(normalizeTask));
    } catch (err) {
      if (!silent) {
        setTasksError(
          err?.response?.data?.message ||
            "No se pudieron cargar las tareas."
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
    reloadUsers()
      .catch(() => setUsers([]));
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

  const sectorIdOf = (s) =>
    s && typeof s === "object" ? s._id ?? s.id : s;

  const visibleTasks = useMemo(() => {
    const now = new Date();
    const diffDays = (d) => (new Date(d) - now) / 86400000;

    return tasks
      .filter((t) => {
        if (t.categoryId !== activeCategory) return false;

        if (
          search &&
          !t.title.toLowerCase().includes(search.toLowerCase())
        ) {
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
          const category = categories.find(
            (c) => c.id === t.categoryId
          );

          const ids = (category?.sectors ?? []).map(sectorIdOf);

          if (!ids.includes(filters.sector)) return false;
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
        (t) =>
          t.column === columnId &&
          t.categoryId === activeCategory
      );

      const nextOrder = sameColumn.length
        ? Math.max(...sameColumn.map((t) => t.order)) + 1
        : 0;

      const created = await createTaskRequest({
        title,
        description: "Sin descripción",
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

      if (patch.title !== undefined) payload.title = patch.title;
      if (patch.description !== undefined) {
        payload.description = patch.description;
      }
      if (patch.priority !== undefined) {
        payload.priority = patch.priority;
      }
      if (patch.column !== undefined) payload.state = patch.column;
      if (patch.members !== undefined) {
        payload.assignedUser = patch.members;
      }
      if (patch.labelIds !== undefined) {
        payload.labels = patch.labelIds;
      }
      if (patch.dueDate !== undefined) {
        payload.dueDate = patch.dueDate || null;
      }
      if (patch.order !== undefined) payload.order = patch.order;

      const updated = await updateTaskRequest(id, payload);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? normalizeTask(updated) : t
        )
      );
    });

  const deleteTask = (id) =>
    track(async () => {
      await deleteTaskRequest(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });

  const moveTask = (id, columnId, beforeId = null) =>
    track(async () => {
      const previous = tasks;
      const moving = tasks.find((t) => t.id === id);

      if (!moving || id === beforeId) return;

      const target = tasks
        .filter(
          (t) =>
            t.column === columnId &&
            t.categoryId === moving.categoryId &&
            t.id !== id
        )
        .sort((a, b) => a.order - b.order);

      const index = beforeId
        ? target.findIndex((t) => t.id === beforeId)
        : -1;

      target.splice(index === -1 ? target.length : index, 0, {
        ...moving,
        column: columnId,
      });

      const renumbered = target.map((t, i) => ({
        ...t,
        order: i,
      }));

      const changed = renumbered.filter((t) => {
        const old = tasks.find((o) => o.id === t.id);

        return (
          !old ||
          old.order !== t.order ||
          old.column !== t.column
        );
      });

      const byId = new Map(renumbered.map((t) => [t.id, t]));

      setTasks((prev) =>
        prev.map((t) => byId.get(t.id) ?? t)
      );

      try {
        await Promise.all(
          changed.map((t) =>
            updateTaskRequest(t.id, {
              state: t.column,
              order: t.order,
            })
          )
        );
      } catch (err) {
        setTasks(previous);
        throw err;
      }
    });

  /* ---------- acciones: categorías ---------- */

  const addCategory = async ({ name, color, sectors: sectorIds }) => {
    const created = await createCategoryRequest({
      name,
      color,
      sectors: sectorIds,
    });

    const normalized = normalizeCategory(created);

    setCategories((prev) => [...prev, normalized]);
    setActiveCategory(normalized.id);

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
    const updated = await updateLabelRequest(id, { title, color });
    const normalized = normalizeLabel(updated);

    setLabels((prev) =>
      prev.map((l) => (l.id === id ? normalized : l))
    );

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
          : t
      )
    );
  };

  /* ---------- contexto global ---------- */

  const value = {
    currentUser,
    reloadUsers,

    categories,
    categoriesLoading,
    categoriesError,
    activeCategory,
    setActiveCategory,
    addCategory,
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
    updateTask,
    deleteTask,
    moveTask,

    view,
    setView,
    search,
    setSearch,

    filters,
    setFilters,
    activeFiltersCount,

    // Notificaciones
    unreadCount,
    reloadUnreadCount,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
