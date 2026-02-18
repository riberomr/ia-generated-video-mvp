# Reporte de Tareas Realizadas - POC Course Builder

**Rama:** `poc/course-builder` (Comparativa vs `course-builder`)
**Objetivo:** Consolidar la POC para despliegue, enfocándose en la generación de guiones y videos mediante templates de Synthesia.

---

## 1. Definición de Alcance y Enfoque Final

- **Especialización en Templates:** Se definió que la POC se centrará exclusivamente en la generación basada en templates de Synthesia. Para esto, se realizó una limpieza profunda eliminando módulos experimentales previos (`courses`, `assets`, `scripts` antiguos y generación "desde cero").
- **Centralización de Lógica:** Creación del módulo `ai-scripts` en la API para manejar todo el ciclo de vida del guion generado por IA en un solo lugar.

## 2. Mejoras en la Persistencia de Datos

- **Evolución del Esquema (Prisma):**
  - **Source Content:** Se agregó `sourceContent` para guardar el texto extraído de documentos (PDF/DOCX), permitiendo regeneraciones sin repetir la subida de archivos.
  - **Variables Crudas:** Inclusión de `rawTemplateVariables` para mantener la estructura original del template para validaciones futuras.
  - **Soft Delete:** Implementación de `isDeleted` en los modelos `AiScript` y `VideoRender`.
  - **Trazabilidad:** Adición de `templateName` para identificar fácilmente el origen del video.

## 3. Nuevas Funcionalidades

- **Regeneración Escena por Escena:**
  - Capacidad de pedirle a la IA que reescriba solo una escena específica manteniendo el contexto global.
  - Interfaz dedicada `SceneRegenerationModal` para capturar instrucciones del usuario.
- **Eliminación Lógica:** Implementación completa del flujo para "eliminar" scripts y videos renderizados de la interfaz sin borrar físicamente el registro histórico (Soft Delete).
- **Gestión de Descargas:** Implementación de `VideoDownloadModal` para centralizar la visualización y descarga de los videos procesados.

## 4. Internacionalización (i18n)

- **Soporte Multi-idioma:** Configuración de `i18next` en el frontend.
- **Localización:** Creación de diccionarios en Español (`es.ts`) e Inglés (`en.ts`).
- **Adaptación de UI:** Todos los componentes principales (Selector de templates, Editor, Modales) ahora responden al idioma del navegador o preferencia del usuario.

## 5. Mejoras en la Experiencia de Usuario (UI/UX)

- **Pantalla de Selección de Templates:**
  - Rediseño de las Cards de templates con efectos visuales mejorados.
  - Visualización de metadatos críticos: cantidad de escenas detectadas, número de variables y fechas de actualización.
- **Editor de Guiones (Smart Scripting):**
  - **Agrupación por Escenas:** El editor ahora organiza automáticamente los inputs según la escena a la que pertenecen.
  - **Claridad de Roles:** Separación visual entre el guion de voz (Voice Script) y los recursos visuales de cada escena.
  - **Editor de Metadatos:** Inclusión de `ScriptMetadataEditor` para ajustar datos del curso/docente post-generación.

## 6. Manejo de Errores y Notificaciones

- **Notificaciones en Tiempo Real:** Integración de `react-hot-toast` para dar feedback inmediato en acciones de guardado, generación y borrado.
- **Confirmaciones de Seguridad:** Modales de confirmación para prevenir la generación accidental de videos o la eliminación de datos.
- **Robustez en API:** Mejora en el manejo de errores de la API de Synthesia y Groq, informando al usuario de manera clara.

## 7. Cambios en Infraestructura y Otros

- **Dockerización POC:** Creación de `docker-compose.poc.yml` para facilitar el despliegue de este entorno específico.
- **Refactorización de Servicios:** Limpieza de código en `SynthesiaService` y `FileExtractionService` para mayor legibilidad y mantenibilidad.
- **Sincronización de Tipos:** Actualización de `@eduvideogen/shared-types` para reflejar la nueva estructura de templates y videos.
