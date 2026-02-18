# Arquitectura, Funcionamiento y Despliegue en AWS

Este documento describe el estado actual del proyecto tras la implementación del patrón **Async Worker**, cómo funciona la arquitectura Serverless, y los pasos para desplegar en AWS.

## 1. Arquitectura Actual (Async Worker Pattern)

El sistema utiliza una arquitectura **Serverless asíncrona** para manejar tareas pesadas de IA, mejorando la escalabilidad y evitando timeouts en el API Gateway.

### Componentes Principales

1.  **Frontend (apps/web):**
    *   Aplicación React (Vite).
    *   **Polling:** Implementa lógica de sondeo (polling) para consultar el estado de tareas asíncronas (`PENDING` -> `PROCESSING` -> `COMPLETED`).
    *   Se comunica con el backend para iniciar trabajos (`POST`) y consultar resultados (`GET`).

2.  **Backend Serverless (apps/apiv2):**
    *   **AiScriptsFunction (API Handler):** 
        *   Recibe peticiones HTTP.
        *   Valida input y sube archivos.
        *   Crea registro en DB con status `PENDING`.
        *   Desencadena asíncronamente al Worker.
        *   Responde inmediatamente `202 Accepted`.
    *   **AiScriptsWorkerFunction (Worker):** 
        *   Procesa eventos de fondo (`InvocationType: Event`).
        *   Ejecuta la llamada a la IA (Groq/Bedrock).
        *   Actualiza el estado en DB a `COMPLETED` o `FAILED`.
    *   **Prisma ORM:** Gestiona la conexión a PostgreSQL.

3.  **Base de Datos:**
    *   PostgreSQL.
    *   Nuevo campo: `AiScript.status` (PENDING, PROCESSING, COMPLETED, FAILED).

---

## 2. Explicación Técnica: ¿Cómo funciona?

### Flujo de "Generar Script" (Asíncrono)

1.  **Inicio (Frontend):** Envía `POST /generate-from-files` con archivos y metadatos.
2.  **Recepción (API):** `AiScriptsFunction` guarda el registro en DB (`PENDING`) e invoca a `AiScriptsWorkerFunction`. Retorna `202`.
3.  **Polling (Frontend):** La UI muestra "Generando..." y consulta `GET /ai-scripts/{id}` cada 3 segundos.
4.  **Procesamiento (Worker):** 
    *   Recibe el evento con `scriptId`.
    *   Actualiza DB a `PROCESSING`.
    *   Genera el contenido con IA.
    *   Actualiza DB a `COMPLETED` con los datos.
5.  **Finalización (Frontend):** Al recibir status `COMPLETED`, detiene el polling y redirige al editor.

### Nota sobre Entorno Local (SAM CLI)
En `sam local`, la invocación asíncrona de AWS SDK (`InvocationType: "Event"`) **no funciona** nativamente contra el mismo contenedor local.
*   **Solución:** Se ha implementado un bypass en `ai-scripts.ts`. Si detecta `AWS_SAM_LOCAL=true`, invoca al código del worker **directamente (síncrono)**. 
*   **Efecto:** El Frontend sigue haciendo polling, pero la API local no responderá el `202` hasta que el worker "síncrono" termine (o responderá rápido si se ajusta). Funcionalmente permite probar todo el flujo.

---

## 3. Guía de Despliegue en AWS

### A. Preparación (Git)

Subir todo excepto `node_modules`, `.aws-sam`, `dist`, y `.env`.
Asegurarse de que `apps/apiv2/env.json` NO contenga credenciales de producción reales si es público.

### B. Despliegue del Backend (SAM)

1.  **Build Manual:**
    Debido a dependencias nativas (Prisma con binarios RHEL para Lambda), usamos un build manual con `esbuild`:
    ```bash
    cd apps/apiv2
    # Limpia
    rm -rf .aws-sam dist
    # Genera cliente prisma (asegurar binaryTargets en schema.prisma incluye "rhel-openssl-3.0.x")
    npx prisma generate
    # Compila TS -> JS
    npm run build
    # Empaqueta para SAM
    sam build
    ```

2.  **Deploy:**
    ```bash
    sam deploy --guided
    ```
    *   **Stack Name:** `course-builder-backend`
    *   **Region:** `us-east-1`
    *   Parámetros (DB URL, API Keys): Se pueden pasar aquí o configurar en AWS Systems Manager / Secrets Manager después.

### C. Despliegue del Frontend

1.  **Build:** `cd apps/web && npm run build` -> genera `dist/`.
2.  **S3 + CloudFront:**
    *   Subir `dist/` a un Bucket S3 privado.
    *   Crear distribución CloudFront con OAI (Origin Access Identity) para leer del bucket.
    *   Configurar `VITE_APP_BASE_URL` apuntando a la URL del API Gateway (producida en el paso B).

---

## 4. Próximos Pasos

1.  **Bedrock Switch:** Cambiar el import en `ai-scripts.ts` para usar `lib/bedrock.ts` y asegurar permisos IAM.
2.  **Dead Letter Queue (DLQ):** Configurar una cola SQS para eventos fallidos del Worker (reintentos).
3.  **WebSockets (Opcional):** Para notificar al frontend en tiempo real en lugar de polling (más complejo, polling es suficiente para MVP).
