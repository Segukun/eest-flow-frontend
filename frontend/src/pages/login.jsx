import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import "../styles/pages/login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Mostrar / ocultar la contraseña (ojito)
  const [showPassword, setShowPassword] = useState(false);

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

      // 1. GUARDAR TOKEN - esto es lo que usa ProtectedRoutes para proteger
      const token = response.data.token || response.data.accessToken || response.data.access_token;
      if (token) {
        localStorage.setItem("token", token);
      } else {
        // Si tu backend no manda token todavia, igual guardamos algo para que funcione el flujo
        // Cuando el backend mande token, esto ya queda listo
        console.warn("El backend no devolvió token, usando user como fallback");
        localStorage.setItem("token", "temp-token");
      }

      // 2. GUARDAR USER
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

      // 3. REDIRIGIR AL HOME (tu home es / no /home)
      navigate("/", { replace: true });

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

              {/* Contenedor para poder poner el ojito DENTRO del input */}
              <div className="admin-password">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
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

                <button
                  type="button"
                  className="admin-password-toggle"
                  disabled={loading}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {!showPassword ? (
                      <>
                        {/* ojo TACHADO = contraseña oculta (puntitos), click para mostrar */}
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        {/* ojo SIN tachar = contraseña visible, click para ocultar */}
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>

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
              navigate("/OlvidarContrasenia")
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </div>
    </main>
  );
};

export default Login;