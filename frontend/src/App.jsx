import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Home from "./pages/home";
import Sectores from "./pages/GestionSectores";
import Foro from "./pages/foro";
import Notificaciones from "./pages/notificaciones";
import Equipo from "./pages/equipo";
import Layout from "./components/layout/Layout";
import ProtectedRoutes from "./components/ProtectedRoutes";
import PublicRoutes from "./components/PublicRoutes";
import { AppProvider } from "./context/AppContext";

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* RUTAS PUBLICAS - solo si NO estás logueado */}
          <Route element={<PublicRoutes />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* RUTAS PROTEGIDAS - solo si SÍ estás logueado */}
          <Route element={<ProtectedRoutes />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/sectores" element={<Sectores />} />
              <Route path="/foro" element={<Foro />} />
              <Route path="/notificaciones" element={<Notificaciones />} />
              <Route path="/equipo" element={<Equipo />} />
            </Route>
          </Route>

          {/* Cualquier ruta que no exista -> login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
