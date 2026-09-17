import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import "../styles/pages/login.css";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Limpiar errores anteriores
    setEmailError("");
    setPasswordError("");
    setServerError("");

    // Limpiar espacios innecesarios del email
    const emailLimpio = email.trim();

    let hayErrores = false;

    if (!emailLimpio) {
      setEmailError("Por favor, ingresá tu email.");
      hayErrores = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(emailLimpio)) {
        setEmailError("Ingresá un email válido. Ejemplo: admin@empresa.com");
        hayErrores = true;
      }
    }

    if (!password) {
      setPasswordError("Por favor, ingresá tu contraseña.");
      hayErrores = true;
    } else if (password.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      hayErrores = true;
    }

    if (hayErrores) {
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
        if (error.response.status === 401) {
          setServerError("email o password incorrectos");
        } else {
          setServerError(
            error.response.data?.message ||
              error.response.data?.mensaje ||
              "Ocurrió un error al iniciar sesión.",
          );
        }

      } else if (error.request) {
        setServerError(
          "No se pudo conectar con el servidor. Verificá que el backend esté funcionando.",
        );

      } else {
        setServerError("Ocurrió un error al intentar iniciar sesión.");
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                  setServerError("");
                }}
                required
                disabled={loading}
                className={emailError ? "input-error" : ""}
              />

              {emailError && <p className="field-error">{emailError}</p>}
            </div>

            <div className="admin-field">
              <label htmlFor="password">Contraseña</label>

              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                  setServerError("");
                }}
                required
                disabled={loading}
                className={passwordError ? "input-error" : ""}
              />

              {passwordError && <p className="field-error">{passwordError}</p>}
            </div>
            {serverError && <p className="server-error">{serverError}</p>}

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
              setServerError(
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
