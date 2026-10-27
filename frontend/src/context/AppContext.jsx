import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { fetchTasks, createTaskRequest, updateTaskRequest, deleteTaskRequest } from "../api/tasks";
import { fetchCategories, createCategoryRequest, deleteCategoryRequest } from "../api/categories";
import { fetchLabels, createLabelRequest, updateLabelRequest, deleteLabelRequest } from "../api/labels";
import { fetchSectors } from "../api/sectors";
import { fetchUsers } from "../api/users";
import { fetchUnreadCount } from "../api/notifications";

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
    // posición de la tarea dentro de su columna (las viejas sin order valen 0)
    order: raw.order ?? 0,
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
  // CORREGIDO: email (lo usa el panel "Asignar personal")
  return { id: raw._id, name: raw.name, email: raw.email, initials, accountType: raw.accountType };
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

  // ---- notificaciones ----
  const [unreadCount, setUnreadCount] = useState(0);

  const [view, setView] = useState("tablero");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ onlyMine: false, priorities: [], sector: "", due: "" });

  const currentUser = sessionUser
    ? users.find((u) => u.id === sessionUser._id) ?? {
        id: sessionUser._id,
        name: sessionUser.name,
        email: sessionUser.email, // CORREGIDO: email
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

  /* ---------- actualización en tiempo real ---------- */
  const mutationsInFlight = useRef(0);
  const mutationVersion = useRef(0); // cuenta cuántas escrituras terminaron
  const tasksSignature = useRef("");

  // envuelve cualquier escritura para que el polling no la pise
  const track = async (fn) => {
    mutationsInFlight.current += 1;
    try {
      return await fn();
    } finally {
      mutationsInFlight.current -= 1;
      mutationVersion.current += 1; // avisa que hubo un cambio
    }
  };

  const loadTasks = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setTasksLoading(true);
      setTasksError(null);
    }

    // guardamos en qué "versión" empezó este pedido
    const versionAtStart = mutationVersion.current;

    try {
      const raw = await fetchTasks();

      // descartamos la respuesta si hay una escritura en curso
      // O si hubo alguna escritura mientras este pedido viajaba (datos viejos)
      if (
        silent &&
        (mutationsInFlight.current > 0 || mutationVersion.current !== versionAtStart)
      ) {
        return;
      }

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

  /* ---------- notificaciones: contador para el badge ---------- */

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await fetchUnreadCount();
      setUnreadCount(res?.data?.count ?? res?.count ?? 0);
    } catch {
      // el badge no debe romper el resto de la app
    }
  }, []);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        loadUnreadCount();
      }
    };

    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadUnreadCount]);

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

    return tasks
      .filter((t) => {
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
      })
      // ordena por posición. sort() es estable: las tareas con el mismo
      // order (por ejemplo las viejas, todas en 0) conservan su orden actual.
      .sort((a, b) => a.order - b.order);
  }, [tasks, categories, activeCategory, search, filters, currentUser]);

  /* ---------- acciones: tareas ---------- */

  const addTask = (columnId, title) =>
    track(async () => {
      if (!activeCategory) return;

      // la tarea nueva va al final de su columna
      const sameColumn = tasks.filter(
        (t) => t.column === columnId && t.categoryId === activeCategory
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
      if (patch.description !== undefined) payload.description = patch.description;
      if (patch.priority !== undefined) payload.priority = patch.priority;
      if (patch.column !== undefined) payload.state = patch.column;
      if (patch.members !== undefined) payload.assignedUser = patch.members;
      if (patch.labelIds !== undefined) payload.labels = patch.labelIds;
      if (patch.dueDate !== undefined) payload.dueDate = patch.dueDate || null;
      if (patch.order !== undefined) payload.order = patch.order;

      const updated = await updateTaskRequest(id, payload);
      setTasks((prev) => prev.map((t) => (t.id === id ? normalizeTask(updated) : t)));
    });

  const deleteTask = (id) =>
    track(async () => {
      await deleteTaskRequest(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });

  /* moveTask(id, columnId)            -> manda la tarea al FINAL de la columna
     moveTask(id, columnId, beforeId)  -> la pone justo ANTES de la tarea beforeId
     Sirve para mover entre columnas y también para reordenar dentro de la misma. */
  const moveTask = (id, columnId, beforeId = null) =>
    track(async () => {
      const previous = tasks;
      const moving = tasks.find((t) => t.id === id);
      if (!moving || id === beforeId) return;

      // Tareas de la columna destino (de la misma categoría), ordenadas,
      // sin la que estamos moviendo
      const target = tasks
        .filter(
          (t) =>
            t.column === columnId &&
            t.categoryId === moving.categoryId &&
            t.id !== id
        )
        .sort((a, b) => a.order - b.order);

      // Insertar antes de beforeId (o al final si no hay)
      const index = beforeId ? target.findIndex((t) => t.id === beforeId) : -1;
      target.splice(index === -1 ? target.length : index, 0, {
        ...moving,
        column: columnId,
      });

      // Renumerar la columna: 0, 1, 2, ...
      const renumbered = target.map((t, i) => ({ ...t, order: i }));

      // Solo se mandan al backend las tareas que realmente cambiaron
      const changed = renumbered.filter((t) => {
        const old = tasks.find((o) => o.id === t.id);
        return !old || old.order !== t.order || old.column !== t.column;
      });

      // Actualización optimista (se ve al instante)
      const byId = new Map(renumbered.map((t) => [t.id, t]));
      setTasks((prev) => prev.map((t) => byId.get(t.id) ?? t));

      try {
        await Promise.all(
          changed.map((t) => updateTaskRequest(t.id, { state: t.column, order: t.order }))
        );
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
    unreadCount, reloadUnreadCount: loadUnreadCount,
    view, setView, search, setSearch,
    filters, setFilters, activeFiltersCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);