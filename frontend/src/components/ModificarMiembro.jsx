import { useEffect, useState } from "react";
import api from "../api.js";
import { useApp } from "../context/AppContext";
import "../styles/components/ModificarMiembro.css";

const obtenerIdsSectores = (sectores) => {
  if (!Array.isArray(sectores)) return [];

  return sectores
    .map((sector) => {
      if (typeof sector === "string") return sector;
      return sector?._id || sector?.id || "";
    })
    .filter(Boolean)
    .map(String);
};

const obtenerTipoCuenta = (miembro) => {
  if (miembro.accountType === "admin" || miembro.accountType === "collaborator") {
    return miembro.accountType;
  }

  return miembro.cuenta?.toLowerCase() === "admin" ? "admin" : "collaborator";
};

const ModificarMiembro = ({ miembro, onClose, onActualizado }) => {
  const { currentUser: usuarioActual } = useApp();
  const esAdminActual = usuarioActual?.accountType === "admin";
  const idUsuarioActual = usuarioActual?._id || usuarioActual?.id;
  const esMismoUsuario = String(idUsuarioActual || "") === String(miembro.id || miembro._id || "");
  const tipoCuentaOriginal = obtenerTipoCuenta(miembro);

  const [formulario, setFormulario] = useState({
    nombre: miembro.nombre || miembro.name || "",
    rol: tipoCuentaOriginal,
    email: miembro.correo || miembro.email || "",
    sectors: obtenerIdsSectores(miembro.sectors),
  });
  const [sectores, setSectores] = useState([]);
  const [cargandoSectores, setCargandoSectores] = useState(true);
  const [errorSectores, setErrorSectores] = useState("");
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [errorServidor, setErrorServidor] = useState("");
  const [cambioRolNoPermitido, setCambioRolNoPermitido] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargarSectores = async () => {
      try {
        setCargandoSectores(true);
        setErrorSectores("");
        const response = await api.get("/api/sectors");
        if (activo) {
          setSectores(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error("Error al cargar sectores:", error);
        if (activo) {
          setErrorSectores(
            error.response?.status === 401
              ? "Tu sesión expiró. Volvé a iniciar sesión."
              : "No se pudieron cargar los sectores. Intentá nuevamente."
          );
        }
      } finally {
        if (activo) setCargandoSectores(false);
      }
    };

    cargarSectores();
    return () => {
      activo = false;
    };
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => ({ ...prev, [name]: "" }));
    setMensaje("");
    setErrorServidor("");
    setCambioRolNoPermitido(false);
  };

  const seleccionarRol = (rol) => {
    if (!esAdminActual && rol !== tipoCuentaOriginal) {
      if (esMismoUsuario && tipoCuentaOriginal === "collaborator" && rol === "admin") {
        setErrorServidor(
          "No podés cambiar tu propia cuenta de Colaborador a Administrador. Solo una cuenta Administrativa puede asignar ese tipo de cuenta."
        );
      } else {
        setErrorServidor("Solo una cuenta Administrativa puede cambiar el tipo de cuenta.");
      }
      setCambioRolNoPermitido(true);
      setMensaje("");
      return;
    }

    setFormulario((prev) => ({ ...prev, rol }));
    setErrores((prev) => ({ ...prev, rol: "" }));
    setMensaje("");
    setErrorServidor("");
    setCambioRolNoPermitido(false);
  };

  const alternarSector = (sectorId) => {
    if (!esAdminActual) {
      setErrorServidor("Solo una cuenta Administrativa puede modificar los sectores de un miembro.");
      return;
    }

    setFormulario((prev) => {
      const seleccionado = prev.sectors.includes(sectorId);
      return {
        ...prev,
        sectors: seleccionado
          ? prev.sectors.filter((id) => id !== sectorId)
          : [...prev.sectors, sectorId],
      };
    });

    setErrores((prev) => ({ ...prev, sectors: "" }));
    setMensaje("");
    setErrorServidor("");
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    const nombreValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre = "El nombre no puede quedar vacío.";
    } else if (!nombreValido.test(formulario.nombre.trim())) {
      nuevosErrores.nombre = "El nombre solo puede contener letras.";
    }

    if (!formulario.email.trim()) {
      nuevosErrores.email = "El email no puede quedar vacío.";
    } else if (!emailValido.test(formulario.email.trim())) {
      nuevosErrores.email = "Ingresá un email válido.";
    }

    if (!formulario.rol) {
      nuevosErrores.rol = "Debés seleccionar un tipo de cuenta.";
    }

    if (esAdminActual && formulario.sectors.length === 0) {
      nuevosErrores.sectors = "El miembro debe pertenecer al menos a un sector.";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (cambioRolNoPermitido) {
      setErrorServidor(
        esMismoUsuario && tipoCuentaOriginal === "collaborator"
          ? "No podés cambiar tu propia cuenta de Colaborador a Administrador. Solo una cuenta Administrativa puede asignar ese tipo de cuenta."
          : "Solo una cuenta Administrativa puede cambiar el tipo de cuenta."
      );
      return;
    }

    setErrorServidor("");

    if (!esAdminActual && formulario.rol !== tipoCuentaOriginal) {
      setErrorServidor(
        esMismoUsuario && tipoCuentaOriginal === "collaborator" && formulario.rol === "admin"
          ? "No podés cambiar tu propia cuenta de Colaborador a Administrador. Solo una cuenta Administrativa puede asignar ese tipo de cuenta."
          : "Solo una cuenta Administrativa puede cambiar el tipo de cuenta."
      );
      return;
    }

    if (!esAdminActual && JSON.stringify([...formulario.sectors].sort()) !== JSON.stringify([...obtenerIdsSectores(miembro.sectors)].sort())) {
      setErrorServidor("Solo una cuenta Administrativa puede modificar los sectores de un miembro.");
      return;
    }

    if (!validarFormulario()) return;

    try {
      setGuardando(true);
      const datos = {
        name: formulario.nombre.trim(),
        email: formulario.email.trim(),
      };

      if (esAdminActual) {
        datos.accountType = formulario.rol;
        datos.sectors = formulario.sectors;
      }

      const response = await api.put(`/api/users/${miembro.id || miembro._id}`, datos);
      const usuarioGuardado = response.data;

      if (esAdminActual && usuarioGuardado?.accountType !== formulario.rol) {
        setErrorServidor("El servidor no confirmó el cambio del tipo de cuenta. No se marcaron los cambios como guardados.");
        return;
      }

      if (esAdminActual) {
        const sectoresGuardados = obtenerIdsSectores(usuarioGuardado?.sectors);
        const sectoresEsperados = [...formulario.sectors].map(String).sort();
        if (JSON.stringify(sectoresGuardados.sort()) !== JSON.stringify(sectoresEsperados)) {
          setErrorServidor("El servidor no confirmó los sectores seleccionados. Revisá los cambios e intentá nuevamente.");
          return;
        }
      }

      setMensaje("Miembro modificado correctamente.");
      if (onActualizado) await onActualizado();
    } catch (error) {
      console.error("Error al modificar miembro:", error);
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;

      if (status === 400) {
        setErrorServidor(serverMessage || "Hay datos inválidos.");
      } else if (status === 401) {
        setErrorServidor("Tu sesión expiró. Volvé a iniciar sesión.");
      } else if (status === 403) {
        setErrorServidor("No tenés permisos para modificar este miembro o sus permisos.");
      } else if (status === 404) {
        setErrorServidor("No se encontró el miembro.");
      } else if (status === 409) {
        setErrorServidor("El correo electrónico ya se encuentra registrado.");
      } else if (status === 500) {
        setErrorServidor("Ocurrió un error interno del servidor.");
      } else if (error.request) {
        setErrorServidor("No se pudo conectar con el servidor.");
      } else {
        setErrorServidor(serverMessage || "Ocurrió un error al modificar el miembro.");
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modificar-modal-overlay" onClick={onClose}>
      <div className="modificar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modificar-modal-header">
          <h2>MODIFICAR MIEMBRO</h2>
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

        <form className="modificar-modal-form" onSubmit={manejarSubmit} noValidate>
          <div className="modificar-campo">
            <label htmlFor="modificar-nombre">Nombre</label>
            <input
              id="modificar-nombre"
              name="nombre"
              type="text"
              value={formulario.nombre}
              onChange={manejarCambio}
              disabled={guardando}
            />
            {errores.nombre && <p className="modificar-error">{errores.nombre}</p>}
          </div>

          <div className="modificar-campo">
            <label>Sectores</label>
            {cargandoSectores ? (
              <p className="modificar-ayuda">Cargando sectores...</p>
            ) : errorSectores ? (
              <p className="modificar-error">{errorSectores}</p>
            ) : sectores.length === 0 ? (
              <p className="modificar-ayuda">No hay sectores disponibles.</p>
            ) : (
              <div className="modificar-sectores-list">
                {sectores.map((sector) => {
                  const id = String(sector._id || sector.id);
                  return (
                    <label className="modificar-sector-option" key={id}>
                      <input
                        type="checkbox"
                        checked={formulario.sectors.includes(id)}
                        onChange={() => alternarSector(id)}
                        disabled={guardando || !esAdminActual}
                      />
                      <span>{sector.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {!esAdminActual && (
              <small className="modificar-ayuda">Solo una cuenta Administrativa puede modificar los sectores.</small>
            )}
            {errores.sectors && <p className="modificar-error">{errores.sectors}</p>}
          </div>

          <div className="modificar-campo">
            <label>Tipo de cuenta</label>
            <div className="modificar-roles">
              <button
                type="button"
                className={formulario.rol === "collaborator" ? "modificar-rol-btn rol-seleccionado" : "modificar-rol-btn"}
                onClick={() => seleccionarRol("collaborator")}
                disabled={guardando}
              >
                Colaborador
              </button>
              <button
                type="button"
                className={formulario.rol === "admin" ? "modificar-rol-btn rol-seleccionado" : "modificar-rol-btn"}
                onClick={() => seleccionarRol("admin")}
                disabled={guardando}
              >
                Administrador
              </button>
            </div>
            {!esAdminActual && (
              <small className="modificar-ayuda">No podés cambiar el tipo de tu cuenta. Esta operación solo puede realizarla una cuenta Administrativa.</small>
            )}
            {errores.rol && <p className="modificar-error">{errores.rol}</p>}
          </div>

          <div className="modificar-campo">
            <label htmlFor="modificar-email">Email</label>
            <input
              id="modificar-email"
              name="email"
              type="email"
              value={formulario.email}
              onChange={manejarCambio}
              disabled={guardando}
            />
            {errores.email && <p className="modificar-error">{errores.email}</p>}
          </div>

          {errorServidor && <p className="modificar-error modificar-mensaje-error">{errorServidor}</p>}
          {mensaje && <p className="modificar-exito">{mensaje}</p>}

          <div className="modificar-modal-actions">
            <button type="button" className="modificar-btn cancelar" onClick={onClose} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="modificar-btn guardar" disabled={guardando || cargandoSectores || Boolean(errorSectores)}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModificarMiembro;
