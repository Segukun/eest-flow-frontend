import { useState } from "react";
import "../styles/components/AgregarMiembro.css";

// Simulación de base de datos
const miembrosDB = [];

const AgregarMiembro = ({ onClose }) => {
  const [formulario, setFormulario] = useState({
    nombre: "",
    sector: "",
    rol: "",
    email: "",
    password: "",
  });

  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar el error del campo al modificarlo
    setErrores((prev) => ({
      ...prev,
      [name]: "",
    }));

    setMensaje("");
  };

  const seleccionarRol = (rol) => {
    setFormulario((prev) => ({
      ...prev,
      rol,
    }));

    setErrores((prev) => ({
      ...prev,
      rol: "",
    }));

    setMensaje("");
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validar nombre: solamente letras y espacios
    const nombreValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio.";
    } else if (!nombreValido.test(formulario.nombre.trim())) {
      nuevosErrores.nombre =
        "El nombre solo puede contener letras.";
    }

    // Validar sector
    if (!formulario.sector) {
      nuevosErrores.sector = "Debés seleccionar un sector.";
    }

    // Validar rol
    if (!formulario.rol) {
      nuevosErrores.rol = "Debés seleccionar un rol.";
    }

    // Validar email
    const emailValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formulario.email.trim()) {
      nuevosErrores.email = "El email es obligatorio.";
    } else if (!emailValido.test(formulario.email)) {
      nuevosErrores.email =
        "Ingresá un email válido. Ejemplo: usuario@email.com";
    }

    // Validar contraseña
    if (!formulario.password) {
      nuevosErrores.password =
        "La contraseña es obligatoria.";
    } else if (formulario.password.length < 6) {
      nuevosErrores.password =
        "La contraseña debe tener al menos 6 caracteres.";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarSubmit = (e) => {
    e.preventDefault();

    setMensaje("");

    if (!validarFormulario()) {
      return;
    }

    // Simulación de guardado en la base de datos
    const nuevoMiembro = {
      id: miembrosDB.length + 1,
      nombre: formulario.nombre.trim(),
      sector: formulario.sector,
      rol: formulario.rol,
      email: formulario.email.trim(),
      password: formulario.password,
    };

    miembrosDB.push(nuevoMiembro);

    console.log("Miembro agregado:", nuevoMiembro);
    console.log("Base de datos simulada:", miembrosDB);

    setMensaje("Miembro agregado correctamente.");

    setFormulario({
      nombre: "",
      sector: "",
      rol: "",
      email: "",
      password: "",
    });
  };

  return (
    <div
      className="agregar-modal-overlay"
      onClick={onClose}
    >
      <div
        className="agregar-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="agregar-modal-header">
          <h2>AGREGAR MIEMBRO</h2>

          <button
            type="button"
            className="agregar-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Formulario */}
        <form
          className="agregar-modal-form"
          onSubmit={manejarSubmit}
          noValidate
        >
          {/* Nombre */}
          <div className="agregar-campo">
            <label htmlFor="nombre">Nombre</label>

            <input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Ingresá el nombre completo"
              value={formulario.nombre}
              onChange={manejarCambio}
            />

            {errores.nombre && (
              <p className="agregar-error">
                {errores.nombre}
              </p>
            )}
          </div>

          {/* Sector */}
          <div className="agregar-campo">
            <label htmlFor="sector">Sector</label>

            <select
              id="sector"
              name="sector"
              value={formulario.sector}
              onChange={manejarCambio}
            >
              <option value="">
                Seleccioná un sector
              </option>

              <option value="taller electromecanica">
                Taller Electromecánica
              </option>

              <option value="preceptoria">
                Preceptoría
              </option>
            </select>

            {errores.sector && (
              <p className="agregar-error">
                {errores.sector}
              </p>
            )}
          </div>

          {/* Rol */}
          <div className="agregar-campo">
            <label>Rol</label>

            <div className="agregar-roles">
              <button
                type="button"
                className={
                  formulario.rol === "colaborador"
                    ? "agregar-rol-btn rol-seleccionado"
                    : "agregar-rol-btn"
                }
                onClick={() =>
                  seleccionarRol("colaborador")
                }
              >
                Colaborador
              </button>

              <button
                type="button"
                className={
                  formulario.rol === "admin"
                    ? "agregar-rol-btn rol-seleccionado"
                    : "agregar-rol-btn"
                }
                onClick={() => seleccionarRol("admin")}
              >
                Admin
              </button>
            </div>

            {errores.rol && (
              <p className="agregar-error">
                {errores.rol}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="agregar-campo">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Ingresá el email"
              value={formulario.email}
              onChange={manejarCambio}
            />

            {errores.email && (
              <p className="agregar-error">
                {errores.email}
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div className="agregar-campo">
            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Ingresá una contraseña"
              value={formulario.password}
              onChange={manejarCambio}
            />

            {errores.password && (
              <p className="agregar-error">
                {errores.password}
              </p>
            )}
          </div>

          {/* Mensaje de éxito */}
          {mensaje && (
            <p className="agregar-exito">
              {mensaje}
            </p>
          )}

          {/* Botones */}
          <div className="agregar-modal-actions">
            <button
              type="button"
              className="agregar-btn cancelar"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="agregar-btn agregar"
            >
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgregarMiembro;