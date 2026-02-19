# Arquitectura y Despliegue en AWS (Serverless)

Este documento detalla la arquitectura técnica del proyecto `ia-generated-video-mvp` y la guía paso a paso para desplegarlo en AWS utilizando SAM (Serverless Application Model).

---

## 🏗️ 1. Arquitectura del Sistema

El sistema ha evolucionado de una arquitectura monolítica (NestJS) a una arquitectura **Serverless Event-Driven** para mejorar la escalabilidad, reducir costos en reposo y manejar eficientemente tareas de larga duración (generación de IA).

### Componentes Principales

#### A. Frontend (Single Page Application)
- **Tecnología:** React + Vite + TailwindCSS.
- **Hosting:** S3 (Static Website Hosting) + CloudFront (CDN & HTTPS).
- **Interacción:** Consume la REST API via HTTPS. Implementa **Polling** para verificar el estado de las tareas asíncronas de generación de video y scripts.

#### B. API & Backend (AWS Lambda + API Gateway)
El backend está dividido en micro-funciones Lambda gestionadas por SAM:

1.  **`CourseBuilderApi` (API Gateway):**
    - Punto de entrada único REST HTTPS.
    - Enruta las peticiones a las funciones Lambda correspondientes.

2.  **`AiScriptsFunction` (Lambda - Node.js 20.x):**
    - **Rol:** Controlador API síncrono.
    - **Responsabilidad:** CRUD de Scripts, subida de archivos, y trigger de generación.
    - **Flujo de Generación:** Recibe la petición, guarda el estado `PENDING` en DynamoDB, e invoca asíncronamente (`Event`) al Worker. Retorna `202 Accepted` al cliente inmediatamente.

3.  **`AiScriptsWorkerFunction` (Lambda - Node.js 20.x):**
    - **Rol:** Worker asíncrono (Background Job).
    - **Responsabilidad:** Procesamiento pesado de IA. Interactúa con **AWS Bedrock** (Claude 3.5 Sonnet) para generar el contenido educativo.
    - **Flujo:** Actualiza estado a `PROCESSING` -> Llama a Bedrock -> Guarda resultado en DynamoDB -> Actualiza estado a `COMPLETED`.

4.  **`TemplatesFunction` (Lambda - Node.js 20.x):**
    - **Responsabilidad:** Proxy/Cache para listar y obtener detalles de templates de **Synthesia**.

5.  **`VideosFunction` (Lambda - Node.js 20.x):**
    - **Responsabilidad:** Gestión de la creación de videos con la API de Synthesia y consulta de estado.

#### C. Capa de Datos (DynamoDB)
- **Base de Datos:** Amazon DynamoDB (Single Table Design).
- **Tabla:** `CourseBuilderTable`.
- **Patrones de Acceso:**
    - `PK` (Partition Key) y `SK` (Sort Key) para modelar entidades (`SCRIPT#<id>`, `VIDEO#<id>`).
    - **GSI1:** Índice secundario para consultas por tipo y fecha (`Type`, `CreatedAt`).

---

## 🚀 2. Guía de Despliegue (Paso a Paso)

**Stack:** 4 Lambdas (SAM) · DynamoDB · API Gateway · S3 + CloudFront
**Región objetivo:** `us-east-2`

### ✅ Pre-requisitos

Antes de empezar, verificar instalación:

```bash
aws --version          # AWS CLI v2
sam --version          # SAM CLI >= 1.100
node --version         # Node 20.x
```

Configurar credenciales:

```bash
export AWS_PROFILE=course-builder-bedrock  # O tu perfil configurado
export AWS_DEFAULT_REGION=us-east-2
```

### PASO 1 — Verificar permisos IAM

El usuario AWS necesita permisos de Administrador o específicos para: CloudFormation, S3, Lambda, DynamoDB, API Gateway, CloudFront, IAM y **Bedrock**.

```bash
aws sts get-caller-identity
```

