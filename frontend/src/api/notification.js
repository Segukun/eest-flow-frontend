import api from "../api";

export const fetchNotifications = async ({ filter = "all", page = 1, limit = 50 } = {}) => {
  const { data } = await api.get("/api/notifications", { params: { filter, page, limit } });
  return data; // { notifications, total, unreadCount, page, limit }
};

export const fetchUnreadCount = async () => {
  const { data } = await api.get("/api/notifications/unread-count");
  return data.count;
};

export const markNotificationRead = async (id) => {
  const { data } = await api.patch(`/api/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch("/api/notifications/read-all");
  return data;
};