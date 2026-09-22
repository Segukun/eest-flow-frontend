import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PRIORITIES } from "../mock/db";
import "../styles/components/filters-dropdown.css";

const BRANCH_ROWS = [
  { id: "priority", label: "Prioridad", icon: "/icons/funnel.svg" },
  { id: "sector", label: "Sector", icon: "/icons/teamsection.svg" },
  { id: "due", label: "Vencimiento próximo", icon: "/icons/bell.svg" },
];

const DUE_OPTIONS = [
  { id: "hoy", label: "Hoy" },
  { id: "48", label: "≤ 48 hs" },
  { id: "7", label: "7 días" },
];

export default function FiltersDropdown() {
  const { filters, setFilters, sectors, activeFiltersCount } = useApp();
  const [expanded, setExpanded] = useState(null); // id de la única rama abierta, o null

  const toggleRow = (id) => setExpanded((cur) => (cur === id ? null : id));

  const togglePriority = (id) =>
    setFilters((f) => ({
      ...f,
      priorities: f.priorities.includes(id)
        ? f.priorities.filter((p) => p !== id)
        : [...f.priorities, id],
    }));

  const setSector = (s) => setFilters((f) => ({ ...f, sector: s }));
  const toggleDue = (id) => setFilters((f) => ({ ...f, due: f.due === id ? "" : id }));
  const toggleMine = () => setFilters((f) => ({ ...f, onlyMine: !f.onlyMine }));

  const clear = () => {
    setFilters({ onlyMine: false, priorities: [], sector: "", due: "" });
    setExpanded(null);
  };

  return (
    <div className="filters-dd">
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

      {/* Mis tareas: switch inline, no ramifica */}
      <button type="button" className="filters-dd__row" onClick={toggleMine}>
        <span className="filters-dd__row-left">
          <img src="/icons/user.svg" alt="" className="icon-sm" />
          Mis tareas
        </span>
        <span className={"switch switch--sm" + (filters.onlyMine ? " switch--on" : "")}>
          <span className="switch__knob" />
        </span>
      </button>

      {BRANCH_ROWS.map((row) => {
        const isOpen = expanded === row.id;
        const rowActive =
          (row.id === "priority" && filters.priorities.length > 0) ||
          (row.id === "sector" && !!filters.sector) ||
          (row.id === "due" && !!filters.due);

        return (
          <div key={row.id} className="filters-dd__branch">
            <button
              type="button"
              className={
                "filters-dd__row" +
                (isOpen ? " is-open" : "") +
                (rowActive ? " is-active" : "")
              }
              onClick={() => toggleRow(row.id)}
            >
              <span className="filters-dd__row-left">
                <img src={row.icon} alt="" className="icon-sm" />
                {row.label}
              </span>
              <span className="filters-dd__row-right">
                {rowActive && <span className="filters-dd__check">✓</span>}
                <span className="filters-dd__chevron">{isOpen ? ">" : "<"}</span>
              </span>
            </button>

            {isOpen && (
              <div className="filters-dd__panel">
                {row.id === "priority" && (
                  <div className="filters-dd__list">
                    {Object.values(PRIORITIES).map((p) => {
                      const on = filters.priorities.includes(p.id);
                      return (
                        <button
                          type="button"
                          key={p.id}
                          className={"filters-dd__opt" + (on ? " is-on" : "")}
                          onClick={() => togglePriority(p.id)}
                        >
                          <span className="filters-dd__opt-dot" style={{ background: p.color }} />
                          {p.label}
                          {on && <span className="filters-dd__check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {row.id === "sector" && (
                  <div className="filters-dd__list">
                    <button
                      type="button"
                      className={"filters-dd__opt" + (!filters.sector ? " is-on" : "")}
                      onClick={() => setSector("")}
                    >
                      Todos los sectores
                      {!filters.sector && <span className="filters-dd__check">✓</span>}
                    </button>
                    {sectors.map((s) => (
                      <button
                        type="button"
                        key={s}
                        className={"filters-dd__opt" + (filters.sector === s ? " is-on" : "")}
                        onClick={() => setSector(s)}
                      >
                        {s}
                        {filters.sector === s && <span className="filters-dd__check">✓</span>}
                      </button>
                    ))}
                  </div>
                )}

                {row.id === "due" && (
                  <div className="filters-dd__list">
                    {DUE_OPTIONS.map((o) => (
                      <button
                        type="button"
                        key={o.id}
                        className={"filters-dd__opt" + (filters.due === o.id ? " is-on" : "")}
                        onClick={() => toggleDue(o.id)}
                      >
                        {o.label}
                        {filters.due === o.id && <span className="filters-dd__check">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}