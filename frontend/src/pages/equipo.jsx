import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiChevronDown,
  FiRefreshCw,
  FiMoreVertical,
  FiMail,
  FiClock,
  FiBookmark,
  FiPlus,
} from "react-icons/fi";

import { miembros, vistasRapidas, totalMiembros } from "./equipodata";
import "../styles/pages/equipo.css";
import AgregarMiembro from "../components/AgregarMiembro.jsx";


const MIEMBROS_POR_PAGINA = 3;

// Qué campo de cada miembro decide si entra en cada vista rápida.
// "administradores" se arma con el tipo de cuenta porque en los datos
// todavía no existe un tipoRol de administración como tal.
const filtrosPorVista = {
  todos: () => true,
  docentes: (miembro) => miembro.tipoRol === "docente",
  tecnicos: (miembro) => miembro.tipoRol === "taller",
  preceptoria: (miembro) => miembro.tipoRol === "preceptoria",
  administradores: (miembro) => miembro.cuenta === "Admin",
};

// Arma los números de página a mostrar, con "…" cuando hay muchas.
// Con pocos miembros esto simplemente muestra todo, pero ya queda listo
// para cuando la base de datos tenga más registros.
const obtenerNumerosDePagina = (paginaActual, totalPaginas) => {
  if (totalPaginas <= 5) {
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }

  const paginas = [1];

  if (paginaActual > 3) paginas.push("…");

  const inicio = Math.max(2, paginaActual - 1);
  const fin = Math.min(totalPaginas - 1, paginaActual + 1);

  for (let pagina = inicio; pagina <= fin; pagina += 1) {
    paginas.push(pagina);
  }

  if (paginaActual < totalPaginas - 2) paginas.push("…");

  paginas.push(totalPaginas);

  return paginas;
};

const MemberCard = ({ miembro }) => {
  return (
    <article
      className={
        miembro.destacado
          ? "team-card team-card-highlight"
          : "team-card"
      }
    >
      <div className="team-card-top">
        <div className={`team-avatar team-avatar-${miembro.tipoRol}`}>
          {miembro.iniciales}
          {miembro.disponible && (
            <span className="team-avatar-dot"></span>
          )}
        </div>

        <div className="team-card-identity">
          <h3 className="team-card-name">{miembro.nombre}</h3>

          <p className="team-card-roles">
            <span
              className={`team-role team-role-${miembro.tipoRol}`}
            >
              {miembro.rol}
            </span>

            <span className="team-separator"></span>

            <span className="team-account-type">
              {miembro.cuenta}
            </span>
          </p>
        </div>

        <button type="button" className="team-card-menu">
          <FiMoreVertical />
        </button>
      </div>

      <ul className="team-card-details">
        <li>
          <FiBookmark />
          <span>{miembro.area}</span>
        </li>

        <li>
          <FiMail />
          <a href={`mailto:${miembro.correo}`}>
            {miembro.correo}
          </a>
        </li>

        <li>
          <FiClock />
          <span>{miembro.turno}</span>
        </li>
      </ul>

      <div className="team-card-footer">
        <span className="team-status">
          <span className="team-status-dot"></span>
          {miembro.estado}
        </span>

        <button
          type="button"
          className="team-file-link"
          disabled
        >
          Ver expediente
        </button>
      </div>
    </article>
  );
};

