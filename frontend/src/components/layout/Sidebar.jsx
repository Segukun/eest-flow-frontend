import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import "../../styles/layout/sidebar.css";

const NAV = [
  { to: "/", label: "Inicio", icon: "/icons/home.svg", end: true },
  {
    to: "/sectores",
    label: "Sectores",
    icon: "/icons/teamsection.svg",
  },
  { to: "/foro", label: "Foro", icon: "/icons/forum.svg" },
  {
    to: "/notificaciones",
    label: "Notificaciones",
    icon: "/icons/bell.svg",
  },
];

export default function Sidebar({
  onOpenPerfil,
  onOpenConfiguracion,
  onOpenAddCategory,
  onRequestEditCategory,
  onRequestDeleteCategory,
}) {
  const {
    categories,
    categoriesLoading,
    activeCategory,
    setActiveCategory,
    currentUser,
    unreadCount,
  } = useApp();

  const isAdmin =
    currentUser?.accountType === "admin";

  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (event) => {
      if (
        ref.current &&
        !ref.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);

    return () => {
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    navigate("/");
  };

  return (
    <aside
      className={
        "sidebar" +
        (collapsed ? " sidebar--collapsed" : "")
      }
    >
      <button
        className="sidebar__collapse-btn"
        onClick={() => setCollapsed((value) => !value)}
        title={collapsed ? "Expandir" : "Colapsar"}
        type="button"
      >
        {collapsed ? "»" : "«"}
      </button>

      <div className="sidebar__brand">
        <img
          src="/eestn1logo.png"
          alt="EEST N°1"
          className="sidebar__logo"
        />

        {!collapsed && (
          <div className="sidebar__brand-text">
            <span className="brand-name">
              EEST
              <span className="brand-name--accent">
                Flow
              </span>
            </span>

            <span className="brand-sub">
              Técnica Digital
            </span>
          </div>
        )}
      </div>

      <nav className="sidebar__nav">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              "nav-item" +
              (isActive ? " nav-item--active" : "")
            }
            title={collapsed ? item.label : undefined}
          >
            <img
              src={item.icon}
              alt=""
              className="icon"
            />

            {!collapsed && <span>{item.label}</span>}

            {item.to === "/notificaciones" &&
              unreadCount > 0 && (
                <span
                  className="nav-item__badge"
                  aria-label={`${unreadCount} notificaciones sin leer`}
                  title={`${unreadCount} notificaciones sin leer`}
                >
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar__section">
          <div className="sidebar__section-head">
            <span>Categorías</span>

            {isAdmin && (
              <button
                className="sidebar__add"
                title="Agregar categoría"
                onClick={onOpenAddCategory}
                type="button"
              >
                +
              </button>
            )}
          </div>

          {categoriesLoading ? (
            <p className="actions-modal__empty-hint">
              Cargando…
            </p>
          ) : (
            <ul className="cat-list">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className={
                    "cat-item-row" +
                    (isAdmin
                      ? " cat-item-row--admin"
                      : "")
                  }
                >
                  <button
                    className={
                      "cat-item" +
                      (activeCategory === category.id
                        ? " cat-item--active"
                        : "")
                    }
                    onClick={() =>
                      handleCategoryClick(category.id)
                    }
                    type="button"
                  >
                    <span
                      className="cat-dot"
                      style={{
                        background: category.color,
                      }}
                    />

                    <span className="cat-name">
                      {category.name}
                    </span>
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        className={
                          "cat-item__edit" +
                          (categories.length <= 1
                            ? " cat-item__edit--only"
                            : "")
                        }
                        title="Editar categoría"
                        aria-label={`Editar categoría ${category.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onRequestEditCategory(category);
                        }}
                        type="button"
                      >
                        ✎
                      </button>

                      {categories.length > 1 && (
                        <button
                          className="cat-item__delete"
                          title="Eliminar categoría"
                          aria-label={`Eliminar categoría ${category.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onRequestDeleteCategory(category);
                          }}
                          type="button"
                        >
                          🗑
                        </button>
                      )}
                    </>
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
          className={({ isActive }) =>
            "nav-item" +
            (isActive ? " nav-item--active" : "")
          }
          title={collapsed ? "Mi Equipo" : undefined}
        >
          <img
            src="/icons/team.svg"
            alt=""
            className="icon"
          />

          {!collapsed && <span>Mi Equipo</span>}
        </NavLink>
      </div>

      <div className="sidebar__user" ref={ref}>
        <button
          className="user-card"
          onClick={() => setMenuOpen((value) => !value)}
          disabled={collapsed || !currentUser}
          type="button"
        >
          <span
            className="avatar"
            style={{ background: "var(--color-green)" }}
          >
            {currentUser?.initials ?? "…"}
          </span>

          {!collapsed && (
            <>
              <span className="user-card__info">
                <strong>
                  {currentUser?.name ?? "Cargando…"}
                </strong>

                <small>
                  {currentUser?.accountType === "admin"
                    ? "Administrador"
                    : "Colaborador"}
                </small>
              </span>

              <span className="user-card__chevron">
                ⌄
              </span>
            </>
          )}
        </button>

        {menuOpen && (
          <div className="user-menu">
            <button
              className="user-menu__item"
              onClick={() => {
                onOpenPerfil();
                setMenuOpen(false);
              }}
              type="button"
            >
              <span
                aria-hidden="true"
                className="icon-sm themed-icon themed-icon--user"
              />
              Editar perfil
            </button>

            <button
              className="user-menu__item"
              onClick={() => {
                onOpenConfiguracion();
                setMenuOpen(false);
              }}
              type="button"
            >
              <span
                aria-hidden="true"
                className="icon-sm themed-icon themed-icon--settings"
              />
              Configuración
            </button>

            <button
              className="user-menu__item user-menu__item--danger"
              onClick={() => {
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
              type="button"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}