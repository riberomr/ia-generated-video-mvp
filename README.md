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
    -   **Groq (Llama 3.3)**: For script generation and **Smart Scripting** (Template Analysis).
    -   **Synthesia (API v2)**: Primary provider for "Smart Video" generation (Templates, custom Avatars/Voices).
    -   **HeyGen (API v2)**: Alternative provider for basic text-to-video.
-   **Infrastructure**: Docker (PostgreSQL, Redis).
-   **Package Manager**: NPM (with Workspaces).

---

## 🚀 Getting Started

### Prerequisites

-   **Node.js**: v18+ (tested with v20).
-   **Docker**: Required for the database.
-   **API Keys**:
    -   [Groq API Key](https://console.groq.com/keys)
    -   [Synthesia API Key](https://www.synthesia.io/api)
    -   [HeyGen API Key](https://app.heygen.com/settings/api)

### 1. Environment Setup

Create a `.env` file in the root directory:

```bash
# PostgreSQL
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=eduvideogen
DATABASE_URL="postgresql://user:password@localhost:5432/eduvideogen?schema=public"

# AI Services
GROQ_API_KEY=your_groq_api_key_here
HEYGEN_API_KEY=your_heygen_api_key_here
SYNTHESIA_API_KEY=your_synthesia_api_key_here

# Frontend Configuration
# Points to your API URL (default: http://localhost:3000)
VITE_APP_BASE_URL=http://localhost:3000
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

**Seed Synthesia Assets (Crucial for Smart Scripting):**
This script populates the database with available Synthesia Avatars and Voices from the `.md` source files.

```bash
npx tsx packages/database/prisma/seed_synthesia_from_md.ts
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
-   **Smart Scripting (Home)**: The core workflow. Select a Synthesia Template -> Input Topic -> AI Auto-maps content to the template's logic.
-   **Script Editor**: Advanced editor to tweak visual variables and voice scripts before generation.
-   **Saved Scripts**: Dashboard to view, edit, and generate videos from saved scripts.

### ⚙️ Backend (`apps/api`)
A NestJS application providing RESTful endpoints.
-   **/videos/synthesia**: Handles template fetching, asset listing, and "Smart Video" generation.
-   **/courses**: Orchestrates the "Smart Scripting" flow, using Groq to map topics to Synthesia template structures.
-   **/videos**: Handles video generation (Synthesia & HeyGen).

### 🗄️ Database (`packages/database`)
Shared library containing the Prisma schema.
-   **Key Models**: `Course`, `Script`, `SynthesiaAvatar`, `SynthesiaVoice`.
-   **Smart Support**: Stores structured `templateData` for perfect template alignment.

---

## 🤖 AI Integration Details

### Smart Scripting (Groq)
-   **Logic**: The system analyzes the structure of a selected **Synthesia Template** (counting scenes, identifying visual placeholders).
-   **Generation**: Uses **Llama-3.3-70b** on Groq to generate a script that fits *perfectly* into that structure (e.g., generating exactly 3 generic bullet points if the template demands `slide_text_1`, `slide_text_2`, `slide_text_3`).

### Synthesia (Primary Video Provider)
-   **API**: Synthesia v2.
-   **Features**:
    -   **Templates**: Rich video layouts with dynamic background/text replacement.
    -   **Assets**: Supports replacing template placeholders with images/text.
    -   **Status**: Real-time webhook-style polling.

### HeyGen (Secondary)
-   **Use Case**: Basic single-avatar videos without complex template layouts.

---

## 🛠️ Repository Status

The repository has been cleaned and optimized:
-   **Local volumes** (`postgres_data`) are ignored.
-   **Build artifacts** (`dist`, `build`) are ignored.
-   **Git history** has been scrubbed of initial clutter.
