import { FiHeart, FiMessageCircle } from "react-icons/fi";
export default function ForoPostFooter({ post, onLike, onComment }) {
  return (
    <div className="foro-post-foot">
      <button className={post.liked?"foro-liked":""} onClick={onLike} type="button">
        <FiHeart fill={post.liked?"#DC2626":"none"} color={post.liked?"#DC2626":""}/> {post.likes}
      </button>
      <button onClick={onComment} type="button"><FiMessageCircle/> {post.commentsCount}</button>
    </div>
  );
}
