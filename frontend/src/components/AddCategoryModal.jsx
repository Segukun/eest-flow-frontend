import { useMemo, useState } from "react";
import ColorPresetPicker from "./ColorPresetPicker";
import OptionListPicker from "./OptionListPicker";
import { DEFAULT_COLOR } from "../colorPresets.js";
import { useApp } from "../context/AppContext";
import "../styles/components/category-modal.css";

const ROL_ADMIN = "admin";

const MSG_SOLO_ADMIN =
  "No puedes agregar ni modificar categorías porque tu cuenta no es de administrador.";

const getSectorId = (sector) =>
  sector && typeof sector === "object" ? (sector._id ?? sector.id) : sector;

function ModeToggle({ value, onChange, allLabel, customLabel, disabled }) {
  return (
    <div className="category-modal__sector-toggle">
      <button
        type="button"
        className={"category-modal__sector-btn" + (value === "all" ? " is-on" : "")}
        aria-pressed={value === "all"}
        onClick={() => onChange("all")}
        disabled={disabled}
      >
        ☰ {allLabel} {value === "all" && "✓"}
      </button>

      <button
        type="button"
        className={
          "category-modal__sector-btn category-modal__sector-btn--outline" +
          (value === "custom" ? " is-on" : "")
        }
        aria-pressed={value === "custom"}
        onClick={() => onChange("custom")}
        disabled={disabled}
      >
        {customLabel}
      </button>
    </div>
  );
}

