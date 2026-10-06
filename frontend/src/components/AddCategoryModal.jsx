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

export default function AddCategoryModal({ onClose }) {
  const { addCategory, sectors } = useApp();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState(null);
  const [sectorMode, setSectorMode] = useState("all"); // "all" | "custom"
  const [selectedSectors, setSelectedSectors] = useState([]);

  const finalColor = customColor || color;

  const toggleSector = (s) =>
    setSelectedSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addCategory({
      name: trimmed,
      color: finalColor,
      sectors: sectorMode === "all" ? "all" : selectedSectors,
    });
    onClose();
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
                <input
                  type="color"
                  className="category-modal__color-input"
                  onChange={(e) => setCustomColor(e.target.value)}
                />
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
                {sectors.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={"pill pill--outline" + (selectedSectors.includes(s) ? " pill--outline-on" : "")}
                    onClick={() => toggleSector(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="category-modal__foot">
          <button className="link-btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={!name.trim()}>
            Agregar
          </button>
        </footer>
      </div>
    </div>
  );
}