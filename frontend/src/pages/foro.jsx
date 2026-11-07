import { useEffect, useMemo, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";

import { useApp } from "../context/AppContext";

import ComentariosModal from "../components/ComentariosModal.jsx";
import PublicarModal from "../components/PublicarModal.jsx";
import ConfirmPinModal from "../components/ConfirmPinModal.jsx";
import DeleteForoPostModal from "../components/DeleteForoPostModal.jsx";
import { useToast } from "../components/Toast.jsx";

import {
  fetchPosts,
  fetchPostById,
  createPostRequest,
  updatePostRequest,
  deletePostRequest,
  pinPostRequest,
} from "../api/posts";

import { likePostRequest, unlikePostRequest } from "../api/likes";
import { fetchSectors } from "../api/sectors";

import useSubmitGuard from "../hooks/useSubmitGuard.js";

import ForoSearch from "../components/ForoSearch.jsx";
import ForoCreate from "../components/ForoCreate.jsx";
import ForoFeed from "../components/ForoFeed.jsx";
import ForoImageModal from "../components/ForoImageModal.jsx";
import ForoPagination from "../components/ForoPagination.jsx";

import { mapPostFromApi } from "../components/ForoHelpers.js";

import { CHAR_LIMIT, CHAR_STEP } from "../components/ForoConstants.js";
import "../styles/pages/Foro.css";

export default function Foro() {
  const toast = useToast();
  const publishGuard = useSubmitGuard(2000);

  // Usuario actualizado desde AppContext, incluyendo el avatar.
  const { currentUser } = useApp();

  const currentUserId = useMemo(() => {
    const id = currentUser?._id ?? currentUser?.id;
    return id ? String(id) : "";
  }, [currentUser]);

  // Solo los administradores pueden pinear publicaciones.
  const canPinPosts = currentUser?.accountType === "admin";

  const [posts, setPosts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [inlineFiles, setInlineFiles] = useState([]);
  const [search, setSearch] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedPostId, setSelectedPostId] = useState(
    () => searchParams.get("post"),
  );

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isCreateActive, setIsCreateActive] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [visibleChars, setVisibleChars] = useState({});
  const [imageModal, setImageModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Estado del modal de pineado.
  const [pinModal, setPinModal] = useState(null);
  const [pinLoading, setPinLoading] = useState(false);

  // ID de la publicación que se quiere eliminar.
  const [deletePostId, setDeletePostId] = useState(null);

  const POSTS_PER_PAGE = 10;

  const inlineInputRef = useRef(null);
  const createInputRef = useRef(null);

  const selectedPost = posts.find(
    (post) => String(post.id) === String(selectedPostId),
  );

  /* ---------- cargar sectores ---------- */

  useEffect(() => {
    fetchSectors()
      .then((response) =>
        setSectors(
          Array.isArray(response)
            ? response
            : response?.data || [],
        ),
      )
      .catch(() => {});
  }, []);

  /* ---------- cargar publicaciones ---------- */

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetchPosts({
          page: 1,
          limit: 50,
        });

        const apiPosts =
          response?.data?.posts ??
          response?.posts ??
          [];

        setPosts(
          apiPosts.map((post) =>
            mapPostFromApi(post, sectors, currentUserId),
          ),
        );
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "No se pudieron cargar las publicaciones.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUserId, sectors]);

  /* ---------- cargar publicación desde enlace directo ---------- */

  useEffect(() => {
    if (loading || !selectedPostId) return;

    if (
      posts.some(
        (post) => String(post.id) === String(selectedPostId),
      )
    ) {
      return;
    }

    let cancelled = false;

    const loadPost = async () => {
      try {
        const response = await fetchPostById(selectedPostId);
        const raw = response?.data ?? response;

        if (cancelled || !raw?._id) return;

        setPosts((previous) => [
          mapPostFromApi(raw, sectors, currentUserId),
          ...previous,
        ]);
      } catch {
        if (!cancelled) {
          toast.error("No se pudo abrir la publicación.");
        }
      }
    };

    loadPost();

    return () => {
      cancelled = true;
    };
  }, [
    loading,
    selectedPostId,
    posts,
    sectors,
    currentUserId,
    toast,
  ]);

  /* ---------- cerrar comentarios ---------- */

  const closeComments = () => {
    setSelectedPostId(null);

    if (searchParams.get("post")) {
      const next = new URLSearchParams(searchParams);
      next.delete("post");

      setSearchParams(next, {
        replace: true,
      });
    }
  };

  /* ---------- cerrar menú al hacer clic afuera ---------- */

  useEffect(() => {
    const handler = (event) => {
      if (!event.target.closest(".foro-post-menu-wrapper")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  /* ---------- ajustar altura del campo de publicación ---------- */

  useEffect(() => {
    if (!createInputRef.current) return;

    createInputRef.current.style.height = "auto";

    const max = isCreateActive ? 160 : 40;

    createInputRef.current.style.height =
      `${Math.min(createInputRef.current.scrollHeight, max)}px`;
  }, [newPost, isCreateActive]);

  /* ---------- reiniciar paginación al buscar ---------- */

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  /* ---------- crear publicación ---------- */

  const createPost = async (arg) => {
    let text = "";
    let files = [];

    if (typeof arg === "string") {
      text = arg;
    } else if (arg && typeof arg === "object") {
      text = arg.text ?? arg.content ?? "";
      files = arg.files ?? [];
    }

    if (!text.trim() && !files.length) return false;

    const result = await publishGuard.run(async () => {
      try {
        const response = await createPostRequest({
          content: [text.trim()],
          files: files
            .map((item) => item.file || item)
            .filter(Boolean),
        });

        const created = response?.data;

        if (!created) {
          throw new Error("No devolvió post");
        }

        setPosts((previous) => [
          mapPostFromApi(created, sectors, currentUserId),
          ...previous,
        ]);

        setNewPost("");
        setInlineFiles([]);
        setIsCreateActive(false);

        toast.success("Publicación creada");
        setCurrentPage(1);

        return true;
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "No se pudo crear la publicación.",
        );

        return false;
      }
    });

    return result === true;
  };

  /* ---------- pinear publicación ---------- */

  const handlePinClick = (post) => {
    if (!canPinPosts || pinLoading) return;

    setPinModal({
      postId: post.id,
      pinned: !post.pinned,
    });
  };

  const handleConfirmPin = async () => {
    if (!pinModal || pinLoading) return;

    const { postId, pinned } = pinModal;

    try {
      setPinLoading(true);

      const response = await pinPostRequest(postId, pinned);

      const body = response?.data ?? response;
      const updatedPost = body?.data ?? body;

      const savedPinned =
        typeof updatedPost?.pinned === "boolean"
          ? updatedPost.pinned
          : pinned;

      setPosts((previous) =>
        previous.map((post) => {
          if (String(post.id) === String(postId)) {
            return {
              ...post,
              pinned: savedPinned,
            };
          }

          if (savedPinned) {
            return {
              ...post,
              pinned: false,
            };
          }

          return post;
        }),
      );

      setPinModal(null);

      toast.success(
        savedPinned
          ? "Publicación anclada"
          : "Se desancló la publicación",
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "No se pudo actualizar el estado de anclado.",
      );
    } finally {
      setPinLoading(false);
    }
  };

  /* ---------- archivos inline ---------- */

  const handleInlineFiles = (event) => {
    const mapped = Array.from(event.target.files || []).map(
      (file) => {
        const isImage = file.type.startsWith("image/");

        const preview = isImage
          ? URL.createObjectURL(file)
          : null;

        return {
          id:
            crypto.randomUUID?.() ||
            `${Date.now()}-${Math.random()}`,
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: file.type,
          isImage,
          isPdf:
            file.type === "application/pdf" ||
            file.name.toLowerCase().endsWith(".pdf"),
          preview,
          url: preview,
          file,
        };
      },
    );

    setInlineFiles((previous) => [
      ...previous,
      ...mapped,
    ]);

    event.target.value = "";
  };

  /* ---------- me gusta ---------- */

  const handleLike = async (postId) => {
    const post = posts.find(
      (item) => String(item.id) === String(postId),
    );

    if (!post) return;

    try {
      if (post.liked) {
        const response = await unlikePostRequest(postId);
        const result = response?.data || {};

        setPosts((previous) =>
          previous.map((item) =>
            String(item.id) === String(postId)
              ? {
                  ...item,
                  liked: false,
                  likes:
                    result.likesCount ??
                    Math.max(0, item.likes - 1),
                }
              : item,
          ),
        );
      } else {
        const response = await likePostRequest(postId);
        const result = response?.data || {};

        setPosts((previous) =>
          previous.map((item) =>
            String(item.id) === String(postId)
              ? {
                  ...item,
                  liked: true,
                  likes:
                    result.likesCount ??
                    item.likes + 1,
                }
              : item,
          ),
        );
      }
    } catch {
      toast.error("No se pudo actualizar el me gusta.");
    }
  };

  /* ---------- eliminar publicación ---------- */

  const handleDelete = (postId) => {
    setOpenMenuId(null);
    setDeletePostId(postId);
  };

  const handleConfirmDelete = async () => {
    if (!deletePostId) return;

    await deletePostRequest(deletePostId);

    setPosts((previous) =>
      previous.filter(
        (post) => String(post.id) !== String(deletePostId),
      ),
    );

    toast.success("Publicación eliminada");
  };

  /* ---------- guardar edición ---------- */

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;

    try {
      const response = await updatePostRequest({
        postId: editingId,
        content: [editText.trim()],
      });

      const updated = response?.data;

      if (!updated) {
        throw new Error("No devolvió");
      }

      const mapped = mapPostFromApi(
        updated,
        sectors,
        currentUserId,
      );

      setPosts((previous) =>
        previous.map((post) =>
          String(post.id) === String(editingId)
            ? { ...post, ...mapped }
            : post,
        ),
      );

      setEditingId(null);
      setEditText("");

      toast.success("Publicación actualizada");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "No se pudo actualizar.",
      );
    }
  };

  /* ---------- descargar archivos ---------- */

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

      const downloadUrl =
        attachment.url || attachment.preview;

      if (!downloadUrl) {
        return toast.info(
          `No hay archivo: ${attachment.name}`,
        );
      }

      const anchor = document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download = attachment.name || "archivo";
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch {
      toast.error("No se pudo descargar.");
    }
  };

  /* ---------- ver más / ver menos ---------- */

  const handleVerMas = (post) => {
    const current = visibleChars[post.id] || CHAR_LIMIT;

    setVisibleChars((previous) => ({
      ...previous,
      [post.id]: Math.min(
        current + CHAR_STEP,
        post.content.length,
      ),
    }));
  };

  const handleVerMenos = (id) => {
    setVisibleChars((previous) => ({
      ...previous,
      [id]: CHAR_LIMIT,
    }));
  };

  /* ---------- búsqueda ---------- */

  const filtered = posts.filter((post) => {
    const query = search.toLowerCase();

    return (
      post.content.toLowerCase().includes(query) ||
      post.author.toLowerCase().includes(query) ||
      post.sectorName?.toLowerCase().includes(query)
    );
  });

  /* ---------- ordenar publicaciones ---------- */

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    return (
      new Date(b.createdAt || 0) -
      new Date(a.createdAt || 0)
    );
  });

  /* ---------- paginación ---------- */

  const totalPages = Math.ceil(
    sorted.length / POSTS_PER_PAGE,
  );

  const paginatedPosts = sorted.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  /* ---------- render ---------- */

  return (
    <div className="foro-layout">
      <div className="foro-container">
        <ForoSearch
          value={search}
          onChange={setSearch}
        />

        <ForoCreate
          currentUser={currentUser}
          newPost={newPost}
          setNewPost={setNewPost}
          inlineFiles={inlineFiles}
          createInputRef={createInputRef}
          inlineInputRef={inlineInputRef}
          isCreateActive={isCreateActive}
          setIsCreateActive={setIsCreateActive}
          onFiles={handleInlineFiles}
          onRemoveFile={(id) =>
            setInlineFiles((previous) =>
              previous.filter((file) => file.id !== id),
            )
          }
          onPublish={() => {
            if (newPost.trim() || inlineFiles.length) {
              createPost({
                text: newPost,
                files: inlineFiles,
              });
            }
          }}
          publishing={publishGuard.busy}
        />

        {error && (
          <div className="foro-empty">
            {error}
          </div>
        )}

        {loading ? (
          <div className="foro-empty">
            Cargando publicaciones...
          </div>
        ) : (
          <div>
            <ForoFeed
              posts={paginatedPosts}
              currentUserId={currentUserId}
              canPinPosts={canPinPosts}
              onPin={handlePinClick}
              editingId={editingId}
              editText={editText}
              setEditText={setEditText}
              visibleChars={visibleChars}
              CHAR_LIMIT={CHAR_LIMIT}
              CHAR_STEP={CHAR_STEP}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onStartEdit={(post) => {
                setEditingId(post.id);
                setEditText(post.content);
                setOpenMenuId(null);
              }}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={() => {
                setEditingId(null);
                setEditText("");
              }}
              onDelete={handleDelete}
              onLike={handleLike}
              onComment={setSelectedPostId}
              onImageClick={setImageModal}
              onDownload={handleDownload}
              onVerMas={handleVerMas}
              onVerMenos={handleVerMenos}
            />

            <ForoPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalPosts={sorted.length}
              visiblePosts={paginatedPosts.length}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        <button
          className="foro-fab"
          onClick={() => setIsPublishModalOpen(true)}
          type="button"
        >
          <FiPlus />
        </button>
      </div>

      <ForoImageModal
        image={imageModal}
        onClose={() => setImageModal(null)}
        onDownload={handleDownload}
      />

      <ComentariosModal
        isOpen={!!selectedPostId}
        post={selectedPost}
        onClose={closeComments}
        onCommentCreated={(id) =>
          setPosts((previous) =>
            previous.map((post) =>
              String(post.id) === String(id)
                ? {
                    ...post,
                    commentsCount: post.commentsCount + 1,
                  }
                : post,
            ),
          )
        }
      />

      <PublicarModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={createPost}
      />

      <ConfirmPinModal
        open={Boolean(pinModal)}
        pinned={Boolean(pinModal?.pinned)}
        loading={pinLoading}
        onClose={() => {
          if (!pinLoading) {
            setPinModal(null);
          }
        }}
        onConfirm={handleConfirmPin}
      />

      <DeleteForoPostModal
        open={Boolean(deletePostId)}
        onClose={() => setDeletePostId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}