import { useEffect, useRef, useState } from "react";

import { FiX, FiFileText, FiTrash2, FiPaperclip } from "react-icons/fi";

import { useToast } from "./Toast.jsx";

import "../styles/components/PublicarModal.css";

const MAX_FILES = 10;

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getInitials(name = "") {
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

function formatSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PublicarModal({ isOpen, onClose, onPublish }) {
  const toast = useToast();

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const filesRef = useRef([]);

  filesRef.current = files;

  const user = getCurrentUser();

  const revokePreviews = (list) => {
    list.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
  };

  /*
   * Al abrir: limpia el estado y bloquea el scroll del fondo.
   * Al cerrar/desmontar: libera las previews.
   */
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    setText("");
    setFiles([]);
    setSubmitting(false);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // En celular no abrimos el teclado automáticamente.
    if (window.matchMedia("(pointer: fine)").matches) {
      textareaRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      revokePreviews(filesRef.current);
    };
  }, [isOpen]);

  /* Cerrar con Escape */
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const canSubmit = (text.trim() || files.length > 0) && !submitting;

  const handleOverlay = (event) => {
    if (event.target === event.currentTarget && !submitting) {
      onClose();
    }
  };

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);

    const remaining = MAX_FILES - files.length;

    if (selected.length > remaining) {
      toast.info(`Podés adjuntar hasta ${MAX_FILES} archivos.`);
    }

    const mapped = selected.slice(0, Math.max(remaining, 0)).map((file) => {
      const isImage = file.type.startsWith("image/");

      return {
        id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: formatSize(file.size),
        type: file.type,
        isImage,
        isPdf:
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf"),
        preview: isImage ? URL.createObjectURL(file) : null,
        file,
      };
    });

    setFiles((prev) => [...prev, ...mapped]);

    event.target.value = "";
  };

  const removeFile = (id) => {
    setFiles((prev) => {
      const target = prev.find((file) => file.id === id);

      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }

      return prev.filter((file) => file.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);

    try {
      const ok = await onPublish({ text, files });

      // Foro.createPost devuelve false si falló (ya muestra el toast de error).
      if (ok !== false) {
        onClose();
      }
    } catch (error) {
      console.error("Error publishing:", error);
      toast.error("No se pudo crear la publicación.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pm-overlay" onClick={handleOverlay}>
      <div
        className="pm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pm-title"
      >
        <div className="pm-header">
          <div>
            <h2 id="pm-title">Crear publicación</h2>
            <span>Compartí algo con la comunidad EEST</span>
          </div>

          <button
            className="pm-close"
            onClick={onClose}
            disabled={submitting}
            type="button"
            aria-label="Cerrar"
          >
            <FiX />
          </button>
        </div>

        <div className="pm-body">
          <div className="pm-user">
            <div className="pm-avatar">{getInitials(user?.name || "Tú")}</div>

            <div>
              <strong>{user?.name || "Tú"}</strong>
              <span>Se publica en tu sector</span>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            placeholder="Escribe algo..."
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={5}
          />

          {files.length > 0 && (
            <div className="pm-files-preview">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`pm-file-chip ${
                    file.isImage ? "pm-file-chip--image" : ""
                  }`}
                >
                  {file.isImage ? (
                    <img src={file.preview} alt={file.name} />
                  ) : (
                    <div className="pm-file-icon">
                      <FiFileText />
                    </div>
                  )}

                  <div className="pm-file-info">
                    <span>{file.name}</span>
                    <small>{file.size}</small>
                  </div>

                  <button
                    onClick={() => removeFile(file.id)}
                    type="button"
                    aria-label={`Quitar ${file.name}`}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pm-footer">
          <div className="pm-actions-left">
            <button
              className="pm-attach"
              onClick={() => inputRef.current?.click()}
              disabled={files.length >= MAX_FILES}
              type="button"
            >
              <FiPaperclip />
              <span className="pm-attach-label">Adjuntar</span>
            </button>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFiles}
              style={{ display: "none" }}
            />

            <span className="pm-hint">
              Imágenes o PDF ({files.length}/{MAX_FILES})
            </span>
          </div>

          <div className="pm-actions-right">
            <button
              className="pm-cancel"
              onClick={onClose}
              disabled={submitting}
              type="button"
            >
              Cancelar
            </button>

            <button
              className="pm-publish"
              onClick={handleSubmit}
              disabled={!canSubmit}
              type="button"
            >
              {submitting ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}