import { useMemo, useState } from "react";
import { FiSearch, FiCheck } from "react-icons/fi";
import UserAvatar from "./layout/UserAvatar.jsx";
import "../styles/components/option-list-picker.css";

/**
 * options: [{ id, label, subtitle?, color?, user? }]
 *   - color -> punto de color (sectores)
 *   - user  -> avatar de la persona (moderadores)
 * selected: ids seleccionados (strings)
 */
export default function OptionListPicker({
  options,
  selected,
  onChange,
  disabled = false,
  label = "Opciones",
  searchPlaceholder = "Buscar",
  emptyMessage = "No hay opciones disponibles.",
}) {
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return options;

    return options.filter((option) =>
      `${option.label} ${option.subtitle ?? ""}`.toLowerCase().includes(text),
    );
  }, [options, query]);

  const selectedCount = options.filter((option) =>
    selectedSet.has(option.id),
  ).length;

  const allVisibleSelected =
    visible.length > 0 && visible.every((option) => selectedSet.has(option.id));

  const toggle = (id) =>
    onChange(
      selectedSet.has(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    );

  const toggleVisible = () => {
    if (allVisibleSelected) {
      const hidden = new Set(visible.map((option) => option.id));
      onChange(selected.filter((id) => !hidden.has(id)));
    } else {
      onChange([...new Set([...selected, ...visible.map((option) => option.id)])]);
    }
  };

  if (options.length === 0) {
    return (
      <div className="option-picker option-picker--empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="option-picker">
      <div className="option-picker__bar">
        {options.length > 5 && (
          <label className="option-picker__search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={disabled}
            />
          </label>
        )}

        <button
          type="button"
          className="option-picker__all"
          onClick={toggleVisible}
          disabled={disabled || visible.length === 0}
        >
          {allVisibleSelected ? "Quitar todos" : "Seleccionar todos"}
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="option-picker__none">No hay resultados para esa búsqueda.</p>
      ) : (
        <ul
          className="option-picker__list"
          role="listbox"
          aria-multiselectable="true"
          aria-label={label}
        >
          {visible.map((option) => {
            const on = selectedSet.has(option.id);

            return (
              <li key={option.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  className={"option-picker__option" + (on ? " is-on" : "")}
                  onClick={() => toggle(option.id)}
                  disabled={disabled}
                >
                  <span className="option-picker__check" aria-hidden="true">
                    {on && <FiCheck />}
                  </span>

                  {option.user ? (
                    <UserAvatar
                      user={option.user}
                      className="option-picker__avatar"
                      title={option.label}
                      style={{
                        backgroundColor: "rgba(5, 144, 62, 0.12)",
                        color: "var(--theme-green-text, #05903e)",
                      }}
                    />
                  ) : option.color ? (
                    <span
                      className="option-picker__dot"
                      style={{ background: option.color }}
                      aria-hidden="true"
                    />
                  ) : null}

                  <span className="option-picker__text">
                    <strong>{option.label}</strong>
                    {option.subtitle && <small>{option.subtitle}</small>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="option-picker__footer">
        {selectedCount} de {options.length} seleccionados
      </div>
    </div>
  );
}