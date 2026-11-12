import { FiPlus } from "react-icons/fi";

import AgregarSectorModal from "../components/AgregarSectorModal.jsx";
import AgregarMiembroModal from "../components/AgregarMiembroModal.jsx";

import ConfirmacionQuitarMiembroModal from "../components/ConfirmacionQuitarMiembroModal.jsx";
import ConfirmacionEliminarSectorModal from "../components/ConfirmarEliminarSectorModal.jsx";

import SectorGroup from "../components/sectores/SectorGroup.jsx";
import SectorSearch from "../components/sectores/SectorSearch.jsx";
import PendingRequestsPanel from "../components/sectores/PendingRequestsPanel.jsx";
import SectorAdministrationModal from "../components/sectores/SectorAdministrationModal.jsx";
import LeaveSectorModal from "../components/sectores/LeaveSectorModal.jsx";

import useGestionSectores from "../hooks/useGestionSectores.js";

import "../styles/pages/GestionSectores.css";

export default function GestionSectores() {
  const gestion = useGestionSectores();

  const {
    isAdmin,
    sectores,
    cargando,
    adminSector,
    myRequests,
    ownSectors,
    otherSectors,
    currentSectorIds,
    busySectorId,

    searchTerm,
    setSearchTerm,

    isSectorModalOpen,
    setIsSectorModalOpen,
    editingSector,
    setEditingSector,

    isAdminModalOpen,
    adminSectorId,

    isMemberModalOpen,
    setIsMemberModalOpen,

    memberToRemove,
    setMemberToRemove,

    sectorToDelete,
    setSectorToDelete,

    sectorToLeave,
    setSectorToLeave,

    openCreateSector,
    openEditSector,
    handleSaveSector,

    handleDeleteSector,
    confirmDeleteSector,

    openAdminModal,
    closeAdminModal,

    openCreateMember,
    handleSaveMember,

    handleDeleteMember,
    confirmRemoveMember,

    isCurrentUserMember,
    pendingRequestFor,
    formatDate,

    handleJoinSector,
    handleCancelSectorRequest,
    handleConfirmLeaveSector,
  } = gestion;

  // Comprobamos si existen sectores que todavía no integrás.
  // La búsqueda no interviene en esta comprobación.
  const hasOtherSectors = sectores.some(
    (sector) => !isCurrentUserMember(sector)
  );

  return (
    <>
      <main className="gs-content">

        {/* ENCABEZADO */}

        <header className="gs-header">
          <div className="gs-header__content">

            <h1>Gestión de Sectores</h1>

            <p>
              Organizá tus espacios de trabajo.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              className="gs-primary"
              onClick={openCreateSector}
            >
              <FiPlus />
              Nuevo sector
            </button>
          )}
        </header>

        {/* SOLICITUDES PENDIENTES */}

        <PendingRequestsPanel
          requests={myRequests}
          formatDate={formatDate}
          busySectorId={busySectorId}
          onCancel={handleCancelSectorRequest}
        />

        {/* CONTENIDO */}

        {cargando ? (
          <div className="gs-loading">
            <span className="gs-loading__spinner" />
            <span>Cargando sectores...</span>
          </div>
        ) : sectores.length === 0 ? (
          <div className="gs-empty-state">
            <div className="gs-empty-state__content">
              <span className="gs-empty-state__eyebrow">
                ESPACIOS DE TRABAJO
              </span>

              <h2>Todavía no hay sectores</h2>

              <p>
                Cuando se creen sectores, aparecerán acá
                para que puedas consultar sus miembros
                y gestionar tu participación.
              </p>

              {isAdmin && (
                <button
                  type="button"
                  className="gs-primary"
                  onClick={openCreateSector}
                >
                  <FiPlus />
                  Crear primer sector
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="gs-sector-groups">

            {/* MIS SECTORES: SIEMPRE COMPLETOS */}

            <SectorGroup
              kicker="TU ESPACIO"
              title="Mis sectores"
              description="Sectores a los que ya pertenecés."
              sectors={ownSectors}
              isAdmin={isAdmin}
              isMember={isCurrentUserMember}
              pendingRequestFor={pendingRequestFor}
              currentSectorCount={currentSectorIds.size}
              busySectorId={busySectorId}
              onOpenSector={openAdminModal}
              onJoinSector={handleJoinSector}
              onCancelRequest={handleCancelSectorRequest}
              onLeaveSector={setSectorToLeave}
              emptyMessage="Todavía no pertenecés a ningún sector."
            />

            {/* BÚSQUEDA: SOLAMENTE PARA DESCUBRIR */}

            {hasOtherSectors && (
              <SectorSearch
                value={searchTerm}
                onChange={setSearchTerm}
              />
            )}

            {/* OTROS SECTORES: SÍ SE PUEDEN FILTRAR */}

            {hasOtherSectors && (
              <SectorGroup
                kicker="DESCUBRIR"
                title="Otros sectores"
                description="Explorá los sectores disponibles y sumate a los que necesites."
                sectors={otherSectors}
                isAdmin={isAdmin}
                isMember={isCurrentUserMember}
                pendingRequestFor={pendingRequestFor}
                currentSectorCount={currentSectorIds.size}
                busySectorId={busySectorId}
                onOpenSector={openAdminModal}
                onJoinSector={handleJoinSector}
                onCancelRequest={handleCancelSectorRequest}
                onLeaveSector={setSectorToLeave}
                emptyMessage="No encontramos otros sectores que coincidan con tu búsqueda."
              />
            )}
          </div>
        )}
      </main>

      {/* CREAR / EDITAR SECTOR */}

      {isAdmin && (
        <AgregarSectorModal
          isOpen={isSectorModalOpen}
          onClose={() => {
            setIsSectorModalOpen(false);
            setEditingSector(null);
          }}
          onSave={handleSaveSector}
          initialData={editingSector}
        />
      )}

      {/* AGREGAR MIEMBRO */}

      {isAdmin && (
        <AgregarMiembroModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          onSave={handleSaveMember}
          sectorId={adminSectorId}
        />
      )}

      {/* ADMINISTRACIÓN DEL SECTOR */}

      {isAdminModalOpen && adminSector && (
        <SectorAdministrationModal
          sector={adminSector}
          isAdmin={isAdmin}
          onClose={closeAdminModal}
          onAddMember={openCreateMember}
          onEdit={() => {
            closeAdminModal();
            openEditSector(adminSector);
          }}
          onDelete={() =>
            handleDeleteSector(adminSector)
          }
          onRemoveMember={handleDeleteMember}
        />
      )}

      {/* CONFIRMAR QUITAR MIEMBRO */}

      {memberToRemove && (
        <ConfirmacionQuitarMiembroModal
          miembro={memberToRemove}
          sectorNombre={adminSector?.nombre}
          onClose={() => setMemberToRemove(null)}
          onConfirm={confirmRemoveMember}
        />
      )}

      {/* CONFIRMAR ELIMINAR SECTOR */}

      {sectorToDelete && (
        <ConfirmacionEliminarSectorModal
          sector={sectorToDelete}
          onClose={() => setSectorToDelete(null)}
          onConfirm={confirmDeleteSector}
        />
      )}

      {/* CONFIRMAR ABANDONAR SECTOR */}

      <LeaveSectorModal
        sector={sectorToLeave}
        currentSectorCount={currentSectorIds.size}
        busy={busySectorId !== null}
        onClose={() => setSectorToLeave(null)}
        onConfirm={handleConfirmLeaveSector}
      />
    </>
  );
}