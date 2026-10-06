import { avatarStyle } from "../theme";
import { useState, useRef, useEffect } from "react";
import { FiSearch, FiFileText, FiImage, FiHeart, FiMessageCircle, FiPlus, FiPaperclip, FiX, FiMoreHorizontal, FiEdit2, FiTrash2, FiSave, FiDownload } from "react-icons/fi";
import ComentariosModal from "../components/ComentariosModal.jsx";
import PublicarModal from "../components/PublicarModal.jsx";
import "../styles/pages/Foro.css";

const INITIAL_POSTS = [
  {
    id: 1,
    pinned: true,
    isEest: true,
    author: "Secretaría Académica",
    role: "hace 2h · Tesis 2T · Teoría de Examen",
    avatar: "EEST",
    avatarColor: "#05903E",
    title: "Estimada comunidad educativa",
    content: "Les informamos que se encuentra abierta la inscripción para las mesas de examen del próximo período. A continuación, les compartimos los detalles pertinentes:",
    bullets: ["Período regular: del 15 al 22 de Noviembre.", "Materias técnicas de taller: consultar con pab/ jef@prof de taller."],
    attachments: [{ id: "f1", name: "Cronograma_Almos_Examen_2026.pdf", size: "2.4 MB", type: "pdf" }],
    likes: 38, liked: false,
    commentsList: [
      { id: 1, author: "Juan Smoes", avatar: "JS", color: "#05903E", text: "Gracias por la info! Este comentario también es muy largo para probar el ver más en comentarios. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl quis aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc quis nisl. Sed euismod, nisl quis aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc quis nisl. Sed euismod, nisl quis aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc quis nisl. Sed euismod, nisl quis aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc quis nisl. Sed euismod, nisl quis aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc quis nisl. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl quis aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc quis nisl.", time: "hace 1h" },
      { id: 2, author: "Marta Costa", avatar: "MC", color: "#FF880F", text: "¿Hay mesa para 6to también?", time: "hace 45m" },
    ],
  },
  {
    id: 2,
    author: "Tú",
    role: "5h · Sector Técnico",
    avatar: "JS",
    avatarColor: "#DC9655",
    content: "Comparto registro de la práctica realizada hoy en el taller de electrotecnia con los alumnos de 5to año. Se completó con éxito el conexionado del tablero principal.",
    attachments: [{ id: "f2", name: "Conexion_tablero_5toA.jpg", type: "image", preview: null, caption: "Fotografía de la práctica en Taller", url: null }],
    likes: 19, liked: false,
    commentsList: [{ id: 3, author: "Claudio Bravo", avatar: "CB", color: "#DC9655", text: "Excelente trabajo chicos!", time: "hace 3h" }],
  },
];

const CHAR_LIMIT = 1000;
const CHAR_STEP = 1000;

