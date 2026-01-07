
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const AVATARS_FILE_PATH = path.resolve(__dirname, '../../../avatars_s.md');
const VOICES_FILE_PATH = path.resolve(__dirname, '../../../voices_s.md');

async function main() {
    console.log('Starting Synthesia assets seeding...');

    // --- Seed Avatars ---
    try {
        if (fs.existsSync(AVATARS_FILE_PATH)) {
            console.log(`Reading avatars from ${AVATARS_FILE_PATH}`);
            const avatarsContent = fs.readFileSync(AVATARS_FILE_PATH, 'utf-8');
            const avatarLines = avatarsContent.split('\n').filter(line => line.trim() !== '');

            // Skip header: Avatar Name	GENDER	VERSION	Avatar_ID
            const avatarData = [];
            // Start from index 1 to skip header
            for (let i = 1; i < avatarLines.length; i++) {
                const line = avatarLines[i];
                const parts = line.split('\t');
                if (parts.length >= 4) {
                    const name = parts[0].trim();
                    const gender = parts[1].trim();
                    const version = parts[2].trim();
                    const id = parts[3].trim();

                    if (id && name) {
                        avatarData.push({
                            id,
                            name,
                            gender,
                            version,
                        });
                    }
                }
            }

            console.log(`Found ${avatarData.length} avatars to insert.`);

            const result = await prisma.synthesiaAvatar.createMany({
                data: avatarData,
                skipDuplicates: true,
            });

            console.log(`Seeded ${result.count} avatars.`);
        } else {
            console.warn(`Avatars file not found at ${AVATARS_FILE_PATH}`);
        }
    } catch (error) {
        console.error('Error seeding avatars:', error);
    }

    // --- Seed Voices ---
    try {
        if (fs.existsSync(VOICES_FILE_PATH)) {
            console.log(`Reading voices from ${VOICES_FILE_PATH}`);
            const voicesContent = fs.readFileSync(VOICES_FILE_PATH, 'utf-8');
            const voiceLines = voicesContent.split('\n').filter(line => line.trim() !== '');

            // Skip header: Language Formal name	Language Native name	Language ICU	Gender	Synthesia Name	Synthesia VOICE_ID
            const voiceData = [];
            // Start from index 1 to skip header
            for (let i = 1; i < voiceLines.length; i++) {
                const line = voiceLines[i];
                const parts = line.split('\t');
                if (parts.length >= 6) {
                    const language = parts[0].trim();
                    const nativeName = parts[1].trim();
                    const languageCode = parts[2].trim();
                    const gender = parts[3].trim();
                    const name = parts[4].trim();
                    const id = parts[5].trim();

                    if (id && name) {
                        voiceData.push({
                            id,
                            name,
                            gender,
                            language,
                            languageCode,
                            nativeName,
                        });
                    }
                }
            }

            console.log(`Found ${voiceData.length} voices to insert.`);

            const result = await prisma.synthesiaVoice.createMany({
                data: voiceData,
                skipDuplicates: true,
            });

            console.log(`Seeded ${result.count} voices.`);
        } else {
            console.warn(`Voices file not found at ${VOICES_FILE_PATH}`);
        }
    } catch (error) {
        console.error('Error seeding voices:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
