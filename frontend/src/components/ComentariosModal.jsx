import { avatarStyle } from "../theme";
import {
  useEffect,
  useState,
} from "react";
import {
  FiX,
  FiSend,
} from "react-icons/fi";

import {
  fetchComments,
  createCommentRequest,
} from "../api/comments";

import "../styles/pages/Foro.css";

const CHAR_LIMIT = 1000;
const CHAR_STEP = 1000;

const AVATAR_COLORS = [
  "#05903E",
  "#DC9655",
  "#2563EB",
  "#9333EA",
  "#EA580C",
];

function getAvatarInitials(
  name = "",
) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (part) => part[0],
    )
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";
}

function getAvatarColor(
  name = "",
) {
  let hash = 0;

  for (
    let i = 0;
    i < name.length;
    i += 1
  ) {
    hash =
      name.charCodeAt(i) +
      ((hash << 5) - hash);
  }

  return AVATAR_COLORS[
    Math.abs(hash) %
      AVATAR_COLORS.length
  ];
}

function formatCommentTime(
  createdAt,
) {
  if (!createdAt) {
    return "";
  }

  const date = new Date(
    createdAt,
  );

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMinutes = Math.floor(
    (Date.now() -
      date.getTime()) /
      60000,
  );

  if (diffMinutes < 1) {
    return "Ahora";
  }

  if (diffMinutes < 60) {
    return `hace ${diffMinutes}m`;
  }

  const hours = Math.floor(
    diffMinutes / 60,
  );

  if (hours < 24) {
    return `hace ${hours}h`;
  }

  const days = Math.floor(
    hours / 24,
  );

  if (days < 7) {
    return `hace ${days}d`;
  }

  return date.toLocaleDateString(
    "es-AR",
  );
}

function mapCommentFromApi(
  comment,
) {
  const author =
    comment.author &&
    typeof comment.author ===
      "object"
      ? comment.author
      : null;

  const authorName =
    author?.name ||
    "Usuario";

  return {
    id: comment._id,

    author: authorName,

    avatar:
      getAvatarInitials(
        authorName,
      ),

    color:
      getAvatarColor(
        authorName,
      ),

    text:
      comment.content || "",

    time:
      formatCommentTime(
        comment.createdAt,
      ),

    createdAt:
      comment.createdAt,

    parentComment:
      comment.parentComment ||
      null,
  };
}

