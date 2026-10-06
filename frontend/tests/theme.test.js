import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { getTheme, initializeTheme, setTheme, subscribeToTheme, THEME_STORAGE_KEY } from "../src/theme.js";

let storage;
let stopSync;
beforeEach(() => {
  storage = new Map();
  globalThis.window = new EventTarget();
  globalThis.document = { documentElement: { dataset: {} } };
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
});
afterEach(() => {
  stopSync?.();
  stopSync = undefined;
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.localStorage;
});

test("restores dark before rendering, persists light, and notifies mounted controls", () => {
  storage.set(THEME_STORAGE_KEY, "oscuro");
  stopSync = initializeTheme();
  assert.equal(getTheme(), "oscuro");
  let notifications = 0;
  const unsubscribe = subscribeToTheme(() => notifications++);
  setTheme("claro");
  assert.equal(getTheme(), "claro");
  assert.equal(storage.get(THEME_STORAGE_KEY), "claro");
  assert.equal(notifications, 1);
  unsubscribe();
  setTheme("oscuro");
  assert.equal(notifications, 1);
});

test("storage restrictions do not prevent switching themes", () => {
  localStorage.getItem = () => { throw new Error("blocked"); };
  localStorage.setItem = () => { throw new Error("blocked"); };
  stopSync = initializeTheme();
  assert.equal(getTheme(), "claro");
  assert.doesNotThrow(() => setTheme("oscuro"));
  assert.equal(getTheme(), "oscuro");
});

test("other tabs update the document even while settings is closed", () => {
  stopSync = initializeTheme();
  const change = (key, newValue) => {
    const event = new Event("storage");
    Object.assign(event, { key, newValue });
    window.dispatchEvent(event);
  };
  change(THEME_STORAGE_KEY, "oscuro");
  assert.equal(getTheme(), "oscuro");
  change("unrelated-preference", "claro");
  assert.equal(getTheme(), "oscuro");
  change(null, null);
  assert.equal(getTheme(), "claro");
  change(THEME_STORAGE_KEY, "invalid");
  assert.equal(getTheme(), "claro");
});

test("the early bootstrap handles saved, invalid, missing and blocked storage", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  for (const value of ["oscuro", "claro", "invalid", null]) {
    localStorage.getItem = () => value;
    runInNewContext(bootstrap, { document, localStorage });
    assert.equal(getTheme(), value === "oscuro" ? "oscuro" : "claro");
  }
  localStorage.getItem = () => { throw new Error("blocked"); };
  assert.doesNotThrow(() => runInNewContext(bootstrap, { document, localStorage }));
  assert.equal(getTheme(), "claro");
});
