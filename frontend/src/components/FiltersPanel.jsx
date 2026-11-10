import { useEffect } from "react";

import { FiFilter, FiTag, FiClock, FiCheck, FiFlag } from "react-icons/fi";

import { useApp, PRIORITIES } from "../context/AppContext";

import UserAvatar from "./layout/UserAvatar";

import "../styles/components/filters.css";

const DUE_OPTIONS = [
  { id: "overdue", label: "Vencido" },
  { id: "today", label: "Vence hoy" },
  { id: "48h", label: "Vence en menos de 48 h" },
  { id: "week", label: "Vence en 1 semana" },
  { id: "month", label: "Vence en 1 mes" },
  { id: "noDate", label: "Sin fecha" },
];

function toggleArrayValue(values, value) {
  const current = Array.isArray(values) ? values : [];

  const exists = current.some((item) => String(item) === String(value));

  return exists
    ? current.filter((item) => String(item) !== String(value))
    : [...current, value];
}

export default function FiltersPanel({ onClose }) {
  const {
    filters,
    setFilters,
    labels = [],
    activeFiltersCount,
    currentUser,
  } = useApp();

  const priorities = Array.isArray(filters.priorities)
    ? filters.priorities
    : [];

  const dueFilters = Array.isArray(filters.due)
    ? filters.due
    : filters.due
      ? [
          filters.due === "hoy"
            ? "today"
            : filters.due === "48"
              ? "48h"
              : filters.due === "7"
                ? "week"
                : filters.due,
        ]
      : [];

  const selectedLabels = Array.isArray(filters.labels) ? filters.labels : [];

  /* ---------- cerrar con Escape ---------- */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  /* ---------- acciones ---------- */

  const toggleMine = () => {
    setFilters((previous) => ({
      ...previous,
      onlyMine: !previous.onlyMine,
    }));
  };

  const togglePriority = (id) => {
    setFilters((previous) => ({
      ...previous,
      priorities: toggleArrayValue(previous.priorities, id),
    }));
  };

  const toggleDue = (id) => {
    setFilters((previous) => ({
      ...previous,
      due: toggleArrayValue(previous.due, id),
    }));
  };

  const toggleLabel = (id) => {
    setFilters((previous) => ({
      ...previous,
      labels: toggleArrayValue(previous.labels, String(id)),
    }));
  };

  const clearLabels = () => {
    setFilters((previous) => ({
      ...previous,
      labels: [],
    }));
  };

  const clear = () => {
    setFilters({
      onlyMine: false,
      priorities: [],
      due: [],
      labels: [],
    });
  };

  return (
    <div className="filters-overlay" onClick={onClose}>
      <section
        className="filters-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filters-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="filters-sheet__handle" />

        {/* ---------- ENCABEZADO ---------- */}

        <div className="filters-sheet__head">
          <div className="filters-sheet__title">
            <span className="filters-sheet__icon">
              <FiFilter />
            </span>

            <div>
              <h3 id="filters-title">Filtros</h3>

              <small>
                {activeFiltersCount}{" "}
                {activeFiltersCount === 1 ? "filtro activo" : "filtros activos"}
              </small>
            </div>
          </div>

          <div className="filters-sheet__head-actions">
            <button
              type="button"
              className="link-btn"
              onClick={clear}
              disabled={!activeFiltersCount}
            >
              ↺ Limpiar
            </button>

            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label="Cerrar filtros"
            >
              ×
            </button>
          </div>
        </div>

        {/* ---------- CONTENIDO ---------- */}

        <div className="filters-sheet__body">
          {/* MIS TAREAS */}

          <div className="switch-row">
            <div className="switch-row__left">
              <UserAvatar
                user={currentUser}
                className="filters-user-avatar"
                title={currentUser?.name || "Mi perfil"}
              />

              <div>
                <strong>Mis tareas</strong>
                <small>Asignadas a mi usuario</small>
              </div>
            </div>

            <button
              type="button"
              className={`switch ${filters.onlyMine ? "switch--on" : ""}`}
              onClick={toggleMine}
              aria-label="Filtrar mis tareas"
              aria-pressed={Boolean(filters.onlyMine)}
            >
              <span className="switch__knob" />
            </button>
          </div>

          {/* PRIORIDAD */}

          <section className="filters-group">
            <div className="filters-group__head">
              <span>
                <FiFlag />
                Prioridad
              </span>

              <small>Selección múltiple</small>
            </div>

            <div className="chip-grid">
              {Object.values(PRIORITIES).map((priority) => {
                const selected = priorities.includes(priority.id);

                return (
                  <button
                    type="button"
                    key={priority.id}
                    className={`pill ${selected ? "pill--on" : ""}`}
                    onClick={() => togglePriority(priority.id)}
                    aria-pressed={selected}
                  >
                    <span
                      className="pill__dot"
                      style={{
                        background: priority.color,
                      }}
                    />

                    {priority.label}

                    {selected && <FiCheck className="pill__check" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* VENCIMIENTOS */}

          <section className="filters-group">
            <div className="filters-group__head">
              <span>
                <FiClock />
                Vencimiento
              </span>

              <small>Podés elegir varios</small>
            </div>

            <div className="filters-due-list">
              {DUE_OPTIONS.map((option) => {
                const selected = dueFilters.includes(option.id);

                return (
                  <button
                    type="button"
                    key={option.id}
                    className={`filters-due-option ${
                      selected ? "is-selected" : ""
                    }`}
                    onClick={() => toggleDue(option.id)}
                    aria-pressed={selected}
                  >
                    <span className="filters-due-option__text">
                      {option.label}
                    </span>

                    {selected && <FiCheck />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ETIQUETAS */}

          <section className="filters-group">
            <div className="filters-group__head">
              <span>
                <FiTag />
                Etiquetas
              </span>

              <small>Selección múltiple</small>
            </div>

            <button
              type="button"
              className={`filters-label-option filters-label-option--all ${
                selectedLabels.length === 0 ? "is-selected" : ""
              }`}
              onClick={clearLabels}
            >
              Todas las etiquetas
              {selectedLabels.length === 0 && <FiCheck />}
            </button>

            {labels.length > 0 ? (
              <div className="filters-label-list">
                {labels.map((label) => {
                  const id = String(label.id);

                  const selected = selectedLabels.some(
                    (item) => String(item) === id,
                  );

                  return (
                    <button
                      type="button"
                      key={id}
                      className={`filters-label-option ${
                        selected ? "is-selected" : ""
                      }`}
                      onClick={() => toggleLabel(id)}
                      aria-pressed={selected}
                      title={label.title}
                    >
                      <span
                        className="filters-label-option__dot"
                        style={{
                          background: label.color || "#05903e",
                        }}
                      />

                      <span className="filters-label-option__name">
                        {label.title}
                      </span>

                      {selected && <FiCheck />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="filters-empty">
                No hay etiquetas disponibles en esta categoría.
              </p>
            )}
          </section>
        </div>

        {/* ---------- PIE ---------- */}

        <div className="filters-sheet__footer">
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Aplicar filtros →
          </button>
        </div>
      </section>
    </div>
  );
}
