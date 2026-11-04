import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_TASK_TITLE_LENGTH, taskDraftKey, updateTaskDrafts } from "../src/taskDrafts.js";

test("conserva textos exactos e independientes por categoría y estado Kanban", () => {
  let drafts = updateTaskDrafts({}, "c1", "pending", "  Revisar certificados\nmañana  ");
  drafts = updateTaskDrafts(drafts, "c1", "in_progress", "Llamar proveedores");
  drafts = updateTaskDrafts(drafts, "c2", "pending", "Otra categoría");
  assert.equal(drafts[taskDraftKey("c1", "pending")], "  Revisar certificados\nmañana  ");
  assert.equal(drafts[taskDraftKey("c1", "in_progress")], "Llamar proveedores");
  assert.equal(drafts[taskDraftKey("c2", "pending")], "Otra categoría");
});

test("limita los borradores a 100 y permite contar 100, 99 y 0 restantes", () => {
  for (const [value, remaining] of [["", 100], ["a", 99], ["a".repeat(100), 0], ["a".repeat(101), 0]]) {
    const drafts = updateTaskDrafts({}, "c1", "pending", value);
    const title = drafts[taskDraftKey("c1", "pending")] ?? "";
    assert.equal(MAX_TASK_TITLE_LENGTH - title.length, remaining);
    assert.ok(title.length <= 100);
  }
});

test("limpiar un borrador solo elimina el de esa categoría y columna", () => {
  let drafts = updateTaskDrafts({}, "c1", "pending", "Guardar");
  drafts = updateTaskDrafts(drafts, "c1", "review", "Mantener");
  const previous = drafts;
  drafts = updateTaskDrafts(drafts, "c1", "pending", "");
  assert.deepEqual(drafts, { [taskDraftKey("c1", "review")]: "Mantener" });
  assert.equal(previous[taskDraftKey("c1", "pending")], "Guardar");
});

test("no agrega borradores vacíos ni sin categoría", () => {
  const drafts = {};
  assert.equal(updateTaskDrafts(drafts, "c1", "pending", ""), drafts);
  assert.equal(updateTaskDrafts(drafts, null, "pending", "Texto"), drafts);
});