const Equipo = () => {
  const [busqueda, setBusqueda] = useState("");
  const [vistaActiva, setVistaActiva] = useState("todos");
  const [rolSeleccionado, setRolSeleccionado] = useState("");
  const [sectorSeleccionado, setSectorSeleccionado] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const [modalAgregarOpen, setModalAgregarOpen] = useState(false);

  // Las opciones de los selects salen de los datos reales, no de una
  // lista aparte: si mañana se agrega un rol o un sector nuevo desde el
  // backend, el select lo va a mostrar solo.
  const roles = useMemo(
    () => [...new Set(miembros.map((miembro) => miembro.rol))],
    []
  );

  const sectores = useMemo(
    () => [...new Set(miembros.map((miembro) => miembro.area))],
    []
  );

  const hayFiltrosActivos =
    busqueda.trim() !== "" ||
    vistaActiva !== "todos" ||
    rolSeleccionado !== "" ||
    sectorSeleccionado !== "";

  const miembrosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return miembros.filter((miembro) => {
      const pasaVista = filtrosPorVista[vistaActiva](miembro);
      const pasaRol =
        rolSeleccionado === "" || miembro.rol === rolSeleccionado;
      const pasaSector =
        sectorSeleccionado === "" || miembro.area === sectorSeleccionado;
      const pasaBusqueda =
        termino === "" ||
        miembro.nombre.toLowerCase().includes(termino) ||
        miembro.area.toLowerCase().includes(termino);

      return pasaVista && pasaRol && pasaSector && pasaBusqueda;
    });
  }, [busqueda, vistaActiva, rolSeleccionado, sectorSeleccionado]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(miembrosFiltrados.length / MIEMBROS_POR_PAGINA)
  );

  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const miembrosDeLaPagina = miembrosFiltrados.slice(
    (paginaSegura - 1) * MIEMBROS_POR_PAGINA,
    paginaSegura * MIEMBROS_POR_PAGINA
  );

  // Cada vez que cambia un filtro, además de aplicarlo volvemos a la
  // página 1: si no, se podía quedar en una página que ya no existe.
  const cambiarFiltro = (actualizar) => {
    actualizar();
    setPaginaActual(1);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setVistaActiva("todos");
    setRolSeleccionado("");
    setSectorSeleccionado("");
    setPaginaActual(1);
  };

  return (
    <>
      <main className="team-page">
        <header className="team-header">
          <div>
            <h1>Equipo Institucional</h1>

            <p>
              Gestión de profesores, directivos, personal técnico de
              taller y preceptoría.
            </p>
          </div>

<button
  type="button"
  className="team-add-button"
  onClick={() => setModalAgregarOpen(true)}
>
  <FiPlus />
  Agregar miembro
</button>
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
                  cambiarFiltro(() => setBusqueda(e.target.value))
                }
              />

              <kbd>⌘K</kbd>
            </div>

            <div className="team-select-wrapper">
              <select
                className="team-select"
                aria-label="Filtrar por sector"
                value={sectorSeleccionado}
                onChange={(e) =>
                  cambiarFiltro(() => setSectorSeleccionado(e.target.value))
                }
              >
                <option value="">Todos los Sectores</option>
                {sectores.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
              <FiChevronDown className="team-select-icon" />
            </div>

            <div className="team-select-wrapper">
              <select
                className="team-select"
                aria-label="Filtrar por rol"
                value={rolSeleccionado}
                onChange={(e) =>
                  cambiarFiltro(() => setRolSeleccionado(e.target.value))
                }
              >
                <option value="">Todos los Roles</option>
                {roles.map((rol) => (
                  <option key={rol} value={rol}>
                    {rol}
                  </option>
                ))}
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

          <div className="team-quick-views">
            <span className="team-quick-views-label">
              Vistas rápidas:
            </span>

            {vistasRapidas.map((vista) => (
              <button
                key={vista.id}
                type="button"
                className={
                  vistaActiva === vista.id
                    ? "team-quick-view team-quick-view-active"
                    : "team-quick-view"
                }
                onClick={() =>
                  cambiarFiltro(() => setVistaActiva(vista.id))
                }
              >
                {vista.etiqueta}
              </button>
            ))}
          </div>
        </section>

        <section className="team-grid">
          {miembrosDeLaPagina.length > 0 ? (
            miembrosDeLaPagina.map((miembro) => (
              <MemberCard key={miembro.id} miembro={miembro} />
            ))
          ) : (
            <p className="team-empty-state">
              No se encontraron integrantes con esos filtros.
            </p>
          )}
        </section>

        <footer className="team-pagination">
          <p className="team-pagination-count">
            {hayFiltrosActivos ? (
              <>
                Mostrando {miembrosDeLaPagina.length} de{" "}
                {miembrosFiltrados.length} resultados filtrados
              </>
            ) : (
              <>
                Mostrando {miembrosDeLaPagina.length} de {totalMiembros}{" "}
                miembros registrados
                <span className="team-pagination-dot"></span>
                <span className="team-pagination-link">
                  Todos los sectores activos
                </span>
              </>
            )}
          </p>

          <nav className="team-pages">
            <button
              type="button"
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaSegura === 1}
            >
              Anterior
            </button>

            {obtenerNumerosDePagina(paginaSegura, totalPaginas).map(
              (pagina, i) =>
                pagina === "…" ? (
                  <span key={`dots-${i}`} className="team-pages-dots">
                    …
                  </span>
                ) : (
                  <button
                    key={pagina}
                    type="button"
                    className={
                      pagina === paginaSegura
                        ? "team-page-number team-page-active"
                        : "team-page-number"
                    }
                    onClick={() => setPaginaActual(pagina)}
                  >
                    {pagina}
                  </button>
                )
            )}

            <button
              type="button"
              onClick={() =>
                setPaginaActual((p) => Math.min(totalPaginas, p + 1))
              }
              disabled={paginaSegura === totalPaginas}
            >
              Siguiente
            </button>
          </nav>
        </footer>
      </main>
      {modalAgregarOpen && (
  <AgregarMiembro
    onClose={() => setModalAgregarOpen(false)}
  />
)}
    </>
  );
};

export default Equipo;