import { useState } from "react";

import api from "../api.js";
import "../styles/components/ModificarMiembro.css";

const ModificarMiembro = ({
  miembro,
  onClose,
  onActualizado,
}) => {
  const [formulario, setFormulario] =
    useState({
      nombre: miembro.nombre || "",
      rol:
        miembro.cuenta?.toLowerCase() ===
        "admin"
          ? "admin"
          : "collaborator",
      email: miembro.correo || "",
    });

  const [errores, setErrores] =
    useState({});

  const [mensaje, setMensaje] =
    useState("");

  const [errorServidor, setErrorServidor] =
    useState("");

  const [guardando, setGuardando] =
    useState(false);

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
    setErrorServidor("");
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
    setErrorServidor("");
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    const nombreValido =
      /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

    const emailValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre =
        "El nombre no puede quedar vacío.";
    } else if (
      !nombreValido.test(
        formulario.nombre.trim()
      )
    ) {
      nuevosErrores.nombre =
        "El nombre solo puede contener letras.";
    }

    if (!formulario.email.trim()) {
      nuevosErrores.email =
        "El email no puede quedar vacío.";
    } else if (
      !emailValido.test(
        formulario.email.trim()
      )
    ) {
      nuevosErrores.email =
        "Ingresá un email válido.";
    }

    if (!formulario.rol) {
      nuevosErrores.rol =
        "Debés seleccionar un rol.";
    }

    setErrores(nuevosErrores);

    return (
      Object.keys(nuevosErrores)
        .length === 0
    );
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    setMensaje("");
    setErrorServidor("");

    if (!validarFormulario()) {
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        name: formulario.nombre.trim(),
        email: formulario.email.trim(),
        accountType:
          formulario.rol === "admin"
            ? "admin"
            : "collaborator",
      };

      console.log(
        "Datos para modificar:",
        datos
      );

      const response =
        await api.put(
          `/api/users/${miembro.id}`,
          datos
        );

      console.log(
        "Respuesta de modificación:",
        response.data
      );

      setMensaje(
        "Miembro modificado correctamente."
      );

      if (onActualizado) {
        await onActualizado(
          response.data
        );
      }
    } catch (error) {
      console.error(
        "Error al modificar miembro:",
        error
      );

      const status =
        error.response?.status;

      const serverMessage =
        error.response?.data?.message;

      if (status === 400) {
        setErrorServidor(
          serverMessage ||
            "Hay datos inválidos."
        );
      } else if (status === 401) {
        setErrorServidor(
          "Tu sesión expiró. Volvé a iniciar sesión."
        );
      } else if (status === 403) {
        setErrorServidor(
          "No tenés permisos para modificar este miembro."
        );
      } else if (status === 404) {
        setErrorServidor(
          "No se encontró el miembro."
        );
      } else if (status === 409) {
        setErrorServidor(
          "El correo electrónico ya se encuentra registrado."
        );
      } else if (status === 500) {
        setErrorServidor(
          "Ocurrió un error interno del servidor."
        );
      } else if (error.request) {
        setErrorServidor(
          "No se pudo conectar con el servidor."
        );
      } else {
        setErrorServidor(
          serverMessage ||
            "Ocurrió un error al modificar el miembro."
        );
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="modificar-modal-overlay"
      onClick={onClose}
    >
      <div
        className="modificar-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="modificar-modal-header">
          <h2>
            MODIFICAR MIEMBRO
          </h2>

          <button
            type="button"
            className="modificar-modal-close"
            onClick={onClose}
            disabled={guardando}
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
              disabled={guardando}
            />

            {errores.nombre && (
              <p className="modificar-error">
                {errores.nombre}
              </p>
            )}
          </div>

          <div className="modificar-campo">
            <label>
              Sector
            </label>

            <select
              disabled
              value=""
              onChange={() => {}}
            >
              <option value="">
                Sectores pendientes
              </option>
            </select>
          </div>

          <div className="modificar-campo">
            <label>
              Rol
            </label>

            <div className="modificar-roles">
              <button
                type="button"
                className={
                  formulario.rol ===
                  "collaborator"
                    ? "modificar-rol-btn rol-seleccionado"
                    : "modificar-rol-btn"
                }
                onClick={() =>
                  seleccionarRol(
                    "collaborator"
                  )
                }
                disabled={guardando}
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
                onClick={() =>
                  seleccionarRol(
                    "admin"
                  )
                }
                disabled={guardando}
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
              disabled={guardando}
            />

            {errores.email && (
              <p className="modificar-error">
                {errores.email}
              </p>
            )}
          </div>

          {errorServidor && (
            <p className="modificar-error">
              {errorServidor}
            </p>
          )}

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
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="modificar-btn guardar"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModificarMiembro;