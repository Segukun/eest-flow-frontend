import { avatarStyle } from "../theme";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  FiSearch,
  FiFileText,
  FiHeart,
  FiMessageCircle,
  FiPlus,
  FiPaperclip,
  FiX,
  FiMoreHorizontal,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiDownload,
} from "react-icons/fi";

import ComentariosModal from "../components/ComentariosModal.jsx";
import PublicarModal from "../components/PublicarModal.jsx";
import { useToast } from "../components/Toast.jsx";

import {
  fetchPosts,
  createPostRequest,
  updatePostRequest,
  deletePostRequest,
} from "../api/posts";

import { likePostRequest, unlikePostRequest } from "../api/likes";

import { fetchSectors } from "../api/sectors";

import "../styles/pages/Foro.css";

const CHAR_LIMIT = 1000;
const CHAR_STEP = 1000;

const AVATAR_COLORS = ["#05903E", "#DC9655", "#2563EB", "#9333EA", "#EA580C"];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getCurrentUserId(user) {
  return user?._id || user?.id || null;
}

function getSectorId(sector) {
  return sector?._id || sector?.id || null;
}

function getSectorName(sector) {
  return sector?.name || sector?.title || "Sector";
}

function getAuthorInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

function getAvatarColor(name = "") {
  let hash = 0;

  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatRelativeDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "Ahora";
  }

  if (diffMinutes < 60) {
    return `hace ${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `hace ${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `hace ${diffDays}d`;
  }

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatFileSize(size) {
  if (!size) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/*
|--------------------------------------------------------------------------
| Map Post de API → formato usado por el frontend
|--------------------------------------------------------------------------
*/

function mapPostFromApi(post, sectors, currentUserId) {
  const authorObject =
    post.author && typeof post.author === "object" ? post.author : null;

  const sectorObject =
    post.sector && typeof post.sector === "object" ? post.sector : null;

  const sectorId = sectorObject?._id || post.sector || null;

  const fallbackSector = sectors.find(
    (sector) => String(getSectorId(sector)) === String(sectorId),
  );

  const authorId = authorObject?._id || post.author || null;
  const authorName = authorObject?.name || "Usuario";
  const isOwnPost = String(authorId) === String(currentUserId);

  const sectorName = sectorObject?.name || getSectorName(fallbackSector);

  return {
    id: post._id,

    author: isOwnPost ? "Tú" : authorName,
    authorId,
    authorName,

    role: [formatRelativeDate(post.createdAt), sectorName]
      .filter(Boolean)
      .join(" · "),

    avatar: getAuthorInitials(authorName),
    avatarColor: getAvatarColor(authorName),

    sectorId,
    sectorName,

    /*
     * El backend guarda content[]
     * y el frontend lo muestra como texto.
     */
    content: (post.content || [])
      .map((block) => (typeof block === "string" ? block : block?.text || ""))
      .filter(Boolean)
      .join("\n\n"),

    attachments: (post.attachments || []).map((attachment) => ({
      id:
        attachment.path ||
        attachment._id ||
        `${post._id}-${attachment.originalName}`,

      name: attachment.originalName || "Archivo",
      size: formatFileSize(attachment.size),

      type:
        attachment.type === "image"
          ? "image"
          : attachment.mimeType === "application/pdf"
            ? "pdf"
            : "file",

      preview: attachment.type === "image" ? attachment.url : null,
      url: attachment.url || null,
      path: attachment.path || null,
      mimeType: attachment.mimeType || null,
    })),

    likes: post.likesCount ?? 0,
    liked: post.isLiked ?? false,
    commentsCount: post.commentsCount ?? 0,
    pinned: post.pinned ?? false,
    active: post.active ?? true,
    createdAt: post.createdAt || null,
    updatedAt: post.updatedAt || null,
  };
}

/*
|--------------------------------------------------------------------------
| Foro
|--------------------------------------------------------------------------
*/

export default function Foro() {
  const toast = useToast();

  const currentUser = useMemo(() => getCurrentUser(), []);

  const currentUserId = useMemo(
    () => getCurrentUserId(currentUser),
    [currentUser],
  );

  const [posts, setPosts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [inlineFiles, setInlineFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isCreateActive, setIsCreateActive] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [visibleChars, setVisibleChars] = useState({});
  const [imageModal, setImageModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [error, setError] = useState("");

  const inlineInputRef = useRef(null);
  const createInputRef = useRef(null);

  const selectedPost = posts.find(
    (post) => String(post.id) === String(selectedPostId),
  );

  /*
  |--------------------------------------------------------------------------
  | Cargar sectores
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadSectors = async () => {
      try {
        setLoadingSectors(true);

        const result = await fetchSectors();

        const sectorList = Array.isArray(result) ? result : result?.data || [];

        setSectors(sectorList);
      } catch (error) {
        console.error("Error loading sectors:", error);
      } finally {
        setLoadingSectors(false);
      }
    };

    loadSectors();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Cargar publicaciones
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetchPosts({
          page: 1,
          limit: 20,
        });

        const apiPosts = response?.data?.posts ?? response?.posts ?? [];

        setPosts(
          apiPosts.map((post) => mapPostFromApi(post, sectors, currentUserId)),
        );
      } catch (error) {
        console.error("Error loading posts:", error);

        const message =
          error.response?.data?.message ||
          "No se pudieron cargar las publicaciones.";

        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
    // `toast` es estable (useMemo en el provider), no hace falta como dependencia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, sectors]);

  /*
  |--------------------------------------------------------------------------
  | Click afuera del menú
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".foro-post-menu-wrapper")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Resize textarea
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!createInputRef.current) {
      return;
    }

    createInputRef.current.style.height = "auto";

    const maxHeight = isCreateActive ? 160 : 40;

    const newHeight = Math.min(createInputRef.current.scrollHeight, maxHeight);

    createInputRef.current.style.height = `${newHeight}px`;
  }, [newPost, isCreateActive]);

  /*
  |--------------------------------------------------------------------------
  | Crear publicación
  |--------------------------------------------------------------------------
  */

  const createPost = async (arg) => {
    try {
      let text = "";
      let files = [];

      if (typeof arg === "string") {
        text = arg;
      } else if (arg && typeof arg === "object") {
        text = arg.text ?? arg.content ?? "";
        files = arg.files ?? [];
      }

      if (!text.trim() && files.length === 0) {
        return;
      }

      const response = await createPostRequest({
        content: [text.trim()],
        files: files.map((item) => item.file || item).filter(Boolean),
      });

      const createdPost = response?.data;

      if (!createdPost) {
        throw new Error("La API no devolvió la publicación creada.");
      }

      const mappedPost = mapPostFromApi(createdPost, sectors, currentUserId);

      setPosts((prev) => [mappedPost, ...prev]);

      setNewPost("");
      setInlineFiles([]);
      setIsCreateActive(false);

      toast.success("Publicación creada");
    } catch (error) {
      console.error("Error creating post:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "No se pudo crear la publicación.",
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Publicación inline
  |--------------------------------------------------------------------------
  */

  const handlePublishInline = async () => {
    if (!newPost.trim() && inlineFiles.length === 0) {
      return;
    }

    await createPost({
      text: newPost,
      files: inlineFiles,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Archivos inline
  |--------------------------------------------------------------------------
  */

  const handleInlineFiles = (event) => {
    const selected = Array.from(event.target.files || []);

    const mapped = selected.map((file) => {
      const isImage = file.type.startsWith("image/");

      return {
        id:
          window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,

        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type,
        isImage,

        isPdf:
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf"),

        preview: isImage ? URL.createObjectURL(file) : null,
        url: isImage ? URL.createObjectURL(file) : null,

        file,
      };
    });

    setInlineFiles((prev) => [...prev, ...mapped].slice(0, 10));

    event.target.value = "";
  };

  const removeInlineFile = (fileId) => {
    setInlineFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  /*
  |--------------------------------------------------------------------------
  | Likes
  |--------------------------------------------------------------------------
  */

  const handleLike = async (postId) => {
    const post = posts.find((item) => String(item.id) === String(postId));

    if (!post) {
      return;
    }

    try {
      if (post.liked) {
        const response = await unlikePostRequest(postId);
        const result = response?.data || {};

        setPosts((prev) =>
          prev.map((item) =>
            String(item.id) === String(postId)
              ? {
                  ...item,
                  liked: false,
                  likes: result.likesCount ?? Math.max(0, item.likes - 1),
                }
              : item,
          ),
        );
      } else {
        const response = await likePostRequest(postId);
        const result = response?.data || {};

        setPosts((prev) =>
          prev.map((item) =>
            String(item.id) === String(postId)
              ? {
                  ...item,
                  liked: true,
                  likes: result.likesCount ?? item.likes + 1,
                }
              : item,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating like:", error);

      toast.error(
        error.response?.data?.message || "No se pudo actualizar el me gusta.",
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Comentarios
  |--------------------------------------------------------------------------
  */

  const handleCommentCreated = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        String(post.id) === String(postId)
          ? { ...post, commentsCount: post.commentsCount + 1 }
          : post,
      ),
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Eliminar
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (postId) => {
    const confirmed = window.confirm("¿Querés borrar esta publicación?");

    if (!confirmed) {
      return;
    }

    try {
      await deletePostRequest(postId);

      setPosts((prev) =>
        prev.filter((post) => String(post.id) !== String(postId)),
      );

      setOpenMenuId(null);

      toast.success("Publicación eliminada");
    } catch (error) {
      console.error("Error deleting post:", error);

      toast.error(
        error.response?.data?.message || "No se pudo borrar la publicación.",
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Editar
  |--------------------------------------------------------------------------
  */

  const handleStartEdit = (post) => {
    setEditingId(post.id);
    setEditText(post.content);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      return;
    }

    try {
      const response = await updatePostRequest({
        postId: editingId,
        content: [editText.trim()],
      });

      const updatedPost = response?.data;

      if (!updatedPost) {
        throw new Error("La API no devolvió la publicación actualizada.");
      }

      const mappedPost = mapPostFromApi(updatedPost, sectors, currentUserId);

      setPosts((prev) =>
        prev.map((post) =>
          String(post.id) === String(editingId)
            ? { ...post, ...mappedPost }
            : post,
        ),
      );

      setEditingId(null);
      setEditText("");

      toast.success("Publicación actualizada");
    } catch (error) {
      console.error("Error updating post:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "No se pudo actualizar la publicación.",
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  /*
  |--------------------------------------------------------------------------
  | Ver más
  |--------------------------------------------------------------------------
  */

  const getVisibleCount = (postId) => visibleChars[postId] || CHAR_LIMIT;

  const handleVerMas = (post) => {
    const current = getVisibleCount(post.id);

    const next = Math.min(current + CHAR_STEP, post.content.length);

    setVisibleChars((prev) => ({
      ...prev,
      [post.id]: next,
    }));
  };

  const handleVerMenos = (postId) => {
    setVisibleChars((prev) => ({
      ...prev,
      [postId]: CHAR_LIMIT,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Descargar archivo
  |--------------------------------------------------------------------------
  */

  const handleDownload = (attachment) => {
    try {
      if (attachment.file) {
        const url = URL.createObjectURL(attachment.file);

        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = attachment.name || "archivo";

        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        URL.revokeObjectURL(url);

        return;
      }

      const downloadUrl = attachment.url || attachment.preview;

      if (!downloadUrl) {
        toast.info(`No hay archivo para descargar: ${attachment.name}`);

        return;
      }

      const anchor = document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download = attachment.name || "archivo";
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (error) {
      console.error("Error downloading file:", error);

      toast.error("No se pudo descargar el archivo.");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Buscador
  |--------------------------------------------------------------------------
  */

  const filteredPosts = posts.filter((post) => {
    const query = search.toLowerCase();

    return (
      post.content.toLowerCase().includes(query) ||
      post.author.toLowerCase().includes(query) ||
      post.sectorName?.toLowerCase().includes(query)
    );
  });

  /*
  |--------------------------------------------------------------------------
  | Orden
  |--------------------------------------------------------------------------
  */

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (a.pinned && !b.pinned) {
      return -1;
    }

    if (!a.pinned && b.pinned) {
      return 1;
    }

    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="foro-layout">
      <div className="foro-container">
        {/* BUSCADOR */}

        <div className="foro-search">
          <FiSearch />

          <input
            placeholder="Buscar..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {/* CREAR PUBLICACIÓN */}

        <div
          className={`foro-create-wrapper ${
            isCreateActive ? "foro-create-wrapper--active" : ""
          }`}
        >
          <div
            className={`foro-create ${
              isCreateActive ? "foro-create--active" : ""
            }`}
            onClick={() => createInputRef.current?.focus()}
          >
            <div className="foro-create-avatar">
              {getAuthorInitials(currentUser?.name || "Tú")}
            </div>

            <textarea
              ref={createInputRef}
              placeholder="Escribe algo..."
              value={newPost}
              onChange={(event) => setNewPost(event.target.value)}
              onFocus={() => setIsCreateActive(true)}
              onBlur={() => {
                if (!newPost.trim() && inlineFiles.length === 0) {
                  setIsCreateActive(false);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();

                  handlePublishInline();
                }
              }}
              rows={1}
            />

            <button
              className="foro-attach"
              onClick={() => inlineInputRef.current?.click()}
              type="button"
              title="Adjuntar"
            >
              <FiPaperclip />
            </button>

            <input
              ref={inlineInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleInlineFiles}
              style={{ display: "none" }}
            />

            <button
              className="foro-publish"
              onClick={handlePublishInline}
              disabled={!newPost.trim() && inlineFiles.length === 0}
              type="button"
            >
              Publicar
            </button>
          </div>

          {/* ARCHIVOS */}

          {inlineFiles.length > 0 && (
            <div className="foro-inline-files">
              {inlineFiles.map((file) => (
                <div key={file.id} className="foro-inline-file">
                  {file.isImage ? (
                    <img src={file.preview} alt={file.name} />
                  ) : (
                    <FiFileText />
                  )}

                  <span>{file.name}</span>

                  <button
                    onClick={() => removeInlineFile(file.id)}
                    type="button"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ESTADO */}

        {error && <div className="foro-empty">{error}</div>}

        {loading ? (
          <div className="foro-empty">Cargando publicaciones...</div>
        ) : (
          <div className="foro-feed">
            {sortedPosts.map((post) => {
              const visibleCount = getVisibleCount(post.id);
              const isLong = post.content.length > CHAR_LIMIT;
              const isFullyExpanded = visibleCount >= post.content.length;

              const displayText =
                isLong && !isFullyExpanded && editingId !== post.id
                  ? post.content.slice(0, visibleCount).trim() + "..."
                  : post.content;

              const isOwnPost = String(post.authorId) === String(currentUserId);

              return (
                <div
                  key={post.id}
                  className={`foro-post ${
                    post.pinned ? "foro-post--pinned" : ""
                  }`}
                >
                  {/* ANCLADO */}

                  {post.pinned && (
                    <div className="foro-pinned-bar">
                      <span>📌 Anclado</span>
                    </div>
                  )}

                  {/* HEADER */}

                  <div className="foro-post-head">
                    <div
                      className="foro-post-avatar"
                      style={avatarStyle(post.avatarColor)}
                    >
                      {post.avatar}
                    </div>

                    <div>
                      <h3>{post.author}</h3>
                      <p>{post.role}</p>
                    </div>

                    {isOwnPost && (
                      <div className="foro-post-menu-wrapper">
                        <button
                          className="foro-more-btn"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === post.id ? null : post.id,
                            )
                          }
                          type="button"
                        >
                          <FiMoreHorizontal />
                        </button>

                        {openMenuId === post.id && (
                          <div className="foro-post-dropdown">
                            <button
                              onClick={() => handleStartEdit(post)}
                              type="button"
                            >
                              <FiEdit2 />
                              Editar
                            </button>

                            <button
                              onClick={() => handleDelete(post.id)}
                              type="button"
                              className="foro-dropdown-delete"
                            >
                              <FiTrash2 />
                              Borrar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* BODY */}

                  <div className="foro-post-body">
                    {editingId === post.id ? (
                      <div className="foro-edit-area">
                        <textarea
                          value={editText}
                          onChange={(event) => setEditText(event.target.value)}
                          autoFocus
                          rows={5}
                          placeholder="Editá tu publicación..."
                        />

                        <div className="foro-edit-actions">
                          <button
                            onClick={handleCancelEdit}
                            type="button"
                            className="foro-edit-cancel"
                          >
                            Cancelar
                          </button>

                          <button
                            onClick={handleSaveEdit}
                            type="button"
                            className="foro-edit-save"
                            disabled={!editText.trim()}
                          >
                            <FiSave />
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="foro-post-text">{displayText}</p>

                        {isLong && (
                          <div
                            className={`foro-ver-mas-wrapper ${
                              visibleCount > CHAR_LIMIT
                                ? "foro-ver-mas-wrapper--expanded"
                                : ""
                            }`}
                          >
                            {visibleCount <= CHAR_LIMIT ? (
                              <button
                                className="foro-ver-mas"
                                onClick={() => handleVerMas(post)}
                                type="button"
                              >
                                Ver más
                              </button>
                            ) : (
                              <>
                                <button
                                  className={`foro-ver-mas ${
                                    !isFullyExpanded
                                      ? "foro-ver-mas--active"
                                      : "foro-ver-mas--disabled"
                                  }`}
                                  onClick={() => handleVerMas(post)}
                                  type="button"
                                  disabled={isFullyExpanded}
                                >
                                  Ver más
                                </button>

                                <span className="foro-ver-mas-sep">·</span>

                                <button
                                  className="foro-ver-mas foro-ver-mas--menos"
                                  onClick={() => handleVerMenos(post.id)}
                                  type="button"
                                >
                                  Ver menos
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* ARCHIVOS */}

                    {post.attachments.length > 0 && editingId !== post.id && (
                      <div className="foro-attachments">
                        {post.attachments.map((attachment) =>
                          attachment.type === "image" ? (
                            <div
                              key={attachment.id}
                              className="foro-attachment-image foro-attachment-thumb"
                              onClick={() => setImageModal(attachment)}
                              title="Click para ver en grande"
                            >
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                              />
                            </div>
                          ) : (
                            <div
                              key={attachment.id}
                              className="foro-file foro-file-downloadable"
                              onClick={() => handleDownload(attachment)}
                              title="Click para descargar"
                            >
                              <div className="foro-file-icon">
                                <FiFileText />
                              </div>

                              <div>
                                <p className="foro-file-name">
                                  {attachment.name}
                                </p>

                                <span>{attachment.size} · Documento</span>
                              </div>

                              <span className="foro-file-download">
                                <FiDownload />
                                PDF
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  {/* FOOTER */}

                  <div className="foro-post-foot">
                    <button
                      className={post.liked ? "foro-liked" : ""}
                      onClick={() => handleLike(post.id)}
                      type="button"
                    >
                      <FiHeart
                        fill={post.liked ? "#DC2626" : "none"}
                        color={post.liked ? "#DC2626" : ""}
                      />{" "}
                      {post.likes}
                    </button>

                    <button
                      onClick={() => setSelectedPostId(post.id)}
                      type="button"
                    >
                      <FiMessageCircle /> {post.commentsCount}
                    </button>
                  </div>
                </div>
              );
            })}

            {sortedPosts.length === 0 && (
              <p className="foro-empty">No se encontraron publicaciones</p>
            )}
          </div>
        )}

        {/* FAB */}

        <button
          className="foro-fab"
          onClick={() => setIsPublishModalOpen(true)}
          type="button"
        >
          <FiPlus />
        </button>
      </div>

      {/* MODAL IMAGEN */}

      {imageModal && (
        <div
          className="foro-image-modal-overlay"
          onClick={() => setImageModal(null)}
        >
          <div
            className="foro-image-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="foro-image-modal-top">
              <span className="foro-image-modal-title">
                {imageModal.name || "Imagen"}
              </span>

              <button
                className="foro-image-modal-close"
                onClick={() => setImageModal(null)}
                type="button"
              >
                <FiX />
              </button>
            </div>

            <div className="foro-image-modal-body">
              <img
                src={imageModal.url || imageModal.preview}
                alt={imageModal.name}
              />
            </div>

            <div className="foro-image-modal-bottom">
              <button
                className="foro-image-modal-download"
                onClick={() => handleDownload(imageModal)}
                type="button"
              >
                <FiDownload />
                Descargar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMENTARIOS */}

      <ComentariosModal
        isOpen={!!selectedPostId}
        post={selectedPost}
        onClose={() => setSelectedPostId(null)}
        onCommentCreated={handleCommentCreated}
      />

      {/* PUBLICAR MODAL */}

      <PublicarModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={createPost}
      />
    </div>
  );
}