import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  // Auth state - lee del localStorage lo que guardaste en login.jsx
  const [realUser, setRealUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setRealUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // currentUser: si hay usuario real logueado, usa ese, si no usa el mock
  const mockUser = USERS.find((u) => u.id === CURRENT_USER_ID);
  const currentUser = useMemo(() => {
    if (realUser) {
      // Adaptar el usuario real al formato que espera el sidebar
      return {
        id: realUser._id || "real",
        name: realUser.name || realUser.email,
        email: realUser.email,
        sector: realUser.sector || mockUser?.sector || "General",
        color: mockUser?.color || "#05903E",
        initials: (realUser.name?.[0] || realUser.email?.[0] || "U").toUpperCase() + (realUser.name?.split(" ")[1]?.[0] || "").toUpperCase(),
        accountType: realUser.accountType,
        ...mockUser, // fallback de campos mock
        name: realUser.name || mockUser?.name,
        sector: realUser.sector || mockUser?.sector,
      };
    }
    return mockUser;
  }, [realUser]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setRealUser(null);
    navigate("/login", { replace: true });
  };

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setRealUser(userData);
  };

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
    if (categories.length <= 1) return;

    setCategories((prev) => prev.filter((c) => c.id !== id));
    setTasks((prev) => prev.filter((t) => t.categoryId !== id));

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
    // Auth
    realUser,
    logout,
    login,
    isAuth: !!localStorage.getItem("token"),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
