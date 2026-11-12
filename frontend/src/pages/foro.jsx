import { useEffect, useMemo, useRef, useState } from "react";
import { POST_TEXT_MAX_LENGTH } from "../formLimits.js";
import { FORUM_PAGE_SIZE, loadForumPage } from "../forumPagination.js";
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
  const [sectorsLoaded, setSectorsLoaded] = useState(false);
  const [linkedPost, setLinkedPost] = useState(null);
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
  const [pageRequest, setPageRequest] = useState({ page: 1, search: "" });
  const [pagination, setPagination] = useState({ page: 1, limit: FORUM_PAGE_SIZE, total: 0, totalPages: 0 });
  const currentPage = pagination.page;
  const pageBusy = useRef(false);
  const feedRef = useRef(null);
  const scrollAfterLoad = useRef(false);

  // Estado del modal de pineado.
  const [pinModal, setPinModal] = useState(null);
  const [pinLoading, setPinLoading] = useState(false);

  // ID de la publicación que se quiere eliminar.
  const [deletePostId, setDeletePostId] = useState(null);

  const inlineInputRef = useRef(null);
  const createInputRef = useRef(null);

  const selectedPost = posts.find(
    (post) => String(post.id) === String(selectedPostId),
  ) ?? (String(linkedPost?.id) === String(selectedPostId) ? linkedPost : null);

  /* ---------- cargar sectores ---------- */

  useEffect(() => {
    let cancelled = false;
    fetchSectors()
      .then((response) => {
        if (cancelled) return;
        setSectors(
          Array.isArray(response)
            ? response
            : response?.data || [],
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSectorsLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  /* ---------- paginación del servidor ---------- */

  useEffect(() => {
    if (!sectorsLoaded || !currentUserId) return;
    const controller = new AbortController();
    const load = async () => {
      pageBusy.current = true;
      setLoading(true);
      setError("");
      try {
        const data = await loadForumPage(fetchPosts, {
          ...pageRequest,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setPosts(data.posts.map((post) => mapPostFromApi(post, sectors, currentUserId)));
        setPagination(data.pagination);
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.response?.data?.message || error.message || "No se pudieron cargar las publicaciones.");
        }
      } finally {
        if (!controller.signal.aborted) {
          pageBusy.current = false;
          setLoading(false);
        }
      }
    };
    load();
    return () => controller.abort();
  }, [pageRequest, currentUserId, sectors, sectorsLoaded]);

  // Esperar al render de los nuevos posts: durante el loading el documento
  // puede ser demasiado corto para desplazarse al inicio del feed.
  useEffect(() => {
    if (loading || error || !scrollAfterLoad.current) return;
    scrollAfterLoad.current = false;
    feedRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    });
  }, [loading, error, posts]);

  // El buscador consulta todo el foro; cada nueva búsqueda comienza en página 1.
  useEffect(() => {
    if (search.trim() === pageRequest.search) return;
    const timer = setTimeout(() => {
      scrollAfterLoad.current = true;
      setPageRequest({ page: 1, search: search.trim() });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, pageRequest.search]);

  const refreshPage = (page = currentPage) => {
    setPageRequest({ page, search: search.trim() });
  };

  const handlePageChange = (page) => {
    if (pageBusy.current || loading || search.trim() !== pageRequest.search ||
        page < 1 || page > pagination.totalPages || (page === currentPage && !error)) return;
    pageBusy.current = true;
    setLoading(true);
    setOpenMenuId(null);
    scrollAfterLoad.current = true;
    setPageRequest({ page, search: pageRequest.search });
  };

  const retryPage = () => {
    if (pageBusy.current) return;
    pageBusy.current = true;
    setLoading(true);
    setPageRequest((previous) => ({ ...previous }));
  };

  /* ---------- cargar publicación desde enlace directo ---------- */

  useEffect(() => {
    if (loading || !selectedPostId) return;

    if (String(linkedPost?.id) === String(selectedPostId)) return;

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

        setLinkedPost(mapPostFromApi(raw, sectors, currentUserId));
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
    linkedPost,
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
    if (text.length > POST_TEXT_MAX_LENGTH) {
      toast.error(`La publicación no puede superar los ${POST_TEXT_MAX_LENGTH} caracteres.`);
      return false;
    }

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

        setNewPost("");
        setInlineFiles([]);
        setIsCreateActive(false);

        toast.success("Publicación creada");
        refreshPage(1);

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
      refreshPage();

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
    refreshPage();
  };

  /* ---------- guardar edición ---------- */

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    if (editText.length > POST_TEXT_MAX_LENGTH) {
      toast.error(`La publicación no puede superar los ${POST_TEXT_MAX_LENGTH} caracteres.`);
      return;
    }

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
      if (pageRequest.search) refreshPage();
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

        <div className="foro-feed-region" ref={feedRef} aria-busy={loading}>
          {error && (
            <div className="foro-empty" role="alert">
              <p>{error}</p>
              <button className="foro-pagination-btn" type="button" disabled={loading}
                onClick={retryPage}>Reintentar</button>
            </div>
          )}
          {loading && <p className="foro-empty" role="status">Cargando publicaciones...</p>}
          {!loading && (
            <ForoFeed
              posts={posts}
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

          )}
          <ForoPagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            totalPosts={pagination.total}
            visiblePosts={posts.length}
            loading={loading || search.trim() !== pageRequest.search}
            onPageChange={handlePageChange}
          />
        </div>

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
        onCommentCreated={(id) => {
          setPosts((previous) =>
            previous.map((post) =>
              String(post.id) === String(id)
                ? {
                    ...post,
                    commentsCount: post.commentsCount + 1,
                  }
                : post,
            ),
          );
          setLinkedPost((post) => post && String(post.id) === String(id)
            ? { ...post, commentsCount: post.commentsCount + 1 }
            : post);
        }}
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
