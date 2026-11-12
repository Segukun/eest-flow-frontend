import SectorCard from "./SectorCard.jsx";

export default function SectorGroup({
  kicker,
  title,
  description,
  sectors,
  isAdmin,
  isMember,
  pendingRequestFor,
  currentSectorCount,
  busySectorId,
  onOpenSector,
  onJoinSector,
  onCancelRequest,
  onLeaveSector,
  emptyMessage,
}) {
  return (
    <section className="gs-sector-group">
      <div className="gs-sector-group__heading">
        <div>
          <span className="gs-section-kicker">
            {kicker}
          </span>

          <h2>{title}</h2>

          <p>{description}</p>
        </div>

        <span className="gs-group-count">
          {sectors.length}
        </span>
      </div>

      {sectors.length > 0 ? (
        <div className="gs-sectores-list gs-sectores-list--full">
          {sectors.map((sector) => {
            const member = isMember(sector);
            const pending = pendingRequestFor(sector.id);
            const isBusy =
              busySectorId === String(sector.id);

            return (
              <SectorCard
                key={sector.id}
                sector={sector}
                isAdmin={isAdmin}
                isMember={member}
                pendingRequest={pending}
                onlySector={
                  currentSectorCount <= 1 && member
                }
                isBusy={isBusy}
                hasBusyOperation={busySectorId !== null}
                onOpen={() => onOpenSector(sector.id)}
                onJoin={() => onJoinSector(sector)}
                onCancelRequest={() =>
                  onCancelRequest(pending)
                }
                onLeave={() => onLeaveSector(sector)}
              />
            );
          })}
        </div>
      ) : (
        <div className="gs-group-empty">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}