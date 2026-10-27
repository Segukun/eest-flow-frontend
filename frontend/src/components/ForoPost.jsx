import { CiMapPin } from "react-icons/ci"

import ForoPostHeader from "./ForoPostHeader";
import ForoPostBody from "./ForoPostBody";
import ForoPostFooter from "./ForoPostFooter";

export default function ForoPost({
  post,
  currentUserId,
  isEditing: isEditingProp,
  editingId,
  editText,
  setEditText,
  visibleChars,
  CHAR_LIMIT,
  CHAR_STEP,
  openMenuId,
  setOpenMenuId,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onLike,
  onComment,
  onPin,
  canPinPosts,
  onImageClick,
  onDownload,
  onVerMas,
  onVerMenos,
}) {
  const visibleCount = visibleChars[post.id] || CHAR_LIMIT;

  const isLong = post.content.length > CHAR_LIMIT;

  const isFullyExpanded =
    visibleCount >= post.content.length;

  // Compatible con las props que envía Foro.jsx.
  const isEditing =
    isEditingProp ??
    (editingId != null &&
      String(editingId) === String(post.id));

  const displayText =
    isLong && !isFullyExpanded && !isEditing
      ? post.content.slice(0, visibleCount).trim() + "..."
      : post.content;

  const isOwnPost =
    String(post.authorId) === String(currentUserId);

  return (
    <div
      className={`foro-post ${
        post.pinned ? "foro-post--pinned" : ""
      }`}
    >
      {/* Indicador visible para todos cuando está anclada. */}
      {post.pinned && (
        <div className="foro-pinned-bar">
          <CiMapPin aria-hidden="true" />
          <span>Anclado</span>
        </div>
      )}

      <ForoPostHeader
        post={post}
        isOwnPost={isOwnPost}
        menuOpen={openMenuId === post.id}
        onToggleMenu={() =>
          setOpenMenuId(
            openMenuId === post.id ? null : post.id,
          )
        }
        onEdit={() => onStartEdit(post)}
        onDelete={() => onDelete(post.id)}
      />

      <ForoPostBody
        post={post}
        isEditing={isEditing}
        editText={editText}
        setEditText={setEditText}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
        displayText={displayText}
        isLong={isLong}
        visibleCount={visibleCount}
        CHAR_LIMIT={CHAR_LIMIT}
        isFullyExpanded={isFullyExpanded}
        onVerMas={() => onVerMas(post)}
        onVerMenos={() => onVerMenos(post.id)}
        onImageClick={onImageClick}
        onDownload={onDownload}
      />

      <ForoPostFooter
        post={post}
        onLike={() => onLike(post.id)}
        onComment={() => onComment(post.id)}
        canPinPosts={canPinPosts}
        onPin={onPin}
      />
    </div>
  );
}