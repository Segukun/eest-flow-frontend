import { Navigate, Outlet } from "react-router-dom";

// Verifica si hay token y si no está expirado (opcional)
const isTokenValid = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  // Si tu token es JWT, podés validar expiración descomentando esto:
  // try {
  //   const payload = JSON.parse(atob(token.split('.')[1]));
  //   const exp = payload.exp * 1000;
  //   if (Date.now() >= exp) {
  //     localStorage.removeItem("token");
  //     localStorage.removeItem("user");
  //     return false;
  //   }
  // } catch {
  //   return false;
  // }

  return true;
};

const ProtectedRoutes = () => {
  const isAuth = isTokenValid();
  // Si está autenticado, muestra las rutas hijas, si no, al login
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoutes;
