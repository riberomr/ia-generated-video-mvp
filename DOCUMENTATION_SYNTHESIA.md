# Documentación de Integración con Synthesia

Este documento detalla la integración actual de la aplicación con Synthesia, cubriendo el uso de templates, generación de videos desde cero, y gestión de avatares/assets. También incluye una comparativa de funcionalidades y un reporte dirigido al equipo de API de Synthesia.

## Funcionalidades y Flujos de Interacción

### 1. Templates (Plantillas)

La aplicación permite generar videos basados en plantillas predefinidas de Synthesia.

*   **Interacción con Synthesia**:
    *   **Listado**: Se obtienen las plantillas disponibles mediante `GET /templates`.
    *   **Detalles**: Se consultan los detalles de una plantilla específica (incluyendo variables) mediante `GET /templates/:id`.
    *   **Generación**: Se utiliza el endpoint `POST /videos/fromTemplate`.
*   **Flujo de Datos**:
    1.  El usuario selecciona un template.
    2.  La aplicación identifica las variables del template (e.g., `{{nombre}}`, `{{contenido}}`).
    3.  Se construye un payload `templateData` mapeando los datos del script a estas variables.
    4.  Se envía la solicitud a Synthesia con el `templateId` y `templateData`.
*   **Puntos Clave**:
    *   Permite consistencia visual rápida.
    *   Depende de la configuración del template en la plataforma de Synthesia.
    *   Limitado a las variables expuestas por el creador del template.

### 2. Videos Desde Cero (Videos from Scratch)

Esta modalidad permite la creación granular de videos, definiendo escena por escena.

*   **Interacción con Synthesia**:
    *   **Generación**: Se utiliza el endpoint `POST /videos`.
    *   **Payload**: Se construye un objeto JSON complejo (`CreateVideoFromScratchDto`) que define un array de inputs (`input`).
*   **Estructura del Input**:
    *   Cada elemento del array representa una escena.
    *   Se define:
        *   `scriptText`: Texto a narrar.
        *   `avatar`: ID del avatar a usar.
        *   `background`: Configuración del fondo (imagen, video, color).
        *   `avatarSettings`: Voz, escala, posición, estilo (circular/rectangular).
        *   `backgroundSettings`: Comportamiento del fondo (loop, trim).
*   **Puntos Clave**:
    *   Máxima flexibilidad.
    *   Control total sobre el avatar y voz en cada escena.
    *   Requiere construir la lógica visual (posicionamiento, fondos) desde la aplicación.

### 3. Avatares y Assets

Gestión de recursos visuales y personajes.

*   **Avatares**:
    *   **Sincronización**: La aplicación mantiene una base de datos local de avatares (`SynthesiaScrappedAvatar`) para permitir filtrado avanzado (por género, encuadre, etc.) que la API cruda podría no ofrecer con tanta flexibilidad o velocidad.
    *   **Uso**: Se utilizan los IDs de avatares de Synthesia para referenciarlos en la generación de videos.
*   **Assets (Recursos)**:
    *   **Carga (Upload)**:
        1.  El archivo se sube primero a un almacenamiento S3 local (MinIO) para persistencia interna.
        2.  Posteriormente, se sube a Synthesia mediante `POST /assets` (imágenes/videos) o `/scriptAudio` (audio).
    *   **Uso**: Los assets subidos retornan un ID de Synthesia que se usa posteriormente en los payloads de generación (e.g., como fondo).

---

## Comparativa: Templates vs. Videos Desde Cero

| Característica | Templates | Videos Desde Cero |
| :--- | :--- | :--- |
| **Velocidad de Creación** | **Alta**. Diseño y estructura ya listos. | **Media/Baja**. Requiere definir cada escena. |
| **Personalización Visual** | **Baja**. Limitada a lo definido en el template. | **Alta**. Control total de backgrounds, posiciones, etc. |
| **Consistencia de Marca** | **Alta**. Asegurada por el template. | **Dependiente**. Requiere lógica en la app para mantener estilos. |
| **Flexibilidad de Avatar/Voz** | **Limitada**. A menudo fija en el template (a menos que sea variable). | **Total**. Se puede elegir avatar/voz por escena. |
| **Complejidad de Integración** | **Baja**. Solo mapeo de variables. | **Alta**. Construcción de objetos JSON complejos. |
| **Mantenimiento** | Cambios en el template se reflejan automático. | Cambios de diseño requieren cambiar código/lógica. |

---

## Reporte para el Equipo de API de Synthesia

### Presentación de Uso Actual

Nuestra aplicación, **[Nombre de tu App]**, integra Synthesia para ofrecer generación de video automatizada a nuestros usuarios. Implementamos un flujo híbrido:

1.  **Exploración de Recursos**: Mantenemos un índice sincronizado de avatares para ofrecer capacidades de búsqueda y filtrado avanzadas (metadata, framing, etc.) a nuestros usuarios antes de la generación.
2.  **Modo "Smart Scripting" (Templates)**: Utilizamos sus endpoints de templates para inyectar contenido dinámico en diseños pre-aprobados. Mapeamos datos de usuarios a las variables del template.
3.  **Modo "Custom Studio" (Videos desde Cero)**: Utilizamos el endpoint `/videos` para usuarios que requieren control granular, construyendo dinámicamente el array de inputs escena por escena.

