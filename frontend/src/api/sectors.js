import api from "../api";

export const fetchSectors = async () => {
  const { data } = await api.get("/api/sectors");
  return data;
};