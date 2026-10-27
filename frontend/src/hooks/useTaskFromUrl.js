import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";

/**
 * Si la URL trae ?task=<id>, cambia a la categoría de esa tarea y llama a onOpen(id).
 * Devuelve clearTaskParam(): llamarla al cerrar el detalle para limpiar la URL.
 */
export default function useTaskFromUrl(onOpen) {
  const { tasks, tasksLoading, categoriesLoading, setActiveCategory } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const handled = useRef(null);
  const taskId = searchParams.get("task");

  useEffect(() => {
    if (!taskId) {
      handled.current = null; // permite volver a abrir la misma tarea más tarde
      return;
    }
    if (tasksLoading || categoriesLoading) return;
    if (handled.current === taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      handled.current = taskId;
      if (task.categoryId) setActiveCategory(task.categoryId);
      onOpen(task.id);
    } else {
      // no existe, se borró o no tenés acceso
      setSearchParams({}, { replace: true });
    }
  }, [taskId, tasks, tasksLoading, categoriesLoading, setActiveCategory, setSearchParams, onOpen]);

  return useCallback(() => {
    handled.current = null;
    if (searchParams.get("task")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);
}