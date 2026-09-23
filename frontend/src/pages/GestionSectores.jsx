import { useState } from "react";
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
import "../styles/pages/GestionSectores.css";

const INITIAL_SECTORES = [
  {
    id: "profesores",
    categoria: "SECTOR ACADÉMICO",
    nombre: "PROFESORES",
    color: "#05903E",
    descripcion: "Docentes de materias técnicas y generales",
    icon: FiUsers,
    miembros: [
      { id: "1", ini: "JS", nombre: "Juan Smoes", materia: "Electrotecnia General", color: "#05903E" },
      { id: "2", ini: "MC", nombre: "Marta Costa", materia: "Sistemas Digitales", color: "#FF880F" },
      { id: "3", ini: "RG", nombre: "Roberto Gómez", materia: "Física Aplicada", color: "#DC9655" },
      { id: "4", ini: "LL", nombre: "Laura López", materia: "Taller de Informática", color: "#05903E" },
    ],
  },
  {
    id: "preceptoria",
    categoria: "ASISTENCIA Y CONTROL",
    nombre: "PRECEPTORÍA",
    color: "#FF880F",
    descripcion: "Control de asistencia y convivencia",
    icon: FiClipboard,
    miembros: [
      { id: "5", ini: "CB", nombre: "Claudio Bravo", color: "#DC9655" },
      { id: "6", ini: "SR", nombre: "Silvia Ramos", color: "#05903E" },
    ],
  },
  {
    id: "tesoreria",
    categoria: "ADMINISTRACIÓN Y FINANZAS",
    nombre: "TESORERÍA",
    color: "#1F151C",
    descripcion: "Administración contable",
    icon: FiDollarSign,
    miembros: [
      { id: "7", ini: "VG", nombre: "Valeria García", color: "#05903E" },
    ],
  },
];

