import React from "react";

export default function ForoPagination({ currentPage, totalPages, totalPosts, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const delta = 1; // cuantas páginas alrededor de la actual

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  return (
    <div className="foro-pagination">
      <div className="foro-pagination-controls">
        <button
          className="foro-pagination-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          ← Anterior
        </button>

        {getPages().map((p, idx) =>
          p === "..." ? (
            <span key={`dots-${idx}`} className="foro-pagination-dots">...</span>
          ) : (
            <button
              key={p}
              className={`foro-pagination-btn ${currentPage === p ? "active" : ""}`}
              onClick={() => onPageChange(p)}
              type="button"
            >
              {p}
            </button>
          )
        )}

        <button
          className="foro-pagination-btn"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
