# EduVideoGen (MVP)

A SaaS platform that automatically generates educational videos from text content using AI. This project uses a Monorepo architecture to manage the frontend, backend, and shared libraries.

## 🏗️ Architecture

This project is built as a **Turborepo** monorepo with the following structure:

-   **apps/web**: React 19 + Vite frontend.
-   **apps/api**: NestJS backend.
-   **packages/database**: Shared Prisma schema and client.
-   **packages/shared-types**: Shared TypeScript interfaces/DTOs.

### ⚡ Tech Stack

-   **Frontend**: React 19, Vite, TailwindCSS (Styled Components style), Lucide React.
-   **Backend**: NestJS, PostgreSQL, Prisma ORM.
-   **AI**:
    -   **Groq (Llama 3.3)**: For script generation.
    -   **HeyGen (API v2)**: For video generation (Text-to-Video with Avatars).
-   **Infrastructure**: Docker (PostgreSQL, Redis).
-   **Package Manager**: NPM (with Workspaces).

---

## 🚀 Getting Started

### Prerequisites

-   **Node.js**: v18+ (tested with v20).
-   **Docker**: Required for the database.
-   **API Keys**:
    -   [Groq API Key](https://console.groq.com/keys)
    -   [HeyGen API Key](https://app.heygen.com/settings/api)

### 1. Environment Setup

Create a `.env` file in the root directory (copy from default or use the logic below):

```bash
# PostgreSQL
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=eduvideogen
DATABASE_URL="postgresql://user:password@localhost:5432/eduvideogen?schema=public"

# AI Services
GROQ_API_KEY=your_groq_api_key_here
HEYGEN_API_KEY=your_heygen_api_key_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Infrastructure

Start the PostgreSQL database using Docker:

```bash
docker-compose up -d
```

### 4. Setup Database

Push the Prisma schema to the database:

```bash
npx prisma db push
```

### 5. Run Development Server

This will start both the Frontend (`port 5173`) and Backend (`port 3000`):

```bash
npm run dev
```

---

## 🧩 Components Overview

### 🖥️ Frontend (`apps/web`)
A modern React application built with Vite.
-   **Script Generator**: Interface to input educational topics.
-   **Saved Scripts**: Manage and view generated scripts.
-   **Video Modal**: Integrated modal to select HeyGen Avatars and Voices for video generation.

### ⚙️ Backend (`apps/api`)
A NestJS application providing RESTful endpoints.
-   **/courses**: Handles script generation using Groq.
-   **/videos**: Handles video generation using HeyGen.
    -   FETch Avatars/Voices directly from HeyGen API.
    -   Manages video status polling.

### 🗄️ Database (`packages/database`)
Shared library containing the Prisma schema.
-   Currently tracks `Courses`, `Scripts` (Scenes), and `Videos`.

---

## 🤖 AI Integration Details

### Groq (Scripting)
-   **Service**: `GroqService`
-   **Model**: `llama-3.3-70b-versatile`
-   **Process**: Converts user-provided topics into structured educational scripts with scenes, visual descriptions, and narrator text.

### HeyGen (Video)
-   **Service**: `HeyGenService`
-   **API**: HeyGen v2
-   **Features**:
    -   Dynamic Avatar & Voice fetching.
    -   Video Generation (currently limited to **1 scene** for credit optimization).
    -   Real-time status tracking (Pending -> Processing -> Completed).

---

## 🛠️ Repository Status

The repository has been cleaned and optimized:
-   **Local volumes** (`postgres_data`) are ignored.
-   **Build artifacts** (`dist`, `build`) are ignored.
-   **Git history** has been scrubbed of initial clutter.
