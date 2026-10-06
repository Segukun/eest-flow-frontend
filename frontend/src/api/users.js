import api from "../api";

export const fetchUsers = async () => {
  const { data } = await api.get("/api/users");
  return data;
};