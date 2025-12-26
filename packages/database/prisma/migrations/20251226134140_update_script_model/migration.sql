-- CreateEnum
CREATE TYPE "ScriptStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "scenes" JSONB NOT NULL,
    "status" "ScriptStatus" NOT NULL DEFAULT 'DRAFT',
    "originalScenes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenderedVideo" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "externalId" TEXT,
    "downloadUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenderedVideo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenderedVideo" ADD CONSTRAINT "RenderedVideo_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
