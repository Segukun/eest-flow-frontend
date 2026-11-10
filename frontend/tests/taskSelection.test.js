import test from "node:test";
import assert from "node:assert/strict";
import { toggleTaskSelection, retainTaskSelection, applyTaskMove, executeTaskBatch } from "../src/taskSelection.js";

const tasks = [
  { id: "a", title: "A", categoryId: "one", column: "pending", order: 0 },
  { id: "b", title: "B", categoryId: "one", column: "in_progress", order: 0 },
  { id: "c", title: "C", categoryId: "one", column: "review", order: 0 },
  { id: "d", title: "D", categoryId: "two", column: "review", order: 7 },
];

test("selecciona, agrega y deselecciona sin mutar el Set original", () => {
  const empty = new Set();
  const one = toggleTaskSelection(empty, "a");
  const two = toggleTaskSelection(one, "b");
  assert.deepEqual([...toggleTaskSelection(two, "a")], ["b"]);
  assert.equal(empty.size, 0);
  assert.deepEqual([...one], ["a"]);
});

test("descarta selección de tareas que dejaron de estar disponibles", () => {
  assert.deepEqual([...retainTaskSelection(new Set(["a", "deleted"]), tasks)], ["a"]);
  assert.equal(retainTaskSelection(new Set(["a"]), []).size, 0);
});

test("mover entre columnas conserva todas las tareas, orden y otras categorías", () => {
  const moved = applyTaskMove(applyTaskMove(tasks, "a", "review"), "b", "review");
  assert.deepEqual(moved.filter(t => t.categoryId === "one").sort((a,b) => a.order-b.order).map(t => t.id), ["c", "a", "b"]);
  assert.equal(new Set(moved.map(t => t.id)).size, tasks.length);
  assert.equal(moved.find(t => t.id === "d"), tasks[3]);
  assert.equal(tasks[0].column, "pending");
});

test("el movimiento individual sigue insertando antes de una tarea", () => {
  const moved = applyTaskMove(tasks, "a", "review", "c");
  assert.equal(moved.find(t => t.id === "a").order, 0);
  assert.equal(moved.find(t => t.id === "c").order, 1);
  assert.equal(applyTaskMove(tasks, "a", "pending", "a"), tasks);
});

test("el lote es secuencial, deduplica IDs y omite tareas en el destino", async () => {
  const calls = []; let pending = 0;
  const result = await executeTaskBatch({ ids: ["a", "c", "b", "a"], tasks, action: "move", destination: "review",
    move: async (id, destination) => { assert.equal(pending++, 0); await Promise.resolve(); calls.push([id,destination]); pending--; } });
  assert.deepEqual(calls, [["a","review"],["b","review"]]);
  assert.deepEqual(result, { succeeded: ["a","b"], failed: [], skipped: ["c"] });
});

test("archiva todas con la operación individual y expone los fallos parciales", async () => {
  const calls = [];
  const result = await executeTaskBatch({ ids: ["a", "b", "c"], tasks, action: "archive",
    archive: async id => { calls.push(id); if(id === "b") throw new Error("Sin conexión"); } });
  assert.deepEqual(calls, ["a","b","c"]);
  assert.deepEqual(result.succeeded, ["a","c"]);
  assert.deepEqual(result.failed, [{id:"b",title:"B",message:"Sin conexión"}]);
});

test("un lote fallido no informa éxitos y conserva los IDs para reintentar", async () => {
  const result = await executeTaskBatch({ ids: ["a", "b"], tasks, action: "move", destination: "review",
    move: async () => { throw {response:{data:{message:"No disponible"}}}; } });
  assert.equal(result.succeeded.length, 0);
  assert.deepEqual(result.failed.map(f => f.id), ["a","b"]);
});
