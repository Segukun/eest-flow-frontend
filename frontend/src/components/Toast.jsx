import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

import "../styles/components/Toast.css";

const ToastContext = createContext(null);

const MAX_TOASTS = 4;
const EXIT_MS = 200;

const ICONS = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo,
};

function ToastItem({ toast, onDismiss }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration);
  const startedAt = useRef(0);

  // Timer que se pausa con hover/foco y retoma con el tiempo restante.
  useEffect(() => {
    if (paused || toast.leaving) return undefined;

    startedAt.current = Date.now();
    const timer = setTimeout(() => onDismiss(toast.id), remaining.current);

    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, toast.leaving, toast.id, onDismiss]);

  const Icon = ICONS[toast.type] || FiInfo;

  return (
    <div
      className={`toast toast--${toast.type} ${
        toast.leaving ? "toast--leaving" : ""
      }`}
      role={toast.type === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="toast__icon">
        <Icon />
      </span>

      <p className="toast__message">{toast.message}</p>

      <button
        className="toast__close"
        onClick={() => onDismiss(toast.id)}
        type="button"
        aria-label="Cerrar notificación"
      >
        <FiX />
      </button>

      <span
        className="toast__progress"
        style={{
          animationDuration: `${toast.duration}ms`,
          animationPlayState: paused ? "paused" : "running",
        }}
      />
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismiss = useCallback(
    (id) => {
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id ? { ...toast, leaving: true } : toast,
        ),
      );

      setTimeout(() => remove(id), EXIT_MS);
    },
    [remove],
  );

  const show = useCallback((message, options = {}) => {
    const { type = "info", duration } = options;

    const id =
      window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

    setToasts((prev) =>
      [
        ...prev,
        {
          id,
          message,
          type,
          duration: duration ?? (type === "error" ? 6000 : 4000),
          leaving: false,
        },
      ].slice(-MAX_TOASTS),
    );

    return id;
  }, []);

  const api = useMemo(
    () => ({
      show,
      dismiss,
      success: (message, options) => show(message, { ...options, type: "success" }),
      error: (message, options) => show(message, { ...options, type: "error" }),
      info: (message, options) => show(message, { ...options, type: "info" }),
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      {createPortal(
        <div className="toast-region" aria-live="polite">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>");
  }

  return context;
}