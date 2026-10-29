import "../styles/pages/equipo.css";

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

  if (paginaActual < totalPaginas - 2) {
    paginas.push("…");
  }

  paginas.push(totalPaginas);

  return paginas;
};

export default function ForoPagination({
  currentPage,
  totalPages,
  totalPosts,
  visiblePosts,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  return (
    <footer className="team-pagination">
      <p className="team-pagination-count">
        Mostrando {visiblePosts} de {totalPosts} publicaciones
      </p>

      <nav
        className="team-pages"
        aria-label="Paginación del foro"
      >
        <button
          type="button"
          onClick={() =>
            onPageChange(
              Math.max(1, currentPage - 1)
            )
          }
          disabled={currentPage === 1}
        >
          Anterior
        </button>

        {obtenerNumerosDePagina(
          currentPage,
          totalPages
        ).map((pagina, i) =>
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
                pagina === currentPage
                  ? "team-page-number team-page-active"
                  : "team-page-number"
              }
              aria-current={
                pagina === currentPage
                  ? "page"
                  : undefined
              }
              onClick={() =>
                onPageChange(pagina)
              }
            >
              {pagina}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() =>
            onPageChange(
              Math.min(
                totalPages,
                currentPage + 1
              )
            )
          }
          disabled={currentPage === totalPages}
        >
          Siguiente
        </button>
      </nav>
    </footer>
  );
}