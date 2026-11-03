import { useEffect, useState, useRef } from "react";
import { readableAccent } from "../theme";
import { FiX, FiPlus, FiAlertCircle } from "react-icons/fi";
import "../styles/components/AgregarSectorModal.css";

const COLORES = [
  { id: "#05903E", label: "Verde" },
  { id: "#FF880F", label: "Naranja" },
  { id: "#DC9655", label: "Terracota" },
  { id: "#1F151C", label: "Grafito" },
];

export default function AgregarSectorModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
}) {
  const isEditing = !!initialData;
  const wheelRef = useRef(null);

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    color: "#05903E",
  });
  const [errors, setErrors] = useState({});
  const [showWheel, setShowWheel] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }
    if (initialData) {
      setForm({
        nombre: initialData.nombre || "",
        descripcion: initialData.descripcion || "",
        color: initialData.color || "#05903E",
      });
    } else {
      setForm({ nombre: "", descripcion: "", color: "#05903E" });
    }
    setErrors({});
    setShowWheel(false);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const nuevosErrores = {};
    if (!form.nombre.trim()) nuevosErrores.nombre = "El nombre es obligatorio.";
    else if (form.nombre.trim().length < 3) nuevosErrores.nombre = "El nombre debe tener al menos 3 caracteres.";
    if (form.descripcion.trim().length > 500) nuevosErrores.descripcion = "La descripción no puede superar los 500 caracteres.";
    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave?.({
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      color: form.color,
    });
  };

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // --- WHEEL: color exacto ---
  const angleToHex = (hue) => {
    const h = hue / 360;
    const s = 0.85;
    const l = 0.55;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  };

  const getHueFromPoint = (clientX, clientY) => {
    if (!wheelRef.current) return 0;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI; // -180 a 180, 0 = derecha
    angle = (angle + 90 + 360) % 360; // 0 = arriba (rojo)
    return angle;
  };

  const handleWheelDown = (e) => {
    e.preventDefault();
    const getXY = (ev) =>
      ev.touches ? { x: ev.touches[0].clientX, y: ev.touches[0].clientY } : { x: ev.clientX, y: ev.clientY };

    let { x, y } = getXY(e);
    setForm(prev => ({ ...prev, color: angleToHex(getHueFromPoint(x, y)) }));

    const move = (ev) => {
      const { x, y } = getXY(ev);
      setForm(prev => ({ ...prev, color: angleToHex(getHueFromPoint(x, y)) }));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
  };

  let accent = "#05903E";
  try { accent = readableAccent(form.color); } catch { accent = "#1F151C"; }
  const isCustom = !COLORES.some(c => c.id.toLowerCase() === form.color.toLowerCase());

  return (
    <div className="asm-overlay" onClick={handleOverlay}>
      <div className="asm-modal" role="dialog" aria-modal="true">
        <div className="asm-header">
          <div>
            <span className="asm-kicker">{isEditing ? "MODIFICAR" : "NUEVO SECTOR"}</span>
            <h2>{isEditing ? "Editar sector" : "Agregar sector"}</h2>
          </div>
          <button type="button" className="asm-close" onClick={onClose}><FiX /></button>
        </div>

        <form className="asm-form" onSubmit={handleSubmit} noValidate>
          <div className="asm-field">
            <label htmlFor="sector-nombre">Nombre</label>
            <input id="sector-nombre" name="nombre" type="text" placeholder="Ej. Secretaría" value={form.nombre} onChange={handleChange} autoComplete="off" />
            {errors.nombre && <p className="asm-error"><FiAlertCircle />{errors.nombre}</p>}
          </div>

          <div className="asm-field">
            <label htmlFor="sector-descripcion">Descripción</label>
            <textarea id="sector-descripcion" name="descripcion" placeholder="Descripción del sector" value={form.descripcion} onChange={handleChange} rows={4} maxLength={500} />
            {errors.descripcion && <p className="asm-error"><FiAlertCircle />{errors.descripcion}</p>}
          </div>

          <div className="asm-field">
            <label>Color</label>
            <div className="asm-colors">
              {COLORES.map((color) => (
                <button key={color.id} type="button"
                  className={form.color.toLowerCase() === color.id.toLowerCase() ? "asm-color asm-color-selected" : "asm-color"}
                  onClick={() => { setForm((prev) => ({ ...prev, color: color.id })); setShowWheel(false); }}
                  title={color.label}>
                  <span className="asm-color-circle" style={{ backgroundColor: color.id }} />
                </button>
              ))}
              <button type="button" className={isCustom ? "asm-color asm-color-selected" : "asm-color asm-color-custom"}
                onClick={() => setShowWheel(!showWheel)} title={isCustom ? form.color : "Personalizar"}>
                {isCustom ? <span className="asm-color-circle" style={{ backgroundColor: form.color }} /> : <FiPlus />}
              </button>
            </div>

            {showWheel && (
              <div className="asm-wheel-wrap">
                <div ref={wheelRef} className="asm-wheel" onMouseDown={handleWheelDown} onTouchStart={handleWheelDown}>
                  <div className="asm-wheel-center" style={{ backgroundColor: form.color }} />
                </div>
                <div className="asm-wheel-controls">
                  <input type="color" value={form.color} onChange={(e) => setForm(p => ({ ...p, color: e.target.value.toUpperCase() }))} className="asm-native-color" />
                  <input type="text" value={form.color} readOnly className="asm-hex-input" />
                </div>
              </div>
            )}
          </div>

          <div className="asm-preview">
            <span className="asm-preview-icon" style={{ backgroundColor: `${form.color}20`, color: accent, borderColor: accent }}><FiPlus /></span>
            <div><strong>{form.nombre || "Nombre del sector"}</strong><span>{form.descripcion || "Sin descripción"}</span></div>
          </div>

          <div className="asm-footer">
            <button type="button" className="asm-button asm-button-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="asm-button asm-button-save">{isEditing ? "Guardar cambios" : "Agregar sector"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}