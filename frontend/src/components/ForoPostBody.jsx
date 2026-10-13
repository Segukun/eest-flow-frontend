import { FiSave } from "react-icons/fi";
import ForoAttachments from "./ForoAttachments.jsx";

export default function ForoPostBody({
  post, isEditing, editText, setEditText, onSaveEdit, onCancelEdit,
  displayText, isLong, visibleCount, CHAR_LIMIT, isFullyExpanded,
  onVerMas, onVerMenos,
  onImageClick, onDownload
}) {
  return (
    <div className="foro-post-body">
      {isEditing ? (
        <div className="foro-edit-area">
          <textarea value={editText} onChange={e=>setEditText(e.target.value)} autoFocus rows={5} placeholder="Editá tu publicación..."/>
          <div className="foro-edit-actions">
            <button onClick={onCancelEdit} type="button" className="foro-edit-cancel">Cancelar</button>
            <button onClick={onSaveEdit} type="button" className="foro-edit-save" disabled={!editText.trim()}><FiSave/> Guardar</button>
          </div>
        </div>
      ) : (
        <>
          <p className="foro-post-text">{displayText}</p>
          {isLong && (
            <div className={`foro-ver-mas-wrapper ${visibleCount>CHAR_LIMIT?"foro-ver-mas-wrapper--expanded":""}`}>
              {visibleCount<=CHAR_LIMIT ? (
                <button className="foro-ver-mas" onClick={onVerMas} type="button">Ver más</button>
              ) : (
                <>
                  <button className={`foro-ver-mas ${!isFullyExpanded?"foro-ver-mas--active":"foro-ver-mas--disabled"}`} onClick={onVerMas} type="button" disabled={isFullyExpanded}>Ver más</button>
                  <span className="foro-ver-mas-sep">·</span>
                  <button className="foro-ver-mas foro-ver-mas--menos" onClick={onVerMenos} type="button">Ver menos</button>
                </>
              )}
            </div>
          )}
        </>
      )}
      {post.attachments.length>0 && !isEditing && (
        <ForoAttachments attachments={post.attachments} onImageClick={onImageClick} onDownload={onDownload}/>
      )}
    </div>
  );
}
