import { useEffect, useState } from "react";
import {
  FiX,
  FiUserPlus,
  FiAlertCircle,
  FiSearch,
  FiCheck,
} from "react-icons/fi";
import api from "../api.js";
import "../styles/components/AgregarSectorModal.css";

const obtenerIniciales = (nombre = "") => {
  return nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((parte) => parte[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const obtenerIdSector = (sector) => {
  if (!sector) {
    return null;
  }

  if (typeof sector === "string") {
    return sector;
  }

  return sector._id || sector.id || null;
};

export default function AgregarMiembroModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  sectorId = null,
}) {
  const isEditing = !!initialData;

  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] =
    useState([]);

  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState(null);

  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    setBusqueda("");
    setError("");

    if (initialData) {
      setUsuarioSeleccionado({
        _id: initialData.id,
        name: initialData.nombre,
        email: initialData.email,
        accountType:
          initialData.accountType ||
          "collaborator",
        sectors: initialData.sectors || [],
      });
    } else {
      setUsuarioSeleccionado(null);
    }

    cargarUsuarios();

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialData, sectorId]);

  useEffect(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      setUsuariosFiltrados(usuarios);
      return;
    }

    const filtrados = usuarios.filter((usuario) => {
      const nombre = (
        usuario.name || ""
      ).toLowerCase();

      const email = (
        usuario.email || ""
      ).toLowerCase();

      return (
        nombre.includes(texto) ||
        email.includes(texto)
      );
    });

    setUsuariosFiltrados(filtrados);
  }, [busqueda, usuarios]);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setError("");

      const response = await api.get("/api/users");

      let listaUsuarios = [];

      if (Array.isArray(response.data)) {
        listaUsuarios = response.data;
      } else if (Array.isArray(response.data?.users)) {
        listaUsuarios = response.data.users;
      }

      const usuariosDisponibles =
        listaUsuarios.filter((usuario) => {
          const idUsuario = usuario._id;

          if (!idUsuario) {
            return false;
          }

          if (
            initialData &&
            idUsuario === initialData.id
          ) {
            return true;
          }

          const sectoresUsuario = Array.isArray(
            usuario.sectors
          )
            ? usuario.sectors
            : [];

          const yaPertenece = sectoresUsuario.some(
            (sector) =>
              obtenerIdSector(sector) === sectorId
          );

          return !yaPertenece;
        });

      setUsuarios(usuariosDisponibles);
      setUsuariosFiltrados(usuariosDisponibles);
    } catch (error) {
      console.error(
        "Error al cargar usuarios:",
        error
      );

      if (error.response?.status === 401) {
        setError(
          "La sesión expiró. Volvé a iniciar sesión."
        );
      } else if (error.response?.status === 403) {
        setError(
          "No tenés permisos para consultar los usuarios."
        );
      } else {
        setError(
          "No se pudieron cargar los usuarios."
        );
      }
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const seleccionarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usuarioSeleccionado) {
      setError(
        "Seleccioná un usuario de la lista."
      );
      return;
    }

    if (!sectorId) {
      setError(
        "No se encontró el sector seleccionado."
      );
      return;
    }

    try {
      setGuardando(true);
      setError("");

      await onSave?.(usuarioSeleccionado);
    } catch (error) {
      console.error(
        "Error al guardar miembro:",
        error
      );

      setError(
        "No se pudo asignar el usuario al sector."
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleOverlay = (e) => {
    if (
      e.target === e.currentTarget &&
      !guardando
    ) {
      onClose();
    }
  };

  return (
    <div
      className="asm-overlay"
      onClick={handleOverlay}
    >
      <div
        className="asm-modal asm-member-modal"
        role="dialog"
        aria-modal="true"
      >
        <div className="asm-header">
          <div>
            <span className="asm-kicker">
              {isEditing
                ? "CAMBIAR MIEMBRO"
                : "MIEMBRO EXISTENTE"}
            </span>

            <h2>
              {isEditing
                ? "Cambiar usuario"
                : "Agregar miembro"}
            </h2>
          </div>

          <button
            type="button"
            className="asm-close"
            onClick={onClose}
            disabled={guardando}
          >
            <FiX />
          </button>
        </div>

        <form
          className="asm-form"
          onSubmit={handleSubmit}
        >
          <div className="asm-field">
            <label htmlFor="buscar-usuario">
              Buscar usuario
            </label>

            <div className="asm-search">
              <FiSearch />

              <input
                id="buscar-usuario"
                type="search"
                placeholder="Buscar por nombre o email"
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(e.target.value)
                }
                disabled={
                  cargando || guardando
                }
              />
            </div>
          </div>

          {error && (
            <p className="asm-error">
              <FiAlertCircle />
              {error}
            </p>
          )}

          <div className="asm-users-list">
            {cargando ? (
              <p className="asm-users-empty">
                Cargando usuarios...
              </p>
            ) : usuariosFiltrados.length === 0 ? (
              <p className="asm-users-empty">
                No hay usuarios disponibles.
              </p>
            ) : (
              usuariosFiltrados.map((usuario) => {
                const seleccionado =
                  usuarioSeleccionado?._id ===
                  usuario._id;

                return (
                  <button
                    key={usuario._id}
                    type="button"
                    className={
                      seleccionado
                        ? "asm-user-option asm-user-option-selected"
                        : "asm-user-option"
                    }
                    onClick={() =>
                      seleccionarUsuario(
                        usuario
                      )
                    }
                    disabled={guardando}
                  >
                    <span className="asm-user-avatar">
                      {obtenerIniciales(
                        usuario.name
                      )}
                    </span>

                    <span className="asm-user-info">
                      <strong>
                        {usuario.name ||
                          "Sin nombre"}
                      </strong>

                      <small>
                        {usuario.email ||
                          "Sin email"}
                      </small>
                    </span>

                    {seleccionado && (
                      <span className="asm-user-check">
                        <FiCheck />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {usuarioSeleccionado && (
            <div className="asm-selected-user">
              <FiUserPlus />

              <div>
                <strong>
                  {usuarioSeleccionado.name}
                </strong>

                <span>
                  {usuarioSeleccionado.email}
                </span>
              </div>
            </div>
          )}

          <div className="asm-footer">
            <button
              type="button"
              className="asm-button asm-button-cancel"
              onClick={onClose}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="asm-button asm-button-save"
              disabled={
                !usuarioSeleccionado ||
                guardando
              }
            >
              {guardando
                ? "Guardando..."
                : isEditing
                ? "Cambiar miembro"
                : "Asignar miembro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}