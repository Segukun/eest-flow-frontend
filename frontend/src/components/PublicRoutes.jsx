import { Navigate, Outlet } from "react-router-dom";

const PublicRoutes = () => {
  const token = localStorage.getItem("token");
  // Si ya está logueado, no puede ver /login, lo mandamos al home
  return token ? <Navigate to="/" replace /> : <Outlet />;
};

export default PublicRoutes;
