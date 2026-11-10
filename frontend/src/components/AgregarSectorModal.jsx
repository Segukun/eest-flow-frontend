import { useEffect, useState } from "react";
import ColorPresetPicker from "./ColorPresetPicker";
import CharacterCounter from "./CharacterCounter";
import { SECTOR_DESCRIPTION_MAX_LENGTH } from "../formLimits.js";
import { DEFAULT_COLOR, colorChipStyle } from "../colorPresets.js";
import { FiX, FiPlus, FiAlertCircle } from "react-icons/fi";
import "../styles/components/AgregarSectorModal.css";

export default function AgregarSectorModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
}) {
  const isEditing = !!initialData;

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    color: DEFAULT_COLOR,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }
    if (initialData) {
      setForm({
        nombre: initialData.nombre || "",
        descripcion: initialData.descripcion || "",
        color: initialData.color || DEFAULT_COLOR,
      });
    } else {
      setForm({ nombre: "", descripcion: "", color: DEFAULT_COLOR });
    }
    setErrors({});
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
    if (form.descripcion.trim().length > SECTOR_DESCRIPTION_MAX_LENGTH) nuevosErrores.descripcion = `La descripción no puede superar los ${SECTOR_DESCRIPTION_MAX_LENGTH} caracteres.`;
    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    try {
      await onSave?.({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        color: form.color,
      });
    } catch (error) {
      setErrors((prev) => ({ ...prev, submit: error.message || "No se pudo guardar el sector." }));
    } finally {
      setSaving(false);
    }
  };

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget && !saving) onClose();
  };

  return (
    <div className="asm-overlay" onClick={handleOverlay}>
      <div className="asm-modal asm-sector-modal" role="dialog" aria-modal="true">
        <div className="asm-header">
          <div>
            <span className="asm-kicker">{isEditing ? "MODIFICAR" : "NUEVO SECTOR"}</span>
            <h2>{isEditing ? "Editar sector" : "Agregar sector"}</h2>
          </div>
          <button type="button" className="asm-close" onClick={onClose} disabled={saving}><FiX /></button>
        </div>

        <form className="asm-form" onSubmit={handleSubmit} noValidate>
          <div className="asm-field">
            <label htmlFor="sector-nombre">Nombre</label>
            <input id="sector-nombre" name="nombre" type="text" placeholder="Ej. Secretaría" value={form.nombre} onChange={handleChange} autoComplete="off" />
            {errors.nombre && <p className="asm-error"><FiAlertCircle />{errors.nombre}</p>}
          </div>

          <div className="asm-field">
            <label htmlFor="sector-descripcion">Descripción</label>
            <textarea id="sector-descripcion" name="descripcion" placeholder="Descripción del sector" value={form.descripcion} onChange={handleChange} rows={4} maxLength={SECTOR_DESCRIPTION_MAX_LENGTH} aria-describedby="sector-description-counter" />
            <CharacterCounter id="sector-description-counter" value={form.descripcion} maxLength={SECTOR_DESCRIPTION_MAX_LENGTH} />
            {errors.descripcion && <p className="asm-error"><FiAlertCircle />{errors.descripcion}</p>}
          </div>

          <div className="asm-field">
            <label>Color</label>
            <ColorPresetPicker
              value={form.color}
              onChange={(color) => setForm((prev) => ({ ...prev, color }))}
              currentColor={initialData?.color}
            />
          </div>

          <div className="asm-preview">
            <span className="asm-preview-icon" style={colorChipStyle(form.color)}><FiPlus /></span>
            <div><strong>{form.nombre || "Nombre del sector"}</strong><span>{form.descripcion || "Sin descripción"}</span></div>
          </div>

          {errors.submit && <p className="asm-error" role="alert"><FiAlertCircle />{errors.submit}</p>}
          <div className="asm-footer">
            <button type="button" className="asm-button asm-button-cancel" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="asm-button asm-button-save" disabled={saving}>{saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Agregar sector"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