export default function Foro() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [newPost, setNewPost] = useState("");
  const [inlineFiles, setInlineFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isCreateActive, setIsCreateActive] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editFiles, setEditFiles] = useState([]);
  const [visibleChars, setVisibleChars] = useState({}); // postId -> chars visibles
  const [imageModal, setImageModal] = useState(null); // {url, name}
  const inlineInputRef = useRef(null);
  const createInputRef = useRef(null);
  const editFilesInputRef = useRef(null);

  const selectedPost = posts.find(p => p.id === selectedPostId);
  const isOwnPost = (post) => post.author === "Tú";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".foro-post-menu-wrapper")) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateFocus = () => setIsCreateActive(true);
  const handleCreateBlur = () => { if (!newPost.trim() && inlineFiles.length === 0) setIsCreateActive(false); };

  useEffect(() => {
    if (createInputRef.current) {
      createInputRef.current.style.height = "auto";
      const max = isCreateActive ? 160 : 40;
      const newH = Math.min(createInputRef.current.scrollHeight, max);
      createInputRef.current.style.height = newH + "px";
    }
  }, [newPost, isCreateActive]);

  const createPost = (arg) => {
    let text = ""; let files = [];
    if (typeof arg === "string") text = arg;
    else if (arg && typeof arg === "object") { text = arg.text ?? arg.content ?? ""; files = arg.files ?? []; }
    if (!text.trim() && (!files || files.length === 0)) return;
    const attachments = (files || []).map(f => ({
      id: f.id || Date.now() + Math.random(), name: f.name, size: f.size || "",
      type: f.isImage ? "image" : (f.isPdf || f.name?.toLowerCase().endsWith(".pdf") ? "pdf" : "file"),
      preview: f.preview || null, url: f.preview || f.url || null, file: f.file || null
    }));
    const nuevo = { id: Date.now(), author: "Tú", role: "Ahora · Sector Técnico", avatar: "JS", avatarColor: "#05903E", content: text, attachments, pinned: false, likes: 0, liked: false, commentsList: [], isEest: false };
    setPosts([nuevo, ...posts]);
  };

  const handleInlineFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    const mapped = selected.map(f => ({
      id: Date.now() + Math.random(), name: f.name, size: `${(f.size / 1024).toFixed(1)} KB`, type: f.type, isImage: f.type.startsWith("image/"), isPdf: f.type === "application/pdf", preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null, url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null, file: f
    }));
    setInlineFiles(prev => [...prev, ...mapped]); e.target.value = "";
  };
  const removeInlineFile = (id) => setInlineFiles(prev => prev.filter(f => f.id !== id));
  const handlePublishInline = () => { if (!newPost.trim() && inlineFiles.length === 0) return; createPost({ text: newPost, files: inlineFiles }); setNewPost(""); setInlineFiles([]); setIsCreateActive(false); };
  const handleLike = (id) => setPosts(prev => prev.map(p => p.id !== id ? p : { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }));
  const handleAddComment = (postId, text) => { const comment = { id: Date.now(), author: "Tú", avatar: "JS", color: "#05903E", text, time: "Ahora" }; setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsList: [...p.commentsList, comment] } : p)); };

  const handleDelete = (id) => { setPosts(prev => prev.filter(p => p.id !== id)); setOpenMenuId(null); };
  const handleStartEdit = (post) => {
    setEditingId(post.id); setEditText(post.content);
    const normalized = (post.attachments || []).map(att => ({
      id: att.id, name: att.name, size: att.size || "", type: att.type,
      isImage: att.type === "image", isPdf: att.type === "pdf" || att.name?.toLowerCase().endsWith(".pdf"),
      preview: att.preview || att.url || null, url: att.url || att.preview || null, file: att.file || null, caption: att.caption || null,
    }));
    setEditFiles(normalized); setOpenMenuId(null);
  };
  const handleSaveEdit = () => {
    if (!editText.trim() && editFiles.length === 0) return;
    const newAttachments = editFiles.map(f => ({
      id: f.id, name: f.name, size: f.size || "", type: f.isImage ? "image" : (f.isPdf || f.name?.toLowerCase().endsWith(".pdf") ? "pdf" : "file"),
      preview: f.preview || f.url || null, url: f.url || f.preview || null, file: f.file || null, caption: f.caption || null,
    }));
    setPosts(prev => prev.map(p => p.id === editingId ? { ...p, content: editText, attachments: newAttachments } : p));
    setEditingId(null); setEditText(""); setEditFiles([]);
  };
  const handleCancelEdit = () => { setEditingId(null); setEditText(""); setEditFiles([]); };
  const handleEditFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    const mapped = selected.map(f => ({
      id: Date.now() + Math.random(), name: f.name, size: `${(f.size / 1024).toFixed(1)} KB`, type: f.type,
      isImage: f.type.startsWith("image/"), isPdf: f.type === "application/pdf",
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null, url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null, file: f
    }));
    setEditFiles(prev => [...prev, ...mapped]); e.target.value = "";
  };
  const removeEditFile = (id) => setEditFiles(prev => prev.filter(f => f.id !== id));

  // VER MAS INCREMENTAL POSTS
  const getVisibleCount = (postId) => visibleChars[postId] || CHAR_LIMIT;
  const handleVerMas = (post) => {
    const current = getVisibleCount(post.id);
    const next = Math.min(current + CHAR_STEP, post.content.length);
    setVisibleChars(prev => ({ ...prev, [post.id]: next }));
  };
  const handleVerMenos = (postId) => {
    setVisibleChars(prev => ({ ...prev, [postId]: CHAR_LIMIT }));
  };

  const handleDownload = (att) => {
    try {
      if (att.file) {
        const url = URL.createObjectURL(att.file);
        const a = document.createElement("a");
        a.href = url; a.download = att.name || "archivo";
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); return;
      }
      const downloadUrl = att.url || att.preview;
      if (downloadUrl) {
        const a = document.createElement("a");
        a.href = downloadUrl; a.download = att.name || "archivo";
        if (downloadUrl.startsWith("blob:")) {
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
        } else {
          a.target = "_blank"; a.rel = "noopener noreferrer";
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }
        return;
      }
      alert(`No hay archivo real para descargar: ${att.name}`);
    } catch (e) { console.error(e); }
  };

  const filteredPosts = posts.filter(p => p.content.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase()) || (p.title && p.title.toLowerCase().includes(search.toLowerCase())));
  const sortedPosts = [...filteredPosts].sort((a,b) => { if (a.pinned && !b.pinned) return -1; if (!a.pinned && b.pinned) return 1; return b.id - a.id; });

  return (
    <div className="foro-layout">
      <div className="foro-container">
        <div className="foro-search"><FiSearch /><input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className={`foro-create-wrapper ${isCreateActive ? "foro-create-wrapper--active" : ""}`} onClick={() => createInputRef.current?.focus()}>
          <div className={`foro-create ${isCreateActive ? "foro-create--active" : ""}`}>
            <div className="foro-create-avatar">R</div>
            <textarea 
              ref={createInputRef}
              placeholder="Escribe algo..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              onFocus={handleCreateFocus}
              onBlur={handleCreateBlur}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePublishInline(); } }}
              rows={1}
            />
            <button className="foro-attach" onClick={() => inlineInputRef.current?.click()} type="button" title="Adjuntar"><FiPaperclip /></button>
            <input ref={inlineInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleInlineFiles} style={{ display: "none" }} />
            <button className="foro-publish" onClick={handlePublishInline} disabled={!newPost.trim() && inlineFiles.length === 0}>Publicar</button>
          </div>
          {inlineFiles.length > 0 && (<div className="foro-inline-files">{inlineFiles.map(f => (<div key={f.id} className="foro-inline-file">{f.isImage ? <img src={f.preview} alt={f.name} /> : <FiFileText />}<span>{f.name}</span><button onClick={() => removeInlineFile(f.id)} type="button"><FiX /></button></div>))}</div>)}
        </div>
        <div className="foro-feed">
          {sortedPosts.map((post) => {
            const visibleCount = getVisibleCount(post.id);
            const isLong = post.content.length > CHAR_LIMIT;
            const isFullyExpanded = visibleCount >= post.content.length;
            const displayText = isLong && !isFullyExpanded && editingId !== post.id ? post.content.slice(0, visibleCount).trim() + "..." : post.content;
            const remaining = post.content.length - visibleCount;
            return (
              <div key={post.id} className={`foro-post ${post.pinned ? "foro-post--pinned" : ""}`}>
                {post.pinned && (<div className="foro-pinned-bar"><span>📌 Anclado</span></div>)}
                <div className="foro-post-head">
                  <div className="foro-post-avatar" style={avatarStyle(post.avatarColor)}>{post.avatar}</div>
                  <div><h3>{post.author}</h3><p>{post.role}</p></div>
                  {isOwnPost(post) && (
                    <div className="foro-post-menu-wrapper">
                      <button className="foro-more-btn" onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} type="button"><FiMoreHorizontal /></button>
                      {openMenuId === post.id && (
                        <div className="foro-post-dropdown">
                          <button onClick={() => handleStartEdit(post)} type="button"><FiEdit2 /> Editar</button>
                          <button onClick={() => handleDelete(post.id)} type="button" className="foro-dropdown-delete"><FiTrash2 /> Borrar</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="foro-post-body">
                  {post.title && <h2 className="foro-post-title">{post.title}</h2>}
                  {editingId === post.id ? (
                    <div className="foro-edit-area">
                      <textarea value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus rows={3} placeholder="Editá tu publicación..." />
                      {editFiles.length > 0 && (
                        <div className="foro-edit-files">
                          {editFiles.map(f => (
                            <div key={f.id} className="foro-edit-file">
                              {f.isImage ? (f.preview || f.url ? <img src={f.preview || f.url} alt={f.name} /> : <FiImage />) : <FiFileText />}
                              <span>{f.name}</span>
                              <button onClick={() => removeEditFile(f.id)} type="button"><FiX /></button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="foro-edit-file-actions">
                        <button className="foro-edit-add-file" onClick={() => editFilesInputRef.current?.click()} type="button"><FiPaperclip /> Agregar archivo</button>
                        <input ref={editFilesInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleEditFiles} style={{ display: "none" }} />
                      </div>
                      <div className="foro-edit-actions">
                        <button onClick={handleCancelEdit} type="button" className="foro-edit-cancel">Cancelar</button>
                        <button onClick={handleSaveEdit} type="button" className="foro-edit-save" disabled={!editText.trim() && editFiles.length === 0}><FiSave /> Guardar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="foro-post-text">{displayText}</p>
                      {isLong && (
                        <div className={`foro-ver-mas-wrapper ${visibleCount > CHAR_LIMIT ? "foro-ver-mas-wrapper--expanded" : ""}`}>
                          {visibleCount <= CHAR_LIMIT ? (
                            <button className="foro-ver-mas" onClick={() => handleVerMas(post)} type="button">
                              Ver más
                            </button>
                          ) : (
                            <>
                              <button 
                                className={`foro-ver-mas ${!isFullyExpanded ? "foro-ver-mas--active" : "foro-ver-mas--disabled"}`} 
                                onClick={() => handleVerMas(post)} 
                                type="button"
                                disabled={isFullyExpanded}
                              >
                                Ver más
                              </button>
                              <span className="foro-ver-mas-sep">·</span>
                              <button className="foro-ver-mas foro-ver-mas--menos" onClick={() => handleVerMenos(post.id)} type="button">
                                Ver menos
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {post.bullets && <ul className="foro-bullets">{post.bullets.map((b,i) => <li key={i}>{b}</li>)}</ul>}
                  {post.attachments && post.attachments.length > 0 && editingId !== post.id && (
                    <div className="foro-attachments">
                      {post.attachments.map(att => (
                        att.type === "image" ? (
                          <div key={att.id} className="foro-attachment-image foro-attachment-thumb" onClick={() => setImageModal(att)} title="Click para ver en grande">
                            {att.url || att.preview ? (<img src={att.url || att.preview} alt={att.name} />) : (<div className="foro-image-placeholder foro-image-placeholder--small"><FiImage /><span>{att.caption || att.name}</span></div>)}
                          </div>
                        ) : (
                          <div key={att.id} className="foro-file foro-file-downloadable" onClick={() => handleDownload(att)} title="Click para descargar">
                            <div className="foro-file-icon"><FiFileText /></div>
                            <div><p className="foro-file-name">{att.name}</p><span>{att.size} · Documento</span></div>
                            <span className="foro-file-download"><FiDownload /> PDF</span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
                <div className="foro-post-foot">
                  <button className={post.liked ? "foro-liked" : ""} onClick={() => handleLike(post.id)} type="button"><FiHeart fill={post.liked ? "#DC2626" : "none"} color={post.liked ? "#DC2626" : ""} /> {post.likes}</button>
                  <button onClick={() => setSelectedPostId(post.id)} type="button"><FiMessageCircle /> {post.commentsList.length}</button>
                </div>
              </div>
            );
          })}
          {sortedPosts.length === 0 && <p className="foro-empty">No se encontraron publicaciones</p>}
        </div>
        <button className="foro-fab" onClick={() => setIsPublishModalOpen(true)} type="button"><FiPlus /></button>
      </div>
      {imageModal && (
        <div className="foro-image-modal-overlay" onClick={() => setImageModal(null)}>
          <div className="foro-image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="foro-image-modal-top">
              <span className="foro-image-modal-title">{imageModal.name || "Imagen"}</span>
              <button className="foro-image-modal-close" onClick={() => setImageModal(null)} type="button"><FiX /></button>
            </div>
            <div className="foro-image-modal-body">
              <img src={imageModal.url || imageModal.preview} alt={imageModal.name} />
            </div>
            <div className="foro-image-modal-bottom">
              <button className="foro-image-modal-download" onClick={() => { handleDownload(imageModal); }} type="button"><FiDownload /> Descargar</button>
            </div>
          </div>
        </div>
      )}
      <ComentariosModal isOpen={!!selectedPostId} post={selectedPost} onClose={() => setSelectedPostId(null)} onAddComment={handleAddComment} />
      <PublicarModal isOpen={isPublishModalOpen} onClose={() => setIsPublishModalOpen(false)} onPublish={createPost} />
    </div>
  );
}
