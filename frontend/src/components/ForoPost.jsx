
import { useEffect, useState } from "react";

import {
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiHeart,
  FiMessageCircle,
  FiDownload,
  FiCheck,
  FiX,
  FiFileText,
  FiImage,
} from "react-icons/fi";

import {
  BsPin,
  BsPinFill,
} from "react-icons/bs";

import { useApp } from "../context/AppContext";
import UserAvatar from "./layout/UserAvatar";

/* ============================================
   UTILIDADES DE ADJUNTOS
   ============================================ */

function getAttachmentName(attachment) {
  return (
    attachment?.originalName ||
    attachment?.originalname ||
    attachment?.filename ||
    attachment?.fileName ||
    attachment?.name ||
    attachment?.file?.name ||
    "Archivo adjunto"
  );
}

function getAttachmentUrl(attachment) {
  const candidates = [
    attachment?.url,
    attachment?.signedUrl,
    attachment?.signed_url,
    attachment?.publicUrl,
    attachment?.downloadUrl,
    attachment?.downloadURL,
    attachment?.previewUrl,
    attachment?.fileUrl,
    attachment?.file?.url,
    attachment?.file?.signedUrl,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }

    if (candidate && typeof candidate === "object") {
      const nested =
        candidate.url ||
        candidate.signedUrl ||
        candidate.href ||
        candidate.uri;

      if (typeof nested === "string" && nested.trim()) {
        return nested.trim();
      }
    }
  }

  return "";
}

function getAttachmentMimeType(attachment) {
  const candidates = [
    attachment?.mimeType,
    attachment?.mimetype,
    attachment?.contentType,
    attachment?.type,
    attachment?.fileType,
    attachment?.mediaType,
    attachment?.file?.type,
    attachment?.metadata?.mimetype,
    attachment?.metadata?.contentType,
  ];

  return (
    candidates.find(
      (value) =>
        typeof value === "string" &&
        value.trim().length > 0,
    ) || ""
  ).toLowerCase();
}

