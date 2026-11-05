import assert from "node:assert/strict";
import { test } from "node:test";
import { COLOR_PRESETS, DEFAULT_COLOR, colorOptions, getContrastText, isPresetColor, colorChipStyle } from "../src/colorPresets.js";

const rgb = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
const luminance = (channels) => channels.map((channel) => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);

test("paleta de 12 a 20 HEX estables, únicos y con nombres; verde por defecto", () => {
  assert.ok(COLOR_PRESETS.length >= 12 && COLOR_PRESETS.length <= 20);
  assert.equal(new Set(COLOR_PRESETS.map((p) => p.id)).size, COLOR_PRESETS.length);
  assert.equal(new Set(COLOR_PRESETS.map((p) => p.value)).size, COLOR_PRESETS.length);
  assert.ok(COLOR_PRESETS.every((p) => p.label && /^#[\dA-F]{6}$/.test(p.value)));
  assert.equal(DEFAULT_COLOR, COLOR_PRESETS.find((p) => p.id === "green").value);
  assert.strictEqual(colorOptions(), COLOR_PRESETS);
});

test("el check tiene al menos 4.5:1 de contraste sobre todos los presets", () => {
  for (const { value } of COLOR_PRESETS) {
    assert.ok(contrast(rgb(value), rgb(getContrastText(value))) >= 4.5, value);
  }
  assert.equal(getContrastText("#fff"), "#000000");
  assert.equal(getContrastText("#000"), "#ffffff");
});

test("los chips mantienen contraste de texto en claro y oscuro sin cambiar el HEX", () => {
  const before = JSON.stringify(COLOR_PRESETS);
  for (const { value } of COLOR_PRESETS) {
    for (const [surface, text] of [["#FFFFFF", "#1F151C"], ["#2B2229", "#FFF9ED"]]) {
      const background = rgb(value).map((channel, i) => channel * 0.14 + rgb(surface)[i] * 0.86);
      assert.ok(contrast(background, rgb(text)) >= 4.5, `${value} sobre ${surface}`);
    }
    assert.ok(colorChipStyle(value).background.includes(value));
  }
  assert.equal(JSON.stringify(COLOR_PRESETS), before);
});

test("conserva HEX y variables legacy como opción actual sin mutar la paleta", () => {
  for (const legacy of ["#f0e", "#123456", "var(--color-bone)", "#ffffff80"]) {
    const options = colorOptions(legacy);
    assert.equal(options.length, COLOR_PRESETS.length + 1);
    assert.deepEqual(options.at(-1), { id: "current", value: legacy, label: "Color actual" });
    assert.equal(colorChipStyle(legacy).border, `1px solid ${legacy}`);
  }
  assert.equal(COLOR_PRESETS.length, 18);
});

test("reconoce presets sin depender de mayúsculas y no duplica el color actual", () => {
  for (const { value } of COLOR_PRESETS) {
    assert.equal(isPresetColor(value.toLowerCase()), true);
    assert.strictEqual(colorOptions(value.toLowerCase()), COLOR_PRESETS);
  }
  assert.equal(isPresetColor(undefined), false);
  assert.equal(isPresetColor("#123456"), false);
});
