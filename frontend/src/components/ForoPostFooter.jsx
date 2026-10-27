import {
  FiHeart,
  FiMessageCircle
} from "react-icons/fi";

import { CiMapPin } from "react-icons/ci"

export default function ForoPostFooter({
  post,
  onLike,
  onComment,
  canPinPosts = false,
  onPin,
}) {
  return (
    <div className="foro-post-foot">
      <button
        className={post.liked ? "foro-liked" : ""}
        onClick={onLike}
        type="button"
        aria-label={
          post.liked
            ? "Quitar me gusta"
            : "Dar me gusta"
        }
      >
        <FiHeart
          fill={post.liked ? "#DC2626" : "none"}
          color={post.liked ? "#DC2626" : ""}
        />
        {post.likes}
      </button>

      <button
        onClick={onComment}
        type="button"
        aria-label="Ver comentarios"
      >
        <FiMessageCircle />
        {post.commentsCount}
      </button>

      {/*
        El botón de pineado solo aparece para administradores.
        El modal de confirmación se abre desde Foro.jsx.
      */}
      {canPinPosts && (
        <button
          className={`foro-post-pin ${
            post.pinned ? "is-pinned" : ""
          }`}
          onClick={() => onPin?.(post)}
          type="button"
          title={
            post.pinned
              ? "Desanclar publicación"
              : "Pinear publicación"
          }
          aria-label={
            post.pinned
              ? "Desanclar publicación"
              : "Pinear publicación"
          }
          aria-pressed={Boolean(post.pinned)}
        >
          <CiMapPin />
        </button>
      )}
    </div>
  );
}