import {
  FiEdit2,
  FiTrash2,
  FiUserPlus,
  FiX,
  FiUsers,
} from "react-icons/fi";

import UserAvatar from "../layout/UserAvatar.jsx";
import { avatarStyle } from "../../utils/sectorHelpers.js";
import { colorChipStyle } from "../../colorPresets.js";

export default function SectorAdministrationModal({
  sector,
  isAdmin,
  onClose,
  onAddMember,
  onEdit,
  onDelete,
  onRemoveMember,
}) {
  if (!sector) return null;

  const SectorIcon = sector.icon || FiUsers;

  return (
    <div
      className="gsd-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="gsd-modal"
        style={{ "--sector-color": sector.color }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gsd-sector-title"
      >
        <header className="gsd-header">
          <div className="gsd-header-left">
            <div
              className="gs-sector-icon gs-sector-icon--large"
              style={colorChipStyle(sector.color)}
            >
              <SectorIcon />
            </div>

            <div className="gs-sector-info">
              <h2 id="gsd-sector-title">
                {sector.nombre}
              </h2>

              <span>
                {sector.descripcion || "Sin descripción"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="gs-icon-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <FiX />
          </button>
        </header>

        <div className="gsd-members-head">
          <div>
            <h4>MIEMBROS ASIGNADOS</h4>
            <span className="gsd-members-total">
              {sector.miembros.length}{" "}
              {sector.miembros.length === 1
                ? "miembro"
                : "miembros"}
            </span>
          </div>

          {isAdmin && (
            <button
              type="button"
              className="gs-chip"
              onClick={onAddMember}
            >
              <FiUserPlus />
              Agregar miembro
            </button>
          )}
        </div>

        <div className="gs-detail-members gsd-members-list">
          {sector.miembros.length === 0 ? (
            <div className="gsd-empty-members">
              <FiUsers />
              <p>Este sector aún no tiene miembros.</p>
            </div>
          ) : (
            sector.miembros.map((member) => (
              <div
                key={member.id}
                className="gs-detail-member"
              >
                <div className="gs-detail-member-left">
                  <UserAvatar
                    user={member}
                    className="gs-member-avatar gs-member-avatar--lg"
                    title={member.nombre}
                    style={avatarStyle(member.color)}
                  />

                  <div className="gs-detail-member-info">
                    <p className="gs-dm-name">
                      {member.nombre}
                    </p>

                    <p className="gs-dm-sub">
                      {member.email || member.rol}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    className="gs-dm-remove"
                    onClick={() => onRemoveMember(member)}
                    title={`Quitar a ${member.nombre} del sector`}
                    aria-label={`Quitar a ${member.nombre}`}
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {isAdmin && (
          <footer className="gs-detail-foot">
            <button
              type="button"
              className="gs-detail-edit"
              onClick={onEdit}
            >
              <FiEdit2 />
              Editar sector
            </button>

            <button
              type="button"
              className="gs-danger"
              onClick={onDelete}
            >
              <FiTrash2 />
              Eliminar sector
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}