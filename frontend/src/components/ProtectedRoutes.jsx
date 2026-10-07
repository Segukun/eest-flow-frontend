import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const hasSession = (() => {
    try {
      return Boolean(localStorage.getItem("user"));
    } catch {
      return false;
    }
  })();

  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }

  return children;
}