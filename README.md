# 🎬 Course Builder - AI-Powered Educational Video Generator

> **Plataforma de generación automática de videos educativos usando IA**
> Transforma materiales de curso (PDF/DOCX) en videos profesionales mediante templates de Synthesia y scripts generados por IA.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)
[![AWS SAM](https://img.shields.io/badge/AWS%20SAM-Serverless-orange.svg)](https://aws.amazon.com/serverless/sam/)
[![DynamoDB](https://img.shields.io/badge/DynamoDB-Database-blue.svg)](https://aws.amazon.com/dynamodb/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

---

## 📖 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Arquitectura (Serverless)](#️-arquitectura-serverless)
- [Stack Tecnológico](#-stack-tecnológico)
- [Cómo Funciona](#-cómo-funciona)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Despliegue](#-instalación-y-despliegue)
- [Configuración](#️-configuración)
- [Uso Local](#-uso-local)
- [Contribución](#-contribución)

---

## 🎯 Descripción General

**Course Builder** es una plataforma SaaS que automatiza la creación de videos educativos profesionales. Los profesores pueden cargar materiales del curso (sílabos, matrices de contenido, documentos PDF/DOCX) y la aplicación:

1. **Analiza** el contenido usando IA (**AWS Bedrock / Claude 3.5 Sonnet**)
2. **Selecciona** un template visual de Synthesia
3. **Genera** un guion adaptado al template seleccionado
4. **Produce** el video final con avatares, voces y diseño profesional

### Problema que Resuelve

- ❌ **Antes:** Crear videos educativos requiere horas de edición manual, diseño gráfico y grabación
- ✅ **Ahora:** Sube tu documento, selecciona un template, y obtén un video profesional en minutos

---

## ✨ Características Principales

### 🤖 Generación Inteligente de Scripts

- **IA Avanzada:** Utiliza **Claude 3.5 Sonnet** via AWS Bedrock para análisis de contenido preciso.
- **Worker Asíncrono:** Procesamiento en segundo plano con AWS Lambda para evitar timeouts.
- **Contexto Educativo:** Considera el perfil del estudiante, tono y estilo pedagógico.

### 📝 Editor de Scripts Avanzado

- **Edición Visual:** Interfaz intuitiva para modificar variables del template.
- **Regeneración por Escena:** Mejora escenas individuales con instrucciones en lenguaje natural.
- **Metadata Configurable:** Ajusta tono, estilo, información del profesor y curso.

### 🎨 Integración con Synthesia

- **Templates Profesionales:** Acceso a biblioteca completa de templates de Synthesia.
- **Avatares Realistas:** Más de 140 avatares con voces en múltiples idiomas.
- **Personalización Total:** Control sobre fondos, textos, imágenes y diseño.

### 🌍 Multiidioma

- **Interfaz Bilingüe:** Soporte completo para inglés y español (i18next).
- **Cambio en Tiempo Real:** Alterna entre idiomas sin recargar.

---

## 🏗️ Arquitectura (Serverless)

El proyecto utiliza una arquitectura **AWS Serverless** para máxima escalabilidad y eficiencia de costos.

```mermaid
graph TD
    User((Usuario))
    CloudFront[CloudFront CDN]
    S3_Web[S3 Bucket (Frontend)]
    APIGW[API Gateway]
    
    subgraph "AWS Cloud (us-east-2)"
        L_API[Lambda: API Handler]
        L_Worker[Lambda: AI Worker]
        L_Templates[Lambda: Templates]
        L_Videos[Lambda: Videos]
        DynamoDB[(DynamoDB Table)]
        Bedrock[AWS Bedrock (Claude)]
    end
    
    Synthesia[Synthesia API]

    User -->|HTTPS| CloudFront
    CloudFront --> S3_Web
    User -->|API REST| APIGW
    
    APIGW --> L_API
    APIGW --> L_Templates
    APIGW --> L_Videos
    
    L_API -->|Guardar Script (PENDING)| DynamoDB
    L_API -.->|Invoke Async| L_Worker
    
    L_Worker -->|Generar Contenido| Bedrock
    L_Worker -->|Actualizar Script (COMPLETED)| DynamoDB
    
    L_Templates --> Synthesia
    L_Videos --> Synthesia
    L_Videos --> DynamoDB
```

### Componentes Clave

1.  **Frontend:** React (Vite) hosteado en S3 + CloudFront.
2.  **API:** AWS API Gateway + Lambda (Node.js 20.x).
3.  **Base de Datos:** DynamoDB (Single Table Design).
4.  **IA:** AWS Bedrock (Claude 3.5 Sonnet).
5.  **Video:** Synthesia API.

Para más detalles sobre la arquitectura y cómo se despliega, ver [ARCHITECTURE_AND_DEPLOYMENT.md](./ARCHITECTURE_AND_DEPLOYMENT.md).

---

## 🛠 Stack Tecnológico

### Frontend

| Tecnología          | Versión | Propósito               |
| ------------------- | ------- | ----------------------- |
| **React**           | 19.x    | Framework UI principal  |
| **Vite**            | 7.x     | Build tool y dev server |
| **TailwindCSS**     | 3.4     | Styling framework       |
| **React Query**     | v5      | Data Fetching & Caching |

### Backend (Serverless)

| Tecnología          | Versión | Propósito                |
| ------------------- | ------- | ------------------------ |
| **AWS SAM**         | Latest  | Infraestructura como Código |
| **AWS Lambda**      | Node 20 | FaaS (Function as a Service) |
| **DynamoDB**        | -       | NoSQL Database           |
| **AWS Bedrock**     | Claude 3.5 | IA Generativa         |

---

## 📁 Estructura del Proyecto

```
ia-generated-video-mvp/
│
├── apps/
│   ├── apiv2/                        # Backend Serverless (SAM)
│   │   ├── src/
│   │   │   ├── handlers/             # Funciones Lambda
│   │   │   ├── lib/                  # Utilidades compartidas (Bedrock, S3, etc)
│   │   │   └── repositories/         # Acceso a datos (DynamoDB)
│   │   ├── template.yaml             # Definición de infraestructura SAM
│   │   └── package.json
│   │
│   └── web/                          # Frontend React
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   └── hooks/
│       └── vite.config.ts
│
├── packages/
│   └── shared-types/                 # Tipos TypeScript compartidos
│
├── ARCHITECTURE_AND_DEPLOYMENT.md    # Guía técnica y de despliegue
├── docker-compose.yml                # DynamoDB Local (para dev)
└── README.md
```

---

## 📋 Requisitos Previos

- **Node.js**: v20+
- **AWS CLI**: v2+ configurado con credenciales.
- **SAM CLI**: Para desarrollo local y despliegue.
- **Docker**: Necesario para correr DynamoDB local y SAM local.

---

## 🚀 Instalación y Despliegue

Para desplegar en AWS, sigue la guía detallada en:

👉 **[Guía de Arquitectura y Despliegue](./ARCHITECTURE_AND_DEPLOYMENT.md)**

Resumen rápido de comandos de deploy:

```bash
# Backend
cd apps/apiv2
npm run build
sam build
sam deploy --guided

# Frontend
cd apps/web
npm run build
# (Subir dist/ a S3 y configurar CloudFront)
```

---

## 💻 Uso Local

### 1. Iniciar Entorno Completo

```bash
# Desde la raíz del proyecto
npm run dev
```

Este comando (configurado con Turbo) iniciará:
1.  **DynamoDB Local** (Docker).
2.  **API Backend** (SAM Local en puerto 3001).
3.  **Frontend** (Vite en puerto 5173).

### 2. Variables de Entorno Locales

Asegúrate de tener el archivo `.env` en la raíz (para Docker) y `apps/apiv2/env.json` para las Lambdas locales.

**Ejemplo `apps/apiv2/env.json`:**

```json
{
  "AiScriptsFunction": {
    "AWS_REGION": "us-east-2",
    "BEDROCK_MODEL_ID": "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
    "SYNTHESIA_API_KEY": "...",
    "DYNAMO_ENDPOINT": "http://host.docker.internal:8005",
    "TABLE_NAME": "CourseBuilderTable",
    "WORKER_FUNCTION_NAME": "course-builder-ai-scripts-worker",
    "AWS_SAM_LOCAL": "true"
  }
}
```

---

## 🤝 Contribución

1.  Fork el repositorio.
2.  Crea una rama (`git checkout -b feature/amazing-feature`).
3.  Commit tus cambios (`git commit -m 'Add some amazing feature'`).
4.  Push a la rama (`git push origin feature/amazing-feature`).
5.  Abre un Pull Request.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.
