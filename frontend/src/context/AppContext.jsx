import { createContext, useContext, useMemo, useState } from "react";
import {
  CATEGORIES, TASKS, USERS, CURRENT_USER_ID, COLUMNS, SECTORS,
} from "../mock/db";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [categories, setCategories] = useState(CATEGORIES);
  const [tasks, setTasks] = useState(TASKS);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [view, setView] = useState("tablero");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    onlyMine: false,
    priorities: [],
    sector: "",
    due: "",
  });

  const currentUser = USERS.find((u) => u.id === CURRENT_USER_ID);

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (filters.onlyMine) n++;
    n += filters.priorities.length;
    if (filters.sector) n++;
    if (filters.due) n++;
    return n;
  }, [filters]);

  const visibleTasks = useMemo(() => {
    const now = new Date();
    const diffDays = (d) => (new Date(d) - now) / 86400000;

    return tasks.filter((t) => {
      if (t.categoryId !== activeCategory) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.onlyMine && !t.members.includes(CURRENT_USER_ID)) return false;
      if (filters.priorities.length && !filters.priorities.includes(t.priority)) return false;
      if (filters.sector && t.sector !== filters.sector) return false;
      if (filters.due) {
        const d = diffDays(t.dueDate);
        if (filters.due === "hoy" && !(d >= -1 && d < 1)) return false;
        if (filters.due === "48" && !(d < 2)) return false;
        if (filters.due === "7" && !(d < 7)) return false;
      }
      return true;
    });
  }, [tasks, activeCategory, search, filters]);

  /* ---------- tareas ---------- */

  const addTask = (columnId, title) => {
    const id = "t" + Math.random().toString(36).slice(2, 8);
    setTasks((prev) => [
      ...prev,
      {
        id,
        categoryId: activeCategory,
        column: columnId,
        title,
        description: "",
        priority: "media",
        labels: [],
        members: [],
        sector: currentUser.sector,
        dueDate: "",
      },
    ]);
  };

  const updateTask = (id, patch) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const deleteTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const moveTask = (id, columnId, beforeId = null) => {
    setTasks((prev) => {
      const moving = prev.find((t) => t.id === id);
      if (!moving) return prev;
      const rest = prev.filter((t) => t.id !== id);
      const updated = { ...moving, column: columnId };
      if (!beforeId) return [...rest, updated];
      const idx = rest.findIndex((t) => t.id === beforeId);
      if (idx === -1) return [...rest, updated];
      return [...rest.slice(0, idx), updated, ...rest.slice(idx)];
    });
  };

  /* ---------- categorías ---------- */

  const addCategory = ({ name, color, sectors: authorizedSectors }) => {
    const id = "cat_" + Math.random().toString(36).slice(2, 8);
    const newCategory = { id, name, color, sectors: authorizedSectors ?? "all" };
    setCategories((prev) => [...prev, newCategory]);
    setActiveCategory(id);
    return id;
  };

  const deleteCategory = (id) => {
    if (categories.length <= 1) return; // nunca te quedás sin categorías

    setCategories((prev) => prev.filter((c) => c.id !== id));
    setTasks((prev) => prev.filter((t) => t.categoryId !== id)); // limpia sus tareas

    if (activeCategory === id) {
      const fallback = categories.find((c) => c.id !== id);
      if (fallback) setActiveCategory(fallback.id);
    }
  };

  const value = {
    categories, activeCategory, setActiveCategory, addCategory, deleteCategory,
    columns: COLUMNS, sectors: SECTORS, users: USERS, currentUser,
    tasks, visibleTasks, addTask, updateTask, deleteTask, moveTask,
    view, setView, search, setSearch,
    filters, setFilters, activeFiltersCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);