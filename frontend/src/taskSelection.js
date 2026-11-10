export function toggleTaskSelection(selected, id) {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function retainTaskSelection(selected, tasks) {
  const available = new Set(tasks.map((task) => task.id));
  return new Set([...selected].filter((id) => available.has(id)));
}

// Mirrors the existing move endpoint: insert before a task, or append, then
// renumber the destination. Call only after the server confirms the move.
export function applyTaskMove(tasks, id, column, beforeId = null) {
  const moving = tasks.find((task) => task.id === id);
  if (!moving || id === beforeId) return tasks;
  const target = tasks.filter((task) => task.id !== id &&
    task.categoryId === moving.categoryId && task.column === column)
    .sort((a, b) => a.order - b.order);
  const index = beforeId ? target.findIndex((task) => task.id === beforeId) : -1;
  target.splice(index < 0 ? target.length : index, 0, { ...moving, column });
  const byId = new Map(target.map((task, order) => [task.id, { ...task, order }]));
  return tasks.map((task) => byId.get(task.id) ?? task);
}

// Sequential requests preserve the order of appended tasks and avoid a burst
// of writes. A failed item does not hide the outcome of the other items.
export async function executeTaskBatch({ ids, tasks, action, destination, move, archive }) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const succeeded = [], failed = [], skipped = [];
  for (const id of new Set(ids)) {
    const task = byId.get(id);
    if (action === "move" && task?.column === destination) {
      skipped.push(id);
      continue;
    }
    try {
      if (action === "move") await move(id, destination);
      else if (action === "archive") await archive(id);
      else throw new Error("Acción no válida.");
      succeeded.push(id);
    } catch (error) {
      failed.push({ id, title: task?.title || "Tarea", message: error.response?.data?.message || error.message });
    }
  }
  return { succeeded, failed, skipped };
}
