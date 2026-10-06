import api from "../api.js";

export const fetchLabels = async (categoryId) => {
  const { data } = await api.get("/api/labels", { params: { category: categoryId } });
  return data;
};

export const createLabelRequest = async (payload) => {
  // nota: el backend exige accountType "admin" para esta ruta
  const { data } = await api.post("/api/labels", payload);
  return data;
};

export const updateLabelRequest = async (id, payload) => {
  const { data } = await api.put(`/api/labels/${id}`, payload);
  return data;
};

export const deleteLabelRequest = async (id) => {
  const { data } = await api.delete(`/api/labels/${id}`);
  return data;
};