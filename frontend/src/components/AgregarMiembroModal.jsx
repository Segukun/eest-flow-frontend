import { useState, useEffect } from "react";
import { FiX, FiUserPlus, FiAlertCircle } from "react-icons/fi";
import "../styles/components/AgregarSectorModal.css";

const COLORES = ["#05903E", "#FF880F", "#DC9655", "#1F151C"];

export default function AgregarMiembroModal({ isOpen, onClose, onSave, initialData = null }) {
  const isEditing = !!initialData;
  const [form, setForm] = useState({ nombre: "", materia: "", color: "#05903E" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({ nombre: initialData.nombre, materia: initialData.materia || "", color: initialData.color });
      } else {
        setForm({ nombre: "", materia: "", color: "#05903E" });
      }
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => (document.body.style.overflow = "");
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || form.nombre.trim().length < 3) {
      setError("Mínimo 3 caracteres");
      return;
    }
    onSave(form);
    onClose();
  };

  return (
    <div className="asm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="asm-modal" style={{ maxWidth: 440 }}>
        <div className="asm-header">
          <div className="asm-header-left">
            <div className="asm-icon" style={{ background: `${form.color}15`, color: form.color }}><FiUserPlus /></div>
            <div>
              <h2>{isEditing ? "Editar miembro" : "Agregar miembro"}</h2>
              <p>Asigná una persona a este sector</p>
            </div>
          </div>
          <button className="asm-close" onClick={onClose}><FiX /></button>
        </div>

        <form className="asm-form" onSubmit={handleSubmit}>
          <div className="asm-field">
            <label>Nombre completo *</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Juan Pérez" />
            {error && <span className="asm-error"><FiAlertCircle /> {error}</span>}
          </div>

          <div className="asm-field">
            <label>Materia / Rol <span className="asm-optional">(opcional)</span></label>
            <input value={form.materia} onChange={(e) => setForm({ ...form, materia: e.target.value })} placeholder="Ej: Matemática, Preceptor..." />
          </div>

          <div className="asm-field">
            <label>Color avatar</label>
            <div className="asm-colors">
              {COLORES.map(c => (
                <button key={c} type="button" className={`asm-color ${form.color === c ? "asm-color--active" : ""}`} style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />
              ))}
            </div>
          </div>

          <div className="asm-footer">
            <button type="button" className="asm-btn asm-btn--secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="asm-btn asm-btn--primary"><FiUserPlus /> {isEditing ? "Guardar" : "Agregar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}