import { useEffect, useState } from "react";
import api from "../api"; // ajustá la ruta si tu api.js está en otro lado
import "../styles/components/MiPerfil.css";

// Prefijos reales según el app.js del backend
const USERS_URL = "/api/users";
const AUTH_URL = "/api/auth";

// Lee el usuario guardado en el login
const getSessionUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const MiPerfil = ({ onClose }) => {
  const sessionUser = getSessionUser();

  const [nombre, setNombre] = useState(sessionUser?.name ?? "");
  const [email, setEmail] = useState(sessionUser?.email ?? "");
  // valores guardados en el servidor, para saber si hubo cambios
  const [original, setOriginal] = useState({
    name: sessionUser?.name ?? "",
    email: sessionUser?.email ?? "",
  });

  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [cargando, setCargando] = useState(true); // carga inicial de datos
  const [guardando, setGuardando] = useState(false); // llamando al backend
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Trae los datos actuales del usuario desde el backend
  useEffect(() => {
    if (!sessionUser?._id) {
      setError("No se encontró la sesión. Volvé a iniciar sesión.");
      setCargando(false);
      return;
    }

    let cancelado = false;

    api
      .get(`${USERS_URL}/${sessionUser._id}`)
      .then(({ data }) => {
        if (cancelado) return;
        setNombre(data.name);
        setEmail(data.email);
        setOriginal({ name: data.name, email: data.email });
      })
      .catch((err) => {
        if (cancelado) return;
        setError(
          err?.response?.data?.message ||
            "No se pudieron cargar los datos del perfil."
        );
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardarPerfil = async () => {
    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim().toLowerCase();

    if (!nombreLimpio) return setError("El nombre no puede estar vacío.");
    if (nombreLimpio.length > 30)
      return setError("El nombre puede tener como máximo 30 caracteres.");
    if (!emailLimpio) return setError("El email no puede estar vacío.");
    if (emailLimpio.length > 50)
      return setError("El email puede tener como máximo 50 caracteres.");

    const quiereCambiarPassword =
      nuevaPassword.length > 0 || confirmarPassword.length > 0;

    if (quiereCambiarPassword) {
      if (nuevaPassword.length < 6)
        return setError("La contraseña debe tener al menos 6 caracteres.");
      if (nuevaPassword !== confirmarPassword)
        return setError("Las contraseñas no coinciden.");
    }

    // Solo se envía lo que cambió
    const payload = {};
    if (nombreLimpio !== original.name) payload.name = nombreLimpio;
    if (emailLimpio !== original.email) payload.email = emailLimpio;

    if (Object.keys(payload).length === 0 && !quiereCambiarPassword) {
      return setMensaje("No hay cambios para guardar.");
    }

    setGuardando(true);
    try {
      // 1) nombre / email
      if (Object.keys(payload).length > 0) {
        try {
          const { data } = await api.put(
            `${USERS_URL}/${sessionUser._id}`,
            payload
          );

          setNombre(data.name);
          setEmail(data.email);
          setOriginal({ name: data.name, email: data.email });

          // actualiza la sesión guardada, sin tocar el resto de sus campos
          localStorage.setItem(
            "user",
            JSON.stringify({ ...sessionUser, name: data.name, email: data.email })
          );
        } catch (err) {
          if (err?.response?.status === 409) {
            setError("Ese email ya está en uso.");
          } else {
            setError(
              err?.response?.data?.message || "No se pudo actualizar el perfil."
            );
          }
          return;
        }
      }

      // 2) contraseña: directo, sin código
      if (quiereCambiarPassword) {
        try {
          await api.post(`${AUTH_URL}/change-password`, {
            newPassword: nuevaPassword,
          });
          setNuevaPassword("");
          setConfirmarPassword("");
        } catch (err) {
          setError(
            err?.response?.data?.message || "No se pudo cambiar la contraseña."
          );
          return;
        }
      }

      setMensaje("Perfil actualizado correctamente.");
    } finally {
      setGuardando(false);
    }
  };

  const manejarSubmit = (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    guardarPerfil();
  };

  const bloqueado = cargando || guardando;

  return (
    <div className="perfil-modal-overlay" onClick={onClose}>
      <div className="perfil-modal" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado */}
        <div className="perfil-modal-header">
          <div>
            <h2>Editar perfil</h2>
            <p>Actualizá la información de tu cuenta.</p>
          </div>

          <button type="button" className="perfil-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Formulario */}
        <form className="perfil-modal-form" onSubmit={manejarSubmit}>
          <div className="perfil-campo">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              maxLength={30}
              disabled={bloqueado}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="perfil-campo">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              maxLength={50}
              disabled={bloqueado}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="perfil-campo">
            <label htmlFor="nuevaPassword">Nueva contraseña</label>
            <input
              id="nuevaPassword"
              type="password"
              placeholder="Ingresá una nueva contraseña"
              value={nuevaPassword}
              disabled={bloqueado}
              onChange={(e) => setNuevaPassword(e.target.value)}
            />
            <small>
              Mínimo 6 caracteres. Dejá vacío si no querés cambiarla.
            </small>
          </div>

          <div className="perfil-campo">
            <label htmlFor="confirmarPassword">Confirmar nueva contraseña</label>
            <input
              id="confirmarPassword"
              type="password"
              placeholder="Repetí la nueva contraseña"
              value={confirmarPassword}
              disabled={bloqueado}
              onChange={(e) => setConfirmarPassword(e.target.value)}
            />
          </div>

          {/* Mensajes */}
          {error && <p className="perfil-mensaje error">{error}</p>}
          {mensaje && <p className="perfil-mensaje success">{mensaje}</p>}

          {/* Acciones */}
          <div className="perfil-modal-actions">
            <button
              type="button"
              className="perfil-btn cancelar"
              disabled={guardando}
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="perfil-btn guardar"
              disabled={bloqueado}
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MiPerfil;