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

// beforeId = tarea ANTES de la cual se inserta (null = al final).
export const moveTaskRequest = async (id, { state, beforeId = null }) => {
  const { data } = await api.patch(`/api/tasks/${id}/move`, {
    state,
    beforeId,
  });

  return data;
};

export const deleteTaskRequest = async (id) => {
  const { data } = await api.delete(`/api/tasks/${id}`);
  return data;
};

/**
 * Sube uno o varios archivos a una tarea.
 *
 * Se utiliza multipart/form-data.
 */
export const uploadTaskAttachmentsRequest = async (
  taskId,
  files = [],
) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const { data } = await api.post(
    `/api/tasks/${taskId}/attachments`,
    formData,
  );

  return data?.task ?? data;
};

/**
 * Elimina un archivo adjunto.
 */
export const deleteTaskAttachmentRequest = async (
  taskId,
  attachmentId,
) => {
  const { data } = await api.delete(
    `/api/tasks/${taskId}/attachments/${attachmentId}`,
  );

  return data?.task ?? data;
};