import { useState } from "react";
import { Outlet } from "react-router-dom";
import MiPerfil from "../miPerfil";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../../styles/layout/layout.css";

export default function Layout() {
  const [perfilModalOpen, setPerfilModalOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        onOpenPerfil={() => setPerfilModalOpen(true)}
      />

      <Topbar />

      <main className="app-main">
        <Outlet />
      </main>

      {perfilModalOpen && (
        <MiPerfil
          onClose={() => setPerfilModalOpen(false)}
        />
      )}
    </div>
  );
}