import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchUnreadCount } from "../api/notification";

const NotificationsContext = createContext({ unreadCount: 0, refreshUnreadCount: () => {} });

const POLL_INTERVAL_MS = 10000;

export function NotificationsProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      setUnreadCount(await fetchUnreadCount());
    } catch {
      // el polling no debe romper la UI; el 401 ya lo maneja el interceptor de Axios
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();

    const refresh = () => {
      if (document.visibilityState === "visible") refreshUnreadCount();
    };

    const id = setInterval(refresh, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [refreshUnreadCount]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, setUnreadCount, refreshUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);