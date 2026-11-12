import { forumPageNumbers } from "../forumPagination.js";

export default function ForoPagination({
  currentPage,
  totalPages,
  totalPosts,
  visiblePosts,
  onPageChange,
  loading = false,
}) {
  if (totalPages <= 1) return null;

  return (
    <footer className="foro-pagination">
      <p className="foro-pagination-info">
        Mostrando {visiblePosts} de {totalPosts} publicaciones
      </p>
      <nav className="foro-pagination-controls" aria-label="Paginación del foro">
        <button type="button" className="foro-pagination-btn"
          aria-label="Página anterior" disabled={loading || currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}>‹</button>
        {forumPageNumbers(currentPage, totalPages).map((page, index) =>
          page === "…" ? (
            <span key={`dots-${index}`} className="foro-pagination-dots" aria-hidden="true">…</span>
          ) : (
            <button key={page} type="button"
              className={`foro-pagination-btn${page === currentPage ? " active" : ""}`}
              aria-label={`Página ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
              disabled={loading} onClick={() => onPageChange(page)}>{page}</button>
          )
        )}
        <button type="button" className="foro-pagination-btn"
          aria-label="Página siguiente" disabled={loading || currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}>›</button>
      </nav>
    </footer>
  );
}