function CommentItem({
  comment,
}) {
  const [
    visibleCount,
    setVisibleCount,
  ] = useState(
    CHAR_LIMIT,
  );

  const isLong =
    comment.text.length >
    CHAR_LIMIT;

  const isFullyExpanded =
    visibleCount >=
    comment.text.length;

  const displayText =
    isLong &&
    !isFullyExpanded
      ? comment.text
          .slice(
            0,
            visibleCount,
          )
          .trim() + "..."
      : comment.text;

  return (
    <div className="foro-comment">
      <div
        className="foro-comment-avatar"
        style={avatarStyle(
          comment.color,
        )}
      >
        {comment.avatar}
      </div>

      <div className="foro-comment-body">
        <div className="foro-comment-head">
          <strong>
            {comment.author}
          </strong>

          <span>
            {comment.time}
          </span>
        </div>

        <p className="foro-comment-text">
          {displayText}
        </p>

        {isLong && (
          <div
            className={`foro-ver-mas-wrapper ${
              visibleCount >
              CHAR_LIMIT
                ? "foro-ver-mas-wrapper--expanded foro-ver-mas-wrapper--comment-expanded"
                : ""
            }`}
          >
            {visibleCount <=
            CHAR_LIMIT ? (
              <button
                className="foro-ver-mas foro-ver-mas--comment"
                onClick={() =>
                  setVisibleCount(
                    (current) =>
                      Math.min(
                        current +
                          CHAR_STEP,
                        comment
                          .text
                          .length,
                      ),
                  )
                }
                type="button"
              >
                Ver más
              </button>
            ) : (
              <>
                <button
                  className={`foro-ver-mas foro-ver-mas--comment ${
                    !isFullyExpanded
                      ? "foro-ver-mas--active"
                      : "foro-ver-mas--disabled"
                  }`}
                  onClick={() => {
                    if (
                      !isFullyExpanded
                    ) {
                      setVisibleCount(
                        (current) =>
                          Math.min(
                            current +
                              CHAR_STEP,
                            comment
                              .text
                              .length,
                          ),
                      );
                    }
                  }}
                  type="button"
                  disabled={
                    isFullyExpanded
                  }
                >
                  Ver más
                </button>

                <span className="foro-ver-mas-sep">
                  ·
                </span>

                <button
                  className="foro-ver-mas foro-ver-mas--comment foro-ver-mas--menos"
                  onClick={() =>
                    setVisibleCount(
                      CHAR_LIMIT,
                    )
                  }
                  type="button"
                >
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

export default function ComentariosModal({
  isOpen,
  post,
  onClose,
  onCommentCreated,
}) {
  const [
    newComment,
    setNewComment,
  ] = useState("");

  const [
    comments,
    setComments,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    if (!isOpen || !post) {
      return;
    }

    const loadComments =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetchComments(
              post.id,
              {
                page: 1,
                limit: 50,
              },
            );

          const apiComments =
            response?.data
              ?.comments ??
            response?.comments ??
            [];

          setComments(
            apiComments.map(
              mapCommentFromApi,
            ),
          );
        } catch (error) {
          console.error(
            "Error loading comments:",
            error,
          );

          setError(
            error.response?.data
              ?.message ||
              "No se pudieron cargar los comentarios.",
          );
        } finally {
          setLoading(false);
        }
      };

    loadComments();
  }, [
    isOpen,
    post,
  ]);

  useEffect(() => {
    if (!isOpen) {
      setNewComment("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen || !post) {
    return null;
  }

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !newComment.trim() ||
        sending
      ) {
        return;
      }

      try {
        setSending(true);
        setError("");

        const response =
          await createCommentRequest(
            post.id,
            newComment.trim(),
          );

        const createdComment =
          response?.data;

        if (!createdComment) {
          throw new Error(
            "La API no devolvió el comentario creado.",
          );
        }

        setComments((prev) => [
          ...prev,
          mapCommentFromApi(
            createdComment,
          ),
        ]);

        setNewComment("");

        onCommentCreated?.(
          post.id,
        );
      } catch (error) {
        console.error(
          "Error creating comment:",
          error,
        );

        setError(
          error.response?.data
            ?.message ||
            "No se pudo publicar el comentario.",
        );
      } finally {
        setSending(false);
      }
    };

  return (
    <div
      className="foro-modal-overlay"
      onClick={onClose}
    >
      <div
        className="foro-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="foro-modal-head">
          <h3>
            Comentarios ·{" "}
            {post.author}
          </h3>

          <button
            onClick={onClose}
            type="button"
          >
            <FiX />
          </button>
        </div>

        <div className="foro-modal-post-preview">
          <p>
            {post.content.slice(
              0,
              200,
            )}

            {post.content
              .length > 200
              ? "..."
              : ""}
          </p>
        </div>

        <div className="foro-modal-comments">
          {loading ? (
            <p className="foro-empty">
              Cargando comentarios...
            </p>
          ) : error ? (
            <p className="foro-empty">
              {error}
            </p>
          ) : comments.length ===
            0 ? (
            <p className="foro-empty">
              No hay comentarios
              aún. ¡Sé el primero!
            </p>
          ) : (
            comments.map(
              (comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                />
              ),
            )
          )}
        </div>

        {error &&
          !loading && (
            <p className="foro-empty">
              {error}
            </p>
          )}

        <form
          className="foro-modal-input"
          onSubmit={handleSubmit}
        >
          <input
            placeholder="Escribe un comentario..."
            value={newComment}
            onChange={(event) =>
              setNewComment(
                event.target.value,
              )
            }
            disabled={sending}
          />

          <button
            type="submit"
            disabled={
              !newComment.trim() ||
              sending
            }
          >
            <FiSend />
          </button>
        </form>
      </div>
    </div>
  );
}