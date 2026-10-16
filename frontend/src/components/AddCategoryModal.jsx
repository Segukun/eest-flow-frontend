import { useState } from "react";
import { useApp } from "../context/AppContext";
import "../styles/components/category-modal.css";

const PRESET_COLORS = [
  "var(--color-green)",
  "var(--color-orange)",
  "var(--color-terracotta)",
  "var(--color-graphite)",
  "var(--color-bone)",
];

// Roles de cuenta (user.accountType): "admin" | "collaborator"
const ROL_ADMIN = "admin";
const MSG_SOLO_ADMIN =
  "No puedes agregar categorías porque tu cuenta no es de administrador.";

export default function AddCategoryModal({ onClose }) {
  const { addCategory, sectors, currentUser } = useApp();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState(null);
  const [sectorMode, setSectorMode] = useState("all");
  const [selectedSectorIds, setSelectedSectorIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Solo los administradores pueden agregar categorías
  const isAdmin = currentUser?.accountType === ROL_ADMIN;

  // Si no es admin, el mensaje se muestra apenas se abre el modal
  const shownError = !isAdmin ? MSG_SOLO_ADMIN : error;

  const finalColor = customColor || color;

  const toggleSector = (sectorId) =>
    setSelectedSectorIds((prev) =>
      prev.includes(sectorId) ? prev.filter((x) => x !== sectorId) : [...prev, sectorId]
    );

  const handleSubmit = async () => {
    // Defensa extra: un colaborador nunca llega a enviar la petición
    if (!isAdmin) {
      setError(MSG_SOLO_ADMIN);
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) return;

    // "Todos" se traduce a mandar TODOS los sectores que existen HOY,
    // porque Category.sectors exige un array de ObjectIds reales,
    // nunca un string "all"
    const sectorIds = sectorMode === "all" ? sectors.map((s) => s.id) : selectedSectorIds;

    if (sectorIds.length === 0) {
      setError("Elegí al menos un sector, o seleccioná \"Todos\".");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await addCategory({ name: trimmed, color: finalColor, sectors: sectorIds });
      onClose();
    } catch (err) {
      // 403 = el backend rechazó el permiso (en vez de mostrar "Forbidden")
      if (err?.response?.status === 403) {
        setError(MSG_SOLO_ADMIN);
      } else {
        setError(err?.response?.data?.message || "No se pudo crear la categoría.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="category-modal" onClick={(e) => e.stopPropagation()}>
        <header className="category-modal__head">
          <div>
            <h2>Agregar Categoría</h2>
            <p>Organiza tus documentos por colores y sectores</p>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </header>

        <div className="category-modal__body">
          <label className="field">
            <span className="field__label">
              Nombre <span className="category-modal__name-dot" style={{ background: finalColor }} />
            </span>
            <input
              className="input"
              placeholder="Ej: Matrícula y Legajo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin}
              autoFocus
            />
          </label>

          <div className="field">
            <span className="field__label">Color</span>
            <div className="category-modal__colors">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={"category-modal__swatch" + (!customColor && color === c ? " is-selected" : "")}
                  style={{ background: c }}
                  onClick={() => { setColor(c); setCustomColor(null); }}
                >
                  {!customColor && color === c && <span className="category-modal__swatch-check">✓</span>}
                </button>
              ))}

              <label
                className={"category-modal__swatch category-modal__swatch--add" + (customColor ? " is-selected" : "")}
                style={customColor ? { background: customColor } : undefined}
              >
                {customColor ? <span className="category-modal__swatch-check">✓</span> : "+"}
                <input type="color" className="category-modal__color-input" onChange={(e) => setCustomColor(e.target.value)} />
              </label>
            </div>
          </div>

          <div className="field">
            <span className="field__label">Sectores autorizados</span>
            <div className="category-modal__sector-toggle">
              <button
                type="button"
                className={"category-modal__sector-btn" + (sectorMode === "all" ? " is-on" : "")}
                onClick={() => setSectorMode("all")}
              >
                ☰ Todos {sectorMode === "all" && "✓"}
              </button>
              <button
                type="button"
                className={"category-modal__sector-btn category-modal__sector-btn--outline" + (sectorMode === "custom" ? " is-on" : "")}
                onClick={() => setSectorMode("custom")}
              >
                Elegir sectores
              </button>
            </div>

            {sectorMode === "custom" && (
              <div className="category-modal__sector-list">
                {sectors.length === 0 ? (
                  <p className="actions-modal__empty-hint">No hay sectores creados todavía.</p>
                ) : (
                  sectors.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      className={"pill pill--outline" + (selectedSectorIds.includes(s.id) ? " pill--outline-on" : "")}
                      onClick={() => toggleSector(s.id)}
                    >
                      <span className="pill__dot" style={{ background: s.color }} />
                      {s.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {shownError && <p className="label-creator__error">{shownError}</p>}
        </div>

        <footer className="category-modal__foot">
          <button className="link-btn" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn--primary"
            onClick={handleSubmit}
            disabled={!isAdmin || !name.trim() || submitting}
          >
            {submitting ? "Agregando…" : "Agregar"}
          </button>
        </footer>
      </div>
    </div>
  );
}