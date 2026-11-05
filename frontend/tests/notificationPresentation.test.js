import assert from "node:assert/strict";
import { test } from "node:test";
import { notificationPresentation } from "../src/notificationPresentation.js";

for (const [category, label] of [["system", "Sistema"], ["forum", "Foro"], ["task", "Tarea"]]) {
  test(`${category} conserva su clase y etiqueta al marcar como leída`, () => {
    const read = notificationPresentation(category, "unknown", true);
    const unread = notificationPresentation(category, "unknown", false);
    assert.equal(read.className, `notificacion notification--${category}`);
    assert.equal(unread.className, `${read.className} notification--unread`);
    assert.equal(read.label, label);
    assert.equal(unread.label, label);
  });
}

test("los eventos específicos mantienen su etiqueta y la categoría define el color", () => {
  for (const [category, type, label] of [
    ["forum", "post_like", "Me gusta"],
    ["forum", "post_comment", "Comentario"],
    ["forum", "comment_reply", "Respuesta"],
    ["task", "task_assigned", "Tarea asignada"],
    ["task", "task_updated", "Tarea actualizada"],
  ]) {
    assert.deepEqual(notificationPresentation(category, type, true), {
      className: `notificacion notification--${category}`,
      label,
    });
  }
});

test("unread no se interpreta como categoría", () => {
  assert.deepEqual(notificationPresentation("unread", "unknown", false), {
    className: "notificacion notification--system notification--unread",
    label: "Sistema",
  });
});
