import { FiMoreVertical, FiEdit2, FiTrash2, FiHeart, FiMessageCircle, FiDownload, FiCheck, FiX } from "react-icons/fi";
import { BsPin, BsPinFill } from "react-icons/bs";

export default function ForoPost({
  post, currentUserId, canPinPosts, onPin, editingId, editText, setEditText,
  visibleChars, CHAR_LIMIT, openMenuId, setOpenMenuId, onStartEdit, onSaveEdit,
  onCancelEdit, onDelete, onLike, onComment, onImageClick, onDownload, onVerMas, onVerMenos,
}) {
  const isOwn = post.isOwn || String(post.authorId) === String(currentUserId);
  const isEditing = String(editingId) === String(post.id);
  const isMenuOpen = String(openMenuId) === String(post.id);
  const visibleLimit = visibleChars[post.id] || CHAR_LIMIT;
  
  // FIX para que no rompa si content no es string
  const safeContent = typeof post.content === "string" ? post.content : "";
  const isLong = safeContent.length > CHAR_LIMIT;
  const isExpanded = visibleLimit > CHAR_LIMIT;
  const displayContent = isLong ? safeContent.slice(0, visibleLimit) : safeContent;

  const avatarBg = isOwn ? "#05903e" : post.avatarColor || "#05903e";

  return (
    <article className={`foro-post ${post.pinned ? "foro-post--pinned" : ""} ${isOwn ? "foro-post--own" : ""}`}>
      {post.pinned && <div className="foro-pinned-bar"><BsPinFill /> Anclada</div>}
      <div className="foro-post-head">
        <div className="foro-post-avatar" style={{ background: avatarBg, backgroundColor: avatarBg }}>
          {post.initials}
        </div>
        <div>
          <h3 style={isOwn ? { color: "#05903e" } : {}}>{post.author}</h3>
          <p>{post.sectorName ? `${post.sectorName} • ` : ""}{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}</p>
        </div>
        <div className="foro-post-menu-wrapper">
          <button className="foro-more-btn" onClick={() => setOpenMenuId(isMenuOpen ? null : post.id)}><FiMoreVertical /></button>
          {isMenuOpen && (
            <div className="foro-post-dropdown">
              {isOwn && <button onClick={() => onStartEdit(post)}><FiEdit2 /> Editar</button>}
              {isOwn && <button className="foro-dropdown-delete" onClick={() => onDelete(post.id)}><FiTrash2 /> Eliminar</button>}
            </div>
          )}
        </div>
      </div>
      <div className="foro-post-body">
        {isEditing ? (
          <div className="foro-edit-area">
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
            <div className="foro-edit-actions">
              <button className="foro-edit-cancel" onClick={onCancelEdit}><FiX /> Cancelar</button>
              <button className="foro-edit-save" onClick={onSaveEdit}><FiCheck /> Guardar</button>
            </div>
          </div>
        ) : (
          <>
            <p className="foro-post-text">{displayContent || "Sin contenido"}</p>
            {isLong && (
              <div className={`foro-ver-mas-wrapper ${isExpanded ? "foro-ver-mas-wrapper--expanded" : ""}`}>
                {!isExpanded ? (
                  <button className="foro-ver-mas" onClick={() => onVerMas(post)}>Ver más</button>
                ) : (
                  <button className="foro-ver-mas foro-ver-mas--menos" onClick={() => onVerMenos(post.id)}>Ver menos</button>
                )}
              </div>
            )}
          </>
        )}
        {post.attachments?.length > 0 && (
          <div className="foro-attachments">
            {post.attachments.map((att, i) => (
              <div key={i} className="foro-file foro-file-downloadable" onClick={() => onDownload(att)}>
                <div className="foro-file-icon">PDF</div>
                <div><p className="foro-file-name">{att.name}</p></div>
                <div className="foro-file-download"><FiDownload /> Descargar</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="foro-post-foot">
        <button className={post.liked ? "foro-liked" : ""} onClick={() => onLike(post.id)}><FiHeart fill={post.liked ? "currentColor" : "none"} /> {post.likes || 0}</button>
        <button onClick={() => onComment(post.id)}><FiMessageCircle /> {post.commentsCount || 0}</button>
        {canPinPosts && (
          <button className={`foro-post-pin ${post.pinned ? "is-pinned" : ""}`} onClick={() => onPin(post)}>
            {post.pinned ? <BsPinFill /> : <BsPin />}
          </button>
        )}
      </div>
    </article>
  );
}