### PASO 2 — Crear Bucket para Artefactos SAM

SAM necesita un bucket para subir el código de las Lambdas (ZIPs).

```bash
export SAM_ARTIFACTS_BUCKET=course-builder-sam-artifacts-$(aws sts get-caller-identity --query Account --output text)
aws s3 mb s3://$SAM_ARTIFACTS_BUCKET --region us-east-2
```

### PASO 3 — Build del Backend

```bash
cd apps/apiv2

# 1. Limpiar previos
rm -rf dist .aws-sam

# 2. Instalar dependencias y compilar
npm ci
npm run build
# (Esto ejecuta esbuild y copia el worker de PDF.js a dist/)

# 3. Empaquetar con SAM
sam build
```

### PASO 4 — Deploy del Backend

```bash
sam deploy \
  --stack-name course-builder-backend \
  --s3-bucket $SAM_ARTIFACTS_BUCKET \
  --region us-east-2 \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    BedrockModelId="us.anthropic.claude-3-5-sonnet-20241022-v2:0" \
    SynthesiaApiKey="TU_API_KEY_DE_SYNTHESIA" \
    DynamoEndpoint="" \
  --resolve-s3 \
  --no-confirm-changeset
```

> **Nota:** Para el primer deploy, puedes usar `sam deploy --guided` para configurar interactivamente y guardar el `samconfig.toml`.

**Guarda la `ApiUrl` de los Outputs de CloudFormation.** (Ej: `https://xyz.execute-api.us-east-2.amazonaws.com/prod/`)

### PASO 5 — Backend Smoke Test

```bash
export API_URL="https://xyz.execute-api.us-east-2.amazonaws.com/prod"
curl -s "$API_URL/videos/templates" | jq .
```

### PASO 6 — Build del Frontend

```bash
cd ../web

# 1. Configurar URL de producción
export VITE_APP_BASE_URL="https://xyz.execute-api.us-east-2.amazonaws.com/prod"

# 2. Build
npm ci
VITE_APP_BASE_URL=$VITE_APP_BASE_URL npm run build
```

### PASO 7 — Deploy del Frontend (S3 + CloudFront)

1.  **Crear Bucket S3 (Privado):**
    ```bash
    export FRONTEND_BUCKET=course-builder-frontend-$(aws sts get-caller-identity --query Account --output text)
    aws s3 mb s3://$FRONTEND_BUCKET --region us-east-2
    aws s3api put-public-access-block --bucket $FRONTEND_BUCKET --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    ```

2.  **Subir Archivos:**
    ```bash
    aws s3 sync dist/ s3://$FRONTEND_BUCKET/ --delete
    ```

3.  **Crear Distribución CloudFront (OAC):**
    *   Origen: El bucket S3 creado.
    *   Acceso: Origin Access Control (OAC).
    *   Viewer Protocol: Redirect HTTP to HTTPS.
    *   Default Root Object: `index.html`.
    *   **Importante (SPA Routing):** Configurar Error Pages 403 y 404 para responder con `/index.html` (Status 200).

4.  **Actualizar Bucket Policy:** Copiar la política que CloudFront sugiere para permitir acceso solo desde esa distribución.

### PASO 8 — Verificación Final

Acceder a la URL de CloudFront (`https://d1234.cloudfront.net`) y verificar:
1.  La app carga correctamente.
2.  Se listan los templates (llamada API exitosa).
3.  Se puede crear un script y generarlo (Worker + Bedrock + DynamoDB).

---

## 🛠️ Desarrollo Local

Para correr todo localmente simulando la nube:

1.  **Backend (SAM Local):**
    ```bash
    cd apps/apiv2
    npm run dev
    # Corre `sam local start-api` en puerto 3001
    # Usa DynamoDB local en Docker si DynamoEndpoint está configurado
    ```

2.  **Frontend:**
    ```bash
    cd apps/web
    npm run dev
    # Corre Vite en puerto 5173
    ```
