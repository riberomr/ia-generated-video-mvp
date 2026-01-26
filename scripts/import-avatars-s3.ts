import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

// --- Configuration ---
const AVATARS_JSON_PATH = path.join(__dirname, "../avatarsmapped.json");
const BUCKET_NAME = process.env.MINIO_BUCKET || "synthesia-assets"; // Default from service
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "http://localhost:9000";
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || MINIO_ENDPOINT; // Use public URL if available for DB

// Initialize Clients
const prisma = new PrismaClient();
const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  },
  forcePathStyle: true,
});

async function main() {
  console.log("Starting avatar import...");

  // 1. Load JSON
  if (!fs.existsSync(AVATARS_JSON_PATH)) {
    console.error(`File not found: ${AVATARS_JSON_PATH}`);
    process.exit(1);
  }
  const rawData = fs.readFileSync(AVATARS_JSON_PATH, "utf-8");
  const avatars = JSON.parse(rawData);
  console.log(`Found ${avatars.length} avatars to process.`);

  let successCount = 0;
  let failCount = 0;

  // 2. Process Loop
  for (const avatar of avatars) {
    const { id, name, thumbnailMediumUrl, gender, ...restMetadata } = avatar;

    if (!thumbnailMediumUrl) {
      console.warn(`Skipping ${name} (${id}): No thumbnail URL.`);
      failCount++;
      continue;
    }

    try {
      // Step A: Download
      const imageBuffer = await downloadImage(thumbnailMediumUrl);
      if (!imageBuffer) {
        console.warn(`Failed to download image for ${name} (${id}). skipping.`);
        failCount++;
        continue;
      }

      // Step B: Upload to MinIO
      const key = `avatars/${id}.jpg`;
      await uploadToS3(key, imageBuffer, "image/jpeg");
      const permanentUrl = `${MINIO_PUBLIC_URL}/${BUCKET_NAME}/${key}`;

      // Step C: DB Upsert
      await prisma.synthesiaScrappedAvatar.upsert({
        where: { id },
        update: {
          name,
          gender: gender || null,
          imageUrl: permanentUrl,
          metadata: restMetadata,
        },
        create: {
          id,
          name,
          gender: gender || null,
          imageUrl: permanentUrl,
          metadata: restMetadata,
        },
      });

      console.log(`Migrated ${name} -> ${permanentUrl}`);
      successCount++;
    } catch (error) {
      console.error(`Error processing ${name} (${id}):`, error);
      failCount++;
    }
  }

  console.log(
    `\nImport complete! Success: ${successCount}, Failed: ${failCount}`,
  );
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Fetch failed for ${url}: ${res.statusText}`);
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e) {
    console.error(`Download exception: ${e}`);
    return null;
  }
}

async function uploadToS3(key: string, body: Buffer, contentType: string) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      // ACL: 'public-read' // Optional, depending on bucket policy
    }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
