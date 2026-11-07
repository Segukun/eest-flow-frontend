import api from "../api";

/**
 * Obtiene todos los usuarios.
 */
export const fetchUsers = async () => {
  const { data } = await api.get("/api/users");

  return data;
};

/**
 * Sube o reemplaza la imagen de perfil.
 */
export const uploadProfilePicture = async (userId, file) => {
  const formData = new FormData();

  formData.append("profilePicture", file);

  const { data } = await api.put(
    `/api/users/${userId}/profile-picture`,
    formData,
  );

  return data;
};

/**
 * Elimina la imagen de perfil.
 */
export const deleteProfilePicture = async (userId) => {
  const { data } = await api.delete(
    `/api/users/${userId}/profile-picture`,
  );

  return data;
};