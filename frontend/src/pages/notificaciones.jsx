import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import "../styles/pages/notificaciones.css"

const Notificaciones = () => {
  const [filtroActivo, setFiltroActivo] = useState("Todas");

  // Datos simulados de una base de datos
  const notificaciones = [
    {
      id: 1,
      tipo: "Vencimiento",
      titulo: "La tarea: Actualizar planilla ha vencido",
      descripcion: "Departamento de Alumnos • Ciclo Lectivo 2026",
      tiempo: "Hace 1 h",
      categoria: "Sistema",
      leida: false,
    },
    {
      id: 2,
      tipo: "Gestión de sectores",
      titulo: "Has sido movido de sector",
      descripcion: "Nuevo: Taller Electromecánica",
      tiempo: "Hace 3 h",
      categoria: "Sistema",
      leida: false,
    },
    {
      id: 3,
      tipo: "Comunidad escolar",
      titulo: "Tu publicación ha sido anclada en el foro",
      descripcion: '"Pautas de seguridad e higiene en pañol 2026"',
      tiempo: "Ayer",
      categoria: "Foro",
      leida: true,
    },
    {
      id: 4,
      tipo: "Preceptoría",
      titulo: "Nuevo aviso: Cronograma de mesas previas y equivalencias",
      descripcion: "Publicado por Regencia Técnica",
      tiempo: "Hace 2 d",
      categoria: "Sistema",
      leida: true,
    },
    {
      id: 5,
      tipo: "Sistema",
      titulo: "Se actualizó el calendario académico",
      descripcion: "Ya podés consultar las nuevas fechas.",
      tiempo: "Hace 3 d",
      categoria: "Sistema",
      leida: true,
    },
  ];

  // Filtrar notificaciones según el botón seleccionado
  const notificacionesFiltradas = notificaciones.filter((notificacion) => {
    if (filtroActivo === "Todas") return true;

    if (filtroActivo === "No leídas") {
      return !notificacion.leida;
    }

    return notificacion.categoria === filtroActivo;
  });

  const cantidadNoLeidas = notificaciones.filter(
    (notificacion) => !notificacion.leida
  ).length;

  return (
    <div id="contenedorNotificaciones">
      <Sidebar />

      <main id="paginaNotificaciones">
        <div className="encabezadoNotificaciones">
          <div>
            <p className="marcaNotificaciones">EEST FLOW</p>
            <h1>Notificaciones</h1>
          </div>
        </div>

        <div id="filtrosNotificaciones">
          <button
            className={`filtroNotificacion ${
              filtroActivo === "Todas" ? "activo" : ""
            }`}
            onClick={() => setFiltroActivo("Todas")}
          >
            Todas
          </button>

          <button
            className={`filtroNotificacion ${
              filtroActivo === "No leídas" ? "activo" : ""
            }`}
            onClick={() => setFiltroActivo("No leídas")}
          >
            No leídas
            <span className="contadorNoLeidas">{cantidadNoLeidas}</span>
          </button>

          <button
            className={`filtroNotificacion ${
              filtroActivo === "Sistema" ? "activo" : ""
            }`}
            onClick={() => setFiltroActivo("Sistema")}
          >
            Sistema
          </button>

          <button
            className={`filtroNotificacion ${
              filtroActivo === "Foro" ? "activo" : ""
            }`}
            onClick={() => setFiltroActivo("Foro")}
          >
            Foro
          </button>
        </div>

        <section className="listaNotificaciones">
          {notificacionesFiltradas.length > 0 ? (
            notificacionesFiltradas.map((notificacion) => (
              <article
                className={`notificacion ${
                  !notificacion.leida ? "noLeida" : ""
                }`}
                key={notificacion.id}
              >
                <div className="contenidoNotificacion">
                  <div className="cabeceraNotificacion">
                    <span className="tipoNotificacion">
                      {notificacion.tipo}
                    </span>

                    <span className="tiempoNotificacion">
                      {notificacion.tiempo}
                    </span>
                  </div>

                  <h2>{notificacion.titulo}</h2>

                  <p className="descripcionNotificacion">
                    {notificacion.descripcion}
                  </p>
                </div>

                <button className="botonVerNotificacion">
                  Ver <span>›</span>
                </button>
              </article>
            ))
          ) : (
            <div className="sinNotificaciones">
              <h2>No hay notificaciones</h2>
              <p>No se encontraron notificaciones en esta categoría.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Notificaciones;