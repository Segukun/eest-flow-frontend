import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../../styles/layout/layout.css";

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <Topbar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}