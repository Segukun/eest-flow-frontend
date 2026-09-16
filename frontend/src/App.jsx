import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/login";
import Home from "./pages/home";
import Sectores from "./pages/sectores";
import Foro from "./pages/foro";
import Notificaciones from "./pages/notificaciones";
import Equipo from "./pages/equipo";
import Layout from "./components/layout/Layout";
import { AppProvider } from "./context/AppContext";

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* rutas sin layout (sin sidebar) */}
          <Route path="/login" element={<Login />} />

          {/* rutas con layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/sectores" element={<Sectores />} />
            <Route path="/foro" element={<Foro />} />
            <Route path="/notificaciones" element={<Notificaciones />} />
            <Route path="/equipo" element={<Equipo />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;