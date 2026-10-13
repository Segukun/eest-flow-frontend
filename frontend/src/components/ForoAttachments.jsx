import { FiFileText, FiDownload } from "react-icons/fi";

export default function ForoAttachments({ attachments, onImageClick, onDownload }) {
  if(!attachments?.length) return null;
  return (
    <div className="foro-attachments">
      {attachments.map(att=>
        att.type==="image" ? (
          <div key={att.id} className="foro-attachment-image foro-attachment-thumb" onClick={()=>onImageClick(att)} title="Click para ver en grande">
            <img src={att.url} alt={att.name} />
          </div>
        ) : (
          <div key={att.id} className="foro-file foro-file-downloadable" onClick={()=>onDownload(att)} title="Click para descargar">
            <div className="foro-file-icon"><FiFileText/></div>
            <div><p className="foro-file-name">{att.name}</p><span>{att.size} · Documento</span></div>
            <span className="foro-file-download"><FiDownload/> PDF</span>
          </div>
        )
      )}
    </div>
  );
}
