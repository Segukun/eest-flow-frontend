import { FiClock } from "react-icons/fi";

export default function PendingRequestsPanel({
  requests,
  formatDate,
  busySectorId,
  onCancel,
}) {
  if (!requests.length) return null;

  return (
    <section className="gs-requests-panel">
      <div className="gs-requests-heading">
        <div>
          <span className="gs-section-kicker">
            EN SEGUIMIENTO
          </span>

          <h2>Solicitudes pendientes</h2>

          <p>
            Cuando un administrador responda,
            la solicitud desaparecerá de esta lista.
          </p>
        </div>

        <span className="gs-requests-count">
          {requests.length}
        </span>
      </div>

      <div className="gs-requests-list">
        {requests.map((request) => {
          const sectorId = String(
            request.sector?._id ??
            request.sector?.id ??
            ""
          );

          const isBusy = busySectorId === sectorId;

          return (
            <article
              className="gs-request-item"
              key={request._id}
            >
              <div className="gs-request-item__icon">
                <FiClock />
              </div>

              <div className="gs-request-item__copy">
                <strong>
                  {request.sector?.name || "Sector"}
                </strong>

                <span>
                  Solicitaste acceso ·{" "}
                  {formatDate(request.createdAt)}
                </span>
              </div>

              <button
                type="button"
                className="gs-request-cancel"
                onClick={() => onCancel(request)}
                disabled={busySectorId !== null}
              >
                {isBusy ? "Cancelando…" : "Cancelar"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}