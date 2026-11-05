import { colorOptions, getContrastText } from "../colorPresets.js";
import "../styles/components/color-preset-picker.css";

export default function ColorPresetPicker({ value, onChange, currentColor, disabled = false }) {
  return (
    <div className="color-preset-grid" role="group" aria-label="Seleccionar color">
      {colorOptions(currentColor).map((preset) => {
        const selected = value?.toLowerCase() === preset.value.toLowerCase();
        return (
          <button
            key={preset.id}
            type="button"
            className={`color-preset${selected ? " color-preset--selected" : ""}${preset.id === "current" ? " color-preset--current" : ""}`}
            style={{ background: preset.value, color: getContrastText(preset.value) }}
            onClick={() => onChange(preset.value)}
            disabled={disabled}
            aria-label={`Seleccionar color ${preset.label.toLowerCase()}`}
            aria-pressed={selected}
            title={`${preset.label} (${preset.value})`}
          >
            {preset.id === "current" && <span className="color-preset__legacy">Color actual</span>}
            {selected && <span className="color-preset__check" aria-hidden="true">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
