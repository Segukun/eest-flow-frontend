import { useEffect, useState } from "react";

import ColorPresetPicker from "./ColorPresetPicker";
import CharacterCounter from "./CharacterCounter";

import { SECTOR_DESCRIPTION_MAX_LENGTH } from "../formLimits.js";
import { DEFAULT_COLOR, colorChipStyle } from "../colorPresets.js";

import {
  FiX,
  FiPlus,
  FiAlertCircle,
  FiGlobe,
  FiLock,
} from "react-icons/fi";

import "../styles/components/AgregarSectorModal.css";

export default function AgregarSectorModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
}) {
  const isEditing = Boolean(initialData);

  const getInitialForm = () => ({
    nombre: initialData?.nombre || "",
    descripcion: initialData?.descripcion || "",
    color: initialData?.color || DEFAULT_COLOR,
    accessMode: initialData?.accessMode || "public",
  });

  const [form, setForm] = useState(getInitialForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Inicializar los valores al abrir o cambiar el sector.
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    setForm(getInitialForm());
    setErrors({});
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // -------------------------------------------------------
  // CAMBIOS DEL FORMULARIO
  // -------------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
      submit: "",
    }));
  };

  const handleColorChange = (color) => {
    setForm((previous) => ({
      ...previous,
      color,
    }));
  };

  // -------------------------------------------------------
  // VALIDACIÓN
  // -------------------------------------------------------

  const validate = () => {
    const newErrors = {};

    if (!form.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio.";
    } else if (form.nombre.trim().length < 3) {
      newErrors.nombre =
        "El nombre debe tener al menos 3 caracteres.";
    }

    if (
      form.descripcion.trim().length >
      SECTOR_DESCRIPTION_MAX_LENGTH
    ) {
      newErrors.descripcion =
        `La descripción no puede superar los ${SECTOR_DESCRIPTION_MAX_LENGTH} caracteres.`;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // -------------------------------------------------------
  // GUARDAR
  // -------------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving || !validate()) return;

    setSaving(true);

    try {
      await onSave?.({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        color: form.color,
        accessMode: form.accessMode,
      });
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        submit:
          error.message ||
          "No se pudo guardar el sector.",
      }));
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------
  // CERRAR
  // -------------------------------------------------------

  const handleOverlay = (event) => {
    if (
      event.target === event.currentTarget &&
      !saving
    ) {
      onClose();
    }
  };

  const accessOptions = [
    {
      value: "public",
      title: "Público",
      description:
        "Cualquier usuario puede unirse directamente.",
      icon: FiGlobe,
    },
    {
      value: "request",
      title: "Requiere solicitar acceso",
      description:
        "Los administradores reciben una solicitud para aprobar o rechazar.",
      icon: FiLock,
    },
  ];

  return (
    <div
      className="asm-overlay"
      onMouseDown={handleOverlay}
    >
      <section
        className="asm-modal asm-sector-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asm-sector-title"
      >
        {/* -------------------------------------------------
            HEADER
        ------------------------------------------------- */}

        <header className="asm-header">
          <div>
            <span className="asm-kicker">
              {isEditing ? "MODIFICAR" : "NUEVO SECTOR"}
            </span>

            <h2 id="asm-sector-title">
              {isEditing
                ? "Editar sector"
                : "Agregar sector"}
            </h2>
          </div>

          <button
            type="button"
            className="asm-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar modal"
          >
            <FiX />
          </button>
        </header>

        {/* -------------------------------------------------
            FORMULARIO
        ------------------------------------------------- */}

        <form
          className="asm-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* CONTENIDO DESPLAZABLE */}

          <div className="asm-form-content">

            {/* NOMBRE */}

            <div className="asm-field">
              <label htmlFor="sector-nombre">
                Nombre
              </label>

              <input
                id="sector-nombre"
                name="nombre"
                type="text"
                placeholder="Ej. Secretaría"
                value={form.nombre}
                onChange={handleChange}
                autoComplete="off"
                maxLength={50}
                disabled={saving}
              />

              {errors.nombre && (
                <p className="asm-error">
                  <FiAlertCircle />
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* DESCRIPCIÓN */}

            <div className="asm-field">
              <label htmlFor="sector-descripcion">
                Descripción
              </label>

              <textarea
                id="sector-descripcion"
                name="descripcion"
                placeholder="Descripción del sector"
                value={form.descripcion}
                onChange={handleChange}
                rows={3}
                maxLength={SECTOR_DESCRIPTION_MAX_LENGTH}
                aria-describedby="sector-description-counter"
                disabled={saving}
              />

              <CharacterCounter
                id="sector-description-counter"
                value={form.descripcion}
                maxLength={SECTOR_DESCRIPTION_MAX_LENGTH}
              />

              {errors.descripcion && (
                <p className="asm-error">
                  <FiAlertCircle />
                  {errors.descripcion}
                </p>
              )}
            </div>

            {/* TIPO DE ACCESO */}

            <fieldset className="asm-field asm-access-field">
              <legend>Tipo de acceso</legend>

              <div className="asm-access-options">
                {accessOptions.map((option) => {
                  const OptionIcon = option.icon;

                  const selected =
                    form.accessMode === option.value;

                  return (
                    <label
                      key={option.value}
                      className={`asm-access-option ${
                        selected ? "is-selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="accessMode"
                        value={option.value}
                        checked={selected}
                        onChange={handleChange}
                        disabled={saving}
                      />

                      <span className="asm-access-option__icon">
                        <OptionIcon />
                      </span>

                      <span className="asm-access-option__copy">
                        <strong>{option.title}</strong>
                        <small>{option.description}</small>
                      </span>

                      <span
                        className="asm-access-option__indicator"
                        aria-hidden="true"
                      />
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* COLOR */}

            <div className="asm-field">
              <label>Color del sector</label>

              <ColorPresetPicker
                value={form.color}
                onChange={handleColorChange}
                currentColor={initialData?.color}
              />
            </div>

            {/* PREVISUALIZACIÓN */}

            <div className="asm-preview">
              <span
                className="asm-preview-icon"
                style={colorChipStyle(form.color)}
              >
                <FiPlus />
              </span>

              <div className="asm-preview-copy">
                <strong>
                  {form.nombre || "Nombre del sector"}
                </strong>

                <span>
                  {form.descripcion || "Sin descripción"}
                </span>
              </div>

              <span
                className={`asm-preview-access ${
                  form.accessMode === "public"
                    ? "is-public"
                    : "is-request"
                }`}
              >
                {form.accessMode === "public"
                  ? "Público"
                  : "Restringido"}
              </span>
            </div>

            {/* ERROR GENERAL */}

            {errors.submit && (
              <p className="asm-error" role="alert">
                <FiAlertCircle />
                {errors.submit}
              </p>
            )}
          </div>

          {/* -------------------------------------------------
              FOOTER FIJO
          ------------------------------------------------- */}

          <footer className="asm-footer">
            <button
              type="button"
              className="asm-button asm-button-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="asm-button asm-button-save"
              disabled={saving}
            >
              {saving
                ? "Guardando…"
                : isEditing
                  ? "Guardar cambios"
                  : "Agregar sector"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}