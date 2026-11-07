import { useState } from "react";
import "../../styles/layout/UserAvatar.css";

export default function UserAvatar({
  user,
  className = "avatar",
  title,
  style,
}) {
  const imageUrl = user?.profilePicture?.url ?? null;

  const [failedUrl, setFailedUrl] = useState(null);

  const name =
    typeof user?.name === "string" ? user.name.trim() : "";

  const initials =
    (typeof user?.initials === "string" && user.initials.trim()) ||
    name.charAt(0).toUpperCase() ||
    "…";

  const showImage = imageUrl && failedUrl !== imageUrl;

  return (
    <span
      className={`${className} user-avatar`}
      style={{ backgroundColor: "var(--color-green)", ...style }}
      role="img"
      title={title ?? (name || undefined)}
      aria-label={`Foto de perfil de ${name || "usuario"}`}
    >
      {showImage ? (
        <img
          className="user-avatar__image"
          src={imageUrl}
          alt=""
          onError={() => setFailedUrl(imageUrl)}
          onLoad={() => setFailedUrl(null)}
          decoding="async"
        />
      ) : (
        initials
      )}
    </span>
  );
}