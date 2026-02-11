# 🎬 Course Builder - AI-Powered Educational Video Generator

> **Plataforma de generación automática de videos educativos usando IA**  
> Transforma materiales de curso (PDF/DOCX) en videos profesionales mediante templates de Synthesia y scripts generados por IA.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-red.svg)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-blueviolet.svg)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

---

## 📖 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Arquitectura](#️-arquitectura)
- [Stack Tecnológico](#-stack-tecnológico)
- [Cómo Funciona](#-cómo-funciona)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Uso](#-uso)
- [Scripts Disponibles](#-scripts-disponibles)
- [Internacionalización](#-internacionalización)
- [API Endpoints](#-api-endpoints)
- [Modelos de Datos](#️-modelos-de-datos)
- [Contribución](#-contribución)

---

## 🎯 Descripción General

**Course Builder** es una plataforma SaaS que automatiza la creación de videos educativos profesionales. Los profesores pueden cargar materiales del curso (sílabos, matrices de contenido, documentos PDF/DOCX) y la aplicación:

1. **Analiza** el contenido usando IA (Groq/Llama 3.3)
2. **Selecciona** un template visual de Synthesia
3. **Genera** un guion adaptado al template seleccionado
4. **Produce** el video final con avatares, voces y diseño profesional

### Problema que Resuelve

- ❌ **Antes:** Crear videos educativos requiere horas de edición manual, diseño gráfico y grabación
- ✅ **Ahora:** Sube tu documento, selecciona un template, y obtén un video profesional en minutos

---

## ✨ Características Principales

### 🤖 Generación Inteligente de Scripts

- **IA Avanzada:** Utiliza Llama 3.3 (70B) via Groq para análisis de contenido
- **Adaptación Automática:** El script se ajusta perfectamente a la estructura del template seleccionado
- **Contexto Educativo:** Considera el perfil del estudiante, tono y estilo pedagógico

### 📝 Editor de Scripts Avanzado

- **Edición Visual:** Interfaz intuitiva para modificar variables del template
- **Regeneración por Escena:** Mejora escenas individuales con instrucciones en lenguaje natural
- **Metadata Configurable:** Ajusta tono, estilo, información del profesor y curso

### 🎨 Integración con Synthesia

- **Templates Profesionales:** Acceso a biblioteca completa de templates de Synthesia
- **Avatares Realistas:** Más de 140 avatares con voces en múltiples idiomas
- **Personalización Total:** Control sobre fondos, textos, imágenes y diseño

### 🌍 Multiidioma

- **Interfaz Bilingüe:** Soporte completo para inglés y español
- **Cambio en Tiempo Real:** Alterna entre idiomas sin recargar
- **Fácil Extensión:** Arquitectura lista para agregar más idiomas

### 📊 Gestión de Proyectos

- **Dashboard Completo:** Visualiza todos tus scripts y videos generados
- **Estado de Generación:** Monitoreo en tiempo real del proceso de creación de videos

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│              React 19 + Vite + TailwindCSS                  │
│         (Template Selection → Script Generation →          │
│              Script Editing → Video Generation)             │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                             │
│                      NestJS + Prisma                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ AI Scripts   │  │   Videos     │  │  Templates   │     │
│  │   Module     │  │   Module     │  │   Module     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌───────────────┐         ┌──────────────┐
│   PostgreSQL  │         │  AI Services │
│   (Prisma)    │         ├──────────────┤
│               │         │ Groq (LLM)   │
│ • AiScript    │         │ Synthesia    │
│ • VideoRender │         │ (Videos)     │
└───────────────┘         └──────────────┘
```

### Flujo de Datos

1. **Usuario** carga materiales del curso (PDF/DOCX)
2. **Frontend** envía archivos y metadata al backend
3. **Backend** extrae texto de los archivos
4. **Groq AI** genera script adaptado al template seleccionado
5. **Backend** guarda el script en PostgreSQL
6. **Usuario** edita/ajusta el script si es necesario
7. **Usuario** inicia generación de video
8. **Synthesia API** crea el video con el template y variables
9. **Sistema** monitorea el estado hasta completar
10. **Usuario** descarga el video finalizado

---

## 🛠 Stack Tecnológico

### Frontend

| Tecnología          | Versión | Propósito               |
| ------------------- | ------- | ----------------------- |
| **React**           | 19.2    | Framework UI principal  |
| **Vite**            | 7.3     | Build tool y dev server |
| **TypeScript**      | 5.0+    | Type safety             |
| **TailwindCSS**     | 3.4     | Styling framework       |
| **React Router**    | 6.22    | Client-side routing     |
| **React Hook Form** | 7.51    | Form management         |
| **i18next**         | Latest  | Internacionalización    |
| **React Hot Toast** | 2.6     | Notificaciones          |

### Backend

| Tecnología          | Versión | Propósito                |
| ------------------- | ------- | ------------------------ |
| **NestJS**          | 11.1    | Framework Node.js        |
| **Prisma**          | 5.22    | ORM y migrations         |
| **PostgreSQL**      | 14+     | Base de datos relacional |
| **TypeScript**      | 5.1+    | Type safety              |
| **Class Validator** | 0.14    | Validación de DTOs       |
| **Multer**          | Latest  | File upload handling     |

### IA & Servicios Externos

| Servicio                 | Propósito                          |
| ------------------------ | ---------------------------------- |
| **Groq (Llama 3.3 70B)** | Generación de scripts educativos   |
| **Synthesia API v2**     | Creación de videos con avatares IA |
| **Mammoth.js**           | Extracción de texto de DOCX        |
| **PDF Parse**            | Extracción de texto de PDFs        |

### Infraestructura

| Herramienta        | Propósito                   |
| ------------------ | --------------------------- |
| **Turborepo**      | Monorepo management         |
| **Docker Compose** | PostgreSQL containerization |
| **NPM Workspaces** | Package management          |

---

## ⚙️ Cómo Funciona

### 1️⃣ Selección de Template

El usuario navega por templates de Synthesia disponibles, cada uno con:

- Preview visual
- Estructura definida (número de escenas, variables)
- Estilos específicos (formal, inspiracional, narrativo)

### 2️⃣ Carga de Materiales

El usuario proporciona:

- **Archivos:** Sílabos, matrices de contenido (PDF/DOCX)
- **Metadata Educativa:**
  - Nombre del curso
  - Información del profesor
  - Perfil de estudiantes
  - Tono deseado (formal, cercano, inspiracional)
  - Estilo (directo, narrativo, engagement)

### 3️⃣ Generación del Script con IA

```typescript
// Proceso interno:
1. Sistema analiza estructura del template seleccionado
   → Identifica variables: script_voice_text_scene_1, slide_title_1, etc.

2. Extrae contenido de archivos PDF/DOCX
   → Mammoth.js para DOCX
   → pdf-parse para PDF

3. Construye prompt para Groq AI:
   → "Genera un script educativo para [curso] dirigido a [perfil_estudiantes]
      con tono [tono] y estilo [estilo], que llene estas variables: [template_vars]
      basándote en este contenido: [extracted_text]"

4. Llama a Groq con modelo llama-3.3-70b-versatile
   → Respuesta en JSON con valores para cada variable

5. Valida y backfill de variables faltantes
   → Asegura que todas las variables requeridas tengan valor

6. Guarda en BD como AiScript con templateData completo
```

### 4️⃣ Edición del Script

El editor permite:

- **Ver estructura completa:** Todas las escenas y variables del template
- **Editar texto:** Modificar narración de cada escena
- **Regenerar escenas:** Mejorar una escena específica con IA
  - Usuario da instrucciones: "Hazlo más entusiasta", "Menciona el examen final"
  - Sistema regenera solo esa escena manteniendo coherencia
- **Ajustar metadata:** Cambiar título, curso, profesor, etc.

### 5️⃣ Generación del Video

```typescript
// Flujo de generación:
1. Usuario hace click en "Generate Video"

2. Sistema construye payload para Synthesia API:
   {
     "test": boolean,  // Watermarked preview o producción
     "template": {
       "id": "template-xyz",
       "data": {
         "script_voice_text_scene_1": "Bienvenidos al curso...",
         "slide_title_1": "Introducción",
         // ... todas las variables del template
       }
     }
   }

3. Synthesia inicia procesamiento:
   → PENDING: Video en cola
   → IN_PROGRESS: Generando render
   → COMPLETE: Listo para descarga
   → FAILED: Error (logs disponibles)

4. Sistema hace polling del estado cada X segundos

5. Cuando está COMPLETE, usuario puede descargar
```

### 6️⃣ Gestión de Videos

Dashboard muestra:

- **Scripts guardados** con metadata completa
- **Videos generados** por cada script con estados
- **Acciones:** Editar script, regenerar video, eliminar, descargar

---

## 📁 Estructura del Proyecto

```
ia-generated-video-mvp/
│
├── apps/
│   ├── api/                          # Backend NestJS
│   │   ├── src/
│   │   │   ├── ai-scripts/           # Módulo de scripts IA
│   │   │   │   ├── ai-scripts.controller.ts
│   │   │   │   ├── ai-scripts.service.ts
│   │   │   │   ├── groq.service.ts   # Integración con Groq
│   │   │   │   └── prompts.ts        # Prompts para LLM
│   │   │   ├── videos/               # Módulo de videos
│   │   │   │   ├── videos.controller.ts
│   │   │   │   ├── synthesia.service.ts
│   │   │   │   └── file-extraction.service.ts
│   │   │   ├── database/             # Módulo de base de datos
│   │   │   │   └── prisma.service.ts
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── web/                          # Frontend React
│       ├── src/
│       │   ├── components/
│       │   │   ├── SavedScripts.tsx  # Dashboard principal
│       │   │   ├── ScriptEditor.tsx  # Editor de scripts
│       │   │   ├── ConfirmationModal.tsx
│       │   │   ├── VideoDownloadModal.tsx
│       │   │   └── SmartScripting/
│       │   │       ├── TemplateSelector.tsx
│       │   │       ├── FullScriptEditor.tsx
│       │   │       ├── SceneRegenerationModal.tsx
│       │   │       └── ScriptMetadataEditor.tsx
│       │   ├── pages/
│       │   │   └── TemplateScriptingPage.tsx
│       │   ├── locales/              # Traducciones i18n
│       │   │   ├── en.ts             # Inglés
│       │   │   └── es.ts             # Español
│       │   ├── i18n.ts               # Configuración i18next
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── package.json
│
├── packages/
│   ├── database/                     # Shared Prisma package
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Modelos de BD
│   │   │   └── migrations/           # Historial de migraciones
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── shared-types/                 # TypeScript types compartidos
│       ├── src/
│       │   └── index.ts
│       └── package.json
│
├── scripts/                          # Utilidades
│   └── import-avatars-s3.ts
│
├── .env                              # Variables de entorno
├── docker-compose.yml                # PostgreSQL setup
├── package.json                      # Root package.json
├── turbo.json                        # Turborepo config
└── README.md
```

---

## 📋 Requisitos Previos

### Software Necesario

- **Node.js**: v20+ (recomendado 20.11 LTS)
- **NPM**: v10+ (incluido con Node.js)
- **Docker**: v20+ (para PostgreSQL)
- **Docker Compose**: v2+ (incluido con Docker Desktop)

### API Keys Requeridas

Necesitarás crear cuentas y obtener API keys de:

1. **Groq** (Gratis con límites generosos)
   - URL: https://console.groq.com/
   - Navega a "API Keys" y genera una nueva

2. **Synthesia** (Requiere plan de pago)
   - URL: https://www.synthesia.io/api
   - Contacta ventas para acceso a la API

### Verificación de Instalación

```bash
# Verificar Node.js
node --version  # Debe mostrar v20.x.x o superior

# Verificar NPM
npm --version   # Debe mostrar v10.x.x o superior

# Verificar Docker
docker --version
docker-compose --version
```

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/ia-generated-video-mvp.git
cd ia-generated-video-mvp
```

### 2. Instalar Dependencias

```bash
# Instala todas las dependencias del monorepo
npm install
```

Este comando instalará:

- Dependencias del root
- Dependencias de `apps/web`
- Dependencias de `apps/api`
- Dependencias de `packages/*`

### 3. Levantar Base de Datos

```bash
# Inicia PostgreSQL en Docker
docker-compose up -d

# Verifica que está corriendo
docker ps
```

Deberías ver un contenedor de PostgreSQL corriendo en el puerto 5433.

### 4. Aplicar Migraciones de Base de Datos

```bash
# Desde la raíz del proyecto
cd packages/database
npx prisma migrate deploy

# O alternativamente
npx prisma db push
```

### 5. Generar Cliente de Prisma

```bash
# Genera el cliente TypeScript de Prisma
npx prisma generate
```

---

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la **raíz del proyecto**:

```bash
# Base de Datos PostgreSQL
DATABASE_URL="postgresql://user_poc:password_poc@localhost:5433/course_builder_poc?schema=public"

# API Keys para IA
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# API Key de Synthesia
SYNTHESIA_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# URL del Backend (para el frontend)
VITE_APP_BASE_URL=http://localhost:3000
```

### Configuración de PostgreSQL (docker-compose.yml)

Si necesitas cambiar credenciales de la BD, edita `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: user_poc
      POSTGRES_PASSWORD: password_poc
      POSTGRES_DB: course_builder_poc
    ports:
      - "5433:5432"
```

---

## 💻 Uso

### Desarrollo

#### Iniciar Todo (Frontend + Backend)

```bash
# Desde la raíz del proyecto
npm run dev
```

Esto inicia:

- **Backend:** http://localhost:3000
- **Frontend:** http://localhost:5173

#### Iniciar Solo el Backend

```bash
cd apps/api
npm run dev
```

#### Iniciar Solo el Frontend

```bash
cd apps/web
npm run dev
```

### Flujo de Trabajo Típico

1. **Accede a la aplicación:**
   - Abre http://localhost:5173

2. **Crea un nuevo script:**
   - Click en "+ Create New" o navega a "New Script (Template)"
   - **Paso 1:** Selecciona un template de Synthesia
   - **Paso 2:** Completa la ficha técnica:
     - Título del script
     - Tipo de video
     - Nombre del curso
     - Información del profesor
     - Perfil de estudiantes
     - Tono y estilo
   - Sube archivos (PDF/DOCX) con el contenido del curso
   - Click en "Create Script"

3. **Espera la generación:**
   - El sistema procesará los archivos y generará el script (15-30 segundos)
   - Serás redirigido al editor automáticamente

4. **Edita el script (opcional):**
   - Revisa cada escena
   - Modifica textos si es necesario
   - Usa "Regenerate Scene" para mejorar escenas individuales
   - Guarda cambios

5. **Genera el video:**
   - Vuelve al dashboard ("Saved Scripts")
   - Click en "Generate Video" en la card del script
   - Elige modo test (con marca de agua, gratis) o producción
   - Confirma

6. **Monitorea el progreso:**
   - El estado cambiará: PENDING → IN_PROGRESS → COMPLETED
   - Click en "Check" para actualizar el estado manualmente
   - Cuando esté COMPLETED, click en "View" para descargar

### Cambiar Idioma

1. En el NavBar, verás un botón con "EN" o "ES"
2. Click para alternar entre inglés y español
3. La preferencia se guarda en localStorage

---

## 📜 Scripts Disponibles

### Root Package.json

```bash
# Desarrollo (frontend + backend)
npm run dev

# Build de producción
npm run build

# Linting
npm run lint

# Formateo de código
npm run format
```

### Backend (apps/api)

```bash
cd apps/api

# Desarrollo con hot-reload
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm run start:prod

# Linting
npm run lint
```

### Frontend (apps/web)

```bash
cd apps/web

# Desarrollo con Vite
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview

# Linting
npm run lint
```

### Database (packages/database)

```bash
cd packages/database

# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy

# Push schema (sin migración)
npx prisma db push

# Abrir Prisma Studio (GUI)
npx prisma studio

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion
```

---

## 🌍 Internacionalización

La aplicación soporta **inglés** y **español** usando `react-i18next`.

### Arquitectura i18n

```
apps/web/src/
├── i18n.ts                    # Configuración principal
└── locales/
    ├── en.ts                  # Diccionario inglés
    └── es.ts                  # Diccionario español
```

### Uso en Componentes

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('nav.app_title')}</h1>
      <button onClick={() => i18n.changeLanguage('es')}>
        Cambiar a Español
      </button>
    </div>
  );
}
```

### Agregar Nuevas Traducciones

1. Edita `apps/web/src/locales/en.ts`:

```typescript
export const en = {
  translation: {
    my_new_key: "My new text",
    // ...
  },
};
```

2. Edita `apps/web/src/locales/es.ts`:

```typescript
export const es = {
  translation: {
    my_new_key: "Mi nuevo texto",
    // ...
  },
};
```

3. Usa en el componente:

```typescript
{
  t("my_new_key");
}
```

### Agregar Nuevo Idioma

1. Crea `apps/web/src/locales/fr.ts` (ejemplo francés)
2. Importa en `i18n.ts`:

```typescript
import { fr } from "./locales/fr";

i18n.init({
  resources: {
    en,
    es,
    fr, // Agregar aquí
  },
  // ...
});
```

---

## 🔌 API Endpoints

### AI Scripts

| Método   | Endpoint                           | Descripción                     |
| -------- | ---------------------------------- | ------------------------------- |
| `GET`    | `/ai-scripts`                      | Lista todos los scripts         |
| `GET`    | `/ai-scripts/:id`                  | Obtiene un script por ID        |
| `POST`   | `/ai-scripts/generate-from-files`  | Genera script desde archivos    |
| `PATCH`  | `/ai-scripts/:id`                  | Actualiza un script             |
| `DELETE` | `/ai-scripts/:id`                  | Elimina un script (soft delete) |
| `POST`   | `/ai-scripts/:id/regenerate-scene` | Regenera una escena específica  |

### Videos

| Método   | Endpoint                     | Descripción                     |
| -------- | ---------------------------- | ------------------------------- |
| `GET`    | `/videos/templates`          | Lista templates de Synthesia    |
| `GET`    | `/videos/templates/:id`      | Obtiene detalles de un template |
| `POST`   | `/videos/generate/:scriptId` | Genera video desde un script    |
| `GET`    | `/videos/status/:videoId`    | Consulta estado de un video     |
| `GET`    | `/videos/:id/download-url`   | Obtiene URL de descarga         |
| `DELETE` | `/videos/:id`                | Elimina un video                |

### Ejemplo: Generar Script

```bash
curl -X POST http://localhost:3000/ai-scripts/generate-from-files \
  -F "files=@syllabus.pdf" \
  -F "title=Curso de Física" \
  -F "courseName=Física Mecánica" \
  -F "teacherName=Dr. Juan Pérez" \
  -F "teacherRole=Profesor" \
  -F "teacherSpecialty=PhD en Física" \
  -F "studentProfile=Estudiantes universitarios de ingeniería" \
  -F "videoType=Course Welcome" \
  -F "tone=Formal" \
  -F "style=Direct & Informative" \
  -F "templateId=abc123xyz"
```

Respuesta:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Curso de Física",
  "templateId": "abc123xyz",
  "templateName": "Educational Course Welcome",
  "templateData": {
    "script_voice_text_scene_1": "Bienvenidos al curso de Física Mecánica...",
    "slide_title_1": "Introducción"
    // ...
  },
  "createdAt": "2024-02-11T14:30:00Z"
}
```

---

## 🗄️ Modelos de Datos

### AiScript

Representa un script generado por IA.

```prisma
model AiScript {
  id                   String   @id @default(uuid())
  title                String

  // Información del Curso
  courseName           String
  teacherName          String
  teacherRole          String
  teacherSpecialty     String

  // Contexto Pedagógico
  studentProfile       String
  videoType            String
  tone                 String
  style                String

  // Integración con Synthesia
  templateId           String
  templateName         String?
  templateData         Json
  rawTemplateVariables Json?
  sourceContent        String?  @db.Text

  isDeleted            Boolean  @default(false)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  videos               VideoRender[]
}
```

### VideoRender

Representa un video generado desde un script.

```prisma
model VideoRender {
  id         String   @id @default(uuid())
  externalId String?  @unique  // ID de Synthesia
  status     String   @default("PENDING")

  scriptId   String
  script     AiScript @relation(fields: [scriptId], references: [id])

  isDeleted  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### Estados de Video

- `PENDING`: En cola para generación
- `IN_PROGRESS`: Synthesia está procesando
- `COMPLETED`: Video listo para descarga
- `FAILED`: Error en la generación

---

## 🤝 Contribución

### Guía para Contribuidores

1. **Fork** el repositorio
2. **Crea una rama** para tu feature:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. **Haz tus cambios** siguiendo las convenciones del proyecto
4. **Ejecuta tests y linting**:
   ```bash
   npm run lint
   npm run format
   ```
5. **Commit** tus cambios con mensajes descriptivos:
   ```bash
   git commit -m "feat: agregar exportación a PDF de scripts"
   ```
6. **Push** a tu fork:
   ```bash
   git push origin feature/nueva-funcionalidad
   ```
7. **Abre un Pull Request** describiendo los cambios

### Convenciones de Código

- **TypeScript** para todo el código
- **Functional Components** con hooks en React
- **Async/Await** para operaciones asíncronas
- **PascalCase** para componentes y clases
- **camelCase** para variables y funciones
- **UPPER_SNAKE_CASE** para constantes
- **Comentarios** en español o inglés (consistente por archivo)

### Estructura de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Formateo, punto y coma faltantes, etc.
- `refactor:` Refactorización de código
- `test:` Agregar o corregir tests
- `chore:` Mantenimiento, dependencias, etc.

---

## 📄 Licencia

Este proyecto es un MVP interno. Consulta con el equipo antes de distribuir.

---

## 🙏 Agradecimientos

- **Synthesia** por su increíble API de generación de videos
- **Groq** por acceso a Llama 3.3 con velocidades impresionantes
- **NestJS** y **React** communities por el excelente soporte

---

## 📞 Soporte

Para preguntas o problemas:

- **Issues:** Abre un issue en GitHub
- **Email:** dev@bitlogic.io
- **Docs:** Revisa `DEMO_DOCUMENTATION.md` para detalles técnicos adicionales

---

**Desarrollado con ❤️ por Bitlogic**