export default function AddCategoryModal({ onClose, category = null }) {
  const { addCategory, updateCategory, sectors, users, currentUser } = useApp();

  const categoryId = category?.id ?? category?._id;
  const isEditing = Boolean(categoryId);

  const originalSectorIds = useMemo(
    () => (category?.sectors ?? []).map(getSectorId).filter(Boolean).map(String),
    [category],
  );

  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? DEFAULT_COLOR);

  // Si la categoría ya incluye a todos los sectores, se muestra como "Todos".
  const [sectorMode, setSectorMode] = useState(() => {
    if (!isEditing) return "all";

    const coversAll =
      sectors.length > 0 &&
      sectors.every((sector) => originalSectorIds.includes(String(sector.id)));

    return coversAll ? "all" : "custom";
  });

  const [selectedSectorIds, setSelectedSectorIds] = useState(originalSectorIds);

  const [moderatorMode, setModeratorMode] = useState(
    category?.moderatorMode === "custom" ? "custom" : "all",
  );
  const [selectedModeratorIds, setSelectedModeratorIds] = useState(() =>
    (category?.moderators ?? []).map(String),
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isAdmin = currentUser?.accountType === ROL_ADMIN;
  const shownError = !isAdmin ? MSG_SOLO_ADMIN : error;
  const locked = !isAdmin || submitting;

  /* ---------- sectores ---------- */

  const effectiveSectorIds = useMemo(
    () =>
      sectorMode === "all"
        ? sectors.map((sector) => String(sector.id))
        : selectedSectorIds,
    [sectorMode, sectors, selectedSectorIds],
  );

  const sectorOptions = useMemo(
    () =>
      sectors.map((sector) => ({
        id: String(sector.id),
        label: sector.name,
        color: sector.color,
      })),
    [sectors],
  );

  // Sectores que se están quitando (solo al editar).
  const removedSectors = useMemo(() => {
    if (!isEditing) return [];

    const kept = new Set(effectiveSectorIds);

    return originalSectorIds
      .filter((id) => !kept.has(id))
      .map(
        (id) =>
          sectors.find((sector) => String(sector.id) === id)?.name ?? "Sector",
      );
  }, [isEditing, originalSectorIds, effectiveSectorIds, sectors]);

  /* ---------- moderadores ---------- */

  // Solo pueden ser moderadores las personas de los sectores de la categoría.
  const moderatorOptions = useMemo(() => {
  const allowed = new Set(effectiveSectorIds);

  return users
    .filter(
      (user) =>
        user.active !== false &&
        user.accountType === "collaborator" &&
        (user.sectors ?? [])
          .map(getSectorId)
          .some((id) => allowed.has(String(id))),
    )
    .map((user) => ({
      id: String(user.id),
      label: user.name || "Sin nombre",
      subtitle: user.email,
      user,
    }));
  }, [users, effectiveSectorIds]);

  // Si se quita un sector, los moderadores que ya no califican dejan de contar.
  const effectiveModeratorIds = useMemo(() => {
    const eligible = new Set(moderatorOptions.map((option) => option.id));
    return selectedModeratorIds.filter((id) => eligible.has(id));
  }, [moderatorOptions, selectedModeratorIds]);

  /* ---------- guardar ---------- */

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

    if (effectiveSectorIds.length === 0) {
      setError('Elegí al menos un sector o seleccioná "Todos".');
      return;
    }

    if (moderatorMode === "custom" && effectiveModeratorIds.length === 0) {
      setError('Elegí al menos un moderador o seleccioná "Todos".');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: trimmed,
        color,
        sectors: effectiveSectorIds,
        moderatorMode,
        moderators: moderatorMode === "custom" ? effectiveModeratorIds : [],
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
              : "No se pudo crear la categoría."),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="category-modal" onClick={(event) => event.stopPropagation()}>
        <header className="category-modal__head">
          <div>
            <h2>{isEditing ? "Editar categoría" : "Agregar categoría"}</h2>

            <p>
              {isEditing
                ? "Modificá el nombre, el color, los sectores y los moderadores."
                : "Organizá tus documentos por colores y sectores."}
            </p>
          </div>

          <button className="icon-btn" onClick={onClose} type="button" aria-label="Cerrar">
            ✕
          </button>
        </header>

        <div className="category-modal__body">
          <label className="field">
            <span className="field__label">
              Nombre
              <span className="category-modal__name-dot" style={{ background: color }} />
            </span>

            <input
              className="input"
              placeholder="Ej: Matrícula y Legajo"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={locked}
              autoFocus
            />
          </label>

          <div className="field">
            <span className="field__label">Color</span>

            <ColorPresetPicker
              value={color}
              onChange={setColor}
              currentColor={category?.color}
              disabled={locked}
            />
          </div>

          {/* ---------- sectores ---------- */}

          <div className="field">
            <span className="field__label">Sectores autorizados</span>

            <ModeToggle
              value={sectorMode}
              onChange={setSectorMode}
              allLabel="Todos"
              customLabel="Elegir sectores"
              disabled={locked}
            />

            {sectorMode === "custom" && (
              <OptionListPicker
                label="Sectores"
                options={sectorOptions}
                selected={selectedSectorIds}
                onChange={setSelectedSectorIds}
                searchPlaceholder="Buscar sector"
                emptyMessage="No hay sectores creados todavía."
                disabled={locked}
              />
            )}
          </div>

          {removedSectors.length > 0 && (
            <div className="category-modal__notice" role="status">
              <span aria-hidden="true">⚠</span>
              <span>
                Al quitar <strong>{removedSectors.join(", ")}</strong>, sus miembros dejan de
                tener acceso a esta categoría (salvo que pertenezcan a otro sector que
                siga), se los desvincula de las tareas que tengan asignadas en ella y se
                les avisa por notificación.
              </span>
            </div>
          )}

          {/* ---------- moderadores ---------- */}

          <div className="field">
            <span className="field__label">Moderadores</span>

            <ModeToggle
              value={moderatorMode}
              onChange={setModeratorMode}
              allLabel="Todos"
              customLabel="Elegir moderadores"
              disabled={locked}
            />

            <p className="category-modal__hint">
              Los moderadores pueden mover tarjetas a Terminado. Los administradores
              siempre pueden.
              {moderatorMode === "all" && " Con “Todos”, cualquiera puede hacerlo."}
            </p>

            {moderatorMode === "custom" && (
              <OptionListPicker
                label="Moderadores"
                options={moderatorOptions}
                selected={effectiveModeratorIds}
                onChange={setSelectedModeratorIds}
                searchPlaceholder="Buscar persona"
                emptyMessage="Ninguna persona pertenece a los sectores elegidos."
                disabled={locked}
              />
            )}
          </div>

          {shownError && <p className="label-creator__error">{shownError}</p>}
        </div>

        <footer className="category-modal__foot">
          <button className="link-btn" onClick={onClose} type="button" disabled={submitting}>
            Cancelar
          </button>

          <button
            className="btn btn--primary"
            onClick={handleSubmit}
            type="button"
            disabled={!isAdmin || !name.trim() || submitting}
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