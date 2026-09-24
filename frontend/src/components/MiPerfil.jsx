import { useState } from "react";
import "../styles/components/MiPerfil.css";

// Simulación de base de datos
const usuariosDB = [
  {
    id: 1,
    nombre: "Juan Pérez",
    email: "juanperez@gmail.com",
  },
];

export const MiPerfil = ({ onClose }) => {
  const usuarioActual = usuariosDB[0];

  const [nombre] = useState(usuarioActual.nombre);
  const [email] = useState(usuarioActual.email);

  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const manejarSubmit = (e) => {
    e.preventDefault();

    setError("");
    setMensaje("");

    // Validar longitud de contraseña
    if (
      nuevaPassword.length > 0 &&
      nuevaPassword.length < 6
    ) {
      setError(
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    // Validar confirmación
    if (nuevaPassword !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    // Simulación de actualización en la base de datos
    if (nuevaPassword.length > 0) {
      usuariosDB[0] = {
        ...usuariosDB[0],
        password: nuevaPassword,
      };
    }

    setMensaje("Perfil actualizado correctamente.");

    setNuevaPassword("");
    setConfirmarPassword("");
  };

  return (
    <div
      className="perfil-modal-overlay"
      onClick={onClose}
    >
      <div
        className="perfil-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="perfil-modal-header">
          <div>
            <h2>Editar perfil</h2>
            <p>Actualizá la información de tu cuenta.</p>
          </div>

          <button
            type="button"
            className="perfil-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Formulario */}
        <form
          className="perfil-modal-form"
          onSubmit={manejarSubmit}
        >
          <div className="perfil-campo">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              disabled
            />
          </div>

          <div className="perfil-campo">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
            />
          </div>

          <div className="perfil-campo">
            <label htmlFor="nuevaPassword">
              Nueva contraseña
            </label>
            <input
              id="nuevaPassword"
              type="password"
              placeholder="Ingresá una nueva contraseña"
              value={nuevaPassword}
              onChange={(e) =>
                setNuevaPassword(e.target.value)
              }
            />
            <small>
              Mínimo 6 caracteres. Dejá vacío si no querés
              cambiarla.
            </small>
          </div>

          <div className="perfil-campo">
            <label htmlFor="confirmarPassword">
              Confirmar nueva contraseña
            </label>
            <input
              id="confirmarPassword"
              type="password"
              placeholder="Repetí la nueva contraseña"
              value={confirmarPassword}
              onChange={(e) =>
                setConfirmarPassword(e.target.value)
              }
            />
          </div>

          {/* Mensajes */}
          {error && (
            <p className="perfil-mensaje error">
              {error}
            </p>
          )}

          {mensaje && (
            <p className="perfil-mensaje success">
              {mensaje}
            </p>
          )}

          {/* Acciones */}
          <div className="perfil-modal-actions">
            <button
              type="button"
              className="perfil-btn cancelar"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="perfil-btn guardar"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MiPerfil;
