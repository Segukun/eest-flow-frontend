// Formato interno / API: "AAAA-MM-DD". Formato en el modal: "DD-MM-AAAA".

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const pad = (n) => String(n).padStart(2, "0");

const isRealDate = (y, m, d) => {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (y < 1000 || y > 9999 || m < 1 || m > 12 || d < 1) return false;
  return d <= new Date(y, m, 0).getDate();
};

export function parseIsoParts(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ""));
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return isRealDate(y, m, d) ? { y, m, d } : null;
}

// "2026-09-01" -> Date en hora LOCAL (evita que se reste un día por UTC)
export function parseLocalDate(value) {
  const p = parseIsoParts(value);
  return p ? new Date(p.y, p.m - 1, p.d) : null;
}

// "2026-09-01" -> "01-09-2026"
export function isoToDisplay(value) {
  const p = parseIsoParts(value);
  return p ? `${pad(p.d)}-${pad(p.m)}-${p.y}` : "";
}

// "01-09-2026" -> "2026-09-01" | null si es inválida o incompleta
export function displayToIso(text) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(text ?? "").trim());
  if (!match) return null;
  const [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return isRealDate(y, m, d) ? `${y}-${pad(m)}-${pad(d)}` : null;
}

// Máscara mientras se escribe
export function maskDisplayInput(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

// "2026-09-01" -> "01 de septiembre del 2026"
export function formatLongDate(value) {
  const p = parseIsoParts(value);
  return p ? `${pad(p.d)} de ${MESES[p.m - 1]} del ${p.y}` : "";
}