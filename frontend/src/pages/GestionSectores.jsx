import { useEffect, useState } from "react";
import {
  FiPlus,
  FiX,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiClipboard,
  FiDollarSign,
  FiUserPlus,
} from "react-icons/fi";
import AgregarSectorModal from "../components/AgregarSectorModal.jsx";
import AgregarMiembroModal from "../components/AgregarMiembroModal.jsx";
import api from "../api.js";
import { useApp } from "../context/AppContext";
import "../styles/pages/GestionSectores.css";

const ICONOS = {
  FiUsers,
  FiClipboard,
  FiDollarSign,
  FiUserPlus,
};

const obtenerIcono = (nombre) => {
  return ICONOS[nombre] || FiUsers;
};

const obtenerIniciales = (nombre = "") => {
  return nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((parte) => parte[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const readableAccent = (color) => {
  if (!color) {
    return "#05903E";
  }

  const hex = color.replace("#", "");

  if (hex.length !== 6) {
    return color;
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminosidad =
    (r * 299 + g * 587 + b * 114) / 1000;

  return luminosidad > 150 ? "#1F151C" : color;
};

const avatarStyle = (color) => ({
  background: `${color || "#05903E"}20`,
  color: `var(--theme-green-text, ${readableAccent(color)})`,
  border: `1px solid var(--theme-green-text, ${color || "#05903E"})`,
});

const convertirMiembro = (miembro) => ({
  id: miembro._id,
  nombre: miembro.name || "",
  email: miembro.email || "",
  accountType: miembro.accountType || "collaborator",
  ini: obtenerIniciales(miembro.name),
  color: "#05903E",
  sectors: miembro.sectors || [],
});

const convertirSector = (sector, miembros = []) => ({
  id: sector._id,
  nombre: sector.name || "",
  descripcion: sector.description || "",
  color: sector.color || "#05903E",
  icon: obtenerIcono(sector.icon),
  miembros: miembros.map(convertirMiembro),
});

export default function GestionSectores() {
  const { currentUser } = useApp();
  const isAdmin = currentUser?.accountType === "admin";
  const [sectores, setSectores] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState(null);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminSectorId, setAdminSectorId] = useState(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const adminSector = sectores.find(
    (sector) => sector.id === adminSectorId
  );

  useEffect(() => {
    cargarSectores();
  }, []);

  const cargarSectores = async () => {
    try {
      setCargando(true);

      const response = await api.get("/api/sectors");

      const listaSectores = Array.isArray(response.data)
        ? response.data
        : response.data.sectors || [];

      const sectoresConvertidos = await Promise.all(
        listaSectores.map(async (sector) => {
          try {
            const miembrosResponse = await api.get(
              `/api/sectors/${sector._id}/members`
            );

            const miembros = Array.isArray(miembrosResponse.data)
              ? miembrosResponse.data
              : miembrosResponse.data.members || [];

            return convertirSector(sector, miembros);
          } catch (error) {
            console.error(
              `Error al obtener miembros del sector ${sector._id}:`,
              error
            );

            return convertirSector(sector, []);
          }
        })
      );

      setSectores(sectoresConvertidos);
    } catch (error) {
      console.error("Error al cargar sectores:", error);

      if (error.response?.status === 401) {
        alert("La sesión expiró. Volvé a iniciar sesión.");
      } else {
        alert("No se pudieron cargar los sectores.");
      }
    } finally {
      setCargando(false);
    }
  };

  const openCreateSector = () => {
    if (!isAdmin) return;
    setEditingSector(null);
    setIsSectorModalOpen(true);
  };

  const openEditSector = (sector) => {
    if (!isAdmin) return;
    setEditingSector(sector);
    setIsSectorModalOpen(true);
  };

  const handleSaveSector = async (formData) => {
    if (!isAdmin) return;
    try {
      const datos = {
        name: formData.nombre.trim(),
        description: formData.descripcion.trim(),
        color: formData.color,
      };

      if (editingSector) {
        await api.put(
          `/api/sectors/${editingSector.id}`,
          datos
        );
      } else {
        await api.post("/api/sectors", datos);
      }

      setIsSectorModalOpen(false);
      setEditingSector(null);

      await cargarSectores();
    } catch (error) {
      console.error("Error al guardar sector:", error);

      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 400) {
        alert(
          message || "Los datos del sector no son válidos."
        );
      } else if (status === 403) {
        alert(
          "No tenés permisos para realizar esta acción."
        );
      } else if (status === 409) {
        alert(
          message || "Ya existe un sector con ese nombre."
        );
      } else {
        alert("No se pudo guardar el sector.");
      }
    }
  };

  const handleDeleteSector = async (id) => {
    if (!isAdmin) return;
    const sector = sectores.find(
      (item) => item.id === id
    );

    if (!sector) {
      return;
    }

    const confirmar = window.confirm(
      `¿Eliminar el sector "${sector.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await api.delete(`/api/sectors/${id}`);

      setIsAdminModalOpen(false);
      setAdminSectorId(null);

      await cargarSectores();
    } catch (error) {
      console.error("Error al eliminar sector:", error);

      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 409) {
        alert(
          message ||
            "No se puede eliminar el sector porque tiene miembros asignados."
        );
      } else if (status === 403) {
        alert(
          "No tenés permisos para eliminar este sector."
        );
      } else {
        alert("No se pudo eliminar el sector.");
      }
    }
  };

  const openAdminModal = async (id) => {
    setAdminSectorId(id);
    setIsAdminModalOpen(true);

    try {
      const response = await api.get(
        `/api/sectors/${id}/members`
      );

      const miembros = Array.isArray(response.data)
        ? response.data
        : response.data.members || [];

      setSectores((prev) =>
        prev.map((sector) =>
          sector.id === id
            ? {
                ...sector,
                miembros: miembros.map(convertirMiembro),
              }
            : sector
        )
      );
    } catch (error) {
      console.error(
        "Error al cargar miembros del sector:",
        error
      );
    }
  };

  const closeAdminModal = () => {
    setIsAdminModalOpen(false);
    setAdminSectorId(null);
    setEditingMember(null);
  };

  const openCreateMember = () => {
    if (!isAdmin) return;
    setEditingMember(null);
    setIsMemberModalOpen(true);
  };

  const openEditMember = (member) => {
    if (!isAdmin) return;
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = async (usuario) => {
    if (!isAdmin) return;
    if (!usuario?._id && !usuario?.id) {
      alert("No se seleccionó un usuario válido.");
      return;
    }

    if (!adminSectorId) {
      alert("No se seleccionó un sector.");
      return;
    }

    const userId = usuario._id || usuario.id;

    try {
      const userResponse = await api.get(
        `/api/users/${userId}`
      );

      const usuarioActual = userResponse.data?.user || userResponse.data;

      const sectoresActuales = Array.isArray(
        usuarioActual.sectors
      )
        ? usuarioActual.sectors
        : [];

      const sectoresIds = sectoresActuales.map((sector) => {
        if (typeof sector === "string") {
          return sector;
        }

        return sector?._id || sector?.id;
      });

      let nuevosSectores = [...sectoresIds];

      if (editingMember) {
        const sectorAnterior = editingMember.sectors?.find?.(
          (sector) => {
            if (typeof sector === "string") {
              return sector !== adminSectorId;
            }

            return (
              (sector?._id || sector?.id) !== adminSectorId
            );
          }
        );

        if (sectorAnterior) {
          const sectorAnteriorId =
            typeof sectorAnterior === "string"
              ? sectorAnterior
              : sectorAnterior._id || sectorAnterior.id;

          nuevosSectores = nuevosSectores.filter(
            (id) => id !== sectorAnteriorId
          );
        }
      }

      if (!nuevosSectores.includes(adminSectorId)) {
        nuevosSectores.push(adminSectorId);
      }

      await api.put(`/api/users/${userId}`, {
        sectors: nuevosSectores,
      });

      setIsMemberModalOpen(false);
      setEditingMember(null);

      await cargarSectores();

      const sectorActualizado = await api.get(
        `/api/sectors/${adminSectorId}/members`
      );

      const miembrosActualizados = Array.isArray(
        sectorActualizado.data
      )
        ? sectorActualizado.data
        : sectorActualizado.data.members || [];

      setSectores((prev) =>
        prev.map((sector) =>
          sector.id === adminSectorId
            ? {
                ...sector,
                miembros:
                  miembrosActualizados.map(convertirMiembro),
              }
            : sector
        )
      );
    } catch (error) {
      console.error(
        "Error al asignar miembro:",
        error
      );

      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 400) {
        alert(
          message || "Los datos del usuario no son válidos."
        );
      } else if (status === 403) {
        alert(
          "No tenés permisos para modificar este usuario."
        );
      } else if (status === 404) {
        alert("El usuario no existe.");
      } else {
        alert("No se pudo asignar el usuario al sector.");
      }
    }
  };

  const handleDeleteMember = async (member) => {
    if (!isAdmin) return;
    if (!member?.id) {
      return;
    }

    const confirmar = window.confirm(
      `¿Quitar a ${member.nombre} de este sector?`
    );

    if (!confirmar) {
      return;
    }

    try {
      const userResponse = await api.get(
        `/api/users/${member.id}`
      );

      const usuario = userResponse.data?.user || userResponse.data;

      const sectoresActuales = Array.isArray(usuario.sectors)
        ? usuario.sectors
        : [];

      const sectoresIds = sectoresActuales.map((sector) => {
        if (typeof sector === "string") {
          return sector;
        }

        return sector?._id || sector?.id;
      });

      const nuevosSectores = sectoresIds.filter(
        (id) => id !== adminSectorId
      );

      if (nuevosSectores.length === 0) {
        alert(
          "El usuario debe pertenecer al menos a un sector."
        );
        return;
      }

      await api.put(`/api/users/${member.id}`, {
        sectors: nuevosSectores,
      });

      await cargarSectores();

      const miembrosResponse = await api.get(
        `/api/sectors/${adminSectorId}/members`
      );

      const miembros = Array.isArray(miembrosResponse.data)
        ? miembrosResponse.data
        : miembrosResponse.data.members || [];

      setSectores((prev) =>
        prev.map((sector) =>
          sector.id === adminSectorId
            ? {
                ...sector,
                miembros: miembros.map(convertirMiembro),
              }
            : sector
        )
      );
    } catch (error) {
      console.error(
        "Error al quitar miembro:",
        error
      );

      alert("No se pudo quitar el miembro del sector.");
    }
  };

  return (
    <>
      <div className="gs-content">
        <div className="gs-header">
          <div>
            <h1>Gestión de Sectores</h1>
            <p>
              Organización y administración de los sectores
              de la escuela.
            </p>
          </div>
        </div>

        {cargando ? (
          <div className="gs-empty">
            Cargando sectores...
          </div>
        ) : sectores.length === 0 ? (
          <div className="gs-empty">
            No hay sectores registrados.
          </div>
        ) : (
          <div className="gs-sectores-list gs-sectores-list--full">
            {sectores.map((sec) => {
              const IconoSector = sec.icon;

              return (
                <div
                  key={sec.id}
                  className="gs-sector-card"
                  style={{ "--sector-color": sec.color }}
                >
                  <div className="gs-sector-card-head">
                    <div
                      className="gs-sector-icon"
                      style={{
                        color: `var(--gs-accent, ${sec.color})`,
                        borderColor: `var(--gs-accent, ${sec.color})`,
                      }}
                    >
                      <IconoSector />
                    </div>

                    <div>
                      <span
                        className="gs-sector-cat"
                        style={{
                          color: `var(--theme-secondary, ${readableAccent(sec.color)})`,
                        }}
                      >
                        SECTOR
                      </span>

                      <h3>{sec.nombre}</h3>
                    </div>

                    <span
                      className="gs-sector-badge"
                      style={{
                        background: `var(--theme-surface-soft, ${sec.color}15)`,
                        color: `var(--theme-secondary, ${readableAccent(sec.color)})`,
                      }}
                    >
                      {sec.miembros.length}{" "}
                      {sec.miembros.length === 1
                        ? "Miembro"
                        : "Miembros"}
                    </span>
                  </div>

                  <p className="gs-sector-description">
                    {sec.descripcion ||
                      "Sin descripción"}
                  </p>

                  <div className="gs-sector-members-preview">
                    {sec.miembros.length === 0 ? (
                      <span className="gs-empty">
                        Sin miembros asignados
                      </span>
                    ) : (
                      <>
                        {sec.miembros
                          .slice(0, 3)
                          .map((member) => (
                            <div
                              key={member.id}
                              className="gs-member-preview"
                            >
                              <span
                                className="gs-member-avatar"
                                style={{
                                  background:
                                    `var(--theme-green-fill, ${member.color})`,
                                }}
                              >
                                {member.ini}
                              </span>

                              <span>
                                {member.nombre}
                              </span>
                            </div>
                          ))}

                        {sec.miembros.length > 3 && (
                          <span className="gs-more">
                            +{sec.miembros.length - 3} más
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="gs-sector-card-foot">
                    <button
                      className="gs-secondary"
                      style={{
                        borderColor: `var(--gs-accent, ${sec.color})`,
                        color: `var(--gs-accent, ${readableAccent(sec.color)})`,
                      }}
                      onClick={() =>
                        openAdminModal(sec.id)
                      }
                    >
                      {isAdmin ? "Administrar sector" : "Ver sector"}
                    </button>
                  </div>
                </div>
              );
            })}

            {isAdmin && (
              <button
                className="gs-add-sector"
                onClick={openCreateSector}
              >
                <span className="gs-add-sector-icon">
                  <FiPlus />
                </span>

                Agregar nuevo sector
              </button>
            )}
          </div>
        )}
      </div>

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

      {isAdmin && (
        <AgregarMiembroModal
          isOpen={isMemberModalOpen}
          onClose={() => {
            setIsMemberModalOpen(false);
            setEditingMember(null);
          }}
          onSave={handleSaveMember}
          initialData={editingMember}
          sectorId={adminSectorId}
        />
      )}

      {isAdminModalOpen && adminSector && (
        <div
          className="gsd-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeAdminModal();
            }
          }}
        >
          <div className="gsd-modal" style={{ "--sector-color": adminSector.color }}>
            <div className="gsd-header">
              <div className="gsd-header-left">
                <div
                  className="gs-sector-icon gs-sector-icon--large"
                  style={{
                    background: `${adminSector.color}15`,
                    color: `var(--gs-accent, ${readableAccent(adminSector.color)})`,
                  }}
                >
                  <adminSector.icon />
                </div>

                <div>
                  <h2>{adminSector.nombre}</h2>

                  <span>
                    {adminSector.descripcion ||
                      "Sin descripción"}
                  </span>
                </div>
              </div>

              <button
                className="gs-icon-btn"
                onClick={closeAdminModal}
              >
                <FiX />
              </button>
            </div>

            <div className="gsd-members-head">
              <h4>
                MIEMBROS ASIGNADOS (
                {adminSector.miembros.length})
              </h4>

              {isAdmin && (
                <button
                  className="gs-chip"
                  onClick={openCreateMember}
                >
                  <FiUserPlus />
                  Agregar miembro
                </button>
              )}
            </div>

            <div className="gs-detail-members gsd-members-list">
              {adminSector.miembros.length === 0 ? (
                <p className="gs-empty">
                  Este sector aún no tiene miembros.
                </p>
              ) : (
                adminSector.miembros.map((member) => (
                  <div
                    key={member.id}
                    className="gs-detail-member"
                  >
                    <div className="gs-detail-member-left">
                      <span
                        className="gs-member-avatar gs-member-avatar--lg"
                        style={avatarStyle(
                          member.color
                        )}
                      >
                        {member.ini}
                      </span>

                      <div>
                        <p className="gs-dm-name">
                          {member.nombre}
                        </p>

                        <p className="gs-dm-sub">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="gs-dm-actions">
                        <button
                          onClick={() =>
                            openEditMember(member)
                          }
                          title="Cambiar sector"
                        >
                          <FiEdit2 />
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteMember(member)
                          }
                          title="Quitar del sector"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {isAdmin && (
              <div className="gs-detail-foot">
                <button
                  onClick={() => {
                    closeAdminModal();
                    openEditSector(adminSector);
                  }}
                >
                  <FiEdit2 />
                  Editar sector
                </button>

                <button
                  className="gs-danger"
                  onClick={() =>
                    handleDeleteSector(
                      adminSector.id
                    )
                  }
                >
                  <FiTrash2 />
                  Eliminar sector
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
