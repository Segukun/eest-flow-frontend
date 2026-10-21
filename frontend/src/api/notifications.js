import api from "../api";

export const fetchNotifications = async ({
  filter = "all",
  page = 1,
  limit = 20,
} = {}) => {
  const { data } = await api.get(
    "/api/notifications",
    {
      params: {
        filter,
        page,
        limit,
      },
    },
  );

  return data;
};

export const fetchUnreadCount = async () => {
  const { data } = await api.get(
    "/api/notifications/unread-count",
  );

  return data;
};

export const markNotificationRead = async (
  notificationId,
) => {
  const { data } = await api.patch(
    `/api/notifications/${notificationId}/read`,
  );

  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch(
    "/api/notifications/read-all",
  );

  return data;
};
