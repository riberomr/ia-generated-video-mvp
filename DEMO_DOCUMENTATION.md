# Documentación Demo POC: Generador de Video IA

Esta aplicación es una Prueba de Concepto (POC) que demuestra la capacidad de generar videos educativos utilizando Inteligencia Artificial (LLMs) y la tecnología de avatares de Synthesia.

La aplicación se divide en 3 partes fundamentales:

1.  **Generación de video en base a Template**
2.  **Generación de video desde 0 (Custom)**
3.  **Gestión de Assets y Avatares**

---

## 1. Generación de Video en base a Template

Este flujo permite crear videos rápidamente aprovechando diseños predefinidos (Templates) en Synthesia.

### Flujo de Trabajo
1.  **Selección**: El usuario elige un Template de la librería disponible.
2.  **Input de Variables**: La aplicación detecta las variables del template (ej. `{{titulo}}`, `{{texto_escena_1}}`) y presenta un formulario.
3.  **Generación de Script (Opcional/Híbrido)**:
    - Se puede utilizar IA para rellenar estas variables automáticamente basándose en un tema o texto fuente.
    - El "Smart Scripting" analiza la estructura del template y genera el contenido exacto requerido.
4.  **Generación de Video**: Se envía la data a la API de Synthesia (`/videos/fromTemplate`), mapeando los inputs del usuario a las capas visuales del video.

**Ventajas**: Consistencia visual garantizada y rapidez de producción.

---

## 2. Generación de Video desde Cero (From Scratch)

Esta es la funcionalidad "Core" de la aplicación, permitiendo una creación granular escena por escena con ayuda de IA Generativa.

### Flujo de Trabajo
1.  **Definición del Guion**: El usuario ingresa un tema, texto fuente, o premisa.
2.  **Configuración de Escenas**: Se define la cantidad de escenas, el objetivo (educativo, venta, humor), la complejidad y la emoción deseada.
3.  **Generación del Script (Prompt Engineering)**: Un LLM (Large Language Model) genera el guion técnico y narrativo.
4.  **Edición (Human-in-the-loop)**: El usuario revisa, edita o regenera escenas específicas.
5.  **Producción**: Se envía la secuencia final a Synthesia para renderizar.

### Ingeniería de Prompts (Prompt Engineering) - El "Cerebro" de la App

El núcleo de la inteligencia reside en el servicio `GroqService`, que utiliza modelos Llama 3 (70B) para orquestar la creación del video.

#### Estrategia de Prompts
Para lograr resultados consistentes y de alta calidad, utilizamos una estrategia de prompts estructurados:

1.  **Estructura JSON Estricta**:
    - Forzamos al modelo a responder **únicamente** en formato JSON.
    - Esto permite que la aplicación parsee la respuesta directamente y la convierta en objetos `Scene` manipulables en el frontend.
    - El prompt incluye la definición precisa de los campos: `scriptText`, `visual_context`, `emotion`, etc.

2.  **Mapeo de Emociones y Tono**:
    - Synthesia tiene limitaciones en cuanto a control facial directo vía API.
    - **Solución**: Instruimos al LLM para que **refleje la emoción en el texto mismo**.
    - *Ejemplo*: Si la emoción es "Excited", el prompt ordena usar signos de exclamación y frases cortas/enérgicas. Si es "Serious", lenguaje formal y pausado.

3.  **Control de Duración y Ritmo (Timing)**:
    - Un problema común es que la IA escribe demasiado texto para una escena corta.
    - **Algoritmo**: Calculamos un límite de palabras basado en la duración deseada (aprox. **150 palabras por minuto** o 2.5 palabras/segundo).
    - **Instrucción**: El prompt recibe explícitamente: *"MAXIMUM ALLOWED WORDS: X"*. Si el texto excede esto, el video se cortaría o desincronizaría.

4.  **Regeneración Contextual (Refinement)**:
    - Si el usuario pide regenerar una escena ("Hazla más alegre"), no enviamos la escena aislada.
    - Enviamos el **contexto de las escenas adyacentes** y el resumen del video para mantener la coherencia narrativa, pero instruimos al modelo a modificar **solo** el nodo JSON de la escena objetivo.

#### Edición Avanzada de Escena
Una vez generado el guion base, el usuario tiene control total sobre los elementos visuales antes de renderizar:
- **Avatares**: Cambio de personaje por escena.
- **Fondos**: Selección de fondos (imágenes/videos) desde la librería.
- **Configuración**: Ajuste de posición, escala y encuadre (circular/rectangular) del avatar.

---

## 3. Carga y Consulta de Assets y Avatares

La gestión de recursos presenta desafíos específicos debido a las limitaciones actuales de la API de Synthesia.

### Limitaciones Identificadas
1.  **Ausencia de Búsqueda de Avatares en Tiempo Real**:
    - La API de Synthesia no permite filtrar avatares por atributos complejos (género, edad, tipo de encuadre, accesorios) de forma eficiente en tiempo real.
    - *Solución*: Implementamos una **Base de Datos Local ("Scrapped/Synced DB")**.
    - Importamos la metadata de los avatares periódicamente a nuestra base de datos.
    - Esto permite al frontend realizar filtrados instantáneos y complejos (ej. "Mujer, Vestimenta Casual, Plano Medio") sin latencia ni dependencia de la API externa.

2.  **Gestión de Assets (Imágenes/Videos)**:
    - No existe una API pública para "consultar" todos los assets de un usuario y ver sus thumbnails fácilmente sin tener el ID previo.
    - *Flujo de Carga*: Cuando un usuario sube una imagen para usar de fondo:
        1.  Se sube a nuestro almacenamiento (S3/MinIO) para persistencia.
        2.  Se sube a la API de Synthesia para obtener el `asset_id` necesario para la generación de video.

3.  **Voces**:
    - Similar a los avatares, las voces se sincronizan localmente para permitir una selección rápida por idioma, género y acento, evitando llamadas costosas y lentas a la API durante el diseño del video.
