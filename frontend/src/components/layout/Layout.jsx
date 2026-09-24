import { useState } from "react";
import { Outlet } from "react-router-dom";
import MiPerfil from "../MiPerfil";
import ConfiguracionModal from "../ConfiguracionModal";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../../styles/layout/layout.css";

export default function Layout() {
  const [perfilModalOpen, setPerfilModalOpen] = useState(false);
  const [configuracionModalOpen, setConfiguracionModalOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        onOpenPerfil={() => setPerfilModalOpen(true)}
        onOpenConfiguracion={() => setConfiguracionModalOpen(true)}
      />

      <Topbar onOpenConfiguracion={() => setConfiguracionModalOpen(true)} />

      <main className="app-main">
        <Outlet />
      </main>

      {configuracionModalOpen && (
        <ConfiguracionModal
          onClose={() => setConfiguracionModalOpen(false)}
          onOpenPerfil={() => {
            setConfiguracionModalOpen(false);
            setPerfilModalOpen(true);
          }}
        />
      )}

      {perfilModalOpen && (
        <MiPerfil
          onClose={() => setPerfilModalOpen(false)}
        />
      )}
    </div>
  );
}
