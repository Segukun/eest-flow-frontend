import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFileText,
  FiImage,
  FiPaperclip,
  FiPlus,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";

import "../styles/components/task-attachments-modal.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 10;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const getAttachmentId = (file) =>
  file?._id ??
  file?.id ??
  file?.path ??
  file?.url ??
  file?.publicUrl;

const getAttachmentName = (file) =>
  file?.originalName ??
  file?.originalname ??
  file?.name ??
  file?.filename ??
  "Archivo adjunto";

const getAttachmentType = (file) =>
  file?.mimeType ?? file?.mimetype ?? file?.type ?? "";

const getAttachmentUrl = (file) =>
  file?.url ??
  file?.publicUrl ??
  file?.signedUrl ??
  file?.downloadUrl ??
  "";

const isImageFile = (file) => {
  const type = getAttachmentType(file).toLowerCase();

  return (
    type.startsWith("image/") ||
    /\.(jpe?g|png|webp)$/i.test(getAttachmentName(file))
  );
};

const formatFileSize = (bytes) => {
  if (!Number.isFinite(Number(bytes)) || Number(bytes) < 0) {
    return "Tamaño no disponible";
  }

  const size = Number(bytes);

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Modal independiente para administrar los adjuntos de una tarea.
 *
 * Props:
 * - task: tarea actual.
 * - onClose: cierra el modal.
 * - onUpload(files): recibe archivos File para subir.
 * - onDelete(attachment): recibe el archivo que se desea eliminar.
 *
 * No modifica AppContext ni conoce la implementación de Supabase.
 */
export default function TaskAttachmentsModal({
  task,
  onClose,
  onUpload,
  onDelete,
}) {
  const attachments = Array.isArray(task?.attachments)
    ? task.attachments
    : [];

  const fileInputRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [draggingOver, setDraggingOver] = useState(false);
  const [error, setError] = useState("");

  const currentAttachment = attachments[activeIndex] ?? null;

  const currentUrl = currentAttachment
    ? getAttachmentUrl(currentAttachment)
    : "";

  const currentName = currentAttachment
    ? getAttachmentName(currentAttachment)
    : "";

  const deleteTargetName = deleteTarget
    ? getAttachmentName(deleteTarget)
    : "";

  const deleteTargetUrl = deleteTarget
    ? getAttachmentUrl(deleteTarget)
    : "";

  const deleteTargetIsImage = deleteTarget
    ? isImageFile(deleteTarget)
    : false;

  const deleteTargetId = deleteTarget
    ? (getAttachmentId(deleteTarget) ?? getAttachmentName(deleteTarget))
    : null;

  const isDeletingTarget = deletingId !== null;

  // Mantener el índice dentro del rango cuando se eliminan archivos.
  useEffect(() => {
    setActiveIndex((index) =>
      Math.min(index, Math.max(attachments.length - 1, 0)),
    );
  }, [attachments.length]);

  // Escape cierra primero la confirmación de eliminación.
  useEffect(() => {
    if (!deleteTarget) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && deletingId === null) {
        setDeleteTarget(null);
        setDeleteError("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [deleteTarget, deletingId]);

  const pendingTotalSize = useMemo(
    () => pendingFiles.reduce((total, file) => total + file.size, 0),
    [pendingFiles],
  );

  /* ---------- selección y validación ---------- */

  const validateAndAddFiles = (fileList) => {
    setError("");

    const incoming = Array.from(fileList ?? []);

    if (!incoming.length) return;

    const validFiles = [];
    const errors = [];

    for (const file of incoming) {
      if (!ALLOWED_TYPES.has(file.type)) {
        errors.push(`${file.name}: formato no permitido.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: supera el máximo de 10 MB.`);
        continue;
      }

      const alreadySelected = pendingFiles.some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified,
      );

      if (alreadySelected) continue;

      validFiles.push(file);
    }

    const availableSlots = MAX_FILES_PER_UPLOAD - pendingFiles.length;

    if (validFiles.length > availableSlots) {
      errors.push(
        `Podés seleccionar hasta ${MAX_FILES_PER_UPLOAD} archivos por subida.`,
      );
    }

    setPendingFiles((previous) => [
      ...previous,
      ...validFiles.slice(0, Math.max(availableSlots, 0)),
    ]);

    if (errors.length) {
      setError(errors.join(" "));
    }
  };

  const handleInputChange = (event) => {
    validateAndAddFiles(event.target.files);

    // Permite volver a seleccionar el mismo archivo.
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();

    setDraggingOver(false);

    validateAndAddFiles(event.dataTransfer.files);
  };

  const removePendingFile = (index) => {
    setPendingFiles((previous) =>
      previous.filter((_, fileIndex) => fileIndex !== index),
    );

    setError("");
  };

  /* ---------- subir archivos ---------- */

  const handleUpload = async () => {
    if (!pendingFiles.length || typeof onUpload !== "function") {
      return;
    }

    setUploading(true);
    setError("");

    try {
      await onUpload(pendingFiles);

      setPendingFiles([]);
    } catch (uploadError) {
      setError(
        uploadError?.response?.data?.message ||
          uploadError?.message ||
          "No se pudieron subir los archivos. Volvé a intentarlo.",
      );
    } finally {
      setUploading(false);
    }
  };

  /* ---------- eliminar archivos ---------- */

  // Abre la confirmación personalizada.
  const openDeleteConfirmation = () => {
    if (
      !currentAttachment ||
      typeof onDelete !== "function" ||
      deletingId !== null
    ) {
      return;
    }

    setDeleteError("");
    setDeleteTarget(currentAttachment);
  };

  // Cierra la confirmación.
  const closeDeleteConfirmation = () => {
    if (deletingId !== null) return;

    setDeleteTarget(null);
    setDeleteError("");
  };

  // Ejecuta la eliminación después de la confirmación.
  const confirmDelete = async () => {
    if (
      !deleteTarget ||
      typeof onDelete !== "function" ||
      deletingId !== null
    ) {
      return;
    }

    const target = deleteTarget;
    const targetId =
      getAttachmentId(target) ?? getAttachmentName(target);

    setDeletingId(targetId);
    setDeleteError("");
    setError("");

    try {
      await onDelete(target);

      setDeleteTarget(null);

      setActiveIndex((index) => Math.max(0, index - 1));
    } catch (deleteError) {
      setDeleteError(
        deleteError?.response?.data?.message ||
          deleteError?.message ||
          "No se pudo eliminar el archivo. Volvé a intentarlo.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- navegación del carrusel ---------- */

  const showPrevious = () => {
    if (attachments.length < 2) return;

    setActiveIndex(
      (index) => (index - 1 + attachments.length) % attachments.length,
    );
  };

  const showNext = () => {
    if (attachments.length < 2) return;

    setActiveIndex(
      (index) => (index + 1) % attachments.length,
    );
  };

  return (
    <div
      className="modal-overlay task-attachments-overlay"
      onClick={(event) => {
        // Cerrar solamente este modal, sin cerrar el modal padre.
        if (event.target === event.currentTarget) {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <section
        className="task-attachments-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-attachments-title"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}

        <header className="task-attachments__header">
          <div className="task-attachments__heading">
            <span className="task-attachments__eyebrow">
              <FiPaperclip />
              Archivos de la tarjeta
            </span>

            <h2 id="task-attachments-title">
              {task?.title || "Adjuntos"}
            </h2>

            <span className="task-attachments__count">
              {attachments.length}{" "}
              {attachments.length === 1
                ? "archivo guardado"
                : "archivos guardados"}
            </span>
          </div>

          <button
            className="icon-btn"
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <FiX />
          </button>
        </header>

        <div className="task-attachments__body">

          {/* Galería / Carrusel */}

          <section
            className="task-attachments__gallery"
            aria-label="Archivos adjuntos"
          >
            {currentAttachment ? (
              <>
                <div className="task-attachments__stage">

                  {attachments.length > 1 && (
                    <button
                      className="task-attachments__arrow task-attachments__arrow--left"
                      type="button"
                      onClick={showPrevious}
                      aria-label="Archivo anterior"
                    >
                      <FiChevronLeft />
                    </button>
                  )}

                  {/* Imagen */}

                  {isImageFile(currentAttachment) && currentUrl ? (
                    <a
                      className="task-attachments__image-link"
                      href={currentUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Abrir imagen en otra pestaña"
                    >
                      <img
                        src={currentUrl}
                        alt={currentName}
                        className="task-attachments__image"
                      />
                    </a>
                  ) : (
                    /* Documento */

                    <div className="task-attachments__file-preview">
                      <span className="task-attachments__file-preview-icon">
                        <FiFileText />
                      </span>

                      <strong>{currentName}</strong>

                      <span>
                        {formatFileSize(currentAttachment.size)}
                      </span>

                      {currentUrl && (
                        <a
                          href={currentUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir documento
                        </a>
                      )}
                    </div>
                  )}

                  {attachments.length > 1 && (
                    <button
                      className="task-attachments__arrow task-attachments__arrow--right"
                      type="button"
                      onClick={showNext}
                      aria-label="Archivo siguiente"
                    >
                      <FiChevronRight />
                    </button>
                  )}
                </div>

                {/* Información del archivo */}

                <div className="task-attachments__file-info">
                  <div className="task-attachments__file-copy">
                    <strong title={currentName}>
                      {currentName}
                    </strong>

                    <span>
                      {formatFileSize(currentAttachment.size)}

                      {formatDate(
                        currentAttachment.createdAt ||
                          currentAttachment.uploadedAt,
                      ) &&
                        ` · ${formatDate(
                          currentAttachment.createdAt ||
                            currentAttachment.uploadedAt,
                        )}`}
                    </span>
                  </div>

                  <div className="task-attachments__file-actions">
                    {currentUrl && (
                      <a
                        className="task-attachments__icon-action"
                        href={currentUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir o descargar"
                        aria-label="Abrir o descargar archivo"
                      >
                        <FiDownload />
                      </a>
                    )}

                    {typeof onDelete === "function" && (
                      <button
                        className="task-attachments__icon-action is-danger"
                        type="button"
                        onClick={openDeleteConfirmation}
                        disabled={deletingId !== null}
                        title="Eliminar archivo"
                        aria-label="Eliminar archivo"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </div>

                {/* Indicadores del carrusel */}

                {attachments.length > 1 && (
                  <div className="task-attachments__carousel-footer">
                    <div className="task-attachments__dots">
                      {attachments.map((file, index) => (
                        <button
                          key={
                            getAttachmentId(file) ??
                            `${getAttachmentName(file)}-${index}`
                          }
                          className={
                            "task-attachments__dot" +
                            (index === activeIndex ? " is-active" : "")
                          }
                          type="button"
                          onClick={() => setActiveIndex(index)}
                          aria-label={`Ver archivo ${index + 1}`}
                        />
                      ))}
                    </div>

                    <span>
                      {activeIndex + 1} / {attachments.length}
                    </span>
                  </div>
                )}
              </>
            ) : (
              /* Estado vacío */

              <div className="task-attachments__empty-gallery">
                <span>
                  <FiImage />
                </span>

                <strong>
                  Todavía no hay archivos
                </strong>

                <p>
                  Cuando adjuntes imágenes o documentos,
                  van a aparecer acá.
                </p>
              </div>
            )}
          </section>

          {/* Zona de subida */}

          <section
            className={
              "task-attachments__upload" +
              (draggingOver ? " is-dragging" : "")
            }
            onDragOver={(event) => {
              event.preventDefault();
              setDraggingOver(true);
            }}
            onDragLeave={(event) => {
              if (
                !event.currentTarget.contains(
                  event.relatedTarget
                )
              ) {
                setDraggingOver(false);
              }
            }}
            onDrop={handleDrop}
          >
            <div className="task-attachments__upload-heading">
              <div>
                <strong>Agregar archivos</strong>

                <p>
                  Imágenes JPG, PNG, WEBP o documentos PDF.
                </p>
              </div>

              <span className="task-attachments__upload-icon">
                <FiUploadCloud />
              </span>
            </div>

            <input
              ref={fileInputRef}
              className="task-attachments__native-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              onChange={handleInputChange}
            />

            <button
              className="task-attachments__select-button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <FiPlus />
              Seleccionar archivos
            </button>

            <span className="task-attachments__hint">
              Máximo 10 archivos por subida · 10 MB por archivo
            </span>

            {/* Archivos pendientes */}

            {pendingFiles.length > 0 && (
              <div className="task-attachments__pending">
                <div className="task-attachments__pending-heading">
                  <strong>
                    Listos para subir ({pendingFiles.length})
                  </strong>

                  <span>
                    {formatFileSize(pendingTotalSize)} en total
                  </span>
                </div>

                <ul className="task-attachments__pending-list">
                  {pendingFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                    >
                      <span className="task-attachments__pending-icon">
                        {file.type.startsWith("image/") ? (
                          <FiImage />
                        ) : (
                          <FiFileText />
                        )}
                      </span>

                      <span className="task-attachments__pending-copy">
                        <strong title={file.name}>
                          {file.name}
                        </strong>

                        <small>
                          {formatFileSize(file.size)}
                        </small>
                      </span>

                      <button
                        type="button"
                        onClick={() => removePendingFile(index)}
                        disabled={uploading}
                        aria-label={`Quitar ${file.name}`}
                        title="Quitar de la selección"
                      >
                        <FiX />
                      </button>
                    </li>
                  ))}
                </ul>

                <button
                  className="task-attachments__upload-button"
                  type="button"
                  onClick={handleUpload}
                  disabled={
                    uploading ||
                    typeof onUpload !== "function"
                  }
                >
                  <FiUploadCloud />

                  {uploading
                    ? "Subiendo archivos…"
                    : "Subir archivos"}
                </button>
              </div>
            )}

            {typeof onUpload !== "function" && (
              <p className="task-attachments__integration-note">
                Falta conectar la función de subida de archivos.
              </p>
            )}
          </section>

          {/* Errores */}

          {error && (
            <p
              className="task-attachments__error"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      </section>

      {/* Confirmación personalizada de eliminación */}

      {deleteTarget && (
        <div
          className="task-attachments-delete-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              event.stopPropagation();
              closeDeleteConfirmation();
            }
          }}
        >
          <section
            className="task-attachments-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="task-attachments-delete-title"
            aria-describedby="task-attachments-delete-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="task-attachments-delete__icon">
              {deleteTargetIsImage ? <FiImage /> : <FiFileText />}
            </div>

            <span className="task-attachments-delete__eyebrow">
              Confirmar eliminación
            </span>

            <h3 id="task-attachments-delete-title">
              {deleteTargetIsImage
                ? "¿Eliminar esta imagen?"
                : "¿Eliminar este archivo?"}
            </h3>

            <p id="task-attachments-delete-description">
              Se quitará permanentemente de esta tarea.
              Esta acción no se puede deshacer.
            </p>

            <div className="task-attachments-delete__file">
              {deleteTargetIsImage && deleteTargetUrl ? (
                <img
                  src={deleteTargetUrl}
                  alt="Vista previa del archivo a eliminar"
                />
              ) : (
                <span className="task-attachments-delete__file-icon">
                  <FiFileText />
                </span>
              )}

              <div className="task-attachments-delete__file-copy">
                <strong title={deleteTargetName}>
                  {deleteTargetName}
                </strong>

                <span>
                  {deleteTargetIsImage ? "Imagen" : "Documento"}
                  {deleteTarget?.size != null
                    ? ` · ${formatFileSize(deleteTarget.size)}`
                    : ""}
                </span>
              </div>
            </div>

            {deleteError && (
              <p
                className="task-attachments-delete__error"
                role="alert"
              >
                <FiAlertCircle />
                {deleteError}
              </p>
            )}

            <div className="task-attachments-delete__actions">
              <button
                type="button"
                className="task-attachments-delete__cancel"
                onClick={closeDeleteConfirmation}
                disabled={isDeletingTarget}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="task-attachments-delete__confirm"
                onClick={confirmDelete}
                disabled={isDeletingTarget || !deleteTargetId}
              >
                <FiTrash2 />

                {isDeletingTarget
                  ? "Eliminando…"
                  : "Eliminar"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}