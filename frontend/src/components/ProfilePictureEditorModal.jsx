
import { useEffect, useRef, useState } from "react";

import {
  FiX,
  FiZoomIn,
  FiZoomOut,
  FiMove,
  FiCheck,
  FiRefreshCw,
  FiImage,
  FiHeart,
  FiMessageCircle,
} from "react-icons/fi";

import "../styles/components/ProfilePictureEditorModal.css";

const OUTPUT_SIZE = 512;

const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), max);

function getBaseName(filename = "foto") {
  return (
    filename.replace(/\.[^.]+$/, "").trim() ||
    "foto"
  );
}

function getUserRole(user) {
  const rawRole =
    user?.role?.label ??
    user?.role?.name ??
    user?.role ??
    user?.accountType ??
    "Usuario";

  const role = String(rawRole).toLowerCase();

  const labels = {
    admin: "Administrador",
    administrator: "Administrador",
    administrador: "Administrador",
    user: "Usuario",
    usuario: "Usuario",
    student: "Estudiante",
    estudiante: "Estudiante",
    teacher: "Docente",
    docente: "Docente",
    staff: "Personal",
    personal: "Personal",
  };

  return (
    labels[role] ||
    String(rawRole).charAt(0).toUpperCase() +
      String(rawRole).slice(1)
  );
}

function PreviewAvatar({
  imageUrl,
  imageStyle,
  className = "",
  title,
}) {
  return (
    <div
      className={`ppe-preview-avatar ${className}`}
      title={title}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Vista previa del avatar"
          style={imageStyle}
          draggable="false"
        />
      )}
    </div>
  );
}

export default function ProfilePictureEditorModal({
  file,
  user,
  onClose,
  onConfirm,
  uploading = false,
}) {
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef(null);

  const [imageUrl, setImageUrl] = useState("");

  const [stageSize, setStageSize] = useState(300);

  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const [offset, setOffset] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  const [imageError, setImageError] = useState("");
  const [error, setError] = useState("");

  const busy = saving || uploading;

  const imageReady =
    Boolean(imageUrl) &&
    imageDimensions.width > 0 &&
    imageDimensions.height > 0 &&
    !imageError;

  const userName = user?.name || "Tu nombre";
  const userEmail = user?.email || "";
  const userRole = getUserRole(user);

  const identityDescription = [
    userName,
    userEmail,
    userRole,
  ]
    .filter(Boolean)
    .join(" · ");

  /* =====================================================
     URL TEMPORAL DE LA IMAGEN

     Se crea y libera dentro del efecto para evitar
     utilizar una URL revocada en React StrictMode.
     ===================================================== */

  useEffect(() => {
    if (!file) {
      setImageUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);

    setImageUrl(objectUrl);
    setImageDimensions({
      width: 0,
      height: 0,
    });
    setImageError("");
    setError("");
    setZoom(1);
    setOffset({
      x: 0,
      y: 0,
    });

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  /* =====================================================
     MEDIR ÁREA DE RECORTE
     ===================================================== */

  useEffect(() => {
    const element = stageRef.current;

    if (!element) return undefined;

    const updateSize = () => {
      const width = element.getBoundingClientRect().width;

      if (width > 0) {
        setStageSize(width);
      }
    };

    updateSize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateSize);

      observer.observe(element);

      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  /* =====================================================
     CERRAR CON ESCAPE
     ===================================================== */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [busy, onClose]);

  /* =====================================================
     CÁLCULO DEL ENCUADRE
     ===================================================== */

  const baseScale = imageReady
    ? Math.max(
        stageSize / imageDimensions.width,
        stageSize / imageDimensions.height,
      )
    : 0;

  const imageScale = baseScale * zoom;

  const displayedWidth =
    imageDimensions.width * imageScale;

  const displayedHeight =
    imageDimensions.height * imageScale;

  const maxOffsetX = stageSize
    ? Math.max(
        0,
        (displayedWidth - stageSize) /
          (2 * stageSize),
      )
    : 0;

  const maxOffsetY = stageSize
    ? Math.max(
        0,
        (displayedHeight - stageSize) /
          (2 * stageSize),
      )
    : 0;

  const safeOffset = {
    x: clamp(
      offset.x,
      -maxOffsetX,
      maxOffsetX,
    ),
    y: clamp(
      offset.y,
      -maxOffsetY,
      maxOffsetY,
    ),
  };

  // Mantener el desplazamiento dentro de los límites
  // cuando cambia el zoom o el tamaño del editor.
  useEffect(() => {
    setOffset((previous) => ({
      x: clamp(
        previous.x,
        -maxOffsetX,
        maxOffsetX,
      ),
      y: clamp(
        previous.y,
        -maxOffsetY,
        maxOffsetY,
      ),
    }));
  }, [maxOffsetX, maxOffsetY]);

  const getPositionedImageStyle = (
    previewSize = stageSize,
  ) => {
    if (!imageReady || !stageSize) {
      return {};
    }

    const ratio = previewSize / stageSize;

    return {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: `${displayedWidth * ratio}px`,
      height: `${displayedHeight * ratio}px`,
      maxWidth: "none",
      objectFit: "fill",
      transform: [
        "translate(-50%, -50%)",
        `translate(${safeOffset.x * previewSize}px, ${safeOffset.y * previewSize}px)`,
      ].join(" "),
      pointerEvents: "none",
      userSelect: "none",
    };
  };

  // Los avatares de las previsualizaciones utilizan
  // exactamente el mismo encuadre que el editor.
  const previewImageStyle =
    getPositionedImageStyle(48);

  /* =====================================================
     CARGA DE IMAGEN
     ===================================================== */

  const handleImageLoad = (event) => {
    const image = event.currentTarget;

    if (
      !image.naturalWidth ||
      !image.naturalHeight
    ) {
      setImageError(
        "La imagen no tiene dimensiones válidas.",
      );
      return;
    }

    setImageDimensions({
      width: image.naturalWidth,
      height: image.naturalHeight,
    });

    setOffset({
      x: 0,
      y: 0,
    });

    setImageError("");
  };

  const handleImageError = () => {
    setImageError(
      "No se pudo abrir esta imagen. Probá con otro archivo JPG, PNG o WebP.",
    );
  };

  /* =====================================================
     ARRASTRAR IMAGEN
     ===================================================== */

  const handlePointerDown = (event) => {
    if (!imageReady || busy) return;

    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();

    try {
      event.currentTarget.setPointerCapture(
        event.pointerId,
      );
    } catch {
      // La interacción sigue funcionando sin captura
      // cuando el navegador no la permite.
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: safeOffset.x,
      startOffsetY: safeOffset.y,
    };

    setDragging(true);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;

    if (
      !drag ||
      drag.pointerId !== event.pointerId
    ) {
      return;
    }

    const deltaX =
      (event.clientX - drag.startX) / stageSize;

    const deltaY =
      (event.clientY - drag.startY) / stageSize;

    setOffset({
      x: clamp(
        drag.startOffsetX + deltaX,
        -maxOffsetX,
        maxOffsetX,
      ),
      y: clamp(
        drag.startOffsetY + deltaY,
        -maxOffsetY,
        maxOffsetY,
      ),
    });
  };

  const handlePointerUp = (event) => {
    if (
      dragRef.current?.pointerId !== event.pointerId
    ) {
      return;
    }

    dragRef.current = null;
    setDragging(false);

    try {
      if (
        event.currentTarget.hasPointerCapture(
          event.pointerId,
        )
      ) {
        event.currentTarget.releasePointerCapture(
          event.pointerId,
        );
      }
    } catch {
      // No requiere ninguna acción adicional.
    }
  };

  /* =====================================================
     ZOOM Y RESTABLECER
     ===================================================== */

  const handleZoomChange = (event) => {
    setZoom(Number(event.target.value));
    setError("");
  };

  const resetCrop = () => {
    setZoom(1);

    setOffset({
      x: 0,
      y: 0,
    });

    setError("");
  };

  /* =====================================================
     GENERAR IMAGEN CUADRADA
     ===================================================== */

  const createCroppedFile = async () => {
    const image = imageRef.current;

    if (
      !imageReady ||
      !image ||
      !stageSize ||
      !imageScale
    ) {
      throw new Error(
        "La imagen todavía no está lista.",
      );
    }

    const canvas = document.createElement("canvas");

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "No se pudo preparar el recorte de la imagen.",
      );
    }

    const sourceSize = stageSize / imageScale;

    const sourceX = clamp(
      imageDimensions.width / 2 -
        sourceSize / 2 -
        (safeOffset.x * stageSize) / imageScale,
      0,
      imageDimensions.width - sourceSize,
    );

    const sourceY = clamp(
      imageDimensions.height / 2 -
        sourceSize / 2 -
        (safeOffset.y * stageSize) / imageScale,
      0,
      imageDimensions.height - sourceSize,
    );

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    );

    const toBlob = (type, quality) =>
      new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new Error(
                  "No se pudo generar la imagen recortada.",
                ),
              );

              return;
            }

            resolve(blob);
          },
          type,
          quality,
        );
      });

    let blob;
    let extension;

    try {
      blob = await toBlob("image/webp", 0.92);

      if (blob.type !== "image/webp") {
        throw new Error(
          "WebP no disponible en este navegador.",
        );
      }

      extension = "webp";
    } catch {
      blob = await toBlob("image/png");
      extension = "png";
    }

    const filename =
      `${getBaseName(file.name)}-perfil.${extension}`;

    return new File(
      [blob],
      filename,
      {
        type: blob.type,
        lastModified: Date.now(),
      },
    );
  };

  /* =====================================================
     CONFIRMAR Y SUBIR
     ===================================================== */

  const handleConfirm = async () => {
    if (!imageReady || busy) return;

    setError("");
    setSaving(true);

    let closeAfterSave = false;

    try {
      const croppedFile = await createCroppedFile();

      const result = await onConfirm(croppedFile);

      closeAfterSave = result !== false;
    } catch (uploadError) {
      setError(
        uploadError?.response?.data?.message ||
          uploadError?.message ||
          "No se pudo procesar o subir la imagen. Volvé a intentarlo.",
      );
    } finally {
      setSaving(false);
    }

    if (closeAfterSave) {
      onClose();
    }
  };

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div
      className="ppe-overlay"
      onClick={(event) => {
        if (
          event.target === event.currentTarget &&
          !busy
        ) {
          onClose();
        }
      }}
    >
      <section
        className="ppe-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Editar fotografía de perfil"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Único elemento del encabezado: cerrar */}

        <button
          className="ppe-close"
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Cerrar editor"
        >
          <FiX />
        </button>

        <div className="ppe-layout">
          {/* =========================================
              EDITOR DE RECORTE
             ========================================= */}

          <section className="ppe-editor">
            <div
              ref={stageRef}
              className={`ppe-stage ${
                dragging ? "is-dragging" : ""
              } ${
                !imageReady ? "is-loading" : ""
              }`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onLostPointerCapture={() => {
                dragRef.current = null;
                setDragging(false);
              }}
              aria-label="Área de recorte. Arrastrá para mover la imagen."
            >
              {imageUrl && (
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Imagen que estás recortando"
                  className="ppe-source-image"
                  style={getPositionedImageStyle()}
                  draggable="false"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}

              {imageReady && (
                <>
                  <div
                    className="ppe-grid"
                    aria-hidden="true"
                  />

                  <div
                    className="ppe-crop-border"
                    aria-hidden="true"
                  />
                </>
              )}

              {!imageReady && !imageError && (
                <div className="ppe-stage-loading">
                  <span className="ppe-spinner" />
                  <span>Preparando imagen...</span>
                </div>
              )}

              {imageError && (
                <div className="ppe-stage-error">
                  <FiImage />
                  <span>{imageError}</span>
                </div>
              )}
            </div>

            <div className="ppe-editor-tools">
              <div className="ppe-drag-hint">
                <FiMove />
                Arrastrá para acomodar
              </div>

              <button
                type="button"
                className="ppe-reset"
                onClick={resetCrop}
                disabled={!imageReady || busy}
                title="Restablecer recorte"
              >
                <FiRefreshCw />
              </button>
            </div>

            {/* Zoom */}

            <div className="ppe-zoom">
              <FiZoomOut />

              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={handleZoomChange}
                disabled={!imageReady || busy}
                aria-label="Nivel de zoom"
              />

              <FiZoomIn />

              <strong>
                {zoom.toFixed(1)}x
              </strong>
            </div>
          </section>

          {/* =========================================
              PREVISUALIZACIONES
             ========================================= */}

          <aside className="ppe-previews">
            {/* PUBLICACIÓN DEL FORO */}

            <section className="ppe-forum-card">
              <div className="ppe-forum-header">
                <PreviewAvatar
                  imageUrl={imageUrl}
                  imageStyle={previewImageStyle}
                  className="ppe-forum-avatar"
                  title={identityDescription}
                />

                <div className="ppe-forum-identity">
                  <strong>{userName}</strong>

                  <span>
                    {userEmail || userRole}
                    {userEmail && userRole
                      ? ` · ${userRole}`
                      : ""}
                  </span>
                </div>

                <span className="ppe-forum-menu">
                  •••
                </span>
              </div>

              <p className="ppe-forum-content">
                Así se verá tu perfil en las publicaciones del foro.
              </p>

              <div className="ppe-forum-footer">
                <span>
                  <FiHeart />
                  0
                </span>

                <span>
                  <FiMessageCircle />
                  0
                </span>
              </div>
            </section>

            {/* TARJETA DE TAREA ASIGNADA */}

            <section className="ppe-task-card">
              <div className="ppe-task-accent" />

              <strong className="ppe-task-title">
                Tarea asignada
              </strong>

              <div className="ppe-task-assignees">
                <PreviewAvatar
                  imageUrl={imageUrl}
                  imageStyle={previewImageStyle}
                  className="ppe-task-avatar"
                  title={identityDescription}
                />
              </div>
            </section>

            <p className="ppe-preview-caption">
              La misma foto se utilizará en tus publicaciones,
              comentarios y tareas asignadas.
            </p>
          </aside>
        </div>

        {/* ERROR DENTRO DEL EDITOR */}

        {error && (
          <div
            className="ppe-error"
            role="alert"
            aria-live="polite"
          >
            <FiImage />
            <span>{error}</span>
          </div>
        )}

        {/* ACCIONES */}

        <footer className="ppe-footer">
          <button
            className="ppe-cancel"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>

          <button
            className="ppe-confirm"
            type="button"
            onClick={handleConfirm}
            disabled={!imageReady || busy}
          >
            {busy ? (
              <>
                <span className="ppe-spinner ppe-spinner--button" />
                {uploading
                  ? "Subiendo..."
                  : "Procesando..."}
              </>
            ) : (
              <>
                <FiCheck />
                Usar esta foto
              </>
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}
