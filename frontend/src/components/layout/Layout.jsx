import { useState } from "react";
import { Outlet } from "react-router-dom";
import MiPerfil from "../MiPerfil";
import ConfiguracionModal from "../ConfiguracionModal";
import AddCategoryModal from "../AddCategoryModal";
import DeleteCategoryModal from "../DeleteCategoryModal";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../../styles/layout/layout.css";

export default function Layout() {
  const [perfilModalOpen, setPerfilModalOpen] = useState(false);
  const [configuracionModalOpen, setConfiguracionModalOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);

  return (
    <div className="app-shell">
      <Sidebar
        onOpenPerfil={() => setPerfilModalOpen(true)}
        onOpenConfiguracion={() => setConfiguracionModalOpen(true)}
        onOpenAddCategory={() => setAddCategoryOpen(true)}
        onRequestDeleteCategory={(category) => setDeleteCategoryTarget(category)}
      />

      <Topbar
        onOpenConfiguracion={() => setConfiguracionModalOpen(true)}
        onOpenAddCategory={() => setAddCategoryOpen(true)}
        onRequestDeleteCategory={(category) => setDeleteCategoryTarget(category)}
      />

      <main className="app-main">
        <Outlet />
      </main>

      {configuracionModalOpen && (
        <ConfiguracionModal
          onClose={() => setConfiguracionModalOpen(false)}
          onOpenPerfil={() => { setConfiguracionModalOpen(false); setPerfilModalOpen(true); }}
        />
      )}

      {perfilModalOpen && <MiPerfil onClose={() => setPerfilModalOpen(false)} />}

      {addCategoryOpen && <AddCategoryModal onClose={() => setAddCategoryOpen(false)} />}

      {deleteCategoryTarget && (
        <DeleteCategoryModal
          category={deleteCategoryTarget}
          onClose={() => setDeleteCategoryTarget(null)}
        />
      )}
    </div>
  );
}