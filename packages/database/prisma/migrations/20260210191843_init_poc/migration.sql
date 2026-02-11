-- CreateTable
CREATE TABLE "AiScript" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "teacherRole" TEXT NOT NULL,
    "teacherSpecialty" TEXT NOT NULL,
    "studentProfile" TEXT NOT NULL,
    "videoType" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiScript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoRender" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scriptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoRender_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoRender_externalId_key" ON "VideoRender"("externalId");

-- AddForeignKey
ALTER TABLE "VideoRender" ADD CONSTRAINT "VideoRender_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "AiScript"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