export default function GestionSectores() {
  const [sectores, setSectores] = useState(INITIAL_SECTORES);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState(null);

  // Modal Administrar (detalle)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminSectorId, setAdminSectorId] = useState(null);

  // Modal Miembros
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const adminSector = sectores.find((s) => s.id === adminSectorId);

  // --- SECTORES ---
  const openCreateSector = () => {
    setEditingSector(null);
    setIsSectorModalOpen(true);
  };

  const openEditSector = (sector) => {
    setEditingSector(sector);
    setIsSectorModalOpen(true);
  };

  const handleSaveSector = (formData) => {
    if (editingSector) {
      setSectores((prev) =>
        prev.map((s) =>
          s.id === editingSector.id ? { ...s, ...formData, nombre: formData.nombre } : s
        )
      );
    } else {
      if (sectores.some((s) => s.nombre === formData.nombre)) {
        alert("Ya existe un sector con ese nombre");
        return;
      }
      const newId = formData.nombre.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
      setSectores((prev) => [
        ...prev,
        {
          id: newId,
          icon: FiUsers,
          miembros: [],
          ...formData,
        },
      ]);
    }
    setEditingSector(null);
  };

  const handleDeleteSector = (id) => {
    if (!window.confirm(`¿Eliminar ${sectores.find((s) => s.id === id)?.nombre}?`)) return;
    setSectores((prev) => prev.filter((s) => s.id !== id));
    setIsAdminModalOpen(false);
  };

  // --- ADMINISTRAR MODAL ---
  const openAdminModal = (id) => {
    setAdminSectorId(id);
    setIsAdminModalOpen(true);
  };

  const closeAdminModal = () => {
    setIsAdminModalOpen(false);
    setAdminSectorId(null);
  };

  // --- MIEMBROS ---
  const openCreateMember = () => {
    setEditingMember(null);
    setIsMemberModalOpen(true);
  };

  const openEditMember = (m) => {
    setEditingMember(m);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = (formData) => {
    const ini = formData.nombre.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
    if (editingMember) {
      setSectores((prev) =>
        prev.map((s) =>
          s.id === adminSectorId
            ? { ...s, miembros: s.miembros.map((m) => (m.id === editingMember.id ? { ...m, ...formData, ini } : m)) }
            : s
        )
      );
    } else {
      const nuevo = { id: Date.now().toString(), ini, ...formData };
      setSectores((prev) =>
        prev.map((s) => (s.id === adminSectorId ? { ...s, miembros: [...s.miembros, nuevo] } : s))
      );
    }
  };

  const handleDeleteMember = (memberId) => {
    setSectores((prev) =>
      prev.map((s) =>
        s.id === adminSectorId ? { ...s, miembros: s.miembros.filter((m) => m.id !== memberId) } : s
      )
    );
  };

  return (
    <>
      <div className="gs-content">
        <div className="gs-header">
          <div>
            <h1>Gestión de Sectores</h1>
            <p>Organización y administración de roles, áreas y dependencias técnicas de la escuela.</p>
          </div>
        </div>

        {/* SOLO LISTA, SIN PANEL LATERAL */}
        <div className="gs-sectores-list gs-sectores-list--full">
          {sectores.map((sec) => (
            <div key={sec.id} className="gs-sector-card">
              <div className="gs-sector-card-head">
                <div className="gs-sector-icon" style={{ color: sec.color, borderColor: sec.color }}>
                  <sec.icon />
                </div>
                <div>
                  <span className="gs-sector-cat" style={{ color: sec.color === "#1F151C" ? "#DC9655" : sec.color }}>
                    {sec.categoria}
                  </span>
                  <h3>{sec.nombre}</h3>
                </div>
                <span className="gs-sector-badge" style={{ background: `${sec.color}15`, color: sec.color }}>
                  {sec.miembros.length} {sec.miembros.length === 1 ? "Miembro" : "Miembros"}
                </span>
              </div>

              <div className="gs-sector-members-preview">
                {sec.miembros.length === 0 ? (
                  <span className="gs-empty">Sin miembros asignados</span>
                ) : (
                  <>
                    {sec.miembros.slice(0, 3).map((m) => (
                      <div key={m.id} className="gs-member-preview">
                        <span className="gs-member-avatar" style={{ background: m.color }}>
                          {m.ini}
                        </span>
                        <span>{m.nombre}</span>
                      </div>
                    ))}
                    {sec.miembros.length > 3 && <span className="gs-more">+{sec.miembros.length - 3} más</span>}
                  </>
                )}
              </div>

              <div className="gs-sector-card-foot">
                <button className="gs-secondary" style={{ borderColor: sec.color, color: sec.color }} onClick={() => openAdminModal(sec.id)}>
                  Administrar sector
                </button>
              </div>
            </div>
          ))}

          <button className="gs-add-sector" onClick={openCreateSector}>
            <span className="gs-add-sector-icon"><FiPlus /></span> Agregar nuevo sector
          </button>
        </div>
      </div>

      {/* MODAL AGREGAR/EDITAR SECTOR */}
      <AgregarSectorModal
        isOpen={isSectorModalOpen}
        onClose={() => { setIsSectorModalOpen(false); setEditingSector(null); }}
        onSave={handleSaveSector}
        initialData={editingSector}
      />

      {/* MODAL MIEMBRO */}
      <AgregarMiembroModal
        isOpen={isMemberModalOpen}
        onClose={() => { setIsMemberModalOpen(false); setEditingMember(null); }}
        onSave={handleSaveMember}
        initialData={editingMember}
      />

      {/* MODAL ADMINISTRAR SECTOR - APARECE SOLO AL TOCAR ADMINISTRAR */}
      {isAdminModalOpen && adminSector && (
        <div className="gsd-overlay" onClick={(e) => e.target === e.currentTarget && closeAdminModal()}>
          <div className="gsd-modal">
            <div className="gsd-header">
              <div className="gsd-header-left">
                <div className="gs-sector-icon gs-sector-icon--large" style={{ background: `${adminSector.color}15`, color: adminSector.color }}>
                  <adminSector.icon />
                </div>
                <div>
                  <h2>{adminSector.nombre}</h2>
                  <span>{adminSector.categoria} • {adminSector.descripcion || "Sin descripción"}</span>
                </div>
              </div>
              <button className="gs-icon-btn" onClick={closeAdminModal}><FiX /></button>
            </div>

            <div className="gsd-members-head">
              <h4>MIEMBROS ASIGNADOS ({adminSector.miembros.length})</h4>
              <button className="gs-chip" onClick={openCreateMember}><FiUserPlus /> Agregar miembro</button>
            </div>

            <div className="gs-detail-members gsd-members-list">
              {adminSector.miembros.length === 0 ? (
                <p className="gs-empty">Este sector aún no tiene miembros.</p>
              ) : (
                adminSector.miembros.map((m) => (
                  <div key={m.id} className="gs-detail-member">
                    <div className="gs-detail-member-left">
                      <span className="gs-member-avatar gs-member-avatar--lg" style={{ background: `${m.color}33`, color: m.color }}>{m.ini}</span>
                      <div>
                        <p className="gs-dm-name">{m.nombre}</p>
                        {m.materia && <p className="gs-dm-sub">{m.materia}</p>}
                      </div>
                    </div>
                    <div className="gs-dm-actions">
                      <button onClick={() => openEditMember(m)}><FiEdit2 /></button>
                      <button onClick={() => handleDeleteMember(m.id)}><FiTrash2 /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="gs-detail-foot">
              <button onClick={() => { closeAdminModal(); openEditSector(adminSector); }}><FiEdit2 /> Editar sector</button>
              <button className="gs-danger" onClick={() => handleDeleteSector(adminSector.id)}><FiTrash2 /> Eliminar sector</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
