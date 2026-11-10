
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { Outlet } from "react-router-dom";

import api from "../../api";
import { useApp } from "../../context/AppContext";
import { useToast } from "../Toast.jsx";

import MiPerfil from "../MiPerfil";
import ConfiguracionModal from "../ConfiguracionModal";
import AddCategoryModal from "../AddCategoryModal";
import DeleteCategoryModal from "../DeleteCategoryModal";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import "../../styles/layout/layout.css";

/* =========================================================
   CONFIGURACIÓN DE CONEXIÓN
   ========================================================= */

const CONNECTION_POLL_INTERVAL = 10000;
const CONNECTION_TIMEOUT = 5000;

// Endpoint de salud del backend.
const HEALTH_CHECK_URL = "/api/health";

export default function Layout() {
  const { currentUser } = useApp();

  const toast = useToast();

  const isAdmin =
    currentUser?.accountType === "admin";

  /* =====================================================
     MODALES
     ===================================================== */

  const [perfilModalOpen, setPerfilModalOpen] =
    useState(false);

  const [
    configuracionModalOpen,
    setConfiguracionModalOpen,
  ] = useState(false);

  const [addCategoryOpen, setAddCategoryOpen] =
    useState(false);

  const [editCategoryTarget, setEditCategoryTarget] =
    useState(null);

  const [deleteCategoryTarget, setDeleteCategoryTarget] =
    useState(null);

  /* =====================================================
     REFERENCIAS DE CONEXIÓN
     ===================================================== */

  const networkRef = useRef({
    offline: false,
    checking: false,
  });

  // Mantiene disponible la versión actual del Toast
  // sin necesidad de reiniciar el intervalo en cada render.
  const toastRef = useRef(toast);

  toastRef.current = toast;

  /* =====================================================
     DETECTOR DE CONEXIÓN
     ===================================================== */

  useEffect(() => {
    let active = true;

    /*
     * Notificar pérdida de conexión.
     *
     * Solo muestra un Toast si acabamos de pasar
     * de conectado a desconectado.
     */
    const notifyOffline = () => {
      if (!active) return;

      if (networkRef.current.offline) {
        return;
      }

      networkRef.current.offline = true;

      toastRef.current.error(
        "Se perdió la conexión a internet. Algunas funciones pueden no estar disponibles.",
      );
    };

    /*
     * Notificar recuperación.
     *
     * Se ejecuta únicamente si anteriormente
     * habíamos detectado una desconexión.
     */
    const notifyOnline = () => {
      if (!active) return;

      if (!networkRef.current.offline) {
        return;
      }

      networkRef.current.offline = false;

      toastRef.current.success(
        "Conexión restablecida. Ya podés continuar utilizando EESTFlow.",
      );
    };

    /*
     * Comprobar si el servidor responde.
     *
     * navigator.onLine por sí solo no garantiza
     * que exista conexión real a internet.
     */
    const checkConnection = async () => {
      if (!active || networkRef.current.checking) {
        return;
      }

      // El navegador detecta que no hay conexión de red.
      if (navigator.onLine === false) {
        notifyOffline();
        return;
      }

      networkRef.current.checking = true;

      try {
        await api.get(HEALTH_CHECK_URL, {
          timeout: CONNECTION_TIMEOUT,
        });

        if (!active) return;

        // Solo considerar recuperada la conexión si
        // el navegador tampoco reporta desconexión.
        if (navigator.onLine !== false) {
          notifyOnline();
        }
      } catch {
        if (!active) return;

        // El servidor no respondió o la conexión falló.
        notifyOffline();
      } finally {
        networkRef.current.checking = false;
      }
    };

    /* ---------- eventos del navegador ---------- */

    const handleOffline = () => {
      notifyOffline();
    };

    const handleOnline = () => {
      // No notificar recuperación inmediatamente:
      // primero verificamos que el servidor responda.
      checkConnection();
    };

    window.addEventListener(
      "offline",
      handleOffline,
    );

    window.addEventListener(
      "online",
      handleOnline,
    );

    /* ---------- primera comprobación ---------- */

    checkConnection();

    /* ---------- polling ---------- */

    const intervalId = setInterval(
      checkConnection,
      CONNECTION_POLL_INTERVAL,
    );

    /* ---------- limpieza ---------- */

    return () => {
      active = false;

      clearInterval(intervalId);

      window.removeEventListener(
        "offline",
        handleOffline,
      );

      window.removeEventListener(
        "online",
        handleOnline,
      );
    };
  }, []);

  /* =====================================================
     ACCIONES DE CATEGORÍAS
     ===================================================== */

  const openAddCategory = () => {
    setEditCategoryTarget(null);
    setAddCategoryOpen(true);
  };

  const openEditCategory = (category) => {
    setAddCategoryOpen(false);
    setEditCategoryTarget(category);
  };

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div className="app-shell">
      <Sidebar
        onOpenPerfil={() =>
          setPerfilModalOpen(true)
        }
        onOpenConfiguracion={() =>
          setConfiguracionModalOpen(true)
        }
        onOpenAddCategory={() =>
          isAdmin && openAddCategory()
        }
        onRequestEditCategory={(category) =>
          isAdmin && openEditCategory(category)
        }
        onRequestDeleteCategory={(category) =>
          isAdmin && setDeleteCategoryTarget(category)
        }
      />

      <Topbar
        onOpenConfiguracion={() =>
          setConfiguracionModalOpen(true)
        }
        onOpenAddCategory={() =>
          isAdmin && openAddCategory()
        }
        onRequestEditCategory={(category) =>
          isAdmin && openEditCategory(category)
        }
        onRequestDeleteCategory={(category) =>
          isAdmin && setDeleteCategoryTarget(category)
        }
      />

      <main className="app-main">
        <Outlet />
      </main>

      {/* ---------- CONFIGURACIÓN ---------- */}

      {configuracionModalOpen && (
        <ConfiguracionModal
          onClose={() =>
            setConfiguracionModalOpen(false)
          }
          onOpenPerfil={() => {
            setConfiguracionModalOpen(false);
            setPerfilModalOpen(true);
          }}
        />
      )}

      {/* ---------- PERFIL ---------- */}

      {perfilModalOpen && (
        <MiPerfil
          onClose={() =>
            setPerfilModalOpen(false)
          }
        />
      )}

      {/* ---------- CREAR CATEGORÍA ---------- */}

      {isAdmin && addCategoryOpen && (
        <AddCategoryModal
          onClose={() =>
            setAddCategoryOpen(false)
          }
        />
      )}

      {/* ---------- EDITAR CATEGORÍA ---------- */}

      {isAdmin && editCategoryTarget && (
        <AddCategoryModal
          key={editCategoryTarget.id}
          category={editCategoryTarget}
          onClose={() =>
            setEditCategoryTarget(null)
          }
        />
      )}

      {/* ---------- ELIMINAR CATEGORÍA ---------- */}

      {isAdmin && deleteCategoryTarget && (
        <DeleteCategoryModal
          category={deleteCategoryTarget}
          onClose={() =>
            setDeleteCategoryTarget(null)
          }
        />
      )}
    </div>
  );
}
