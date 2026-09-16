import { useApp } from "../context/AppContext";
import { PRIORITIES } from "../mock/db";
import "../styles/components/filters.css";

export default function FiltersPanel({ onClose }) {
  const { filters, setFilters, sectors, activeFiltersCount } = useApp();

  const togglePriority = (id) =>
    setFilters((f) => ({
      ...f,
      priorities: f.priorities.includes(id)
        ? f.priorities.filter((p) => p !== id)
        : [...f.priorities, id],
    }));

  const clear = () =>
    setFilters({ onlyMine: false, priorities: [], sector: "", due: "" });

  return (
    <div className="filters-overlay" onClick={onClose}>
      <div className="filters-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="filters-sheet__handle" />
        <div className="filters-sheet__head">
          <div className="filters-sheet__title">
            <span className="filters-sheet__icon">
              <img src="/icons/funnel.svg" alt="" className="icon-sm" />
            </span>
            <div>
              <h3>Filtros</h3>
              <small>{activeFiltersCount} filtro(s) activo(s)</small>
            </div>
          </div>
          <div className="filters-sheet__head-actions">
            <button className="link-btn" onClick={clear}>↺ Limpiar</button>
            <button className="icon-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="filters-sheet__body">
          <div className="switch-row">
            <div className="switch-row__left">
              <span className="switch-row__icon">
                <img src="/icons/user.svg" alt="" className="icon-sm" />
              </span>
              <div>
                <strong>Mis tareas</strong>
                <small>Asignadas a mi usuario</small>
              </div>
            </div>
            <button
              className={"switch" + (filters.onlyMine ? " switch--on" : "")}
              onClick={() => setFilters((f) => ({ ...f, onlyMine: !f.onlyMine }))}
            >
              <span className="switch__knob" />
            </button>
          </div>

          <div className="filters-group">
            <div className="filters-group__head">
              <span>⚑ Prioridad</span>
              <small>Múltiple selección</small>
            </div>
            <div className="chip-grid">
              {Object.values(PRIORITIES).map((p) => {
                const on = filters.priorities.includes(p.id);
                return (
                  <button
                    key={p.id}
                    className={"pill" + (on ? " pill--on" : "")}
                    onClick={() => togglePriority(p.id)}
                  >
                    <span className="pill__dot" style={{ background: p.color }} />
                    {p.label}
                    {on && <span className="pill__check">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filters-group">
            <div className="filters-group__head"><span>Sector</span></div>
            <select
              className="select"
              value={filters.sector}
              onChange={(e) => setFilters((f) => ({ ...f, sector: e.target.value }))}
            >
              <option value="">Todos los sectores</option>
              {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="filters-group">
            <div className="filters-group__head"><span>Vencimiento próximo</span></div>
            <div className="chip-grid chip-grid--3">
              {[
                { id: "hoy", label: "Hoy" },
                { id: "48", label: "≤ 48 hs" },
                { id: "7", label: "7 días" },
              ].map((o) => (
                <button
                  key={o.id}
                  className={"pill pill--outline" + (filters.due === o.id ? " pill--outline-on" : "")}
                  onClick={() => setFilters((f) => ({ ...f, due: f.due === o.id ? "" : o.id }))}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="filters-sheet__footer">
          <button className="btn btn--primary" onClick={onClose}>Aplicar filtros →</button>
        </div>
      </div>
    </div>
  );
}