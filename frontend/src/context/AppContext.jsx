import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { fetchTasks, createTaskRequest, updateTaskRequest, deleteTaskRequest } from "../api/tasks";
import { fetchCategories, createCategoryRequest, deleteCategoryRequest } from "../api/categories";
import { fetchLabels, createLabelRequest, updateLabelRequest, deleteLabelRequest } from "../api/labels";
import { fetchSectors } from "../api/sectors";
import { fetchUsers } from "../api/users";

const AppContext = createContext(null);

const POLL_INTERVAL_MS = 10000; // cada 10 segundos

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
  };
}

function normalizeCategory(raw) {
  return { id: raw._id, name: raw.name, color: raw.color, sectors: raw.sectors ?? [] };
}

function normalizeLabel(raw) {
  return { id: raw._id, title: raw.title, color: raw.color, categoryId: raw.category };
}

function normalizeSector(raw) {
  return { id: raw._id, name: raw.name, color: raw.color };
}

function normalizeUser(raw) {
  const initials = (raw.name || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return { id: raw._id, name: raw.name, initials, accountType: raw.accountType };
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

  // ---- etiquetas de la categoría activa ----
  const [labels, setLabels] = useState([]);
  const [labelsLoading, setLabelsLoading] = useState(false);

  // ---- tareas ----
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);

  const [view, setView] = useState("tablero");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ onlyMine: false, priorities: [], sector: "", due: "" });

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
        accountType: sessionUser.accountType,
      }
    : null;

  /* ---------- carga inicial ---------- */

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const raw = await fetchCategories();
      const normalized = raw.map(normalizeCategory);
      setCategories(normalized);
      setActiveCategory((prev) => prev ?? normalized[0]?.id ?? null);
    } catch (err) {
      setCategoriesError(err?.response?.data?.message || "No se pudieron cargar las categorías.");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

/* ---------- actualizacion en tiempo real ---------- */
  const mutationsInFlight = useRef(0);
  const tasksSignature = useRef("");

  // envuelve cualquier escritura para que el polling no la pise
  const track = async (fn) => {
    mutationsInFlight.current += 1;
    try {
      return await fn();
    } finally {
      mutationsInFlight.current -= 1;
    }
  };

  const loadTasks = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setTasksLoading(true);
      setTasksError(null);
    }
    try {
      const raw = await fetchTasks();

      // si hay una escritura en curso, descartamos esta respuesta (puede estar vieja)
      if (silent && mutationsInFlight.current > 0) return;

      // si no cambió nada, no re-renderizamos
      const signature = JSON.stringify(raw);
      if (silent && signature === tasksSignature.current) return;
      tasksSignature.current = signature;

      setTasks(raw.map(normalizeTask));
    } catch (err) {
      // en el polling los errores no tumban el tablero
      if (!silent) {
        setTasksError(err?.response?.data?.message || "No se pudieron cargar las tareas.");
      }
    } finally {
      if (!silent) setTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadTasks();
    fetchSectors()
      .then((raw) => setSectors(raw.map(normalizeSector)))
      .catch(() => setSectors([]));
    fetchUsers()
      .then((raw) => setUsers(raw.map(normalizeUser)))
      .catch(() => setUsers([]));
  }, [loadCategories, loadTasks]);

  /* efecto de tiempo real */
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        loadTasks({ silent: true });
      }
    };

    const id = setInterval(refresh, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh); // refresca al volver a la pestaña

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadTasks]);

  /* ---------- etiquetas: dependen de la categoría activa ---------- */

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

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (filters.onlyMine) n++;
    n += filters.priorities.length;
    if (filters.sector) n++;
    if (filters.due) n++;
    return n;
  }, [filters]);

  const sectorIdOf = (s) => (s && typeof s === "object" ? s._id ?? s.id : s);

  const visibleTasks = useMemo(() => {
    const now = new Date();
    const diffDays = (d) => (new Date(d) - now) / 86400000;

    return tasks.filter((t) => {
      if (t.categoryId !== activeCategory) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.priorities.length && !filters.priorities.includes(t.priority)) return false;
      if (filters.onlyMine && currentUser && !t.members.includes(currentUser.id)) return false;

      if (filters.sector) {
        const category = categories.find((c) => c.id === t.categoryId);
        const ids = (category?.sectors ?? []).map(sectorIdOf);
        if (!ids.includes(filters.sector)) return false;
      }

      if (filters.due && t.dueDate) {
        const d = diffDays(t.dueDate);
        if (filters.due === "hoy" && !(d >= -1 && d < 1)) return false;
        if (filters.due === "48" && !(d < 2)) return false;
        if (filters.due === "7" && !(d < 7)) return false;
      }
      return true;
    });
  }, [tasks, categories, activeCategory, search, filters, currentUser]);

  /* ---------- acciones: tareas ---------- */

