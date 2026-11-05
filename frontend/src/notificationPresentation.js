const CATEGORY_LABELS = {
  system: "Sistema",
  forum: "Foro",
  task: "Tarea",
};

const TYPE_LABELS = {
  post_like: "Me gusta",
  post_comment: "Comentario",
  comment_reply: "Respuesta",
  task_assigned: "Tarea asignada",
  task_updated: "Tarea actualizada",
};

export function notificationPresentation(category, type, read) {
  const knownCategory = Object.hasOwn(CATEGORY_LABELS, category) ? category : "system";
  return {
    label: TYPE_LABELS[type] ?? CATEGORY_LABELS[knownCategory],
    className: `notificacion notification--${knownCategory}${read ? "" : " notification--unread"}`,
  };
}
