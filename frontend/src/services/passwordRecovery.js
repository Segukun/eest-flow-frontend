import api from "../api.js";

export const LONGITUD_CODIGO = 6;
export const MIN_CONTRASENIA = 6;
export const MAX_CONTRASENIA = 64;

export function validarEmail(email) {
  if (!email) return "Rellene el formulario para enviar el código";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return "Ingrese un email con formato válido, por ejemplo nombre@correo.com";
  }
  return "";
}

export function validarContrasenia(nueva, repetir) {
  if (!nueva || !repetir) return "Rellene ambos formularios";
  if (nueva.length < MIN_CONTRASENIA || nueva.length > MAX_CONTRASENIA) {
    return "La contraseña debe tener entre 6 y 64 caracteres";
  }
  if (nueva !== repetir) return "Ambas contraseñas no coinciden";
  return "";
}

async function solicitar(path, body, signal, campo) {
  const { data } = await api.post(`/api/auth/${path}`, body, {
    signal,
    timeout: 15000,
  });
  if (
    typeof data?.[campo] !== "boolean" ||
    (path === "verify-code" && data.valido &&
      (typeof data.resetToken !== "string" || !data.resetToken.trim())) ||
    (path === "reset-password" && data.ok !== true)
  ) {
    const error = new Error("Respuesta de recuperación inesperada");
    error.code = "INVALID_RECOVERY_RESPONSE";
    throw error;
  }
  return data;
}

export const solicitarCodigoPorEmail = (email, signal) =>
  solicitar("forgot-password", { email }, signal, "existe");

export const reenviarCodigo = (email, signal) =>
  solicitar("resend-code", { email }, signal, "ok");

export const verificarCodigoEnviado = (email, code, signal) =>
  solicitar("verify-code", { email, code }, signal, "valido");

export const guardarNuevaContrasenia = (email, resetToken, newPassword, signal) =>
  solicitar("reset-password", { email, resetToken, newPassword }, signal, "ok");

export const esTokenInvalido = (error) =>
  error.response?.status === 400 &&
  error.response?.data?.message === "Invalid or expired reset token";

// Nunca se muestran ni registran el cuerpo de la petición o errores crudos de Axios.
export function mensajeErrorRecuperacion(error) {
  if (esTokenInvalido(error)) {
    return "La autorización para restablecer la contraseña no es válida o venció. Solicite un nuevo código.";
  }
  if (error.code === "INVALID_RECOVERY_RESPONSE") {
    return "El servidor devolvió una respuesta inesperada. Intente nuevamente.";
  }
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return "La solicitud tardó demasiado. Intente nuevamente.";
  }
  if (!error.response) {
    return "No pudimos conectar con el servidor. Intente nuevamente.";
  }
  if (error.response.status === 400) {
    return "Los datos enviados no son válidos. Revise el formulario.";
  }
  return "No pudimos completar la solicitud. Intente nuevamente más tarde.";
}