const addTask = (columnId, title) =>
  track(async () => {
    if (!activeCategory) return;
    const created = await createTaskRequest({
      title,
      description: "Sin descripción",
      priority: "medium",
      state: columnId,
      category: activeCategory,
    });
    setTasks((prev) => [...prev, normalizeTask(created)]);
  });

const updateTask = (id, patch) =>
  track(async () => {
    const payload = {};
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.priority !== undefined) payload.priority = patch.priority;
    if (patch.column !== undefined) payload.state = patch.column;
    if (patch.members !== undefined) payload.assignedUser = patch.members;
    if (patch.labelIds !== undefined) payload.labels = patch.labelIds;
    if (patch.dueDate !== undefined) payload.dueDate = patch.dueDate || null;

    const updated = await updateTaskRequest(id, payload);
    setTasks((prev) => prev.map((t) => (t.id === id ? normalizeTask(updated) : t)));
  });

const deleteTask = (id) =>
  track(async () => {
    await deleteTaskRequest(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  });

const moveTask = (id, columnId) =>
  track(async () => {
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, column: columnId } : t)));
    try {
      await updateTaskRequest(id, { state: columnId });
    } catch (err) {
      setTasks(previous);
      throw err;
    }
  });

  /* ---------- acciones: categorías ---------- */

  const addCategory = async ({ name, color, sectors: sectorIds }) => {
    const created = await createCategoryRequest({ name, color, sectors: sectorIds });
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
    if (!activeCategory) throw new Error("No hay categoría activa");
    const created = await createLabelRequest({ title, color, category: activeCategory });
    const normalized = normalizeLabel(created);
    setLabels((prev) => [...prev, normalized]);
    return normalized;
  };

  const updateLabel = async (id, { title, color }) => {
  const updated = await updateLabelRequest(id, { title, color });
  const normalized = normalizeLabel(updated);
  setLabels((prev) => prev.map((l) => (l.id === id ? normalized : l)));
  return normalized;
};

const deleteLabel = async (id) => {
  await deleteLabelRequest(id);
  setLabels((prev) => prev.filter((l) => l.id !== id));
  // limpia la referencia en cualquier tarea que la tuviera asignada,
  // para que la UI no siga mostrando una etiqueta borrada
  setTasks((prev) =>
    prev.map((t) =>
      t.labelIds.includes(id) ? { ...t, labelIds: t.labelIds.filter((lid) => lid !== id) } : t
    )
  );
};

  const value = {
    currentUser,
    categories, categoriesLoading, categoriesError,
    activeCategory, setActiveCategory, addCategory, deleteCategory,
    columns: COLUMNS, sectors, users,
    labels, labelsLoading, addLabel, updateLabel, deleteLabel,
    tasks, visibleTasks, tasksLoading, tasksError, reloadTasks: () => loadTasks(),
    addTask, updateTask, deleteTask, moveTask,
    view, setView, search, setSearch,
    filters, setFilters, activeFiltersCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);