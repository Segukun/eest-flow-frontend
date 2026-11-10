
import { useEffect, useRef, useState } from "react";

import {
  FiCamera,
  FiTrash2,
} from "react-icons/fi";

import api from "../api";
import { useApp } from "../context/AppContext";

import {
  MAX_CONTRASENIA,
  validarContrasenia,
} from "../services/passwordRecovery.js";

import UserAvatar from "./layout/UserAvatar.jsx";
import ProfilePictureEditorModal from "./ProfilePictureEditorModal.jsx";

import "../styles/components/MiPerfil.css";

const USERS_URL = "/api/users";
const AUTH_URL = "/api/auth";

const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024;

const ALLOWED_PROFILE_PICTURE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const ALLOWED_PROFILE_PICTURE_EXTENSIONS =
  /\.(jpe?g|png|webp)$/i;

export const MiPerfil = ({ onClose }) => {
  const {
    currentUser,
    updateCurrentUser,
    uploadUserProfilePicture,
    deleteUserProfilePicture,
  } = useApp();

  const userId = currentUser?.id;

  const fileInputRef = useRef(null);

  const [nombre, setNombre] = useState(
    currentUser?.name ?? "",
  );

  const [email, setEmail] = useState(
    currentUser?.email ?? "",
  );

  const [original, setOriginal] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
  });

  const [passwordActual, setPasswordActual] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [eliminandoImagen, setEliminandoImagen] = useState(false);

  const [imagenPendiente, setImagenPendiente] = useState(null);

  const [errorFoto, setErrorFoto] = useState("");
  const [mensajeFoto, setMensajeFoto] = useState("");

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const bloqueado =
    cargando ||
    guardando ||
    subiendoImagen ||
    eliminandoImagen;

  const tieneFoto = Boolean(
    currentUser?.profilePicture?.path ||
    currentUser?.profilePicture?.url,
  );

  /* ---------- cargar perfil ---------- */

  useEffect(() => {
    if (!userId) {
      setError(
        "No se encontró la sesión. Volvé a iniciar sesión.",
      );

      setCargando(false);
      return;
    }

    let cancelado = false;

    api
      .get(`${USERS_URL}/${userId}`)
      .then(({ data }) => {
        if (cancelado) return;

        setNombre(data.name);
        setEmail(data.email);

        setOriginal({
          name: data.name,
          email: data.email,
        });

        // Sincronizar usuario global y foto de perfil.
        updateCurrentUser(data);
      })
      .catch((err) => {
        if (cancelado) return;

        setError(
          err?.response?.data?.message ||
            "No se pudieron cargar los datos del perfil.",
        );
      })
      .finally(() => {
        if (!cancelado) {
          setCargando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [userId]);

  /* ---------- seleccionar fotografía ---------- */

  const manejarSeleccionImagen = (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    // Permitir seleccionar nuevamente el mismo archivo.
    input.value = "";

    if (!file) return;

    setErrorFoto("");
    setMensajeFoto("");

    setError("");
    setMensaje("");

    const formatoValido =
      ALLOWED_PROFILE_PICTURE_TYPES.includes(file.type) ||
      ALLOWED_PROFILE_PICTURE_EXTENSIONS.test(file.name);

    if (!formatoValido) {
      setErrorFoto(
        "Formato no permitido. Utilizá JPG, PNG o WebP.",
      );

      return;
    }

    if (file.size > MAX_PROFILE_PICTURE_SIZE) {
      setErrorFoto(
        "La imagen no puede superar los 5 MB.",
      );

      return;
    }

    // Todavía no se sube. Primero pasa al editor.
    setImagenPendiente(file);
  };

  /* ---------- confirmar fotografía recortada ---------- */

  const manejarConfirmacionImagen = async (croppedFile) => {
    if (!userId) {
      throw new Error(
        "No se encontró la sesión. Volvé a iniciar sesión.",
      );
    }

    setErrorFoto("");
    setMensajeFoto("");
    setSubiendoImagen(true);

    try {
      // El backend recibe exclusivamente el archivo recortado.
      await uploadUserProfilePicture(userId, croppedFile);

      setMensajeFoto(
        "Foto de perfil actualizada correctamente.",
      );

      return true;
    } catch (err) {
      // Se propaga para que el editor muestre el error internamente.
      throw new Error(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo actualizar la imagen de perfil.",
      );
    } finally {
      setSubiendoImagen(false);
    }
  };

  /* ---------- eliminar fotografía ---------- */

  const manejarEliminarImagen = async () => {
    if (!tieneFoto || !userId || eliminandoImagen) {
      return;
    }

    setErrorFoto("");
    setMensajeFoto("");
    setEliminandoImagen(true);

    try {
      await deleteUserProfilePicture(userId);

      setMensajeFoto(
        "Foto de perfil eliminada correctamente.",
      );
    } catch (err) {
      setErrorFoto(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo eliminar la imagen de perfil.",
      );
    } finally {
      setEliminandoImagen(false);
    }
  };

  /* ---------- guardar perfil ---------- */

  const guardarPerfil = async () => {
    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim().toLowerCase();

    if (!nombreLimpio) {
      return setError(
        "El nombre no puede estar vacío.",
      );
    }

    if (nombreLimpio.length > 30) {
      return setError(
        "El nombre puede tener como máximo 30 caracteres.",
      );
    }

    if (!emailLimpio) {
      return setError(
        "El email no puede estar vacío.",
      );
    }

    if (emailLimpio.length > 50) {
      return setError(
        "El email puede tener como máximo 50 caracteres.",
      );
    }

    const quiereCambiarPassword =
      passwordActual.length > 0 ||
      nuevaPassword.length > 0 ||
      confirmarPassword.length > 0;

    if (quiereCambiarPassword) {
      if (!passwordActual) {
        return setError(
          "Ingresá tu contraseña actual.",
        );
      }

      if (!nuevaPassword) {
        return setError(
          "Ingresá una nueva contraseña.",
        );
      }

      if (!confirmarPassword) {
        return setError(
          "Confirmá la nueva contraseña.",
        );
      }

      const errorPassword = validarContrasenia(
        nuevaPassword,
        confirmarPassword,
      );

      if (errorPassword) {
        return setError(errorPassword);
      }
    }

    // Solo enviar los campos que cambiaron.
    const payload = {};

    if (nombreLimpio !== original.name) {
      payload.name = nombreLimpio;
    }

    if (emailLimpio !== original.email) {
      payload.email = emailLimpio;
    }

    if (
      Object.keys(payload).length === 0 &&
      !quiereCambiarPassword
    ) {
      return setMensaje(
        "No hay cambios para guardar.",
      );
    }

    setGuardando(true);

    try {
      // 1. Actualizar nombre y email.
      if (Object.keys(payload).length > 0) {
        try {
          const { data } = await api.put(
            `${USERS_URL}/${userId}`,
            payload,
          );

          setNombre(data.name);
          setEmail(data.email);

          setOriginal({
            name: data.name,
            email: data.email,
          });

          updateCurrentUser(data);
        } catch (err) {
          if (err?.response?.status === 409) {
            setError("Ese email ya está en uso.");
          } else {
            setError(
              err?.response?.data?.message ||
                "No se pudo actualizar el perfil.",
            );
          }

          return;
        }
      }

      // 2. Cambiar contraseña.
      if (quiereCambiarPassword) {
        try {
          await api.post(
            `${AUTH_URL}/change-password`,
            {
              currentPassword: passwordActual,
              newPassword: nuevaPassword,
            },
          );

          setPasswordActual("");
          setNuevaPassword("");
          setConfirmarPassword("");
        } catch (err) {
          setError(
            err?.response?.data?.message ||
              "No se pudo cambiar la contraseña.",
          );

          return;
        }
      }

      setMensaje(
        "Perfil actualizado correctamente.",
      );
    } finally {
      setGuardando(false);
    }
  };

  /* ---------- enviar formulario ---------- */

  const manejarSubmit = (event) => {
    event.preventDefault();

    setError("");
    setMensaje("");

    guardarPerfil();
  };

  /* ---------- render ---------- */

  return (
    <>
      <div
        className="perfil-modal-overlay"
        onClick={onClose}
      >
        <div
          className="perfil-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="perfil-titulo"
          onClick={(event) => event.stopPropagation()}
        >
          {/* ENCABEZADO */}

          <div className="perfil-modal-header">
            <div>
              <h2 id="perfil-titulo">
                Editar perfil
              </h2>

              <p>
                Actualizá la información de tu cuenta.
              </p>
            </div>

            <button
              type="button"
              className="perfil-modal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          {/* FORMULARIO */}

          <form
            className="perfil-modal-form"
            onSubmit={manejarSubmit}
          >
            {/* FOTOGRAFÍA DE PERFIL */}

            <section className="perfil-foto">
              <UserAvatar
                user={currentUser}
                className="avatar perfil-foto__avatar"
                title={currentUser?.name || "Tu perfil"}
              />

              <div className="perfil-foto__contenido">
                <strong>
                  Foto de perfil
                </strong>

                <p>
                  Personalizá tu cuenta con una fotografía.
                </p>

                <div className="perfil-foto__acciones">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="perfil-foto__input"
                    onChange={manejarSeleccionImagen}
                    disabled={bloqueado}
                    aria-label="Seleccionar foto de perfil"
                  />

                  <button
                    type="button"
                    className="perfil-btn guardar"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={bloqueado}
                  >
                    <FiCamera aria-hidden="true" />

                    {subiendoImagen
                      ? "Subiendo..."
                      : tieneFoto
                        ? "Cambiar foto"
                        : "Subir foto"}
                  </button>

                  {tieneFoto && (
                    <button
                      type="button"
                      className="perfil-btn cancelar perfil-foto__eliminar"
                      onClick={manejarEliminarImagen}
                      disabled={bloqueado}
                    >
                      <FiTrash2 aria-hidden="true" />

                      {eliminandoImagen
                        ? "Eliminando..."
                        : "Quitar foto"}
                    </button>
                  )}
                </div>

                <small>
                  JPG, PNG o WebP. Tamaño máximo: 5 MB.
                </small>

                {/* Errores y confirmaciones de fotografía */}

                {errorFoto && (
                  <p
                    className="perfil-mensaje error perfil-foto__mensaje"
                    role="alert"
                  >
                    {errorFoto}
                  </p>
                )}

                {mensajeFoto && (
                  <p
                    className="perfil-mensaje success perfil-foto__mensaje"
                    role="status"
                  >
                    {mensajeFoto}
                  </p>
                )}
              </div>
            </section>

            {/* NOMBRE */}

            <div className="perfil-campo">
              <label htmlFor="nombre">
                Nombre
              </label>

              <input
                id="nombre"
                type="text"
                value={nombre}
                maxLength={30}
                disabled={bloqueado}
                onChange={(event) =>
                  setNombre(event.target.value)
                }
              />
            </div>

            {/* EMAIL */}

            <div className="perfil-campo">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                maxLength={50}
                disabled={bloqueado}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
              />
            </div>

            {/* CONTRASEÑA ACTUAL */}

            <div className="perfil-campo">
              <label htmlFor="passwordActual">
                Contraseña actual
              </label>

              <input
                id="passwordActual"
                type="password"
                autoComplete="current-password"
                maxLength={MAX_CONTRASENIA}
                placeholder="Ingresá tu contraseña actual"
                value={passwordActual}
                disabled={bloqueado}
                onChange={(event) =>
                  setPasswordActual(event.target.value)
                }
              />

              <small>
                Solo es necesaria para cambiar tu contraseña.
              </small>
            </div>

            {/* NUEVA CONTRASEÑA */}

            <div className="perfil-campo">
              <label htmlFor="nuevaPassword">
                Nueva contraseña
              </label>

              <input
                id="nuevaPassword"
                type="password"
                autoComplete="new-password"
                maxLength={MAX_CONTRASENIA}
                placeholder="Ingresá una nueva contraseña"
                value={nuevaPassword}
                disabled={bloqueado}
                onChange={(event) =>
                  setNuevaPassword(event.target.value)
                }
              />

              <small>
                Entre 6 y 64 caracteres. Dejá vacío si no querés cambiarla.
              </small>
            </div>

            {/* CONFIRMAR CONTRASEÑA */}

            <div className="perfil-campo">
              <label htmlFor="confirmarPassword">
                Confirmar nueva contraseña
              </label>

              <input
                id="confirmarPassword"
                type="password"
                autoComplete="new-password"
                maxLength={MAX_CONTRASENIA}
                placeholder="Repetí la nueva contraseña"
                value={confirmarPassword}
                disabled={bloqueado}
                onChange={(event) =>
                  setConfirmarPassword(event.target.value)
                }
              />
            </div>

            {/* MENSAJES GENERALES */}

            {error && (
              <p
                className="perfil-mensaje error"
                role="alert"
              >
                {error}
              </p>
            )}

            {mensaje && (
              <p
                className="perfil-mensaje success"
                role="status"
              >
                {mensaje}
              </p>
            )}

            {/* ACCIONES */}

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
                {guardando
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* EDITOR DE FOTOGRAFÍA */}

      {imagenPendiente && (
        <ProfilePictureEditorModal
          file={imagenPendiente}
          user={currentUser}
          uploading={subiendoImagen}
          onClose={() => setImagenPendiente(null)}
          onConfirm={manejarConfirmacionImagen}
        />
      )}
    </>
  );
};

export default MiPerfil;
