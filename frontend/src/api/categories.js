import api from "../api";

export const fetchCategories = async () => {
  const { data } = await api.get("/api/categories");
  return data;
};

export const createCategoryRequest = async (payload) => {
  const { data } = await api.post("/api/categories", payload);
  return data;
};

export const updateCategoryRequest = async (id, payload) => {
  const { data } = await api.put(`/api/categories/${id}`, payload);
  return data;
};

export const deleteCategoryRequest = async (id) => {
  const { data } = await api.delete(`/api/categories/${id}`);
  return data;
};