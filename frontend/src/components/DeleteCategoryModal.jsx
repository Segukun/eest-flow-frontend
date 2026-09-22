import { useApp } from "../context/AppContext";
import "../styles/components/category-modal.css";

export default function DeleteCategoryModal({ category, onClose }) {
  const { deleteCategory } = useApp();

  const confirm = () => {
    deleteCategory(category.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="delete-category-modal" onClick={(e) => e.stopPropagation()}>
        <span className="delete-category-modal__icon">⚠</span>
        <h2>Eliminar categoría</h2>
        <p>¿Está seguro que desea eliminar <strong>{category.name}</strong>?</p>

        <div className="delete-category-modal__actions">
          <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--danger-solid" onClick={confirm}>🗑 Eliminar</button>
        </div>
      </div>
    </div>
  );
}