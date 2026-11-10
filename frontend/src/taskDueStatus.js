const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

// tone -> color del indicador (ver task-card-status.css)
export const DUE_TONES = {
  overdue: {
    tone: "overdue",
    label: "Vencida",
    hint: "Tarea vencida",
  },
  imminent: {
    tone: "imminent",
    label: "Vence hoy",
    hint: "Vence en menos de 24 hs",
  },
  soon: {
    tone: "soon",
    label: "Vence mañana",
    hint: "Vence en menos de 48 hs",
  },
  review: {
    tone: "done",
    label: "En revisión",
    hint: "En revisión: la fecha límite ya no corre",
  },
  completed: {
    tone: "done",
    label: "Completada",
    hint: "Tarea completada",
  },
};

/**
 * Devuelve el estado visual de la fecha límite de una tarea,
 * o null si no hay que destacarla.
 *
 * - Terminado y En revisión: la fecha siempre se muestra en verde.
 * - Resto de columnas: se compara por día de calendario. La fecha límite
 *   vale hasta el final de ese día, igual que el criterio de "vencida":
 *     día anterior a hoy -> vencida
 *     hoy                -> menos de 24 hs
 *     mañana             -> menos de 48 hs
 */
export function getTaskDueStatus({ dueDate, column, now = new Date() }) {
  if (!(dueDate instanceof Date) || Number.isNaN(dueDate.getTime())) {
    return null;
  }

  if (column === "completed") return DUE_TONES.completed;
  if (column === "review") return DUE_TONES.review;

  const days = Math.round((startOfDay(dueDate) - startOfDay(now)) / DAY_MS);

  if (days < 0) return DUE_TONES.overdue;
  if (days === 0) return DUE_TONES.imminent;
  if (days === 1) return DUE_TONES.soon;

  return null;
}