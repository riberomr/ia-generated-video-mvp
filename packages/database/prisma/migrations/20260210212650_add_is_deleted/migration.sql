-- AlterTable
ALTER TABLE "AiScript" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VideoRender" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
