
import api from "../api";

export const fetchSectors = async () => {
  const { data } = await api.get("/api/sectors");
  return data;
};

export const fetchSectorMembers = async (sectorId) => {
  const { data } = await api.get(`/api/sectors/${sectorId}/members`);
  return data;
};

export const createSectorRequest = async (payload) => {
  const { data } = await api.post("/api/sectors", payload);
  return data;
};

export const updateSectorRequest = async (sectorId, payload) => {
  const { data } = await api.put(`/api/sectors/${sectorId}`, payload);
  return data;
};

export const deleteSectorRequest = async (sectorId) => {
  const { data } = await api.delete(`/api/sectors/${sectorId}`);
  return data;
};

// Unirse o solicitar acceso.
export const joinSectorRequest = async (sectorId) => {
  const { data } = await api.post(`/api/sectors/${sectorId}/join`);
  return data;
};

// Abandonar un sector.
export const leaveSectorRequest = async (sectorId) => {
  const { data } = await api.post(`/api/sectors/${sectorId}/leave`);
  return data;
};

// Solicitudes pendientes del usuario autenticado.
export const fetchMyPendingSectorRequests = async () => {
  const { data } = await api.get("/api/sectors/requests/mine");
  return data?.requests ?? [];
};

// Cancelar una solicitud propia.
export const cancelSectorJoinRequest = async (requestId) => {
  const { data } = await api.delete(`/api/sectors/requests/${requestId}`);
  return data;
};

// Resolver una solicitud como administrador.
export const resolveSectorJoinRequest = async (
  requestId,
  decision,
) => {
  const { data } = await api.patch(
    `/api/sectors/requests/${requestId}/resolve`,
    { decision },
  );

  return data;
};
