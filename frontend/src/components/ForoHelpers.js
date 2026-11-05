const USER_GREEN = "#05903e";
const COLORS_PALETTE = ["#05903e"];

function hashCode(str) {
  let hash = 0;
  if (!str) return 0;
  for (let i = 0; i < String(str).length; i++) {
    hash = String(str).charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getCurrentUserId(currentUser) {
  const u = currentUser || getCurrentUser();
  return String(u?._id || u?.id || u?._id?.toString() || "");
}

function getInitials(name) {
  if (!name) return "U";
  return name.trim().split(/\s+/).map(n=>n[0]).join("").slice(0,2).toUpperCase();
}

// FIX PARA [object Object]
function extractContentText(content) {
  if (!content) return "";
  if (typeof content === "string") return content;
  
  if (Array.isArray(content)) {
    return content.map(c => {
      if (typeof c === "string") return c;
      if (c && typeof c === "object") {
        return c.text || c.content || c.message || c.value || c.body || "";
      }
      return "";
    }).filter(Boolean).join("\n");
  }
  
  if (typeof content === "object") {
    return content.text || content.content || content.message || content.value || content.body || "";
  }
  
  return String(content);
}

function getAvatarColorForUser(userId, currentUserId, authorName, currentUserName) {
  // FIX: si el nombre coincide, también es verde (por si los IDs no coinciden)
  if (String(userId) === String(currentUserId)) return USER_GREEN;
  if (authorName && currentUserName && authorName.toLowerCase().trim() === currentUserName.toLowerCase().trim()) {
    return USER_GREEN;
  }
  const idx = Math.abs(hashCode(String(userId || authorName))) % COLORS_PALETTE.length;
  const color = COLORS_PALETTE[idx];
  // Nunca devuelvas rojo si es el usuario actual
  return color;
}

export function mapPostFromApi(apiPost, sectors = [], currentUserId = "") {
  const currentUser = getCurrentUser();
  const currentUserName = currentUser?.name || currentUser?.displayName || "";
  const resolvedCurrentId = currentUserId || getCurrentUserId(currentUser);

  const authorId = apiPost.userId || apiPost.author?._id || apiPost.author?.id || apiPost.authorId || apiPost.user?._id || "";
  const authorName = apiPost.author?.name || apiPost.authorName || apiPost.userName || apiPost.user?.name || "Usuario";

  const isOwn = String(authorId) === String(resolvedCurrentId) || 
                (authorName && currentUserName && authorName.toLowerCase().trim() === currentUserName.toLowerCase().trim());

  const sectorId = apiPost.sectorId || apiPost.sector?._id;
  const sectorName = sectors.find(s => String(s._id || s.id) === String(sectorId))?.name || apiPost.sectorName || "";

  return {
    id: apiPost._id || apiPost.id,
    authorId: authorId,
    author: authorName,
    initials: getInitials(authorName),
    avatarColor: isOwn ? USER_GREEN : getAvatarColorForUser(authorId, resolvedCurrentId, authorName, currentUserName),
    isOwn: isOwn,
    content: extractContentText(apiPost.content), // FIX [object Object]
    sectorName,
    sectorId,
    createdAt: apiPost.createdAt,
    likes: apiPost.likesCount ?? apiPost.likes ?? 0,
    liked: apiPost.likedBy?.includes(resolvedCurrentId) || false,
    commentsCount: apiPost.commentsCount || 0,
    pinned: !!apiPost.pinned,
    attachments: (apiPost.files || apiPost.attachments || []).map(f => ({
      name: f.name || f.filename || "archivo",
      url: f.url || f.path,
      type: f.mimetype || f.type || "",
      size: "",
    })),
  };
}

export function formatRelativeDate(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffSec < 60) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHour < 24) return `hace ${diffHour} h`;
  if (diffDay === 1) return "ayer";
  if (diffDay < 7) return `hace ${diffDay} días`;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}
export const formatDate = formatRelativeDate;
export const timeAgo = formatRelativeDate;