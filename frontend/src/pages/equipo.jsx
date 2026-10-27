import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiSearch,
  FiChevronDown,
  FiRefreshCw,
  FiMoreVertical,
  FiMail,
  FiPlus,
} from "react-icons/fi";

import { useApp } from "../context/AppContext";
import "../styles/pages/equipo.css";
import AgregarMiembro from "../components/AgregarMiembro.jsx";
import ModificarMiembro from "../components/ModificarMiembro.jsx";
import ConfirmacionEliminarMiembroModal from "../components/ConfirmacionEliminarMiembroModal.jsx";

const MIEMBROS_POR_PAGINA = 6;

const obtenerIniciales = (nombre) => {
  if (!nombre) return "";

  const partes = nombre.trim().split(" ");

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return (
    partes[0][0] +
    partes[partes.length - 1][0]
  ).toUpperCase();
};

const convertirMiembro = (usuario) => {
  const esAdmin = usuario.accountType === "admin";
  const sectoresUsuario = Array.isArray(usuario.sectors) ? usuario.sectors : [];
  const sectoresIds = sectoresUsuario
    .map((sector) => typeof sector === "string" ? sector : sector?._id || sector?.id)
    .filter(Boolean)
    .map(String);
  const nombresSectores = sectoresUsuario
    .map((sector) => typeof sector === "object" ? sector?.name : "")
    .filter(Boolean);

  return {
    id: usuario._id,
    nombre: usuario.name || "",
    iniciales: obtenerIniciales(usuario.name),
    rol: esAdmin ? "Administrador" : "Colaborador",
    tipoRol: esAdmin ? "direccion" : "",
    cuenta: esAdmin ? "Admin" : "Colaborador",
    accountType: esAdmin ? "admin" : "collaborator",
    sectors: sectoresIds,
    sectoresNombres: nombresSectores,
    area: nombresSectores.length ? nombresSectores.join(", ") : "Sin sector asignado",
    correo: usuario.email || "",
  };
};

const obtenerNumerosDePagina = (
  paginaActual,
  totalPaginas
) => {
  if (totalPaginas <= 5) {
    return Array.from(
      { length: totalPaginas },
      (_, i) => i + 1
    );
  }

  const paginas = [1];

  if (paginaActual > 3) {
    paginas.push("…");
  }

  const inicio = Math.max(
    2,
    paginaActual - 1
  );

  const fin = Math.min(
    totalPaginas - 1,
    paginaActual + 1
  );

  for (
    let pagina = inicio;
    pagina <= fin;
    pagina += 1
  ) {
    paginas.push(pagina);
  }

  if (
    paginaActual <
    totalPaginas - 2
  ) {
    paginas.push("…");
  }

  paginas.push(totalPaginas);

  return paginas;
};

