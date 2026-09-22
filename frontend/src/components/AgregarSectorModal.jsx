import { useState, useEffect } from "react";
import { FiX, FiPlus, FiAlertCircle } from "react-icons/fi";
import "../styles/components/AgregarSectorModal.css";

const CATEGORIAS = [
  "SECTOR ACADÉMICO",
  "ASISTENCIA Y CONTROL",
  "ADMINISTRACIÓN Y FINANZAS",
  "MODERNIZACIÓN Y LEGAJO",
  "DIRECCIÓN",
];

const COLORES = [
  { id: "#05903E", label: "Verde" },
  { id: "#FF880F", label: "Naranja" },
  { id: "#DC9655", label: "Terracota" },
  { id: "#1F151C", label: "Grafito" },
];

export default function AgregarSectorModal({ isOpen, onClose, onSave, initialData = null }) {
  const isEditing = !!initialData;
  const [form, setForm] = useState({
    nombre: "",
    categoria: CATEGORIAS[0],
    descripcion: "",
    color: "#05903E",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          nombre: initialData.nombre,
          categoria: initialData.categoria,
          descripcion: initialData.descripcion || "",
          color: initialData.color,
        });
      } else {
        setForm({ nombre: "", categoria: CATEGORIAS[0], descripcion: "", color: "#05903E" });
      }
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => (document.body.style.overflow = "");
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    else if (form.nombre.trim().length < 3) e.nombre = "Mínimo 3 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    onSave?.(form);
    onClose();
  };

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="asm-overlay" onClick={handleOverlay}>
      <div className="asm-modal" role="dialog" aria-modal="true">
        <div className="asm-header">
          <div className="asm-header-left">
            <div className="asm-icon" style={{ background: `${form.color}15`, color: form.color }}>
              <FiPlus />
            </div>
            <div>
              <h2>{isEditing ? "Editar sector" : "Agregar nuevo sector"}</h2>
              <p>{isEditing ? "Modificá los datos del sector" : "Creá un área para organizar roles"}</p>
            </div>
          </div>
          <button className="asm-close" onClick={onClose}><FiX /></button>
        </div>

        <form className="asm-form" onSubmit={handleSubmit}>
          <div className="asm-field">
            <label>Nombre del sector <span className="asm-required">*</span></label>
            <input
              type="text"
              placeholder="Ej: PROFESORES, PRECEPTORÍA..."
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value.toUpperCase() })}
              className={errors.nombre ? "asm-input--error" : ""}
            />
            {errors.nombre && <span className="asm-error"><FiAlertCircle /> {errors.nombre}</span>}
          </div>

          <div className="asm-row">
            <div className="asm-field">
              <label>Categoría <span className="asm-required">*</span></label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIAS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="asm-field">
              <label>Color del sector</label>
              <div className="asm-colors">
                {COLORES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`asm-color ${form.color === c.id ? "asm-color--active" : ""}`}
                    style={{ background: c.id }}
                    onClick={() => setForm({ ...form, color: c.id })}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="asm-field">
            <label>Descripción <span className="asm-optional">(opcional)</span></label>
            <textarea rows={3} placeholder="Breve descripción..." value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>

          <div className="asm-preview">
            <span className="asm-preview-label">Vista previa</span>
            <div className="asm-preview-card">
              <div className="asm-preview-icon" style={{ borderColor: form.color, color: form.color }}><FiPlus /></div>
              <div>
                <span className="asm-preview-cat" style={{ color: form.color }}>{form.categoria}</span>
                <h4>{form.nombre || "NOMBRE DEL SECTOR"}</h4>
              </div>
              <span className="asm-preview-badge" style={{ background: `${form.color}15`, color: form.color }}>0 Miembros</span>
            </div>
          </div>

          <div className="asm-footer">
            <button type="button" className="asm-btn asm-btn--secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="asm-btn asm-btn--primary"><FiPlus /> {isEditing ? "Guardar cambios" : "Crear sector"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
