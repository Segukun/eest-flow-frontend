# EEST Flow Frontend

Repositorio del frontend de EEST Flow.

EEST Flow es una aplicación web privada destinada a la organización interna de la EEST N.º 1. Será utilizada por preceptores, profesores, directores y secretarios.

## Función de este repositorio

Este repositorio contiene:

- Pantallas de la aplicación.
- Navegación.
- Componentes visuales.
- Formularios.
- Validaciones de interfaz.
- Estilos.
- Comunicación con la API del backend.

El backend y la base de datos se encuentran en otro repositorio.

## Tecnologías

- React.
- JavaScript.
- CSS.
- Vite.
- React Router DOM.
- Axios.
- React Icons.

## Primera versión

La primera versión del frontend estará formada por:

- Pantalla de inicio de sesión.
- Tablero de tareas.
- Cuatro columnas de estado.
- Tarjetas de tareas.
- Formulario para crear o editar tareas.
- Detalle de una tarea.
- Mensajes de validación.
- Pantalla administrativa para la creación de cuentas.

No existe registro público.

## Estados del tablero

- Pendiente.
- En curso.
- Revisión.
- Terminado.

## Datos de una tarea

- Título.
- Descripción.
- Persona asignada opcional.
- Fecha de entrega opcional.
- Prioridad.
- Categoría opcional.
- Estado.

## Prioridades

- Baja.
- Media.
- Alta.

## Estructura inicial

```text
frontend/
├── public/
│   └── assets/
├── src/
│   ├── components/
│   ├── pages/
│   ├── styles/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── vite.config.js
```

La estructura podrá organizarse internamente a medida que se agreguen los componentes y pantallas correspondientes al sprint.

## Diseño

Los bocetos iniciales fueron realizados en papel por Joaquín.

El diseño digital está siendo desarrollado en Figma por Benicio y Sebastián.

La implementación debe respetar:

- El diseño aprobado en Figma.
- El escudo escolar como logotipo.
- La paleta de colores definida.
- Las tipografías seleccionadas.
- Los componentes del UI Kit.

### Paleta de colores

- Naranja: `#FF880F`
- Verde: `#05903E`
- Terracota: `#DC9655`
- Grafito: `#1F151C`
- Blanco hueso: `#FFF9ED`

## Instalación

Se necesita Node.js y npm. Después de clonar el repositorio:

```bash
cd frontend
npm install
```

## Ejecución local

```bash
npm run dev
```

## Construcción

```bash
npm run build
```

## Verificación del código

```bash
npm run lint
```

## Backend

El frontend se comunicará con la API ubicada en el repositorio backend de EEST Flow.

La dirección y configuración de la API se documentarán cuando se realice la conexión entre ambos proyectos.

## Sprint 2

Durante el Sprint 2 se realizará:

- Configuración inicial del proyecto.
- Organización de carpetas.
- Instalación de dependencias.
- Configuración de rutas.
- Navegación inicial.
- Pantalla de inicio de sesión.
- Primera versión visual del tablero.
- Componentes visuales reutilizables.
- Formulario inicial de tareas.
- Validaciones de interfaz.
- Comprobación de la ejecución local.

La integración completa con el backend se realizará progresivamente durante los próximos sprints.

## Trabajo en el repositorio

Antes de solicitar una revisión se debe comprobar que:

- El proyecto se inicia correctamente.
- No aparecen errores durante el uso básico.
- Los componentes no están duplicados.
- El diseño respeta el Figma.
- La interfaz se adapta a diferentes tamaños.
- Los cambios están subidos a la rama acordada.
- Se adjuntaron capturas y evidencias en Trello.

## Estado

Proyecto en desarrollo.

Actualmente se está construyendo la estructura inicial del frontend correspondiente al Sprint 2.
