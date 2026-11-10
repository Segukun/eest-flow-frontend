import { useState } from "react";

import {
  FiFlag,
  FiCalendar,
  FiTag,
  FiUser,
  FiChevronLeft,
  FiChevronDown,
  FiCheck,
} from "react-icons/fi";

import { useApp, PRIORITIES } from "../context/AppContext";

import "../styles/components/filters-dropdown.css";

const BRANCH_ROWS = [
  {
    id: "priority",
    label: "Prioridad",
    icon: FiFlag,
  },
  {
    id: "due",
    label: "Vencimiento",
    icon: FiCalendar,
  },
  {
    id: "labels",
    label: "Etiquetas",
    icon: FiTag,
  },
];

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

export default function FiltersDropdown() {
  const { filters, setFilters, labels = [], activeFiltersCount } = useApp();

  const [expanded, setExpanded] = useState(null);

  const priorities = Array.isArray(filters.priorities)
    ? filters.priorities
    : [];

  const dueFilters = Array.isArray(filters.due)
    ? filters.due
    : filters.due
      ? [filters.due]
      : [];

  const selectedLabels = Array.isArray(filters.labels) ? filters.labels : [];

  const toggleRow = (id) => {
    setExpanded((current) => (current === id ? null : id));
  };

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

    setExpanded(null);
  };

  return (
    <div className="filters-dd">
      {/* ENCABEZADO */}

      <div className="filters-dd__head">
        <span>Filtrar por</span>

        <button
          type="button"
          className="filters-dd__clear"
          onClick={clear}
          disabled={!activeFiltersCount}
        >
          ↺ Limpiar
        </button>
      </div>

      {/* MIS TAREAS */}

      <button
        type="button"
        className={`filters-dd__row ${filters.onlyMine ? "is-active" : ""}`}
        onClick={toggleMine}
        aria-pressed={Boolean(filters.onlyMine)}
      >
        <span className="filters-dd__row-left">
          <span aria-hidden="true" className="filters-dd__icon">
            <FiUser />
          </span>
          Mis tareas
        </span>

        <span
          className={`switch switch--sm ${
            filters.onlyMine ? "switch--on" : ""
          }`}
          aria-hidden="true"
        >
          <span className="switch__knob" />
        </span>
      </button>

      {/* RAMAS DE FILTROS */}

      {BRANCH_ROWS.map((row) => {
        const isOpen = expanded === row.id;

        const Icon = row.icon;

        const rowActive =
          (row.id === "priority" && priorities.length > 0) ||
          (row.id === "due" && dueFilters.length > 0) ||
          (row.id === "labels" && selectedLabels.length > 0);

        const selectedCount =
          row.id === "priority"
            ? priorities.length
            : row.id === "due"
              ? dueFilters.length
              : selectedLabels.length;

        return (
          <div key={row.id} className="filters-dd__branch">
            <button
              type="button"
              className={`filters-dd__row ${isOpen ? "is-open" : ""} ${
                rowActive ? "is-active" : ""
              }`}
              onClick={() => toggleRow(row.id)}
              aria-expanded={isOpen}
            >
              <span className="filters-dd__row-left">
                <span aria-hidden="true" className="filters-dd__icon">
                  <Icon />
                </span>

                {row.label}
              </span>

              <span className="filters-dd__row-right">
                {rowActive && (
                  <span className="filters-dd__count">{selectedCount}</span>
                )}

                {isOpen ? (
                  <FiChevronDown className="filters-dd__chevron" />
                ) : (
                  <FiChevronLeft className="filters-dd__chevron" />
                )}
              </span>
            </button>

            {isOpen && (
              <div
                className={`filters-dd__panel ${
                  row.id === "labels" ? "filters-dd__panel--labels" : ""
                }`}
              >
                {/* PRIORIDADES */}

                {row.id === "priority" && (
                  <div className="filters-dd__list">
                    {Object.values(PRIORITIES).map((priority) => {
                      const selected = priorities.includes(priority.id);

                      return (
                        <button
                          type="button"
                          key={priority.id}
                          className={`filters-dd__opt ${
                            selected ? "is-on" : ""
                          }`}
                          onClick={() => togglePriority(priority.id)}
                          aria-pressed={selected}
                        >
                          <span
                            className="filters-dd__opt-dot"
                            style={{
                              background: priority.color,
                            }}
                          />

                          {priority.label}

                          {selected && (
                            <FiCheck className="filters-dd__check" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* VENCIMIENTOS */}

                {row.id === "due" && (
                  <div className="filters-dd__list">
                    {DUE_OPTIONS.map((option) => {
                      const selected = dueFilters.includes(option.id);

                      return (
                        <button
                          type="button"
                          key={option.id}
                          className={`filters-dd__opt ${
                            selected ? "is-on" : ""
                          }`}
                          onClick={() => toggleDue(option.id)}
                          aria-pressed={selected}
                        >
                          {option.label}

                          {selected && (
                            <FiCheck className="filters-dd__check" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ETIQUETAS */}

                {row.id === "labels" && (
                  <>
                    <div className="filters-dd__list">
                      <button
                        type="button"
                        className={`filters-dd__opt ${
                          selectedLabels.length === 0 ? "is-on" : ""
                        }`}
                        onClick={clearLabels}
                      >
                        Todas las etiquetas
                        {selectedLabels.length === 0 && (
                          <FiCheck className="filters-dd__check" />
                        )}
                      </button>
                    </div>

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
                              className={`filters-dd__opt filters-dd__label-opt ${
                                selected ? "is-on" : ""
                              }`}
                              onClick={() => toggleLabel(id)}
                              aria-pressed={selected}
                              title={label.title}
                            >
                              <span
                                className="filters-dd__opt-dot"
                                style={{
                                  background: label.color || "#05903e",
                                }}
                              />

                              <span className="filters-dd__label-text">
                                {label.title}
                              </span>

                              {selected && (
                                <FiCheck className="filters-dd__check" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="filters-dd__empty">
                        No hay etiquetas en esta categoría.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
