import api from "../api";

export const fetchTasks = async () => {
  const { data } = await api.get("/api/tasks");
  return data;
};

export const createTaskRequest = async (payload) => {
  const { data } = await api.post("/api/tasks", payload);
  return data;
};

export const updateTaskRequest = async (id, payload) => {
  const { data } = await api.put(`/api/tasks/${id}`, payload);
  return data;
};

// beforeId = tarea ANTES de la cual se inserta (null = al final de la columna)
export const moveTaskRequest = async (id, { state, beforeId = null }) => {
  const { data } = await api.patch(`/api/tasks/${id}/move`, { state, beforeId });
  return data;
};

export const deleteTaskRequest = async (id) => {
  const { data } = await api.delete(`/api/tasks/${id}`);
  return data;
};