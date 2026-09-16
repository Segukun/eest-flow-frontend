// Mock de datos "provenientes de la BD"

export const PRIORITIES = {
  critica: { id: "critica", label: "Crítica", color: "#ff5a1f" },
  alta:    { id: "alta",    label: "Alta",    color: "var(--color-orange)" },
  media:   { id: "media",   label: "Media",   color: "var(--color-terracotta)" },
  baja:    { id: "baja",    label: "Baja",    color: "#9aa0a6" },
};

export const COLUMNS = [
  { id: "pendiente", title: "Pendiente", dot: "var(--color-orange)" },
  { id: "en_curso",  title: "En curso",  dot: "var(--color-green)" },
  { id: "revision",  title: "En revisión", dot: "var(--color-terracotta)" },
  { id: "terminado", title: "Terminado", dot: "#9aa0a6" },
];

export const SECTORS = [
  "Taller Electromecánica",
  "Taller Automotores",
  "Preceptoría",
  "Secretaría",
  "Dirección",
];

export const USERS = [
  { id: "u1", name: "Juan Smoes",    initials: "JD", color: "var(--color-terracotta)", sector: "Taller Electromecánica", role: "Docente Admin" },
  { id: "u2", name: "Ana Álvarez",   initials: "AA", color: "var(--color-graphite)",   sector: "Secretaría",  role: "Secretaria" },
  { id: "u3", name: "Martín Ruiz",   initials: "MR", color: "var(--color-green)",      sector: "Preceptoría", role: "Preceptor" },
  { id: "u4", name: "Julia Lema",    initials: "JL", color: "var(--color-graphite)",   sector: "Dirección",   role: "Directiva" },
  { id: "u5", name: "Sofía Castro",  initials: "SC", color: "var(--color-green)",      sector: "Secretaría",  role: "Administrativa" },
  { id: "u6", name: "Karen Mendez",  initials: "KM", color: "var(--color-orange)",     sector: "Preceptoría", role: "Preceptora" },
];

export const CURRENT_USER_ID = "u1";

export const CATEGORIES = [
  { id: "asistencia", name: "Control de asistencia",    color: "var(--color-green)" },
  { id: "documentacion", name: "Documentación académica", color: "var(--color-orange)" },
  { id: "legajo", name: "Matrícula y Legajo",           color: "var(--color-terracotta)" },
  { id: "personal", name: "Administración personal",    color: "#6c4ae0" },
  { id: "taller", name: "Talleres y mantenimiento",     color: "#1f9fb8" },
];

export const LABEL_COLORS = {
  EDUCACIÓN: "var(--color-green)",
  ADMINISTRACIÓN: "var(--color-orange)",
  LEGAJO: "var(--color-terracotta)",
  URGENTE: "var(--color-graphite)",
  PERSONAL: "var(--color-orange)",
  DOCUMENTACIÓN: "var(--color-terracotta)",
  PETICIÓN: "var(--color-terracotta)",
  CONSULTA: "#6c4ae0",
  REVISIÓN: "var(--color-orange)",
  TALLER: "#1f9fb8",
};

export const ALL_LABELS = Object.keys(LABEL_COLORS);

export const TASKS = [
  { id: "t1", categoryId: "asistencia", column: "pendiente", title: "Actualizar planillas de asistencia Marzo", priority: "alta", labels: ["EDUCACIÓN", "ADMINISTRACIÓN"], members: ["u2", "u3"], sector: "Secretaría", dueDate: "2026-09-18" },
  { id: "t2", categoryId: "asistencia", column: "pendiente", title: "Revisar asistencias Marzo - 3ro B", priority: "media", labels: ["LEGAJO"], members: ["u4", "u5", "u6"], sector: "Preceptoría", dueDate: "2026-09-23" },
  { id: "t3", categoryId: "asistencia", column: "pendiente", title: "Cargar licencias docentes pendientes", priority: "critica", labels: ["URGENTE", "PERSONAL"], members: ["u2"], sector: "Dirección", dueDate: "2026-09-16" },
  { id: "t4", categoryId: "asistencia", column: "pendiente", title: "Validar documentación de ingreso", priority: "baja", labels: ["DOCUMENTACIÓN"], members: ["u3", "u4"], sector: "Secretaría", dueDate: "2026-09-30" },
  { id: "t5", categoryId: "asistencia", column: "en_curso", title: "Sistematizar inasistencias 2do trimestre", priority: "alta", labels: ["EDUCACIÓN"], members: ["u5", "u2"], sector: "Secretaría", dueDate: "2026-09-17" },
  { id: "t6", categoryId: "asistencia", column: "en_curso", title: "Control de puntualidad preceptores", priority: "media", labels: ["ADMINISTRACIÓN", "REVISIÓN"], members: ["u6", "u4"], sector: "Preceptoría", dueDate: "2026-09-25" },
  { id: "t7", categoryId: "asistencia", column: "en_curso", title: "Entrevista familias - seguimiento", priority: "baja", labels: ["PERSONAL"], members: ["u3"], sector: "Dirección", dueDate: "2026-10-02" },
  { id: "t8", categoryId: "asistencia", column: "terminado", title: "Cierre de asistencia Febrero", priority: "media", labels: ["EDUCACIÓN"], members: ["u1"], sector: "Taller Electromecánica", dueDate: "2026-09-10" },

  { id: "t9",  categoryId: "documentacion", column: "pendiente", title: "Cargar notas al sistema SIE", priority: "alta", labels: ["PETICIÓN"], members: ["u1", "u5"], sector: "Taller Electromecánica", dueDate: "2026-09-17" },
  { id: "t10", categoryId: "documentacion", column: "pendiente", title: "Definir fecha de mesa de examen", priority: "baja", labels: ["CONSULTA"], members: ["u4"], sector: "Dirección", dueDate: "2026-09-27" },
  { id: "t11", categoryId: "documentacion", column: "revision", title: "Revisar informe de taller mecánico", priority: "critica", labels: ["URGENTE", "TALLER"], members: ["u1"], sector: "Taller Electromecánica", dueDate: "2026-09-16" },

  { id: "t12", categoryId: "legajo", column: "pendiente", title: "Digitalizar legajos 1er año", priority: "media", labels: ["LEGAJO", "DOCUMENTACIÓN"], members: ["u5"], sector: "Secretaría", dueDate: "2026-09-29" },
  { id: "t13", categoryId: "legajo", column: "en_curso", title: "Actualizar matrícula 2026", priority: "alta", labels: ["ADMINISTRACIÓN"], members: ["u2", "u4"], sector: "Secretaría", dueDate: "2026-09-18" },

  { id: "t14", categoryId: "personal", column: "pendiente", title: "Planilla de horas extra septiembre", priority: "alta", labels: ["PERSONAL"], members: ["u1"], sector: "Taller Electromecánica", dueDate: "2026-09-17" },
  { id: "t15", categoryId: "personal", column: "terminado", title: "Alta de nuevo preceptor", priority: "baja", labels: ["PERSONAL"], members: ["u6"], sector: "Preceptoría", dueDate: "2026-09-05" },

  { id: "t16", categoryId: "taller", column: "en_curso", title: "Mantenimiento torno CNC", priority: "critica", labels: ["TALLER", "URGENTE"], members: ["u1"], sector: "Taller Electromecánica", dueDate: "2026-09-16" },
  { id: "t17", categoryId: "taller", column: "revision", title: "Pedido de insumos electromecánica", priority: "media", labels: ["TALLER"], members: ["u1", "u3"], sector: "Taller Electromecánica", dueDate: "2026-09-22" },
];