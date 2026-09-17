import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import "../styles/pages/login.css";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // limpiar espacios email
    const emailLimpio = email.trim();

    // validaciones de campos
    if (!emailLimpio || !password) {
      setError("Por favor, completá todos los campos.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailLimpio)) {
      setError("Ingresá un email válido. Ejemplo: admin@empresa.com");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/api/auth/login", {
        email: emailLimpio,
        password: password,
      });

      console.log("Respuesta del servidor:", response.data);

      const user = response.data.user;

      if (user) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            _id: user._id,
            name: user.name,
            email: user.email,
            accountType: user.accountType,
            sector: user.sector,
            active: user.active,
          }),
        );
      }
      navigate("/home");
    } 
    catch (error) {
      console.error("Error al iniciar sesión:", error);

      if (error.response) {
        // login incorrecto
        if (error.response.status === 401) {
          setError("email o password incorrectos");
        } else {
          // Otro error enviado por el backend
          setError(
            error.response.data?.mensaje ||
              error.response.data?.message ||
              "Ocurrió un error al iniciar sesión.",
          );
        }

      } else if (error.request) {
        setError(
          "No se pudo conectar con el servidor. Verificá que el backend esté funcionando.",
        );
      } else {
        setError("Ocurrió un error al iniciar sesión.");
      }
    } 
    finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      {" "}
      <div className="admin-login-overlay"></div>
      <div className="admin-login-content">
        <div className="admin-card">
          <div className="admin-card-logo">
            <img src="/eestn1logo.png" alt="Logo" />
          </div>

          <div className="admin-card-header">
            <h1>Panel de administración</h1>
            <p>Ingresá para continuar</p>
          </div>

          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-field">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                placeholder="admin@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="password">Contraseña</label>

              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <p
                style={{
                  color: "#8d1717",
                  fontSize: "13px",
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="admin-primary-button"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <button
            type="button"
            className="admin-link-button"
            onClick={() => {
              setError(
                "La recuperación de contraseña todavía no está disponible.",
              );
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>
    </main>
  );
};

export default AdminLogin;
