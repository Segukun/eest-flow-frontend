import { useEffect, useState } from "react";
import api from "../api.js";
import "../styles/components/AgregarMiembro.css";

const AgregarMiembro = ({ onClose }) => {
  const [formulario, setFormulario] = useState({
    nombre: "",
    sector: "",
    email: "",
    password: "",
  });

  const [sectores, setSectores] = useState([]);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [errorServidor, setErrorServidor] = useState("");
  const [cargandoSectores, setCargandoSectores] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const cargarSectores = async () => {
      try {
        setCargandoSectores(true);

        const response = await api.get("/api/sectors");

        setSectores(response.data);
      } catch (error) {
        console.error("Error al cargar sectores:", error);

        if (error.response?.status === 401) {
          setErrorServidor(
            "Tu sesión expiró. Volvé a iniciar sesión."
          );
        } else {
          setErrorServidor(
            "No se pudieron cargar los sectores."
          );
        }
      } finally {
        setCargandoSectores(false);
      }
    };

    cargarSectores();
  }, []);

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

  const validarFormulario = () => {
    const nuevosErrores = {};

    const nombreValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio.";
    } else if (!nombreValido.test(formulario.nombre.trim())) {
      nuevosErrores.nombre =
        "El nombre solo puede contener letras.";
    }

    if (!formulario.sector) {
      nuevosErrores.sector =
        "Debés seleccionar un sector.";
    }

    const emailValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formulario.email.trim()) {
      nuevosErrores.email =
        "El email es obligatorio.";
    } else if (!emailValido.test(formulario.email.trim())) {
      nuevosErrores.email =
        "Ingresá un email válido.";
    }

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

  const limpiarFormulario = () => {
    setFormulario({
      nombre: "",
      sector: "",
      email: "",
      password: "",
    });
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    setMensaje("");
    setErrorServidor("");

    const formularioValido = validarFormulario();

    if (!formularioValido) {
      return;
    }

    try {
      setEnviando(true);

      const datos = {
        name: formulario.nombre.trim(),
        email: formulario.email.trim(),
        password: formulario.password,
        sectors: [formulario.sector],
      };

      console.log("Datos enviados:", datos);

      const response = await api.post(
        "/api/auth/accounts",
        datos
      );

      console.log(
        "Respuesta de creación:",
        response.data
      );

      setMensaje(
        "Miembro agregado correctamente."
      );

      limpiarFormulario();
      setErrores({});
    } catch (error) {
      console.error(
        "Error al crear miembro:",
        error
      );

      const status = error.response?.status;
      const serverMessage =
        error.response?.data?.message;

      if (status === 400) {
        setErrorServidor(
          serverMessage ||
            "Hay campos requeridos faltantes o datos inválidos."
        );
      } else if (status === 401) {
        setErrorServidor(
          "Tu sesión expiró. Volvé a iniciar sesión."
        );
      } else if (status === 403) {
        setErrorServidor(
          "No tenés permisos de administrador para realizar esta acción."
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
          "No se pudo conectar con el servidor. Verificá que el backend esté funcionando."
        );
      } else {
        setErrorServidor(
          serverMessage ||
            "Ocurrió un error al crear el miembro."
        );
      }
    } finally {
      setEnviando(false);
    }
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
        <div className="agregar-modal-header">
          <h2>AGREGAR MIEMBRO</h2>

          <button
            type="button"
            className="agregar-modal-close"
            onClick={onClose}
            disabled={enviando}
          >
            ×
          </button>
        </div>

        <form
          className="agregar-modal-form"
          onSubmit={manejarSubmit}
          noValidate
        >
          <div className="agregar-campo">
            <label htmlFor="nombre">
              Nombre
            </label>

            <input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Ingresá el nombre completo"
              value={formulario.nombre}
              onChange={manejarCambio}
              disabled={enviando}
            />

            {errores.nombre && (
              <p className="agregar-error">
                {errores.nombre}
              </p>
            )}
          </div>

          <div className="agregar-campo">
            <label htmlFor="sector">
              Sector
            </label>

            <select
              id="sector"
              name="sector"
              value={formulario.sector}
              onChange={manejarCambio}
              disabled={
                cargandoSectores || enviando
              }
            >
              <option value="">
                {cargandoSectores
                  ? "Cargando sectores..."
                  : "Seleccioná un sector"}
              </option>

              {sectores.map((sector) => (
                <option
                  key={sector._id}
                  value={sector._id}
                >
                  {sector.name}
                </option>
              ))}
            </select>

            {errores.sector && (
              <p className="agregar-error">
                {errores.sector}
              </p>
            )}
          </div>

          <div className="agregar-campo">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Ingresá el email"
              value={formulario.email}
              onChange={manejarCambio}
              disabled={enviando}
            />

            {errores.email && (
              <p className="agregar-error">
                {errores.email}
              </p>
            )}
          </div>

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
              disabled={enviando}
            />

            {errores.password && (
              <p className="agregar-error">
                {errores.password}
              </p>
            )}
          </div>

          {errorServidor && (
            <p className="agregar-error">
              {errorServidor}
            </p>
          )}

          {mensaje && (
            <p className="agregar-exito">
              {mensaje}
            </p>
          )}

          <div className="agregar-modal-actions">
            <button
              type="button"
              className="agregar-btn cancelar"
              onClick={onClose}
              disabled={enviando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="agregar-btn agregar"
              disabled={
                enviando || cargandoSectores
              }
            >
              {enviando
                ? "Agregando..."
                : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgregarMiembro;