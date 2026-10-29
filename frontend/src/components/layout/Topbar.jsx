import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import "../../styles/layout/topbar.css";

const NAV = [
  { to: "/", label: "Inicio", icon: "/icons/home.svg", end: true },
  { to: "/sectores", label: "Sectores", icon: "/icons/teamsection.svg" },
  { to: "/foro", label: "Foro", icon: "/icons/forum.svg" },
  { to: "/notificaciones", label: "Notificaciones", icon: "/icons/bell.svg" },
  { to: "/equipo", label: "Mi Equipo", icon: "/icons/team.svg" },
];

export default function Topbar({
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

  const navigate = useNavigate();
  const isAdmin =
    currentUser?.accountType === "admin";

  const [open, setOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    navigate("/");
    setOpen(false);
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar__brand">
          <img
            src="/eestn1logo.png"
            alt="EEST N°1"
            className="topbar__logo"
          />

          <span className="brand-name">
            EEST
            <span className="brand-name--accent">
              Flow
            </span>
          </span>
        </div>

        <button
          className="topbar__burger"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {open && (
        <div
          className="drawer__backdrop"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={
          "drawer" + (open ? " drawer--open" : "")
        }
      >
        <div className="drawer__head">
          <div className="topbar__brand">
            <img
              src="/eestn1logo.png"
              alt=""
              className="topbar__logo"
            />

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
          </div>

          <button
            className="drawer__close"
            onClick={() => setOpen(false)}
            type="button"
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav className="drawer__nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                "nav-item" +
                (isActive ? " nav-item--active" : "")
              }
            >
              <img
                src={item.icon}
                alt=""
                className="icon"
              />

              <span>{item.label}</span>

              {item.to === "/notificaciones" &&
                unreadCount > 0 && (
                  <span
                    className="nav-item__badge"
                    aria-label={`${unreadCount} notificaciones sin leer`}
                  >
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}
            </NavLink>
          ))}

          <button
            className="nav-item"
            onClick={() =>
              setCatsOpen((value) => !value)
            }
            type="button"
          >
            <img
              src="/icons/list.svg"
              alt=""
              className="icon"
            />

            <span>Categorías</span>

            <span className="nav-item__chevron">
              {catsOpen ? "⌃" : "⌄"}
            </span>
          </button>

          {catsOpen &&
            (categoriesLoading ? (
              <p className="actions-modal__empty-hint">
                Cargando…
              </p>
            ) : (
              <ul className="cat-list cat-list--drawer">
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
                            setOpen(false);
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
                              setOpen(false);
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

                {isAdmin && (
                  <li>
                    <button
                      className="cat-item cat-item--add"
                      onClick={() => {
                        onOpenAddCategory();
                        setOpen(false);
                      }}
                      type="button"
                    >
                      <span className="cat-dot cat-dot--add">
                        +
                      </span>

                      <span className="cat-name">
                        Agregar categoría
                      </span>
                    </button>
                  </li>
                )}
              </ul>
            ))}
        </nav>

        <div className="drawer__user">
          <span
            className="avatar"
            style={{ background: "var(--color-green)" }}
          >
            {currentUser?.initials ?? "…"}
          </span>

          <div className="user-card__info">
            <strong>
              {currentUser?.name ?? "Cargando…"}
            </strong>

            <span className="role-chip">
              {currentUser?.accountType === "admin"
                ? "Administrador"
                : "Colaborador"}
            </span>
          </div>
        </div>

        <div className="drawer__actions">
          <button
            className="user-menu__item"
            onClick={() => {
              onOpenConfiguracion();
              setOpen(false);
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
      </aside>
    </>
  );
}