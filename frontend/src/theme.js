export const THEME_STORAGE_KEY = "eest-flow-theme";
const THEME_EVENT = "eest-flow-theme-change";

const normalizeTheme = (theme) => theme === "oscuro" ? "oscuro" : "claro";

export function getTheme() {
  return normalizeTheme(document.documentElement.dataset.theme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = normalizeTheme(theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function setTheme(theme) {
  const next = normalizeTheme(theme);
  applyTheme(next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // El selector sigue funcionando si el navegador bloquea el almacenamiento.
  }
}

export function initializeTheme() {
  try {
    applyTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    applyTheme(getTheme());
  }
  const onStorage = (event) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      applyTheme(event.newValue);
    }
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export function subscribeToTheme(onChange) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

// Mantiene los colores elegidos para etiquetas/sectores y eleva su contraste
// sobre superficies oscuras. No altera muestras de color ni avatares.
export function readableAccent(color) {
  return `color-mix(in srgb, ${color} var(--theme-accent-weight, 100%), #fff9ed)`;
}

export function avatarStyle(color) {
  const value = color.toLowerCase();
  const warm = ["#ff880f", "#dc9655", "var(--color-orange)", "var(--color-terracotta)"].includes(value);
  const green = ["#05903e", "var(--color-green)"].includes(value);
  return {
    background: green ? `var(--theme-green-fill, ${color})` : color,
    color: warm ? "var(--theme-on-warm, #ffffff)" : "#ffffff",
  };
}
