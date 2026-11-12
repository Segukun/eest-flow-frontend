import assert from "node:assert/strict";
import { test } from "node:test";
import { forumPageNumbers, loadForumPage } from "../src/forumPagination.js";

test("pocas páginas muestran todos los números, sin controles ficticios", () => {
  for (const total of [0, 1, 2, 3, 5]) {
    assert.deepEqual(forumPageNumbers(1, total), Array.from({ length: total }, (_, i) => i + 1));
  }
});

test("20 y 100 páginas mantienen primera, última y vecinas sin una fila enorme", () => {
  for (const total of [20, 100]) {
    for (let current = 1; current <= total; current += 1) {
      const pages = forumPageNumbers(current, total);
      const numbers = pages.filter(Number.isInteger);
      assert.ok(pages.length <= 7);
      assert.equal(numbers[0], 1);
      assert.equal(numbers.at(-1), total);
      assert.ok(numbers.includes(current));
      assert.equal(new Set(numbers).size, numbers.length);
      assert.deepEqual(numbers, [...numbers].sort((a, b) => a - b));
    }
  }
  assert.deepEqual(forumPageNumbers(10, 20), [1, "…", 9, 10, 11, "…", 20]);
});

const response = (page, totalPages, posts = []) => ({
  data: { posts, pagination: { page, limit: 10, total: totalPages * 10, totalPages } },
});

test("consulta únicamente la página pedida con búsqueda, límite y señal de cancelación", async () => {
  const signal = new AbortController().signal;
  const expected = response(2, 5, [{ _id: "post-20" }]);
  const data = await loadForumPage(async (options) => {
    assert.deepEqual(options, { page: 2, limit: 10, search: "taller", signal });
    return expected;
  }, { page: 2, search: "taller", signal });
  assert.deepEqual(data, expected.data);
});

test("una página eliminada se corrige consultando el último número válido", async () => {
  const requests = [];
  const data = await loadForumPage(async ({ page, search }) => {
    requests.push(page);
    assert.equal(search, "texto");
    return response(page, 4);
  }, { page: 5, search: "texto" });
  assert.deepEqual(requests, [5, 4]);
  assert.equal(data.pagination.page, 4);
});

test("sin resultados vuelve a página 1 y conserva totalPages=0 del servidor", async () => {
  const requests = [];
  const data = await loadForumPage(async ({ page }) => {
    requests.push(page);
    return response(page, 0);
  }, { page: 3 });
  assert.deepEqual(requests, [3, 1]);
  assert.equal(data.pagination.totalPages, 0);
});

test("errores y cancelaciones se propagan para conservar la página anterior y permitir reintentar", async () => {
  for (const error of [new Error("API"), new DOMException("Cancelado", "AbortError")]) {
    await assert.rejects(loadForumPage(async () => { throw error; }, { page: 2 }), (actual) => actual === error);
  }
});

test("no inventa paginación si falta el contrato real ni reintenta indefinidamente", async () => {
  await assert.rejects(loadForumPage(async () => ({ data: { posts: [] } }), { page: 1 }), /paginación válida/);
  let count = 0;
  await assert.rejects(loadForumPage(async ({ page }) => {
    count += 1;
    return response(page, page - 1);
  }, { page: 10 }), /cambiaron durante la carga/);
  assert.equal(count, 3);
});
