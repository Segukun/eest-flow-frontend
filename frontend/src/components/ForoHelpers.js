import { AVATAR_COLORS } from "./ForoConstants.js";

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}
export function getCurrentUserId(user) { return user?._id || user?.id || null; }
export function getSectorId(sector) { return sector?._id || sector?.id || null; }
export function getSectorName(sector) { return sector?.name || sector?.title || "Sector"; }
export function getAuthorInitials(name = "") {
  return name.trim().split(/\s+/).filter(Boolean).map(p=>p[0]).join("").slice(0,2).toUpperCase() || "U";
}
export function getAvatarColor(name = "") {
  let hash=0; for(let i=0;i<name.length;i++) hash=name.charCodeAt(i)+((hash<<5)-hash);
  return AVATAR_COLORS[Math.abs(hash)%AVATAR_COLORS.length];
}
export function formatRelativeDate(dateString) {
  if(!dateString) return "";
  const date=new Date(dateString); if(isNaN(date.getTime())) return "";
  const diffMs=Date.now()-date.getTime(); const diffM=Math.floor(diffMs/60000);
  if(diffM<1) return "Ahora"; if(diffM<60) return `hace ${diffM}m`;
  const diffH=Math.floor(diffM/60); if(diffH<24) return `hace ${diffH}h`;
  const diffD=Math.floor(diffH/24); if(diffD<7) return `hace ${diffD}d`;
  return date.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric"});
}
export function formatFileSize(size) {
  if(!size) return ""; if(size<1024) return `${size} B`;
  if(size<1024*1024) return `${(size/1024).toFixed(1)} KB`;
  return `${(size/(1024*1024)).toFixed(1)} MB`;
}

export function mapPostFromApi(post, sectors, currentUserId) {
  const authorObject = post.author && typeof post.author==="object" ? post.author : null;
  const sectorObject = post.sector && typeof post.sector==="object" ? post.sector : null;
  const sectorId = sectorObject?._id || post.sector || null;
  const fallbackSector = sectors.find(s=>String(s._id||s.id)===String(sectorId));
  const authorId = authorObject?._id || post.author || null;
  const authorName = authorObject?.name || "Usuario";
  const isOwnPost = String(authorId)===String(currentUserId);
  const sectorName = sectorObject?.name || fallbackSector?.name || "Sector";
  return {
    id: post._id,
    author: isOwnPost ? "Tú" : authorName,
    authorId, authorName,
    role: [formatRelativeDate(post.createdAt), sectorName].filter(Boolean).join(" · "),
    avatar: getAuthorInitials(authorName),
    avatarColor: getAvatarColor(authorName),
    sectorId, sectorName,
    content: (post.content||[]).map(b=>typeof b==="string"?b:b?.text||"").filter(Boolean).join("\n\n"),
    attachments: (post.attachments||[]).map(a=>({
      id: a.path || a._id || `${post._id}-${a.originalName}`,
      name: a.originalName || "Archivo",
      size: formatFileSize(a.size),
      type: a.type==="image" ? "image" : a.mimeType==="application/pdf" ? "pdf" : "file",
      preview: a.type==="image" ? a.url : null,
      url: a.url||null, path: a.path||null, mimeType: a.mimeType||null,
    })),
    likes: post.likesCount ?? 0,
    liked: post.isLiked ?? false,
    commentsCount: post.commentsCount ?? 0,
    pinned: post.pinned ?? false,
    active: post.active ?? true,
    createdAt: post.createdAt||null,
    updatedAt: post.updatedAt||null,
  };
}
