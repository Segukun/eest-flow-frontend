
import { useState, useEffect, useRef } from "react";
import { FiX, FiFileText, FiTrash2, FiPaperclip } from "react-icons/fi";
import "../styles/components/PublicarModal.css";

export default function PublicarModal({ isOpen, onClose, onPublish }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setText("");
      setFiles([]);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    const mapped = selected.map(f => ({
      id: Date.now() + Math.random(),
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)} KB`,
      type: f.type,
      isImage: f.type.startsWith("image/"),
      isPdf: f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      file: f
    }));
    setFiles(prev => [...prev, ...mapped].slice(0, 5));
    if (e.target) e.target.value = "";
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = () => {
    if (!text.trim() && files.length === 0) return;
    onPublish({ text, files });
    setText("");
    setFiles([]);
    onClose();
  };

  return (
    <div className="pm-overlay" onClick={handleOverlay}>
      <div className="pm-modal">
        <div className="pm-header">
          <div><h2>Crear publicación</h2><span>Compartí algo con la comunidad EEST</span></div>
          <button className="pm-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="pm-body">
          <div className="pm-user"><div className="pm-avatar">R</div><div><strong>Tú</strong><span>Sector Técnico</span></div></div>
          <textarea placeholder="Escribe algo..." value={text} onChange={(e) => setText(e.target.value)} autoFocus rows={4} />
          {files.length > 0 && (
            <div className="pm-files-preview">
              {files.map(f => (
                <div key={f.id} className={`pm-file-chip ${f.isImage ? "pm-file-chip--image" : ""}`}>
                  {f.isImage ? <><img src={f.preview} alt={f.name} /><div className="pm-file-info"><span>{f.name}</span><small>{f.size}</small></div></> : <><div className="pm-file-icon"><FiFileText /></div><div className="pm-file-info"><span>{f.name}</span><small>{f.size}</small></div></>}
                  <button onClick={() => removeFile(f.id)}><FiTrash2 /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="pm-footer">
          <div className="pm-actions-left">
            <button className="pm-attach" onClick={() => inputRef.current?.click()} type="button"><FiPaperclip /> Adjuntar</button>
            <input ref={inputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFiles} style={{ display: 'none' }} />
            <span className="pm-hint">Imágenes o PDF (máx 5)</span>
          </div>
          <div className="pm-actions-right">
            <button className="pm-cancel" onClick={onClose} type="button">Cancelar</button>
            <button className="pm-publish" onClick={handleSubmit} disabled={!text.trim() && files.length === 0} type="button">Publicar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
