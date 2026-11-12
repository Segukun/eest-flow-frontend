import {
  FiUsers,
  FiClipboard,
  FiDollarSign,
  FiUserPlus,
} from "react-icons/fi";

const ICONOS = {
  FiUsers,
  FiClipboard,
  FiDollarSign,
  FiUserPlus,
};

export const obtenerIcono = (nombre) =>
  ICONOS[nombre] || FiUsers;

export const obtenerIniciales = (nombre = "") =>
  nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((parte) => parte[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

export const readableAccent = (color) => {
  if (!color) return "#05903E";

  const hex = color.replace("#", "");

  if (hex.length !== 6) return color;

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminosidad =
    (r * 299 + g * 587 + b * 114) / 1000;

  return luminosidad > 150 ? "#1F151C" : color;
};

export const avatarStyle = (color) => ({
  background: `${color || "#05903E"}20`,
  color: `var(--theme-green-text, ${readableAccent(color)})`,
  border: `1px solid var(--theme-green-text, ${color || "#05903E"})`,
});

export const obtenerId = (elemento) =>
  String(
    elemento?._id ??
    elemento?.id ??
    elemento ??
    ""
  );

export const extraerLista = (data, propiedad) => {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.[propiedad])) {
    return data[propiedad];
  }

  return [];
};

export const convertirMiembro = (
  miembro,
  usuarios = []
) => {
  const id = obtenerId(miembro);

  const usuarioCompleto = usuarios.find(
    (usuario) => obtenerId(usuario) === id
  );

  const nombre =
    miembro.name ||
    miembro.nombre ||
    usuarioCompleto?.name ||
    "";

  const esAdmin =
    (miembro.accountType ||
      usuarioCompleto?.accountType) === "admin";

  const sectoresUsuario = Array.isArray(miembro.sectors)
    ? miembro.sectors
    : usuarioCompleto?.sectors ?? [];

  const sectoresIds = sectoresUsuario
    .map((sector) =>
      typeof sector === "string"
        ? sector
        : sector?._id || sector?.id
    )
    .filter(Boolean)
    .map(String);

  const nombresSectores = sectoresUsuario
    .filter((sector) => typeof sector === "object")
    .map((sector) => sector?.name)
    .filter(Boolean);

  const iniciales = obtenerIniciales(nombre);

  return {
    id,
    nombre,

    name: nombre,
    initials: usuarioCompleto?.initials || iniciales,

    profilePicture:
      usuarioCompleto?.profilePicture ??
      (typeof miembro.profilePicture === "object"
        ? miembro.profilePicture
        : null),

    email:
      miembro.email ||
      usuarioCompleto?.email ||
      "",

    accountType: esAdmin
      ? "admin"
      : "collaborator",

    ini: iniciales,
    color: "#05903E",

    sectors: sectoresIds,
    sectoresNombres: nombresSectores,

    rol: esAdmin
      ? "Administrador"
      : "Colaborador",

    tipoRol: esAdmin ? "direccion" : "",

    cuenta: esAdmin
      ? "Admin"
      : "Colaborador",

    area: nombresSectores.length
      ? nombresSectores.join(", ")
      : "Sin sector asignado",
  };
};

export const convertirSector = (
  sector,
  miembros = [],
  usuarios = []
) => ({
  id: obtenerId(sector),
  nombre: sector.name || "",
  descripcion: sector.description || "",
  color: sector.color || "#05903E",
  icon: obtenerIcono(sector.icon),
  accessMode: sector.accessMode || "public",
  categoryCount: Number(sector.categoryCount || 0),

  miembros: miembros.map((miembro) =>
    convertirMiembro(miembro, usuarios)
  ),
});

export const formatRequestDate = (
  value,
  currentTime = Date.now()
) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const elapsed = currentTime - date.getTime();

  if (elapsed >= 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString("es-AR");
  }

  const minutes = Math.max(
    1,
    Math.floor(elapsed / 60000)
  );

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  return `Hace ${hours} h`;
};