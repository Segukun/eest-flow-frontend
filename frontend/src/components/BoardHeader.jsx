import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import FiltersPanel from "./FiltersPanel";
import "../styles/components/board-header.css";

export default function BoardHeader() {
  const {
    categories, activeCategory, setActiveCategory,
    view, setView, search, setSearch, activeFiltersCount, visibleTasks,
  } = useApp();

  const [catOpen, setCatOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const ref = useRef(null);
  const current = categories.find((c) => c.id === activeCategory);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setCatOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <header className="board-header">
      <div className="board-header__row">
        <div className="cat-select" ref={ref}>
          <button className="cat-select__trigger" onClick={() => setCatOpen((v) => !v)}>
            <h1 className="board-title">{current?.name}</h1>
            <span className="cat-dot" style={{ background: current?.color }} />
            <span className="cat-select__chevron">⌄</span>
          </button>

          {catOpen && (
            <div className="cat-select__menu">
              <div className="cat-select__menu-head">
                Seleccionar categoría <small>{categories.length} disponibles</small>
              </div>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={"cat-select__option" + (c.id === activeCategory ? " is-active" : "")}
                  onClick={() => { setActiveCategory(c.id); setCatOpen(false); }}
                >
                  <span className="radio" style={{ borderColor: c.color }}>
                    {c.id === activeCategory && <span className="radio__dot" style={{ background: c.color }} />}
                  </span>
                  <span>{c.name}</span>
                  {c.id === activeCategory && <span className="chip chip--active">Activa</span>}
                </button>
              ))}
              <button className="cat-select__add">+ Agregar categoría</button>
            </div>
          )}
        </div>

        <div className="board-header__tools">
          <div className="view-toggle">
            <button
              className={"view-toggle__btn" + (view === "tablero" ? " is-active" : "")}
              onClick={() => setView("tablero")}
            >
              <img src="/icons/table.svg" alt="" className="icon-sm" /> Tablero
            </button>
            <button
              className={"view-toggle__btn" + (view === "lista" ? " is-active" : "")}
              onClick={() => setView("lista")}
            >
              <img src="/icons/list.svg" alt="" className="icon-sm" /> Lista
            </button>
          </div>

          <label className="search">
            <img src="/icons/search.svg" alt="" className="icon-sm" />
            <input
              type="text"
              placeholder="Buscar tarea"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <button className="filters-btn" onClick={() => setFiltersOpen(true)}>
            <img src="/icons/funnel.svg" alt="" className="icon-sm" />
            Filtros
            {activeFiltersCount > 0 && <span className="filters-btn__count">{activeFiltersCount}</span>}
          </button>
        </div>
      </div>

      <div className="board-header__meta">
        <span className="sync-dot" /> Tablero sincronizado · {visibleTasks.length} tareas
      </div>

      {filtersOpen && <FiltersPanel onClose={() => setFiltersOpen(false)} />}
    </header>
  );
}