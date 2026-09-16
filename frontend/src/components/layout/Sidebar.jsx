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

export default function Sidebar() {
  const { categories, activeCategory, setActiveCategory, currentUser } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img src="/eestn1logo.png" alt="EEST N°1" className="sidebar__logo" />
        <div className="sidebar__brand-text">
          <span className="brand-name">EEST<span className="brand-name--accent">Flow</span></span>
          <span className="brand-sub">Técnica Digital</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => "nav-item" + (isActive ? " nav-item--active" : "")}
          >
            <img src={item.icon} alt="" className="icon" />
            <span>{item.label}</span>
            {item.badge && <span className="nav-item__badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__section">
        <div className="sidebar__section-head">
          <span>Categorías</span>
          <button className="sidebar__add" title="Agregar categoría">+</button>
        </div>
        <ul className="cat-list">
          {categories.map((c) => (
            <li key={c.id}>
              <button
                className={"cat-item" + (activeCategory === c.id ? " cat-item--active" : "")}
                onClick={() => setActiveCategory(c.id)}
              >
                <span className="cat-dot" style={{ background: c.color }} />
                <span className="cat-name">{c.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar__section">
        <NavLink
          to="/equipo"
          className={({ isActive }) => "nav-item" + (isActive ? " nav-item--active" : "")}
        >
          <img src="/icons/team.svg" alt="" className="icon" />
          <span>Mi Equipo</span>
        </NavLink>
      </div>

      <div className="sidebar__user" ref={ref}>
        <button className="user-card" onClick={() => setMenuOpen((v) => !v)}>
          <span className="avatar" style={{ background: currentUser.color }}>{currentUser.initials}</span>
          <span className="user-card__info">
            <strong>{currentUser.name}</strong>
            <small>{currentUser.sector}</small>
          </span>
          <span className="user-card__chevron">⌄</span>
        </button>

        {menuOpen && (
          <div className="user-menu">
            <button className="user-menu__item">
              <img src="/icons/user.svg" alt="" className="icon-sm" /> Editar perfil
            </button>
            <button className="user-menu__item">
              <img src="/icons/settingsgear.svg" alt="" className="icon-sm" /> Configuración
            </button>
            <button className="user-menu__item user-menu__item--danger">Cerrar sesión</button>
          </div>
        )}
      </div>
    </aside>
  );
}