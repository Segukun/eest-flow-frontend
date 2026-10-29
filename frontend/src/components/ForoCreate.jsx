import { FiPaperclip, FiFileText, FiX } from "react-icons/fi";

export default function ForoCreate({
  currentUser, newPost, setNewPost, inlineFiles,
  createInputRef, inlineInputRef,
  isCreateActive, setIsCreateActive,
  onFiles, onRemoveFile, onPublish,
  publishing = false,
}) {
  const initials = (currentUser?.name||"Tú").trim().split(/\s+/).map(p=>p[0]).join("").slice(0,2).toUpperCase() || "U";

  const handlePublish = () => {
    if (publishing) return;
    onPublish();
  };

  return (
    <div className={`foro-create-wrapper ${isCreateActive?"foro-create-wrapper--active":""}`}>
      <div className={`foro-create ${isCreateActive?"foro-create--active":""}`} onClick={()=>createInputRef.current?.focus()}>
        <div className="foro-create-avatar">{initials}</div>
        <textarea
          ref={createInputRef}
          placeholder="Escribe algo..."
          value={newPost}
          onChange={e=>setNewPost(e.target.value)}
          onFocus={()=>setIsCreateActive(true)}
          onBlur={()=>{ if(!newPost.trim() && inlineFiles.length===0) setIsCreateActive(false); }}
          onKeyDown={e=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); if(!e.repeat) handlePublish(); } }}
          rows={1}
        />
        <button className="foro-attach" onClick={()=>inlineInputRef.current?.click()} type="button" disabled={publishing}><FiPaperclip/></button>
        <input ref={inlineInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" onChange={onFiles} style={{display:"none"}}/>
        <button className="foro-publish" onClick={handlePublish} disabled={publishing || (!newPost.trim() && inlineFiles.length===0)} type="button">
          {publishing ? "Publicando..." : "Publicar"}
        </button>
      </div>
      {inlineFiles.length>0 && (
        <div className="foro-inline-files">
          {inlineFiles.map(file=>(
            <div key={file.id} className="foro-inline-file">
              {file.isImage ? <img src={file.preview} alt={file.name}/> : <FiFileText/>}
              <span>{file.name}</span>
              <button onClick={()=>onRemoveFile(file.id)} type="button" disabled={publishing}><FiX/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}