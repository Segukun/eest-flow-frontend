export const FORUM_PAGE_SIZE = 10;

export function forumPageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const pages = [1];
  if (currentPage > 3) pages.push("…");
  for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page += 1) {
    pages.push(page);
  }
  if (currentPage < totalPages - 2) pages.push("…");
  pages.push(totalPages);
  return pages;
}

// El servidor puede devolver una página vacía si se eliminaron publicaciones.
// Reconsultamos una página válida, sin inventar totales a partir del array local.
export async function loadForumPage(fetchPage, { page, search, signal }) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetchPage({ page, limit: FORUM_PAGE_SIZE, search, signal });
    const data = response?.data;
    const pagination = data?.pagination;
    if (!Array.isArray(data?.posts) || !pagination ||
        !Number.isInteger(pagination.page) || pagination.page < 1 ||
        !Number.isInteger(pagination.limit) || pagination.limit < 1 ||
        !Number.isInteger(pagination.total) || pagination.total < 0 ||
        !Number.isInteger(pagination.totalPages) || pagination.totalPages < 0) {
      throw new Error("La respuesta del foro no contiene una paginación válida.");
    }
    const lastPage = Math.max(1, pagination.totalPages);
    if (pagination.page <= lastPage) return data;
    page = lastPage;
  }
  throw new Error("Las publicaciones cambiaron durante la carga. Intentá nuevamente.");
}
