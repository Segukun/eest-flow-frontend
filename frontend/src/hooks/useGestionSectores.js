import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import api from "../api.js";
import { useApp } from "../context/AppContext";
import { useToast } from "../components/Toast.jsx";

import {
  convertirMiembro,
  convertirSector,
  extraerLista,
  formatRequestDate,
  obtenerId,
} from "../utils/sectorHelpers.js";

export default function useGestionSectores() {
  const { currentUser, users, reloadUsers, reloadCategories, reloadTasks } =
    useApp();

  const toast = useToast();

  // Referencias actualizadas al contexto.
  // Evitan que las funciones de carga cambien de identidad
  // cada vez que AppContext actualiza sus estados.
  const latestRef = useRef({
    users,
    reloadUsers,
    reloadCategories,
    reloadTasks,
    toast,
  });

  latestRef.current = {
    users,
    reloadUsers,
    reloadCategories,
    reloadTasks,
    toast,
  };

  // Evita ejecutar varias cargas de sectores simultáneamente.
  const loadingRef = useRef(false);

  // Conserva las solicitudes actuales para la sincronización.
  const requestsRef = useRef([]);

  const isAdmin = currentUser?.accountType === "admin";

  // -------------------------------------------------------
  // ESTADOS
  // -------------------------------------------------------

  const [sectores, setSectores] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);

  const [editingSector, setEditingSector] = useState(null);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const [adminSectorId, setAdminSectorId] = useState(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState(null);

  const [sectorToDelete, setSectorToDelete] = useState(null);

  const [sectorToLeave, setSectorToLeave] = useState(null);

  const [myRequests, setMyRequests] = useState([]);

  const [clock, setClock] = useState(Date.now());

  const [searchTerm, setSearchTerm] = useState("");

  const [busySectorId, setBusySectorId] = useState(null);

  const adminSector = useMemo(
    () => sectores.find((sector) => sector.id === adminSectorId) ?? null,
    [sectores, adminSectorId],
  );

  // -------------------------------------------------------
  // CARGAR SECTORES Y MIEMBROS
  // -------------------------------------------------------

  const cargarSectores = useCallback(async ({ showLoading = false } = {}) => {
    // No iniciar otra carga si ya existe una en ejecución.
    if (loadingRef.current) {
      return [];
    }

    loadingRef.current = true;

    const context = latestRef.current;

    if (showLoading) {
      setCargando(true);
    }

    try {
      let usuariosConFotos = Array.isArray(context.users) ? context.users : [];

      // Actualizar usuarios y fotografías.
      try {
        const usuariosActualizados = await context.reloadUsers();

        if (Array.isArray(usuariosActualizados)) {
          usuariosConFotos = usuariosActualizados;
        }
      } catch (error) {
        console.warn("No se pudieron actualizar las fotografías:", error);
      }

      // Obtener sectores.
      const response = await api.get("/api/sectors");

      const listaSectores = extraerLista(response.data, "sectors");

      // Obtener los miembros de cada sector.
      const sectoresConvertidos = await Promise.all(
        listaSectores.map(async (sector) => {
          try {
            const miembrosResponse = await api.get(
              `/api/sectors/${sector._id}/members`,
            );

            const miembros = extraerLista(miembrosResponse.data, "members");

            return convertirSector(sector, miembros, usuariosConFotos);
          } catch (error) {
            console.error(
              `Error al obtener miembros del sector ${sector._id}:`,
              error,
            );

            // Conservamos el sector aunque falle su consulta de miembros.
            return convertirSector(sector, []);
          }
        }),
      );

      setSectores(sectoresConvertidos);

      // Cargar solicitudes pendientes.
      try {
        const requestsResponse = await api.get("/api/sectors/requests/mine");

        const requests = requestsResponse.data?.requests ?? [];

        requestsRef.current = requests;
        setMyRequests(requests);
      } catch (error) {
        console.error(
          "No se pudieron cargar las solicitudes pendientes:",
          error,
        );

        requestsRef.current = [];
        setMyRequests([]);
      }

      return usuariosConFotos;
    } catch (error) {
      console.error("Error al cargar sectores:", error);

      if (error.response?.status === 401) {
        context.toast.error("La sesión expiró. Volvé a iniciar sesión.");
      } else {
        context.toast.error("No se pudieron cargar los sectores.");
      }

      return [];
    } finally {
      loadingRef.current = false;

      if (showLoading) {
        setCargando(false);
      }
    }
  }, []);

  useEffect(() => {
    cargarSectores({ showLoading: true });
  }, [cargarSectores]);

  // -------------------------------------------------------
  // ACTUALIZAR EL TIEMPO DE LAS SOLICITUDES
  // -------------------------------------------------------

  useEffect(() => {
    const intervalId = setInterval(() => setClock(Date.now()), 60000);

    return () => clearInterval(intervalId);
  }, []);

  // -------------------------------------------------------
  // SINCRONIZAR SOLICITUDES PENDIENTES
  // -------------------------------------------------------

  useEffect(() => {
    let cancelled = false;
    let refreshing = false;

    const refreshPendingRequests = async () => {
      if (cancelled || refreshing || document.visibilityState !== "visible") {
        return;
      }

      refreshing = true;

      try {
        const response = await api.get("/api/sectors/requests/mine");

        if (cancelled) return;

        const nextRequests = response.data?.requests ?? [];

        const previousRequests = requestsRef.current;

        const nextIds = new Set(
          nextRequests.map((request) => String(request._id)),
        );

        const hadResolvedRequest = previousRequests.some(
          (request) => !nextIds.has(String(request._id)),
        );

        const hasSameRequests =
          previousRequests.length === nextRequests.length &&
          previousRequests.every(
            (request, index) =>
              String(request._id) === String(nextRequests[index]?._id),
          );

        if (!hasSameRequests) {
          requestsRef.current = nextRequests;
          setMyRequests(nextRequests);
        }

        // Solo actualizamos toda la información cuando
        // detectamos que una solicitud pendiente se resolvió.
        if (hadResolvedRequest) {
          const context = latestRef.current;

          await Promise.all([
            context.reloadUsers(),
            context.reloadCategories(),
            context.reloadTasks(),
          ]);

          if (!cancelled) {
            await cargarSectores();
          }
        }
      } catch (error) {
        console.warn("No se pudieron sincronizar las solicitudes:", error);
      } finally {
        refreshing = false;
      }
    };

    const intervalId = setInterval(refreshPendingRequests, 10000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [cargarSectores]);

  // -------------------------------------------------------
  // CREAR Y EDITAR SECTORES
  // -------------------------------------------------------

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
        accessMode: formData.accessMode || "public",
      };

      if (editingSector) {
        await api.put(`/api/sectors/${editingSector.id}`, datos);
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

      const messages = {
        400: message || "Los datos del sector no son válidos.",
        403: "No tenés permisos para realizar esta acción.",
        409: "Ya existe un sector con ese nombre.",
      };

      throw new Error(
        messages[status] ||
          (error.response
            ? "No se pudo guardar el sector. Intentá nuevamente."
            : "No se pudo conectar con el servidor. Revisá tu conexión e intentá nuevamente."),
        { cause: error },
      );
    }
  };

  // -------------------------------------------------------
  // ELIMINAR SECTORES
  // -------------------------------------------------------

  const handleDeleteSector = (sector) => {
    if (!isAdmin || !sector?.id) return;

    setSectorToDelete(sector);
  };

  const confirmDeleteSector = async () => {
    if (!isAdmin || !sectorToDelete) return;

    const sector = sectorToDelete;

    await api.delete(`/api/sectors/${sector.id}`);

    setSectorToDelete(null);
    setIsAdminModalOpen(false);
    setAdminSectorId(null);

    await cargarSectores();

    toast.success(`Se ha eliminado el sector ${sector.nombre}.`);
  };

  // -------------------------------------------------------
  // ABRIR Y CERRAR ADMINISTRACIÓN DE SECTOR
  // -------------------------------------------------------

  const openAdminModal = async (id) => {
    setAdminSectorId(id);
    setIsAdminModalOpen(true);

    try {
      let usuariosConFotos = Array.isArray(users) ? users : [];

      try {
        const usuariosActualizados = await reloadUsers();

        if (Array.isArray(usuariosActualizados)) {
          usuariosConFotos = usuariosActualizados;
        }
      } catch (error) {
        console.warn("No se pudieron actualizar los usuarios:", error);
      }

      const response = await api.get(`/api/sectors/${id}/members`);

      const miembros = extraerLista(response.data, "members");

      setSectores((previous) =>
        previous.map((sector) =>
          sector.id === id
            ? {
                ...sector,
                miembros: miembros.map((miembro) =>
                  convertirMiembro(miembro, usuariosConFotos),
                ),
              }
            : sector,
        ),
      );
    } catch (error) {
      console.error("Error al cargar miembros del sector:", error);
    }
  };

  const closeAdminModal = () => {
    setIsAdminModalOpen(false);
    setAdminSectorId(null);
  };

  // -------------------------------------------------------
  // AGREGAR MIEMBRO
  // -------------------------------------------------------

  const openCreateMember = () => {
    if (!isAdmin) return;

    setIsMemberModalOpen(true);
  };

  const handleSaveMember = async (usuario) => {
    if (!isAdmin) return;

    const userId = usuario?._id || usuario?.id;

    if (!userId) {
      toast.error("No se seleccionó un usuario válido.");
      return;
    }

    if (!adminSectorId) {
      toast.error("No se seleccionó un sector.");
      return;
    }

    const nombreMiembro = usuario.name || usuario.nombre || "el miembro";

    const nombreSector = adminSector?.nombre || "";

    try {
      const userResponse = await api.get(`/api/users/${userId}`);

      const usuarioActual = userResponse.data?.user || userResponse.data;

      const sectoresActuales = Array.isArray(usuarioActual.sectors)
        ? usuarioActual.sectors
        : [];

      const sectoresIds = sectoresActuales
        .map((sector) =>
          typeof sector === "string" ? sector : sector?._id || sector?.id,
        )
        .filter(Boolean);

      const nuevosSectores = [...sectoresIds];

      if (!nuevosSectores.some((id) => String(id) === String(adminSectorId))) {
        nuevosSectores.push(adminSectorId);
      }

      await api.put(`/api/users/${userId}`, {
        sectors: nuevosSectores,
      });

      setIsMemberModalOpen(false);

      toast.success(
        `Se ha agregado a ${nombreMiembro} al sector ${nombreSector}.`,
      );

      const usuariosConFotos = await cargarSectores();

      const sectorActualizado = await api.get(
        `/api/sectors/${adminSectorId}/members`,
      );

      const miembrosActualizados = extraerLista(
        sectorActualizado.data,
        "members",
      );

      setSectores((previous) =>
        previous.map((sector) =>
          sector.id === adminSectorId
            ? {
                ...sector,
                miembros: miembrosActualizados.map((miembro) =>
                  convertirMiembro(miembro, usuariosConFotos ?? users),
                ),
              }
            : sector,
        ),
      );
    } catch (error) {
      console.error("Error al asignar miembro:", error);

      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 400) {
        toast.error(message || "Los datos del usuario no son válidos.");
      } else if (status === 403) {
        toast.error("No tenés permisos para modificar este usuario.");
      } else if (status === 404) {
        toast.error("El usuario no existe.");
      } else {
        toast.error("No se pudo asignar el usuario al sector.");
      }
    }
  };

  // -------------------------------------------------------
  // QUITAR MIEMBRO
  // -------------------------------------------------------

  const handleDeleteMember = (member) => {
    if (!isAdmin || !member?.id) return;

    setMemberToRemove(member);
  };

  const confirmRemoveMember = async () => {
    if (!isAdmin || !memberToRemove) return;

    const member = memberToRemove;
    const sectorNombre = adminSector?.nombre || "";

    const userResponse = await api.get(`/api/users/${member.id}`);

    const usuario = userResponse.data?.user || userResponse.data;

    const sectoresActuales = Array.isArray(usuario.sectors)
      ? usuario.sectors
      : [];

    const sectoresIds = sectoresActuales
      .map((sector) =>
        typeof sector === "string" ? sector : sector?._id || sector?.id,
      )
      .filter(Boolean);

    const nuevosSectores = sectoresIds.filter(
      (id) => String(id) !== String(adminSectorId),
    );

    if (nuevosSectores.length === 0) {
      throw new Error("El usuario debe pertenecer al menos a un sector.");
    }

    await api.put(`/api/users/${member.id}`, {
      sectors: nuevosSectores,
    });

    await cargarSectores();

    setMemberToRemove(null);

    toast.success(
      `Se ha quitado a ${member.nombre} del sector ${sectorNombre}.`,
    );
  };

  // -------------------------------------------------------
  // MEMBRESÍA Y FILTROS
  // -------------------------------------------------------

  // -------------------------------------------------------
  // MEMBRESÍA Y BÚSQUEDA
  // -------------------------------------------------------

  const currentSectorIds = useMemo(
    () => new Set((currentUser?.sectors ?? []).map((item) => obtenerId(item))),
    [currentUser?.sectors],
  );

  const currentUserId = obtenerId(currentUser);

  const isCurrentUserMember = useCallback(
    (sector) =>
      currentSectorIds.has(String(sector.id)) ||
      sector.miembros.some((member) => String(member.id) === currentUserId),
    [currentSectorIds, currentUserId],
  );

  const pendingRequestFor = useCallback(
    (sectorId) =>
      myRequests.find(
        (request) => obtenerId(request.sector) === String(sectorId),
      ),
    [myRequests],
  );

  // La búsqueda SOLO afecta a los sectores ajenos.
  const matchesSearch = useCallback(
    (sector) => {
      const query = searchTerm.trim().toLowerCase();

      if (!query) return true;

      return `${sector.nombre} ${sector.descripcion}`
        .toLowerCase()
        .includes(query);
    },
    [searchTerm],
  );

  // Mis sectores nunca se filtran.
  const ownSectors = useMemo(
    () => sectores.filter((sector) => isCurrentUserMember(sector)),
    [sectores, isCurrentUserMember],
  );

  // La búsqueda únicamente afecta a Otros sectores.
  const otherSectors = useMemo(
    () =>
      sectores.filter(
        (sector) => !isCurrentUserMember(sector) && matchesSearch(sector),
      ),
    [sectores, isCurrentUserMember, matchesSearch],
  );

  const formatDate = useCallback(
    (value) => formatRequestDate(value, clock),
    [clock],
  );

  // -------------------------------------------------------
  // UNIRSE O SOLICITAR ACCESO
  // -------------------------------------------------------

  const handleJoinSector = async (sector) => {
    if (busySectorId !== null) return;

    setBusySectorId(String(sector.id));

    try {
      const response = await api.post(`/api/sectors/${sector.id}/join`);

      const result = response.data;

      if (result?.status === "requested") {
        toast.success(
          "Tu solicitud de acceso fue enviada a los administradores.",
        );
      } else {
        toast.success(`Ahora pertenecés al sector ${sector.nombre}.`);
      }

      await reloadUsers();

      if (result?.status !== "requested") {
        await Promise.all([reloadCategories(), reloadTasks()]);
      }

      await cargarSectores();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "No se pudo completar la acción. Intentá nuevamente.",
      );
    } finally {
      setBusySectorId(null);
    }
  };

  // -------------------------------------------------------
  // CANCELAR SOLICITUD
  // -------------------------------------------------------

  const handleCancelSectorRequest = async (request) => {
    if (!request || busySectorId !== null) return;

    const sectorId = obtenerId(request.sector);

    setBusySectorId(sectorId || "request");

    try {
      await api.delete(`/api/sectors/requests/${request._id}`);

      toast.info("Cancelaste tu solicitud de acceso.");

      await cargarSectores();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "No se pudo cancelar la solicitud. Actualizá la página e intentá nuevamente.",
      );

      await cargarSectores();
    } finally {
      setBusySectorId(null);
    }
  };

  // -------------------------------------------------------
  // ABANDONAR SECTOR
  // -------------------------------------------------------

  const handleConfirmLeaveSector = async () => {
    if (!sectorToLeave || busySectorId !== null) {
      return;
    }

    const sector = sectorToLeave;

    setBusySectorId(String(sector.id));

    try {
      await api.post(`/api/sectors/${sector.id}/leave`);

      setSectorToLeave(null);
      closeAdminModal();

      await reloadUsers();

      await Promise.all([reloadCategories(), reloadTasks()]);

      await cargarSectores();

      toast.success(`Abandonaste el sector ${sector.nombre}.`);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "No se pudo abandonar el sector. Intentá nuevamente.",
      );
    } finally {
      setBusySectorId(null);
    }
  };

  // -------------------------------------------------------
  // RETORNO DEL HOOK
  // -------------------------------------------------------

  return {
    // Datos
    currentUser,
    isAdmin,
    sectores,
    cargando,
    adminSector,
    myRequests,
    ownSectors,
    otherSectors,
    currentSectorIds,
    busySectorId,

    // Filtros
    searchTerm,
    setSearchTerm,

    // Estados de modales
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

    // Funciones
    cargarSectores,
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
  };
}
