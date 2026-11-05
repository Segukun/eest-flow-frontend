import { useState } from "react";
import ColorPresetPicker from "./ColorPresetPicker";
import { DEFAULT_COLOR } from "../colorPresets.js";
import { useApp } from "../context/AppContext";
import "../styles/components/category-modal.css";

const ROL_ADMIN = "admin";

const MSG_SOLO_ADMIN =
  "No puedes agregar ni modificar categorías porque tu cuenta no es de administrador.";

const getSectorId = (sector) =>
  sector && typeof sector === "object"
    ? sector._id ?? sector.id
    : sector;

export default function AddCategoryModal({
  onClose,
  category = null,
}) {
  const {
    addCategory,
    updateCategory,
    sectors,
    currentUser,
  } = useApp();

  const categoryId = category?.id ?? category?._id;
  const isEditing = Boolean(categoryId);

  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? DEFAULT_COLOR);

  const [sectorMode, setSectorMode] = useState(
    isEditing ? "custom" : "all"
  );

  const [selectedSectorIds, setSelectedSectorIds] =
    useState(() =>
      (category?.sectors ?? [])
        .map(getSectorId)
        .filter(Boolean)
        .map(String)
    );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isAdmin =
    currentUser?.accountType === ROL_ADMIN;

  const shownError = !isAdmin
    ? MSG_SOLO_ADMIN
    : error;

  const toggleSector = (sectorId) => {
    const id = String(sectorId);

    setSelectedSectorIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!isAdmin) {
      setError(MSG_SOLO_ADMIN);
      return;
    }

    const trimmed = name.trim();

    if (!trimmed) {
      setError("Ingresá el nombre de la categoría.");
      return;
    }

    const sectorIds =
      sectorMode === "all"
        ? sectors.map((sector) => String(sector.id))
        : selectedSectorIds;

    if (sectorIds.length === 0) {
      setError(
        'Elegí al menos un sector o seleccioná "Todos".'
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: trimmed,
        color,
        sectors: sectorIds,
      };

      if (isEditing) {
        await updateCategory(categoryId, payload);
      } else {
        await addCategory(payload);
      }

      onClose();
    } catch (err) {
      if (err?.response?.status === 403) {
        setError(MSG_SOLO_ADMIN);
      } else {
        setError(
          err?.response?.data?.message ||
            (isEditing
              ? "No se pudo actualizar la categoría."
              : "No se pudo crear la categoría.")
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="category-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="category-modal__head">
          <div>
            <h2>
              {isEditing
                ? "Editar categoría"
                : "Agregar categoría"}
            </h2>

            <p>
              {isEditing
                ? "Modificá el nombre, el color y los sectores autorizados."
                : "Organizá tus documentos por colores y sectores."}
            </p>
          </div>

          <button
            className="icon-btn"
            onClick={onClose}
            type="button"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        <div className="category-modal__body">
          <label className="field">
            <span className="field__label">
              Nombre
              <span
                className="category-modal__name-dot"
                style={{ background: color }}
              />
            </span>

            <input
              className="input"
              placeholder="Ej: Matrícula y Legajo"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              disabled={!isAdmin || submitting}
              autoFocus
            />
          </label>

          <div className="field">
            <span className="field__label">
              Color
            </span>

            <ColorPresetPicker
              value={color}
              onChange={setColor}
              currentColor={category?.color}
              disabled={!isAdmin || submitting}
            />
          </div>

          <div className="field">
            <span className="field__label">
              Sectores autorizados
            </span>

            <div className="category-modal__sector-toggle">
              <button
                type="button"
                className={
                  "category-modal__sector-btn" +
                  (sectorMode === "all" ? " is-on" : "")
                }
                onClick={() => setSectorMode("all")}
                disabled={!isAdmin || submitting}
              >
                ☰ Todos {sectorMode === "all" && "✓"}
              </button>

              <button
                type="button"
                className={
                  "category-modal__sector-btn category-modal__sector-btn--outline" +
                  (sectorMode === "custom" ? " is-on" : "")
                }
                onClick={() => setSectorMode("custom")}
                disabled={!isAdmin || submitting}
              >
                Elegir sectores
              </button>
            </div>

            {sectorMode === "custom" && (
              <div className="category-modal__sector-list">
                {sectors.length === 0 ? (
                  <p className="actions-modal__empty-hint">
                    No hay sectores creados todavía.
                  </p>
                ) : (
                  sectors.map((sector) => {
                    const sectorId = String(sector.id);
                    const selected =
                      selectedSectorIds.includes(sectorId);

                    return (
                      <button
                        type="button"
                        key={sectorId}
                        className={
                          "pill pill--outline" +
                          (selected
                            ? " pill--outline-on"
                            : "")
                        }
                        onClick={() =>
                          toggleSector(sectorId)
                        }
                        disabled={!isAdmin || submitting}
                      >
                        <span
                          className="pill__dot"
                          style={{ background: sector.color }}
                        />

                        {sector.name}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {shownError && (
            <p className="label-creator__error">
              {shownError}
            </p>
          )}
        </div>

        <footer className="category-modal__foot">
          <button
            className="link-btn"
            onClick={onClose}
            type="button"
            disabled={submitting}
          >
            Cancelar
          </button>

          <button
            className="btn btn--primary"
            onClick={handleSubmit}
            type="button"
            disabled={
              !isAdmin ||
              !name.trim() ||
              submitting
            }
          >
            {submitting
              ? isEditing
                ? "Guardando..."
                : "Agregando..."
              : isEditing
                ? "Guardar cambios"
                : "Agregar"}
          </button>
        </footer>
      </div>
    </div>
  );
}
