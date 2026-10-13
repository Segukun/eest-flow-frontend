import { useState } from "react";
import { useApp } from "../context/AppContext";
import "../styles/components/category-modal.css";

export default function DeleteCategoryModal({ category, onClose }) {
  const { deleteCategory } = useApp();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const confirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteCategory(category.id);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo eliminar la categoría.");
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="delete-category-modal" onClick={(e) => e.stopPropagation()}>
        <span className="delete-category-modal__icon">⚠</span>
        <h2>Eliminar categoría</h2>
        <p>¿Está seguro que desea eliminar <strong>{category.name}</strong>?</p>

        {error && <p className="label-creator__error">{error}</p>}

        <div className="delete-category-modal__actions">
          <button className="btn btn--ghost" onClick={onClose} disabled={deleting}>Cancelar</button>
          <button className="btn btn--danger-solid" onClick={confirm} disabled={deleting}>
            {deleting ? "Eliminando…" : "🗑 Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}