### Feedback y Preguntas sobre la API

Para mejorar nuestra integración y dependencia de la API, tenemos las siguientes consultas sobre el roadmap y capacidades actuales:

#### 1. Introspección de Templates (Crucial)
**Problema:** Al consultar los detalles de un template (`GET /templates/:id`), obtenemos las variables, pero **no sabemos cuántas escenas** contiene el video resultante.
**Impacto:** Esto dificulta la lógica de negocio. Por ejemplo, si tenemos un script de 5 párrafos y el template solo tiene 3 escenas, no sabemos cómo distribuir el texto óptimamente sin "adivinar" o prueba y error.
**Pregunta:** ¿Está planeado exponer la metadata de la estructura del template (número de escenas, duración estimada) en la respuesta de la API?

#### 2. Sobrescritura de Propiedades en Templates
**Problema:** Actualmente, si diseñamos un template en la APP de Synthesia, propiedades como la **Voz** y el **Locale** quedan fijas. Si no las asignamos a una variable (lo cual a veces no es posible o práctico en el builder para todas las propiedades), no podemos cambiarlas vía API.
**Caso de Uso:** Queremos usar el mismo diseño visual (Template) pero generar versiones en Español (Voz A) e Inglés (Voz B) dinámicamente. Hoy estamos forzados a duplicar el template en su plataforma.
**Pregunta:** ¿Planean permitir "overrides" globales en el endpoint `/videos/fromTemplate` para forzar voz, avatar o locale, independientemente de la configuración del template?

#### 3. Paridad de Funcionalidades (App Builder vs API)
**Observación:** Notamos que nuevas funcionalidades de personalización aparecen primero en su App Web.
**Pregunta:** ¿Cuál es el tiempo estimado de llegada (ETA) para que las opciones de personalización avanzadas (animaciones de entrada/salida específicas, capas de texto complejas) disponibles en el builder sean totalmente configurables vía el endpoint `/videos` (desde cero)?


#### 4. Variables de Assets Dinámicos
**Pregunta:** ¿Es posible pasar una URL de imagen/video directamente a una variable de tipo "image/video" en un template sin tener que subirla primero como Asset vía API? Esto agilizaría flujos donde el contenido es efímero.

#### 5. Gestión de Avatares Personalizados (Custom Avatars)
**Problema:** Diferentes profesores requieren diferentes avatares personalizados. Actualmente, la API no permite la creación programática de avatares ("Custom Avatar API").
**Impacto:** Cada vez que necesitamos un nuevo avatar para un profesor, el proceso es manual en la plataforma de Synthesia (grabación, consentimiento, espera de procesamiento). Esto hace inviable escalar a cientos de profesores automáticamente desde nuestra app.
**Pregunta:** ¿Está en roadmap una API para gestionar el ciclo de vida de avatares personalizados (invitar a grabar, subir consentimientos, etc.) sin intervención manual en su dashboard?

---

## Comparativa: Synthesia API vs HeyGen API

A continuación, comparamos las capacidades de la API de Synthesia con su principal competidor, HeyGen, basado en documentación pública reciente.

| Característica | Synthesia API (Enfoque Enterprise) | HeyGen API (Enfoque Flexible/Creative) |
| :--- | :--- | :--- |
| **Enfoque Principal** | Gobernanza, Seguridad (SOC2), Escalabilidad Corporativa, Training. | Creadores individuales, Marketing, Velocidad de Iteración, Interactividad. |
| **Gestión de Avatares** | **Manual/Controlada**. Gran librería de stock (230+). Avatares personalizados requieren procesos estrictos de consentimiento y validación manual. | **Más Flexible**. "Avatar III" permite generar avatares animados desde fotos estáticas programáticamente. Avatares de video finetuned también disponibles. |
| **Voces e Idiomas** | **Extensa**. 120+ idiomas, 400+ voces. Clonación de voz requiere audio de ~10 min. | **Muy Amplia**. 175+ idiomas, 300+ voces. Clonación de voz más rápida ("Instant Voice Cloning"). |
| **Videos desde Cero** | Estructura rígida basada en inputs de escenas. Muy robusta pero verbosa. | Más flexible, orientada a resultados rápidos. |
| **Interactividad** | Enfocado en video asíncrono (generar y descargar). | ofrece **Streaming Avatar API** para avatares interactivos en tiempo real (conversacionales). |
| **Traducción de Video** | Soportada (doblaje). | Soportada, con nuevas funciones de "lip-sync" natural optimizado recientemente. |
| **Pricing API** | Generalmente requiere planes Enterprise/Creator. Límites de minutos más estrictos. | Modelos más flexibles para alto volumen, planes de "créditos" accesibles. |

### Conclusión para nuestro Caso de Uso

*   **Por qué seguir con Synthesia**: Si nuestra prioridad es la calidad "human-like" consistente, la seguridad de marca y la estabilidad para una institución educativa, Synthesia es el líder. Su API es robusta aunque restrictiva en ciertos flujos personalizados.
*   **Cuándo considerar HeyGen**: Si necesitamos escalar masivamente la creación de avatares personalizados "al vuelo" (desde fotos) o si requerimos interactividad en tiempo real (chatbots con cara), HeyGen ofrece endpoints (Avatar III, Streaming) que Synthesia no posee actualmente.