const MemberCard = ({
  miembro,
  isAdmin,
  onModificar,
  onEliminar,
}) => {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;

    const cerrarAlClickAfuera = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          e.target
        )
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      cerrarAlClickAfuera
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        cerrarAlClickAfuera
      );
    };
  }, [menuOpen]);

  return (
    <article className="team-card">
      <div className="team-card-top">
        <div
          className={`team-avatar ${
            miembro.tipoRol
              ? `team-avatar-${miembro.tipoRol}`
              : ""
          }`}
        >
          {miembro.iniciales}
        </div>

        <div className="team-card-identity">
          <h3 className="team-card-name">
            {miembro.nombre}
          </h3>

          <p className="team-card-roles">
            <span
              className={`team-role ${
                miembro.tipoRol
                  ? `team-role-${miembro.tipoRol}`
                  : ""
              }`}
            >
              {miembro.rol}
            </span>

          </p>
        </div>

        {isAdmin && (
          <div
            className="team-card-menu-wrapper"
            ref={menuRef}
            onBlur={(e) => {
              if (
                !e.currentTarget.contains(
                  e.relatedTarget
                )
              ) {
                setMenuOpen(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setMenuOpen(false);
                menuButtonRef.current?.focus();
              }
            }}
          >
            <button
              type="button"
              className="team-card-menu"
              ref={menuButtonRef}
              aria-label={`Opciones de ${miembro.nombre}`}
              aria-expanded={menuOpen}
              aria-controls={`miembro-opciones-${miembro.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(
                  (open) => !open
                );
              }}
            >
              <FiMoreVertical aria-hidden="true" />
            </button>

            {menuOpen && (
              <div
                className="user-menu team-card-dropdown"
                id={`miembro-opciones-${miembro.id}`}
              >
                <button
                  type="button"
                  className="user-menu__item"
                  onClick={() => {
                    setMenuOpen(false);
                    onModificar(miembro);
                  }}
                >
                  Editar miembro
                </button>
                <button
                  type="button"
                  className="user-menu__item team-card-dropdown-delete"
                  onClick={() => {
                    setMenuOpen(false);
                    onEliminar(miembro);
                  }}
                >
                  Eliminar miembro
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ul className="team-card-details">
        <li>
          <span>{miembro.area}</span>
        </li>

        <li>
          <FiMail />

          <a
            href={`mailto:${miembro.correo}`}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {miembro.correo}
          </a>
        </li>
      </ul>
    </article>
  );
};

const Equipo = () => {
  const { currentUser, reloadUsers } = useApp();
  const isAdmin = currentUser?.accountType === "admin";
  const [miembros, setMiembros] =
    useState([]);

  const [
    cargandoMiembros,
    setCargandoMiembros,
  ] = useState(true);

  const [
    errorMiembros,
    setErrorMiembros,
  ] = useState("");

  const [busqueda, setBusqueda] =
    useState("");

  const [
    rolSeleccionado,
    setRolSeleccionado,
  ] = useState("");

  const [
    sectorSeleccionado,
    setSectorSeleccionado,
  ] = useState("");

  const [
    paginaActual,
    setPaginaActual,
  ] = useState(1);

  const [
    modalAgregarOpen,
    setModalAgregarOpen,
  ] = useState(false);

  const [
    modalModificarOpen,
    setModalModificarOpen,
  ] = useState(false);

  const [
    modalEliminarOpen,
    setModalEliminarOpen,
  ] = useState(false);

  const [
    miembroSeleccionado,
    setMiembroSeleccionado,
  ] = useState(null);

  const cargarMiembros = useCallback(async () => {
    try {
      setCargandoMiembros(true);
      setErrorMiembros("");

      const usuarios = await reloadUsers();

      const miembrosConvertidos =
        usuarios.map(convertirMiembro);

      setMiembros(miembrosConvertidos);
      setPaginaActual(1);
    } catch (error) {
      console.error(
        "Error al cargar miembros:",
        error
      );

      if (
        error.response?.status === 401
      ) {
        setErrorMiembros(
          "Tu sesión expiró. Volvé a iniciar sesión."
        );
      } else {
        setErrorMiembros(
          "No se pudieron cargar los miembros."
        );
      }
    } finally {
      setCargandoMiembros(false);
    }
  }, [reloadUsers]);

  useEffect(() => {
    cargarMiembros();
  }, [cargarMiembros]);

  const roles = useMemo(
    () =>
      [
        ...new Set(
          miembros
            .map(
              (miembro) =>
                miembro.rol
            )
            .filter(Boolean)
        ),
      ],
    [miembros]
  );

  const sectores = useMemo(
    () => [...new Set(miembros.flatMap((miembro) => miembro.sectoresNombres || []))].sort((a, b) => a.localeCompare(b, "es")),
    [miembros]
  );

  const hayFiltrosActivos =
    busqueda.trim() !== "" ||
    rolSeleccionado !== "" ||
    sectorSeleccionado !== "";

  const miembrosFiltrados =
    useMemo(() => {
      const termino =
        busqueda.trim().toLowerCase();

      return miembros.filter(
        (miembro) => {
          const pasaRol =
            rolSeleccionado === "" ||
            miembro.rol ===
              rolSeleccionado;

          const pasaSector =
            sectorSeleccionado === "" ||
            (miembro.sectoresNombres || []).includes(sectorSeleccionado);

          const pasaBusqueda =
            termino === "" ||
            miembro.nombre
              .toLowerCase()
              .includes(termino) ||
            miembro.area
              .toLowerCase()
              .includes(termino);

          return (
            pasaRol &&
            pasaSector &&
            pasaBusqueda
          );
        }
      );
    }, [
      miembros,
      busqueda,
      rolSeleccionado,
      sectorSeleccionado,
    ]);

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        miembrosFiltrados.length /
          MIEMBROS_POR_PAGINA
      )
    );

  const paginaSegura = Math.min(
    paginaActual,
    totalPaginas
  );

  const miembrosDeLaPagina =
    miembrosFiltrados.slice(
      (paginaSegura - 1) *
        MIEMBROS_POR_PAGINA,
      paginaSegura *
        MIEMBROS_POR_PAGINA
    );

  const cambiarFiltro = (
    actualizar
  ) => {
    actualizar();
    setPaginaActual(1);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setRolSeleccionado("");
    setSectorSeleccionado("");
    setPaginaActual(1);
  };

  const abrirModalModificar = (
    miembro
  ) => {
    if (!isAdmin) return;
    setMiembroSeleccionado(
      miembro
    );
    setModalModificarOpen(true);
  };

  const cerrarModalModificar = () => {
    setModalModificarOpen(false);
    setMiembroSeleccionado(null);
  };

  const abrirModalEliminar = (miembro) => {
    if (!isAdmin) return;
    setMiembroSeleccionado(miembro);
    setModalEliminarOpen(true);
  };

  const cerrarModalEliminar = () => {
    setModalEliminarOpen(false);
    setMiembroSeleccionado(null);
  };

  return (
    <>
      <main className="team-page">
        <header className="team-header">
          <div>
            <h1>
              Equipo Institucional
            </h1>

            <p>
              Gestión de profesores,
              directivos, personal
              técnico de taller y
              preceptoría.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              className="team-add-button"
              onClick={() =>
                isAdmin && setModalAgregarOpen(
                  true
                )
              }
            >
              <FiPlus />
              Agregar miembro
            </button>
          )}
        </header>

        <section className="team-filters-panel">
          <div className="team-filters">
            <div className="team-search">
              <FiSearch />

              <input
                type="search"
                placeholder="Buscar por nombre, apellido, especialidad (ej. Juan Smoes)"
                aria-label="Buscar integrantes"
                value={busqueda}
                onChange={(e) =>
                  cambiarFiltro(() =>
                    setBusqueda(
                      e.target.value
                    )
                  )
                }
              />
            </div>

            <div className="team-select-wrapper">
              <select
                className="team-select"
                aria-label="Filtrar por sector"
                value={
                  sectorSeleccionado
                }
                onChange={(e) =>
                  cambiarFiltro(() =>
                    setSectorSeleccionado(
                      e.target.value
                    )
                  )
                }
              >
                <option value="">
                  Todos los Sectores
                </option>

                {sectores.map(
                  (sector) => (
                    <option
                      key={sector}
                      value={sector}
                    >
                      {sector}
                    </option>
                  )
                )}
              </select>

              <FiChevronDown className="team-select-icon" />
            </div>

            <div className="team-select-wrapper">
              <select
                className="team-select"
                aria-label="Filtrar por rol"
                value={
                  rolSeleccionado
                }
                onChange={(e) =>
                  cambiarFiltro(() =>
                    setRolSeleccionado(
                      e.target.value
                    )
                  )
                }
              >
                <option value="">
                  Todos los Roles
                </option>

                {roles.map(
                  (rol) => (
                    <option
                      key={rol}
                      value={rol}
                    >
                      {rol}
                    </option>
                  )
                )}
              </select>

              <FiChevronDown className="team-select-icon" />
            </div>

            <button
              type="button"
              className="team-refresh"
              onClick={limpiarFiltros}
              aria-label="Limpiar filtros"
            >
              <FiRefreshCw />
            </button>
          </div>

        </section>

        {errorMiembros && (
          <p className="team-empty-state">
            {errorMiembros}
          </p>
        )}

        <section className="team-grid">
          {cargandoMiembros ? (
            <p className="team-empty-state">
              Cargando integrantes...
            </p>
          ) : miembrosDeLaPagina.length >
            0 ? (
            miembrosDeLaPagina.map(
              (miembro) => (
                <MemberCard
                  key={miembro.id}
                  miembro={miembro}
                  isAdmin={isAdmin}
                  onModificar={
                    abrirModalModificar
                  }
                  onEliminar={abrirModalEliminar}
                />
              )
            )
          ) : (
            <p className="team-empty-state">
              No se encontraron
              integrantes con esos
              filtros.
            </p>
          )}
        </section>

        <footer className="team-pagination">
          <p className="team-pagination-count">
            {hayFiltrosActivos ? (
              <>
                Mostrando{" "}
                {
                  miembrosDeLaPagina.length
                }{" "}
                de{" "}
                {
                  miembrosFiltrados.length
                }{" "}
                resultados filtrados
              </>
            ) : (
              <>
                Mostrando{" "}
                {
                  miembrosDeLaPagina.length
                }{" "}
                de {miembros.length}{" "}
                miembros registrados
                <span className="team-pagination-dot"></span>
                <span className="team-pagination-link">
                  Todos los sectores
                  activos
                </span>
              </>
            )}
          </p>

          <nav className="team-pages">
            <button
              type="button"
              onClick={() =>
                setPaginaActual(
                  (p) =>
                    Math.max(
                      1,
                      p - 1
                    )
                )
              }
              disabled={
                paginaSegura === 1
              }
            >
              Anterior
            </button>

            {obtenerNumerosDePagina(
              paginaSegura,
              totalPaginas
            ).map(
              (pagina, i) =>
                pagina === "…" ? (
                  <span
                    key={`dots-${i}`}
                    className="team-pages-dots"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={pagina}
                    type="button"
                    className={
                      pagina ===
                      paginaSegura
                        ? "team-page-number team-page-active"
                        : "team-page-number"
                    }
                    onClick={() =>
                      setPaginaActual(
                        pagina
                      )
                    }
                  >
                    {pagina}
                  </button>
                )
            )}

            <button
              type="button"
              onClick={() =>
                setPaginaActual(
                  (p) =>
                    Math.min(
                      totalPaginas,
                      p + 1
                    )
                )
              }
              disabled={
                paginaSegura ===
                totalPaginas
              }
            >
              Siguiente
            </button>
          </nav>
        </footer>
      </main>

      {isAdmin && modalAgregarOpen && (
        <AgregarMiembro
          onClose={() =>
            setModalAgregarOpen(
              false
            )
          }
          onAgregado={
            cargarMiembros
          }
        />
      )}

      {isAdmin && modalModificarOpen &&
        miembroSeleccionado && (
          <ModificarMiembro
            miembro={
              miembroSeleccionado
            }
            onClose={
              cerrarModalModificar
            }
            onActualizado={
              cargarMiembros
            }
          />
        )}

      {isAdmin && modalEliminarOpen && miembroSeleccionado && (
        <ConfirmacionEliminarMiembroModal
          miembro={miembroSeleccionado}
          onClose={cerrarModalEliminar}
          onEliminado={async () => {
            cerrarModalEliminar();
            await cargarMiembros();
          }}
        />
      )}
    </>
  );
};

export default Equipo;
