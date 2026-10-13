import { BrowserRouter, Route, Routes } from "react-router-dom";

import Login from "./pages/login";
import Home from "./pages/home";
import Sectores from "./pages/GestionSectores";
import Foro from "./pages/foro";
import Notificaciones from "./pages/notificaciones";
import Equipo from "./pages/equipo";

import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoutes";

import { AppProvider } from "./context/AppContext";
import { ToastProvider } from "./components/Toast.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route
          element={
            <ProtectedRoute>
              <AppProvider>
                <ToastProvider>
                  <Layout />
                </ToastProvider>
              </AppProvider>
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/sectores" element={<Sectores />} />
          <Route path="/foro" element={<Foro />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="/equipo" element={<Equipo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;