import ForoPost from "./ForoPost";

export default function ForoFeed({ posts, ...props }) {
  if(!posts.length) return <p className="foro-empty">No se encontraron publicaciones</p>;
  return (
    <div className="foro-feed">
      {posts.map(post=>(
        <ForoPost key={post.id} post={post} {...props} />
      ))}
    </div>
  );
}