function getAttachmentPaths(attachment, url) {
  return [
    getAttachmentName(attachment),
    attachment?.path,
    attachment?.filePath,
    attachment?.storagePath,
    attachment?.objectPath,
    url,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function hasImageMetadata(attachment, url) {
  const mimeType = getAttachmentMimeType(attachment);
  const paths = getAttachmentPaths(attachment, url);

  return (
    attachment?.isImage === true ||
    attachment?.file?.isImage === true ||
    mimeType.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|avif)(?:[?#\s]|$)/i.test(paths)
  );
}

function hasPdfMetadata(attachment, url) {
  const mimeType = getAttachmentMimeType(attachment);
  const paths = getAttachmentPaths(attachment, url);

  return (
    attachment?.isPdf === true ||
    mimeType === "application/pdf" ||
    /\.pdf(?:[?#\s]|$)/i.test(paths)
  );
}

/* ============================================
   ARCHIVO DESCARGABLE
   ============================================ */

function PostFileAttachment({
  attachment,
  onDownload,
}) {
  const handleDownload = () => {
    if (typeof onDownload === "function") {
      onDownload(attachment);
      return;
    }

    const url = getAttachmentUrl(attachment);

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const isPdf = hasPdfMetadata(
    attachment,
    getAttachmentUrl(attachment),
  );

  const name = getAttachmentName(attachment);

  const url = getAttachmentUrl(attachment);

  return (
    <button
      className="foro-file foro-file-downloadable"
      type="button"
      onClick={handleDownload}
      disabled={!url && !attachment?.file}
      title={`Descargar ${name}`}
    >
      <span
        className={`foro-file-icon ${
          isPdf
            ? "foro-file-icon--pdf"
            : "foro-file-icon--generic"
        }`}
      >
        <FiFileText />

        <small>
          {isPdf ? "PDF" : "ARCHIVO"}
        </small>
      </span>

      <span className="foro-file-content">
        <span className="foro-file-name">
          {name}
        </span>

        <span className="foro-file-description">
          {isPdf
            ? "Documento PDF"
            : "Archivo adjunto"}
        </span>
      </span>

      <span className="foro-file-download">
        <FiDownload />
        Descargar
      </span>
    </button>
  );
}

/* ============================================
   IMAGEN O ARCHIVO DESCONOCIDO
   ============================================ */

function PostAttachment({
  attachment,
  onImageClick,
  onDownload,
}) {
  const url = getAttachmentUrl(attachment);
  const name = getAttachmentName(attachment);

  const knownImage = hasImageMetadata(attachment, url);
  const knownPdf = hasPdfMetadata(attachment, url);

  /*
   * Si conocemos el formato, lo utilizamos.
   *
   * Si no lo conocemos, intentamos cargar la URL como
   * imagen y dejamos que el navegador determine el resultado.
   */
  const [status, setStatus] = useState(() => {
    if (knownImage) return "image";
    if (knownPdf) return "file";
    return url ? "checking" : "file";
  });

  // Actualizar la detección cuando cambie la URL o el archivo.
  useEffect(() => {
    if (knownImage) {
      setStatus("image");
    } else if (knownPdf) {
      setStatus("file");
    } else {
      setStatus(url ? "checking" : "file");
    }
  }, [knownImage, knownPdf, url]);

  const openImage = () => {
    if (!url) return;

    const imageData = {
      ...attachment,
      name,
      url,
      preview: url,
      src: url,
    };

    if (typeof onImageClick === "function") {
      onImageClick(imageData);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Si es un PDF o un documento, mostramos su tarjeta.
  if (status === "file") {
    return (
      <PostFileAttachment
        attachment={attachment}
        onDownload={onDownload}
      />
    );
  }

  // Si está confirmada como imagen pero no tiene URL.
  if (!url) {
    return (
      <div className="foro-image-placeholder foro-image-placeholder--small">
        <FiImage />
        <span>Imagen no disponible</span>
        <small>{name}</small>
      </div>
    );
  }

  // Si la imagen confirmada no pudo cargarse.
  if (status === "broken-image") {
    return (
      <div className="foro-image-placeholder foro-image-placeholder--small">
        <FiImage />
        <span>No se pudo cargar</span>
        <small>{name}</small>
      </div>
    );
  }

  /*
   * Este mismo img resuelve el caso de metadatos ausentes:
   * - onLoad: sabemos que es una imagen.
   * - onError: no es una imagen renderizable y pasa a archivo.
   */
  return (
    <button
      className={`foro-attachment-thumb ${
        status === "checking"
          ? "foro-attachment-thumb--checking"
          : ""
      }`}
      type="button"
      onClick={openImage}
      title={`Ver ${name}`}
      aria-label={`Ver imagen ${name}`}
    >
      <img
        src={url}
        alt={name}
        loading="lazy"
        decoding="async"
        onLoad={() => {
          setStatus("image");
        }}
        onError={() => {
          setStatus(
            knownImage
              ? "broken-image"
              : "file",
          );
        }}
      />

      <span className="foro-attachment-overlay">
        <span className="foro-image-name">
          {name}
        </span>

        <span className="foro-download-hint">
          Ver imagen
        </span>
      </span>
    </button>
  );
}

/* ============================================
   PUBLICACIÓN
   ============================================ */

export default function ForoPost({
  post,
  currentUserId,
  canPinPosts,
  onPin,
  editingId,
  editText,
  setEditText,
  visibleChars,
  CHAR_LIMIT,
  openMenuId,
  setOpenMenuId,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onLike,
  onComment,
  onImageClick,
  onDownload,
  onVerMas,
  onVerMenos,
}) {
  const {
    users = [],
    currentUser,
  } = useApp();

  const isOwn =
    post.isOwn ||
    String(post.authorId) === String(currentUserId);

  const isEditing =
    String(editingId) === String(post.id);

  const isMenuOpen =
    String(openMenuId) === String(post.id);

  const visibleLimit =
    visibleChars[post.id] || CHAR_LIMIT;

  const safeContent =
    typeof post.content === "string"
      ? post.content
      : "";

  const isLong =
    safeContent.length > CHAR_LIMIT;

  const isExpanded =
    visibleLimit > CHAR_LIMIT;

  const displayContent = isLong
    ? safeContent.slice(0, visibleLimit)
    : safeContent;

  const avatarBg = isOwn
    ? "#05903e"
    : post.avatarColor || "#05903e";

  /* ---------- autor ---------- */

  const authorId = post.authorId
    ? String(post.authorId)
    : "";

  const authorUser =
    (authorId
      ? users.find(
          (user) =>
            String(user?._id ?? user?.id) === authorId,
        )
      : null) ||
    (isOwn ? currentUser : null) || {
      name: post.author,
      initials: post.initials,
      profilePicture: post.profilePicture ?? null,
    };

  /* ---------- adjuntos ---------- */

  const attachments = Array.isArray(post.attachments)
    ? post.attachments
    : [];

  return (
    <article
      className={`foro-post ${
        post.pinned ? "foro-post--pinned" : ""
      } ${
        isOwn ? "foro-post--own" : ""
      }`}
    >
      {post.pinned && (
        <div className="foro-pinned-bar">
          <BsPinFill />
          Anclada
        </div>
      )}

      {/* ENCABEZADO */}

      <div className="foro-post-head">
        <UserAvatar
          user={authorUser}
          className="foro-post-avatar"
          title={post.author}
          style={{
            backgroundColor: avatarBg,
          }}
        />

        <div>
          <h3
            style={
              isOwn
                ? { color: "#05903e" }
                : {}
            }
          >
            {post.author}
          </h3>

          <p>
            {post.sectorName
              ? `${post.sectorName} • `
              : ""}

            {post.createdAt
              ? new Date(
                  post.createdAt,
                ).toLocaleDateString()
              : ""}
          </p>
        </div>

        <div className="foro-post-menu-wrapper">
          <button
            className="foro-more-btn"
            onClick={() =>
              setOpenMenuId(
                isMenuOpen ? null : post.id,
              )
            }
            type="button"
            aria-label="Opciones de publicación"
          >
            <FiMoreVertical />
          </button>

          {isMenuOpen && (
            <div className="foro-post-dropdown">
              {isOwn && (
                <button
                  onClick={() => onStartEdit(post)}
                  type="button"
                >
                  <FiEdit2 />
                  Editar
                </button>
              )}

              {isOwn && (
                <button
                  className="foro-dropdown-delete"
                  onClick={() => onDelete(post.id)}
                  type="button"
                >
                  <FiTrash2 />
                  Eliminar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CONTENIDO */}

      <div className="foro-post-body">
        {isEditing ? (
          <div className="foro-edit-area">
            <textarea
              value={editText}
              onChange={(event) =>
                setEditText(event.target.value)
              }
              autoFocus
            />

            <div className="foro-edit-actions">
              <button
                className="foro-edit-cancel"
                onClick={onCancelEdit}
                type="button"
              >
                <FiX />
                Cancelar
              </button>

              <button
                className="foro-edit-save"
                onClick={onSaveEdit}
                type="button"
              >
                <FiCheck />
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="foro-post-text">
              {displayContent || "Sin contenido"}
            </p>

            {isLong && (
              <div
                className={`foro-ver-mas-wrapper ${
                  isExpanded
                    ? "foro-ver-mas-wrapper--expanded"
                    : ""
                }`}
              >
                {!isExpanded ? (
                  <button
                    className="foro-ver-mas"
                    onClick={() => onVerMas(post)}
                    type="button"
                  >
                    Ver más
                  </button>
                ) : (
                  <button
                    className="foro-ver-mas foro-ver-mas--menos"
                    onClick={() => onVerMenos(post.id)}
                    type="button"
                  >
                    Ver menos
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* ARCHIVOS E IMÁGENES */}

        {attachments.length > 0 && (
          <div className="foro-attachments">
            {attachments.map((attachment, index) => {
              const key =
                attachment._id ||
                attachment.id ||
                `${getAttachmentName(attachment)}-${index}`;

              return (
                <PostAttachment
                  key={key}
                  attachment={attachment}
                  onImageClick={onImageClick}
                  onDownload={onDownload}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ACCIONES */}

      <div className="foro-post-foot">
        <button
          className={post.liked ? "foro-liked" : ""}
          onClick={() => onLike(post.id)}
          type="button"
        >
          <FiHeart
            fill={
              post.liked
                ? "currentColor"
                : "none"
            }
          />

          {post.likes || 0}
        </button>

        <button
          onClick={() => onComment(post.id)}
          type="button"
        >
          <FiMessageCircle />
          {post.commentsCount || 0}
        </button>

        {canPinPosts && (
          <button
            className={`foro-post-pin ${
              post.pinned ? "is-pinned" : ""
            }`}
            onClick={() => onPin(post)}
            type="button"
            aria-label={
              post.pinned
                ? "Desanclar publicación"
                : "Anclar publicación"
            }
          >
            {post.pinned ? (
              <BsPinFill />
            ) : (
              <BsPin />
            )}
          </button>
        )}
      </div>
    </article>
  );
}
