import {
  FiClipboard,
  FiClock,
  FiGlobe,
  FiLock,
  FiLogOut,
} from "react-icons/fi";

import { colorChipStyle } from "../../colorPresets.js";
import UserAvatar from "../layout/UserAvatar.jsx";

import { avatarStyle, readableAccent } from "../../utils/sectorHelpers.js";

export default function SectorCard({
  sector,
  isAdmin,
  isMember,
  pendingRequest,
  onlySector,
  isBusy,
  hasBusyOperation,
  onOpen,
  onJoin,
  onCancelRequest,
  onLeave,
}) {
  const SectorIcon = sector.icon;

  return (
    <article
      className="gs-sector-card"
      style={{ "--sector-color": sector.color }}
    >
      <div className="gs-sector-card__main">
        <div className="gs-sector-card-head">
          <div
            className="gs-sector-icon"
            style={colorChipStyle(sector.color)}
          >
            <SectorIcon />
          </div>

          <div className="gs-sector-info">
            <span
              className="gs-sector-cat"
              style={{
                color: `var(--theme-secondary, ${readableAccent(sector.color)})`,
              }}
            >
              SECTOR
            </span>

            <h3>{sector.nombre}</h3>
          </div>

          <span
            className="gs-sector-badge"
            style={colorChipStyle(sector.color)}
          >
            {sector.miembros.length}{" "}
            {sector.miembros.length === 1
              ? "miembro"
              : "miembros"}
          </span>
        </div>

        <p className="gs-sector-description">
          {sector.descripcion || "Sin descripción"}
        </p>

        <div className="gs-sector-meta">
          <span
            className={`gs-access-badge ${
              sector.accessMode === "public"
                ? "is-public"
                : "is-request"
            }`}
          >
            {sector.accessMode === "public"
              ? <FiGlobe />
              : <FiLock />}

            {sector.accessMode === "public"
              ? "Público"
              : "Requiere solicitud"}
          </span>

          <span className="gs-category-count">
            <FiClipboard />

            {sector.categoryCount}{" "}
            {sector.categoryCount === 1
              ? "categoría"
              : "categorías"}
          </span>
        </div>

        <div className="gs-sector-members-preview">
          {sector.miembros.length === 0 ? (
            <span className="gs-empty">
              Sin miembros asignados
            </span>
          ) : (
            <>
              {sector.miembros
                .slice(0, 4)
                .map((member) => (
                  <div
                    key={member.id}
                    className="gs-member-preview"
                    title={member.nombre}
                  >
                    <UserAvatar
                      user={member}
                      className="gs-member-avatar"
                      title={member.nombre}
                      style={avatarStyle(member.color)}
                    />

                    <span>{member.nombre}</span>
                  </div>
                ))}

              {sector.miembros.length > 4 && (
                <span className="gs-more">
                  +{sector.miembros.length - 4} más
                </span>
              )}
            </>
          )}
        </div>
      </div>

      <div className="gs-sector-card-foot gs-sector-card-foot--membership">
        <button
          type="button"
          className="gs-secondary"
          onClick={onOpen}
        >
          {isAdmin
            ? "Administrar sector"
            : "Ver sector"}
        </button>

        {isMember ? (
          <button
            type="button"
            className="gs-membership-button is-leave"
            onClick={onLeave}
            disabled={onlySector || hasBusyOperation}
            title={
              onlySector
                ? "Debés pertenecer al menos a un sector"
                : "Abandonar sector"
            }
          >
            <FiLogOut />

            {isBusy
              ? "Procesando…"
              : "Abandonar"}
          </button>
        ) : pendingRequest ? (
          <button
            type="button"
            className="gs-membership-button is-pending"
            onClick={onCancelRequest}
            disabled={hasBusyOperation}
          >
            <FiClock />

            {isBusy
              ? "Cancelando…"
              : "Pendiente · Cancelar"}
          </button>
        ) : (
          <button
            type="button"
            className="gs-membership-button is-join"
            onClick={onJoin}
            disabled={hasBusyOperation}
          >
            {sector.accessMode === "public" || isAdmin
              ? <FiGlobe />
              : <FiLock />}

            {isBusy
              ? "Procesando…"
              : sector.accessMode === "public" || isAdmin
                ? "Unirme"
                : "Solicitar acceso"}
          </button>
        )}
      </div>
    </article>
  );
}