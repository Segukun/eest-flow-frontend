import { useState } from "react";
import { FiX, FiSend } from "react-icons/fi";
import "../styles/pages/Foro.css";

const CHAR_LIMIT = 1000;
const CHAR_STEP = 1000;

function CommentItem({ comment }) {
  const [visibleCount, setVisibleCount] = useState(CHAR_LIMIT);
  const isLong = comment.text.length > CHAR_LIMIT;
  const isFullyExpanded = visibleCount >= comment.text.length;
  const displayText = isLong && !isFullyExpanded ? comment.text.slice(0, visibleCount).trim() + "..." : comment.text;
  const remaining = comment.text.length - visibleCount;

  return (
    <div className="foro-comment">
      <div className="foro-comment-avatar" style={{ background: comment.color }}>{comment.avatar}</div>
      <div className="foro-comment-body">
        <div className="foro-comment-head">
          <strong>{comment.author}</strong> <span>{comment.time}</span>
        </div>
        <p className="foro-comment-text">{displayText}</p>
        {isLong && (
          <div className={`foro-ver-mas-wrapper ${visibleCount > CHAR_LIMIT ? "foro-ver-mas-wrapper--expanded foro-ver-mas-wrapper--comment-expanded" : ""}`}>
            {visibleCount <= CHAR_LIMIT ? (
              <button className="foro-ver-mas foro-ver-mas--comment" onClick={() => setVisibleCount(v => Math.min(v + CHAR_STEP, comment.text.length))} type="button">
                Ver más
              </button>
            ) : (
              <>
                <button 
                  className={`foro-ver-mas foro-ver-mas--comment ${!isFullyExpanded ? "foro-ver-mas--active" : "foro-ver-mas--disabled"}`} 
                  onClick={() => !isFullyExpanded && setVisibleCount(v => Math.min(v + CHAR_STEP, comment.text.length))} 
                  type="button"
                  disabled={isFullyExpanded}
                >
                  Ver más
                </button>
                <span className="foro-ver-mas-sep">·</span>
                <button className="foro-ver-mas foro-ver-mas--comment foro-ver-mas--menos" onClick={() => setVisibleCount(CHAR_LIMIT)} type="button">
                  Ver menos
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComentariosModal({ isOpen, post, onClose, onAddComment }) {
  const [newComment, setNewComment] = useState("");

  if (!isOpen || !post) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(post.id, newComment);
    setNewComment("");
  };

  return (
    <div className="foro-modal-overlay" onClick={onClose}>
      <div className="foro-modal" onClick={(e) => e.stopPropagation()}>
        <div className="foro-modal-head">
          <h3>Comentarios · {post.author}</h3>
          <button onClick={onClose} type="button"><FiX /></button>
        </div>
        <div className="foro-modal-post-preview">
          <p>{post.content.slice(0, 200)}{post.content.length > 200 ? "..." : ""}</p>
        </div>
        <div className="foro-modal-comments">
          {post.commentsList.length === 0 ? (
            <p className="foro-empty">No hay comentarios aún. Sé el primero!</p>
          ) : (
            post.commentsList.map(c => <CommentItem key={c.id} comment={c} />)
          )}
        </div>
        <form className="foro-modal-input" onSubmit={handleSubmit}>
          <input
            placeholder="Escribe un comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button type="submit" disabled={!newComment.trim()}><FiSend /></button>
        </form>
      </div>
    </div>
  );
}
