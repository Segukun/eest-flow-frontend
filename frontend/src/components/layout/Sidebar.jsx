import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import "../../styles/layout/sidebar.css";

const NAV = [
  { to: "/", label: "Inicio", icon: "/icons/home.svg", end: true },
  { to: "/sectores", label: "Sectores", icon: "/icons/teamsection.svg" },
  { to: "/foro", label: "Foro", icon: "/icons/forum.svg" },
  { to: "/notificaciones", label: "Notificaciones", icon: "/icons/bell.svg", badge: 3 },
];

export default function Sidebar({ onOpenPerfil, onOpenConfiguracion, onOpenAddCategory, onRequestDeleteCategory }) {
  const { categories, categoriesLoading, activeCategory, setActiveCategory, currentUser } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <aside className={"sidebar" + (collapsed ? " sidebar--collapsed" : "")}>
      <button
        className="sidebar__collapse-btn"
        onClick={() => setCollapsed((v) => !v)}
        title={collapsed ? "Expandir" : "Colapsar"}
      >
        {collapsed ? "»" : "«"}
      </button>

      <div className="sidebar__brand">
        <img src="/eestn1logo.png" alt="EEST N°1" className="sidebar__logo" />
        {!collapsed && (
          <div className="sidebar__brand-text">
            <span className="brand-name">EEST<span className="brand-name--accent">Flow</span></span>
            <span className="brand-sub">Técnica Digital</span>
          </div>
        )}
      </div>

      <nav className="sidebar__nav">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => "nav-item" + (isActive ? " nav-item--active" : "")}
            title={collapsed ? item.label : undefined}
          >
            <img src={item.icon} alt="" className="icon" />
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && item.badge && <span className="nav-item__badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar__section">
          <div className="sidebar__section-head">
            <span>Categorías</span>
            <button className="sidebar__add" title="Agregar categoría" onClick={onOpenAddCategory}>
              +
            </button>
          </div>

          {categoriesLoading ? (
            <p className="actions-modal__empty-hint">Cargando…</p>
          ) : (
            <ul className="cat-list">
              {categories.map((c) => (
                <li key={c.id} className="cat-item-row">
                  <button
                    className={"cat-item" + (activeCategory === c.id ? " cat-item--active" : "")}
                    onClick={() => setActiveCategory(c.id)}
                  >
                    <span className="cat-dot" style={{ background: c.color }} />
                    <span className="cat-name">{c.name}</span>
                  </button>
                  {categories.length > 1 && (
                    <button
                      className="cat-item__delete"
                      title="Eliminar categoría"
                      onClick={(e) => { e.stopPropagation(); onRequestDeleteCategory(c); }}
                    >
                      🗑
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="sidebar__section">
        <NavLink
          to="/equipo"
          className={({ isActive }) => "nav-item" + (isActive ? " nav-item--active" : "")}
          title={collapsed ? "Mi Equipo" : undefined}
        >
          <img src="/icons/team.svg" alt="" className="icon" />
          {!collapsed && <span>Mi Equipo</span>}
        </NavLink>
      </div>

      <div className="sidebar__user" ref={ref}>
        <button className="user-card" onClick={() => setMenuOpen((v) => !v)} disabled={collapsed || !currentUser}>
          <span className="avatar" style={{ background: "var(--color-green)" }}>
            {currentUser?.initials ?? "…"}
          </span>
          {!collapsed && (
            <>
              <span className="user-card__info">
                <strong>{currentUser?.name ?? "Cargando…"}</strong>
                <small>{currentUser?.accountType === "admin" ? "Administrador" : "Colaborador"}</small>
              </span>
              <span className="user-card__chevron">⌄</span>
            </>
          )}
        </button>

        {menuOpen && (
          <div className="user-menu">
            <button className="user-menu__item" onClick={() => { onOpenPerfil(); setMenuOpen(false); }}>
              <img src="/icons/user.svg" alt="" className="icon-sm" />
              Editar perfil
            </button>
            <button className="user-menu__item" onClick={() => { onOpenConfiguracion(); setMenuOpen(false); }}>
              <img src="/icons/settingsgear.svg" alt="" className="icon-sm" /> Configuración
            </button>
            <button
              className="user-menu__item user-menu__item--danger"
              onClick={() => {
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}