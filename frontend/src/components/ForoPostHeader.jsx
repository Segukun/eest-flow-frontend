import { FiMoreHorizontal, FiEdit2, FiTrash2 } from "react-icons/fi";
import { avatarStyle } from "../theme";

export default function ForoPostHeader({ post, isOwnPost, menuOpen, onToggleMenu, onEdit, onDelete }) {
  return (
    <div className="foro-post-head">
      <div className="foro-post-avatar" style={avatarStyle(post.avatarColor)}>{post.avatar}</div>
      <div><h3>{post.author}</h3><p>{post.role}</p></div>
      {isOwnPost && (
        <div className="foro-post-menu-wrapper">
          <button className="foro-more-btn" onClick={onToggleMenu} type="button"><FiMoreHorizontal/></button>
          {menuOpen && (
            <div className="foro-post-dropdown">
              <button onClick={onEdit} type="button"><FiEdit2/> Editar</button>
              <button onClick={onDelete} type="button" className="foro-dropdown-delete"><FiTrash2/> Borrar</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
