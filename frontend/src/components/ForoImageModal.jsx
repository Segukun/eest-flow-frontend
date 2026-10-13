import { FiX, FiDownload } from "react-icons/fi";
export default function ForoImageModal({ image, onClose, onDownload }) {
  if(!image) return null;
  return (
    <div className="foro-image-modal-overlay" onClick={onClose}>
      <div className="foro-image-modal" onClick={e=>e.stopPropagation()}>
        <div className="foro-image-modal-top">
          <span className="foro-image-modal-title">{image.name||"Imagen"}</span>
          <button className="foro-image-modal-close" onClick={onClose} type="button"><FiX/></button>
        </div>
        <div className="foro-image-modal-body"><img src={image.url||image.preview} alt={image.name}/></div>
        <div className="foro-image-modal-bottom">
          <button className="foro-image-modal-download" onClick={()=>onDownload(image)} type="button"><FiDownload/> Descargar</button>
        </div>
      </div>
    </div>
  );
}
