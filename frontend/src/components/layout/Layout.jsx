import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import MiPerfil from "../MiPerfil";
import ConfiguracionModal from "../ConfiguracionModal";
import AddCategoryModal from "../AddCategoryModal";
import DeleteCategoryModal from "../DeleteCategoryModal";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../../styles/layout/layout.css";

export default function Layout() {
  const { currentUser } = useApp();

  const isAdmin =
    currentUser?.accountType === "admin";

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

  const openAddCategory = () => {
    setEditCategoryTarget(null);
    setAddCategoryOpen(true);
  };

  const openEditCategory = (category) => {
    setAddCategoryOpen(false);
    setEditCategoryTarget(category);
  };

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

      {perfilModalOpen && (
        <MiPerfil
          onClose={() =>
            setPerfilModalOpen(false)
          }
        />
      )}

      {isAdmin && addCategoryOpen && (
        <AddCategoryModal
          onClose={() =>
            setAddCategoryOpen(false)
          }
        />
      )}

      {isAdmin && editCategoryTarget && (
        <AddCategoryModal
          key={editCategoryTarget.id}
          category={editCategoryTarget}
          onClose={() =>
            setEditCategoryTarget(null)
          }
        />
      )}

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