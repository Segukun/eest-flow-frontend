import { useEffect, useMemo, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";

import ComentariosModal from "../components/ComentariosModal.jsx";
import PublicarModal from "../components/PublicarModal.jsx";
import ConfirmPinModal from "../components/ConfirmPinModal.jsx";
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

import ForoSearch from "../components/ForoSearch.jsx";
import ForoCreate from "../components/ForoCreate.jsx";
import ForoFeed from "../components/ForoFeed.jsx";
import ForoImageModal from "../components/ForoImageModal.jsx";
import ForoPagination from "../components/ForoPagination.jsx";

import {
  getCurrentUser,
  getCurrentUserId,
  mapPostFromApi,
} from "../components/ForoHelpers.js";

import { CHAR_LIMIT, CHAR_STEP } from "../components/ForoConstants.js";
import "../styles/pages/Foro.css";

export default function Foro() {
  const toast = useToast();

  const currentUser = useMemo(() => getCurrentUser(), []);
  const currentUserId = useMemo(
    () => getCurrentUserId(currentUser),
    [currentUser],
  );

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

  const POSTS_PER_PAGE = 10;

  const inlineInputRef = useRef(null);
  const createInputRef = useRef(null);

  const selectedPost = posts.find(
    (p) => String(p.id) === String(selectedPostId),
  );

  useEffect(() => {
    fetchSectors()
      .then((r) =>
        setSectors(Array.isArray(r) ? r : r?.data || []),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetchPosts({
          page: 1,
          limit: 50,
        });

        const apiPosts = res?.data?.posts ?? res?.posts ?? [];

        setPosts(
          apiPosts.map((p) =>
            mapPostFromApi(p, sectors, currentUserId),
          ),
        );
      } catch (e) {
        setError(
          e.response?.data?.message ||
            "No se pudieron cargar las publicaciones.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUserId, sectors]);

  // Si el post del enlace directo no está entre los primeros cargados,
  // lo traemos aparte.
  useEffect(() => {
    if (loading || !selectedPostId) return;

    if (
      posts.some(
        (p) => String(p.id) === String(selectedPostId),
      )
    ) {
      return;
    }

    let cancelled = false;

    const loadPost = async () => {
      try {
        const res = await fetchPostById(selectedPostId);
        const raw = res?.data ?? res;

        if (cancelled || !raw?._id) return;

        setPosts((prev) => [
          mapPostFromApi(raw, sectors, currentUserId),
          ...prev,
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
  }, [loading, selectedPostId, posts, sectors, currentUserId, toast]);

  const closeComments = () => {
    setSelectedPostId(null);

    if (searchParams.get("post")) {
      const next = new URLSearchParams(searchParams);
      next.delete("post");

      setSearchParams(next, { replace: true });
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(".foro-post-menu-wrapper")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!createInputRef.current) return;

    createInputRef.current.style.height = "auto";

    const max = isCreateActive ? 160 : 40;

    createInputRef.current.style.height =
      `${Math.min(createInputRef.current.scrollHeight, max)}px`;
  }, [newPost, isCreateActive]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

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

      if (!text.trim() && !files.length) return;

      const res = await createPostRequest({
        content: [text.trim()],
        files: files.map((i) => i.file || i).filter(Boolean),
      });

      const created = res?.data;

      if (!created) {
        throw new Error("No devolvió post");
      }

      setPosts((prev) => [
        mapPostFromApi(created, sectors, currentUserId),
        ...prev,
      ]);

      setNewPost("");
      setInlineFiles([]);
      setIsCreateActive(false);

      toast.success("Publicación creada");
      setCurrentPage(1);
    } catch (e) {
      toast.error(
        e.response?.data?.message ||
          "No se pudo crear la publicación.",
      );
    }
  };

  // Abre el modal de confirmación al pulsar el icono de pin.
  const handlePinClick = (post) => {
    if (!canPinPosts || pinLoading) return;

    setPinModal({
      postId: post.id,
      pinned: !post.pinned,
    });
  };

  // Ejecuta el pineado o desanclado después de confirmar.
  const handleConfirmPin = async () => {
    if (!pinModal || pinLoading) return;

    const { postId, pinned } = pinModal;

    try {
      setPinLoading(true);

      const response = await pinPostRequest(postId, pinned);

      // Axios devuelve el cuerpo en response.data.
      const body = response?.data ?? response;
      const updatedPost = body?.data ?? body;

      const savedPinned =
        typeof updatedPost?.pinned === "boolean"
          ? updatedPost.pinned
          : pinned;

      setPosts((prev) =>
        prev.map((post) => {
          // Actualizar la publicación elegida.
          if (String(post.id) === String(postId)) {
            return {
              ...post,
              pinned: savedPinned,
            };
          }

          // Al pinear una nueva, desanclar todas las demás
          // también en el estado local.
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
    } catch (e) {
      toast.error(
        e.response?.data?.message ||
          "No se pudo actualizar el estado de anclado.",
      );
    } finally {
      setPinLoading(false);
    }
  };

  const handleInlineFiles = (e) => {
    const mapped = Array.from(e.target.files || []).map((file) => {
      const isImage = file.type.startsWith("image/");

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
        preview: isImage ? URL.createObjectURL(file) : null,
        url: isImage ? URL.createObjectURL(file) : null,
        file,
      };
    });

    setInlineFiles((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const handleLike = async (postId) => {
    const post = posts.find(
      (p) => String(p.id) === String(postId),
    );

    if (!post) return;

    try {
      if (post.liked) {
        const r = await unlikePostRequest(postId);
        const res = r?.data || {};

        setPosts((prev) =>
          prev.map((i) =>
            String(i.id) === String(postId)
              ? {
                  ...i,
                  liked: false,
                  likes:
                    res.likesCount ?? Math.max(0, i.likes - 1),
                }
              : i,
          ),
        );
      } else {
        const r = await likePostRequest(postId);
        const res = r?.data || {};

        setPosts((prev) =>
          prev.map((i) =>
            String(i.id) === String(postId)
              ? {
                  ...i,
                  liked: true,
                  likes: res.likesCount ?? i.likes + 1,
                }
              : i,
          ),
        );
      }
    } catch {
      toast.error("No se pudo actualizar el me gusta.");
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("¿Querés borrar esta publicación?")) return;

    try {
      await deletePostRequest(postId);

      setPosts((prev) =>
        prev.filter((p) => String(p.id) !== String(postId)),
      );

      setOpenMenuId(null);
      toast.success("Publicación eliminada");
    } catch (e) {
      toast.error(
        e.response?.data?.message || "No se pudo borrar.",
      );
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;

    try {
      const res = await updatePostRequest({
        postId: editingId,
        content: [editText.trim()],
      });

      const updated = res?.data;

      if (!updated) {
        throw new Error("No devolvió");
      }

      const mapped = mapPostFromApi(
        updated,
        sectors,
        currentUserId,
      );

      setPosts((prev) =>
        prev.map((p) =>
          String(p.id) === String(editingId)
            ? { ...p, ...mapped }
            : p,
        ),
      );

      setEditingId(null);
      setEditText("");

      toast.success("Publicación actualizada");
    } catch (e) {
      toast.error(
        e.response?.data?.message ||
          "No se pudo actualizar.",
      );
    }
  };

  const handleDownload = (attachment) => {
    try {
      if (attachment.file) {
        const url = URL.createObjectURL(attachment.file);
        const a = document.createElement("a");

        a.href = url;
        a.download = attachment.name || "archivo";

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
        return;
      }

      const dl = attachment.url || attachment.preview;

      if (!dl) {
        return toast.info(`No hay archivo: ${attachment.name}`);
      }

      const a = document.createElement("a");

      a.href = dl;
      a.download = attachment.name || "archivo";
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      toast.error("No se pudo descargar.");
    }
  };

  const handleVerMas = (post) => {
    const cur = visibleChars[post.id] || CHAR_LIMIT;

    setVisibleChars((prev) => ({
      ...prev,
      [post.id]: Math.min(
        cur + CHAR_STEP,
        post.content.length,
      ),
    }));
  };

  const handleVerMenos = (id) =>
    setVisibleChars((prev) => ({
      ...prev,
      [id]: CHAR_LIMIT,
    }));

  const filtered = posts.filter((p) => {
    const q = search.toLowerCase();

    return (
      p.content.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q) ||
      p.sectorName?.toLowerCase().includes(q)
    );
  });

  // Las publicaciones ancladas aparecen primero.
  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    return (
      new Date(b.createdAt || 0) -
      new Date(a.createdAt || 0)
    );
  });

  const totalPages = Math.ceil(
    sorted.length / POSTS_PER_PAGE,
  );

  const paginatedPosts = sorted.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  return (
    <div className="foro-layout">
      <div className="foro-container">
        <ForoSearch value={search} onChange={setSearch} />

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
            setInlineFiles((prev) =>
              prev.filter((f) => f.id !== id),
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
        />

        {error && <div className="foro-empty">{error}</div>}

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
              onStartEdit={(p) => {
                setEditingId(p.id);
                setEditText(p.content);
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
          setPosts((prev) =>
            prev.map((p) =>
              String(p.id) === String(id)
                ? {
                    ...p,
                    commentsCount: p.commentsCount + 1,
                  }
                : p,
            ),
          )
        }
      />

      <PublicarModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={createPost}
      />

      {/* Modal de confirmación para pinear o desanclar. */}
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
    </div>
  );
}