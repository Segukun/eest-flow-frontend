export const COLOR_PRESETS = [
  { id: "green", value: "#05903E", label: "Verde" },
  { id: "sage", value: "#72A57A", label: "Salvia" },
  { id: "olive", value: "#899447", label: "Oliva" },
  { id: "yellow", value: "#D4B44C", label: "Amarillo" },
  { id: "orange", value: "#E89A45", label: "Naranja" },
  { id: "terracotta", value: "#DC9655", label: "Terracota" },
  { id: "coral", value: "#D87965", label: "Coral" },
  { id: "red", value: "#BD5357", label: "Rojo" },
  { id: "pink", value: "#CB7EAA", label: "Rosa" },
  { id: "magenta", value: "#AC5D91", label: "Magenta" },
  { id: "purple", value: "#8864BC", label: "Violeta" },
  { id: "lavender", value: "#A295C7", label: "Lavanda" },
  { id: "blue", value: "#5688C7", label: "Azul" },
  { id: "indigo", value: "#5E70AF", label: "Índigo" },
  { id: "teal", value: "#4A9B9B", label: "Turquesa" },
  { id: "cyan", value: "#65A9BE", label: "Celeste" },
  { id: "slate", value: "#7D8996", label: "Pizarra" },
  { id: "brown", value: "#9B7A62", label: "Tierra" },
];

export const DEFAULT_COLOR = COLOR_PRESETS[0].value;

export const isPresetColor = (value) =>
  COLOR_PRESETS.some((preset) => preset.value.toLowerCase() === value?.toLowerCase());

// Se conserva el valor original: abrir un registro legacy no normaliza sus datos.
export function colorOptions(currentColor) {
  return currentColor && !isPresetColor(currentColor)
    ? [...COLOR_PRESETS, { id: "current", value: currentColor, label: "Color actual" }]
    : COLOR_PRESETS;
}

export function getContrastText(color) {
  let value = color || DEFAULT_COLOR;
  const variable = /^var\((--[\w-]+)\)$/.exec(value);
  if (variable && typeof document !== "undefined") {
    value = getComputedStyle(document.documentElement).getPropertyValue(variable[1]).trim();
  }
  if (/^#[\da-f]{3,4}$/i.test(value)) {
    value = "#" + [...value.slice(1)].map((digit) => digit + digit).join("");
  }
  if (!/^#[\da-f]{6}([\da-f]{2})?$/i.test(value)) return "#000000";
  const rgb = [1, 3, 5].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
  const linear = rgb.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? "#000000" : "#ffffff";
}

// El mismo HEX da identidad al borde y al fondo; el texto usa el tema activo.
export const colorChipStyle = (color = DEFAULT_COLOR) => ({
  color: "var(--theme-text, var(--color-graphite))",
  background: `color-mix(in srgb, ${color} 14%, var(--theme-surface, var(--color-white)))`,
  border: `1px solid ${color}`,
});
