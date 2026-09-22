import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import "../../styles/layout/topbar.css";
import { FiPlus } from "react-icons/fi";

const NAV = [
  { to: "/", label: "Inicio", icon: "/icons/home.svg", end: true },
  { to: "/sectores", label: "Sectores", icon: "/icons/teamsection.svg" },
  { to: "/foro", label: "Foro", icon: "/icons/forum.svg" },
  { to: "/notificaciones", label: "Notificaciones", icon: "/icons/bell.svg", badge: 3 },
  { to: "/equipo", label: "Mi Equipo", icon: "/icons/team.svg" },
];

export default function Topbar() {
  const { categories, activeCategory, setActiveCategory, currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);

  return (
    <>
      <header className="topbar">
        <div className="topbar__brand">
          <img src="/eestn1logo.png" alt="EEST N°1" className="topbar__logo" />
          <span className="brand-name">EEST<span className="brand-name--accent">Flow</span></span>
        </div>
        <button className="topbar__burger" onClick={() => setOpen(true)} aria-label="Abrir menú">
          <span /><span /><span />
        </button>
      </header>

      {open && <div className="drawer__backdrop" onClick={() => setOpen(false)} />}

      <aside className={"drawer" + (open ? " drawer--open" : "")}>
        <div className="drawer__head">
          <div className="topbar__brand">
            <img src="/eestn1logo.png" alt="" className="topbar__logo" />
            <div className="sidebar__brand-text">
              <span className="brand-name">EEST<span className="brand-name--accent">Flow</span></span>
              <span className="brand-sub">Técnica Digital</span>
            </div>
          </div>
          <button className="drawer__close" onClick={() => setOpen(false)}>✕</button>
        </div>

        <nav className="drawer__nav">
          {NAV.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => "nav-item" + (isActive ? " nav-item--active" : "")}
            >
              <img src={i.icon} alt="" className="icon" />
              <span>{i.label}</span>
              {i.badge && <span className="nav-item__badge">{i.badge}</span>}
            </NavLink>
          ))}

          <button className="nav-item" onClick={() => setCatsOpen((v) => !v)}>
            <img src="/icons/list.svg" alt="" className="icon" />
            <span>Categorías</span>
            <span className="nav-item__chevron">{catsOpen ? "⌃" : "⌄"}</span>
          </button>

          {catsOpen && (
            <ul className="cat-list cat-list--drawer">
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    className={"cat-item" + (activeCategory === c.id ? " cat-item--active" : "")}
                    onClick={() => { setActiveCategory(c.id); setOpen(false); }}
                  >
                    <span className="cat-dot" style={{ background: c.color }} />
                    <span className="cat-name">{c.name}</span>
                  </button>
                </li>
              ))}

              <li>
                <button className="cat-item cat-item--add">
                  <FiPlus className="cat-dot cat-dot--add"/>
                  <span className="cat-name">Agregar categoría</span>
                </button>
              </li>
            </ul>
          )}
        </nav>

        <div className="drawer__user">
          <span className="avatar" style={{ background: currentUser.color }}>{currentUser.initials}</span>
          <div className="user-card__info">
            <strong>{currentUser.name}</strong>
            <small>{currentUser.sector}</small>
            <span className="role-chip">{currentUser.role}</span>
          </div>
        </div>
        <div className="drawer__actions">
          <button className="user-menu__item">
            <img src="/icons/settingsgear.svg" alt="" className="icon-sm" /> Configuración
          </button>
          <button className="user-menu__item user-menu__item--danger">Cerrar sesión</button>
        </div>
      </aside>
    </>
  );
}