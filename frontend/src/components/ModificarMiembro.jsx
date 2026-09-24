import { useState } from "react";
import "../styles/components/ModificarMiembro.css";

// Simulación de base de datos
const miembrosDB = [];

const ModificarMiembro = ({ miembro, onClose }) => {
  const [formulario, setFormulario] = useState({
    nombre: miembro.nombre || "",
    sector: miembro.area || "",
    rol:
      miembro.cuenta?.toLowerCase() === "admin"
        ? "admin"
        : "colaborador",
    email: miembro.correo || "",
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

    const nombreValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Nombre: no es obligatorio modificarlo,
    // pero si se escribe, debe tener solamente letras.
    if (formulario.nombre.trim() === "") {
      nuevosErrores.nombre = "El nombre no puede quedar vacío.";
    } else if (!nombreValido.test(formulario.nombre.trim())) {
      nuevosErrores.nombre =
        "El nombre solo puede contener letras.";
    }

    // Sector
    if (!formulario.sector) {
      nuevosErrores.sector = "Debés seleccionar un sector.";
    }

    // Rol
    if (!formulario.rol) {
      nuevosErrores.rol = "Debés seleccionar un rol.";
    }

    // Email
    if (formulario.email.trim() === "") {
      nuevosErrores.email = "El email no puede quedar vacío.";
    } else if (!emailValido.test(formulario.email.trim())) {
      nuevosErrores.email =
        "Ingresá un email válido. Ejemplo: usuario@email.com";
    }

    // Contraseña:
    // Solo se valida si el usuario decide modificarla.
    if (
      formulario.password !== "" &&
      formulario.password.length < 6
    ) {
      nuevosErrores.password =
        "La contraseña debe tener al menos 6 caracteres.";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarSubmit = (e) => {
    e.preventDefault();
    setMensaje("");

    if (!validarFormulario()) return;

    const miembroModificado = {
      ...miembro,
      nombre: formulario.nombre.trim(),
      area: formulario.sector,
      cuenta: formulario.rol === "admin" ? "Admin" : "Colaborador",
      correo: formulario.email.trim(),
      ...(formulario.password !== "" && {
        password: formulario.password,
      }),
    };

    miembrosDB.push(miembroModificado);

    console.log("Miembro modificado:", miembroModificado);
    console.log("Base de datos simulada:", miembrosDB);

    setMensaje("Miembro modificado correctamente.");
  };

  return (
    <div
      className="modificar-modal-overlay"
      onClick={onClose}
    >
      <div
        className="modificar-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modificar-modal-header">
          <h2>MODIFICAR MIEMBRO</h2>

          <button
            type="button"
            className="modificar-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        <form
          className="modificar-modal-form"
          onSubmit={manejarSubmit}
          noValidate
        >
          {/* Nombre */}
          <div className="modificar-campo">
            <label htmlFor="modificar-nombre">
              Nombre
            </label>

            <input
              id="modificar-nombre"
              name="nombre"
              type="text"
              value={formulario.nombre}
              onChange={manejarCambio}
            />

            {errores.nombre && (
              <p className="modificar-error">
                {errores.nombre}
              </p>
            )}
          </div>

          {/* Sector */}
          <div className="modificar-campo">
            <label htmlFor="modificar-sector">
              Sector
            </label>

            <select
              id="modificar-sector"
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
              <p className="modificar-error">
                {errores.sector}
              </p>
            )}
          </div>

          {/* Rol */}
          <div className="modificar-campo">
            <label>Rol</label>

            <div className="modificar-roles">
              <button
                type="button"
                className={
                  formulario.rol === "colaborador"
                    ? "modificar-rol-btn rol-seleccionado"
                    : "modificar-rol-btn"
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
                    ? "modificar-rol-btn rol-seleccionado"
                    : "modificar-rol-btn"
                }
                onClick={() => seleccionarRol("admin")}
              >
                Admin
              </button>
            </div>

            {errores.rol && (
              <p className="modificar-error">
                {errores.rol}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="modificar-campo">
            <label htmlFor="modificar-email">
              Email
            </label>

            <input
              id="modificar-email"
              name="email"
              type="email"
              value={formulario.email}
              onChange={manejarCambio}
            />

            {errores.email && (
              <p className="modificar-error">
                {errores.email}
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div className="modificar-campo">
            <label htmlFor="modificar-password">
              Contraseña
            </label>

            <input
              id="modificar-password"
              name="password"
              type="password"
              placeholder="Ingresá una nueva contraseña"
              value={formulario.password}
              onChange={manejarCambio}
            />

            <small className="modificar-ayuda">
              Dejá este campo vacío si no querés cambiar la contraseña.
            </small>

            {errores.password && (
              <p className="modificar-error">
                {errores.password}
              </p>
            )}
          </div>

          {mensaje && (
            <p className="modificar-exito">
              {mensaje}
            </p>
          )}

          <div className="modificar-modal-actions">
            <button
              type="button"
              className="modificar-btn cancelar"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="modificar-btn guardar"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModificarMiembro;