import { useState } from "react";
import { FiLock, FiMoon, FiSun } from "react-icons/fi";
import "../styles/components/MiPerfil.css";
import "../styles/components/ConfiguracionModal.css";

export default function ConfiguracionModal({ onClose, onOpenPerfil }) {
  // Selección visual: se reinicia al cerrar y no modifica el tema de la app.
  const [tema, setTema] = useState("claro");

  return (
    <div className="perfil-modal-overlay" onClick={onClose}>
      <div
        className="perfil-modal configuracion-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="configuracion-titulo"
        aria-describedby="configuracion-descripcion"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="perfil-modal-header">
          <div>
            <h2 id="configuracion-titulo">Configuración</h2>
            <p id="configuracion-descripcion">Personalizá tu experiencia en EEST Flow.</p>
          </div>
          <button
            type="button"
            className="perfil-modal-close"
            aria-label="Cerrar configuración"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="perfil-modal-form">
          <section className="configuracion-modal__seccion" aria-labelledby="apariencia-titulo">
            <h3 id="apariencia-titulo">Apariencia</h3>
            <p>Elegí cómo querés visualizar la interfaz.</p>
            <div className="configuracion-modal__temas" role="group" aria-labelledby="apariencia-titulo">
              <label className="configuracion-modal__opcion">
                <input
                  type="radio"
                  name="tema-visual"
                  value="claro"
                  checked={tema === "claro"}
                  onChange={() => setTema("claro")}
                />
                <span><FiSun aria-hidden="true" /> Claro</span>
              </label>
              <label className="configuracion-modal__opcion">
                <input
                  type="radio"
                  name="tema-visual"
                  value="oscuro"
                  checked={tema === "oscuro"}
                  onChange={() => setTema("oscuro")}
                />
                <span><FiMoon aria-hidden="true" /> Oscuro</span>
              </label>
            </div>
          </section>

          <section className="configuracion-modal__seccion" aria-labelledby="seguridad-titulo">
            <h3 id="seguridad-titulo">Seguridad</h3>
            <p>Gestioná la contraseña de tu cuenta.</p>
            <button
              type="button"
              className="perfil-btn cancelar configuracion-modal__password"
              onClick={onOpenPerfil}
            >
              <FiLock aria-hidden="true" /> Cambiar contraseña
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
