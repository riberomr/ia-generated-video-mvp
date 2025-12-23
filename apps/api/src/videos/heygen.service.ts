import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Script, Scene } from '@eduvideogen/shared-types';

@Injectable()
export class HeyGenService {
    private readonly logger = new Logger(HeyGenService.name);
    private readonly apiKey = process.env.HEYGEN_API_KEY;
    private readonly baseUrl = 'https://api.heygen.com';

    constructor(private readonly prisma: PrismaService) {
        if (!this.apiKey) {
            this.logger.warn('HEYGEN_API_KEY is missing from environment variables!');
        }
    }

    private async fetchFromHeyGen(endpoint: string, options: RequestInit = {}) {
        if (!this.apiKey) {
            throw new InternalServerErrorException('HEYGEN_API_KEY is not configured');
        }

        const url = `${this.baseUrl}${endpoint}`;
        this.logger.log(`Calling HeyGen API: ${url}`);

        const res = await fetch(url, {
            ...options,
            headers: {
                'X-Api-Key': this.apiKey,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await res.json();

        if (!res.ok) {
            this.logger.error(`HeyGen API Error [${endpoint}]: ${JSON.stringify(data)}`);
            throw new InternalServerErrorException(`HeyGen API call failed: ${data.message || res.statusText}`);
        }

        return data;
    }

    async getAvatars() {
        const response = await this.fetchFromHeyGen('/v2/avatars');
        return response.data?.avatars || [];
    }

    async getVoices() {
        const response = await this.fetchFromHeyGen('/v2/voices');
        return response.data?.voices || [];
    }

    async generateVideo(scriptId: string, options: { avatarId?: string; voiceId?: string } = {}) {
        // 1. Retrieve Script
        // @ts-ignore
        const script = await this.prisma.script.findUnique({
            where: { id: scriptId },
        });

        if (!script) {
            throw new NotFoundException(`Script with ID ${scriptId} not found`);
        }

        // 2. Fetch Assets for fallback or validation
        // We still fetch to ensure defaults are valid or to validate user input if we wanted strict checks
        // Optimization: In a real app, we might rely on frontend sending valid IDs and just handle API errors.
        // For now, let's just use what is passed or fallback.

        let avatarId = options.avatarId;
        let voiceId = options.voiceId;

        // If not provided, try to fetch sensible defaults
        if (!avatarId || !voiceId) {
            const avatars = await this.getAvatars();
            const voices = await this.getVoices();

            if (!avatarId) {
                avatarId = avatars.length > 0 ? avatars[0].avatar_id : 'Anna_public_3_20240108';
            }
            if (!voiceId) {
                const voice = voices.find((v: any) => v.language === 'English' || v.locale === 'en-US') || voices[0];
                voiceId = voice ? voice.voice_id : '2d5b0e6cf361460aa9853f191196152a';
            }
        }

        this.logger.log(`Using Avatar: ${avatarId}, Voice: ${voiceId}`);

        // 3. Construct Payload
        const allScenes = script.scenes as unknown as Scene[];

        // LIMIT TO 1 SCENE to save credits
        const scenes = allScenes.slice(0, 1);
        this.logger.log(`Generating video for ${scenes.length} scene(s) (limited to 1 for cost saving).`);

        const videoInputs = scenes.map((scene) => ({
            character: {
                type: 'avatar',
                avatar_id: avatarId,
                avatar_style: 'normal',
            },
            voice: {
                type: 'text',
                voice_id: voiceId,
                input_text: scene.text, // Moved inside voice object
            },
            background: {
                type: 'color',
                value: '#ffffff',
            },
        }));

        const payload = {
            video_inputs: videoInputs,
            dimension: {
                width: 1280, // 720p is often safer for free tiers
                height: 720,
            },
        };

        // 4. Call API
        const response = await this.fetchFromHeyGen('/v2/video/generate', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const externalId = response.data?.video_id;

        if (!externalId) {
            throw new InternalServerErrorException('Failed to get video_id from HeyGen response');
        }

        this.logger.log(`Video generation started. External ID: ${externalId}`);

        // 5. Create RenderedVideo record
        // @ts-ignore
        const renderedVideo = await this.prisma.renderedVideo.create({
            data: {
                scriptId: script.id,
                externalId: externalId,
                status: 'PENDING',
            },
        });

        return {
            message: 'Video generation started',
            videoId: renderedVideo.id,
            externalId: renderedVideo.externalId,
            status: renderedVideo.status
        };
    }

    async checkStatus(videoId: string) {
        // 1. Retrieve RenderedVideo
        // @ts-ignore
        const video = await this.prisma.renderedVideo.findUnique({
            where: { id: videoId },
        });

        if (!video) {
            throw new NotFoundException(`Video with ID ${videoId} not found`);
        }

        if (!video.externalId) {
            throw new InternalServerErrorException(`Video record ${videoId} has no external ID`);
        }

        // 2. Call API (v1 video_status)
        // Endpoint: https://api.heygen.com/v1/video_status.get?video_id=...
        const response = await this.fetchFromHeyGen(`/v1/video_status.get?video_id=${video.externalId}`);

        const data = response.data || {};
        const status = data.status; // pending, processing, completed, failed
        const videoUrl = data.video_url;

        this.logger.log(`Checked status for ${video.externalId}: ${status}`);

        let newStatus = video.status;
        let downloadUrl = video.downloadUrl;

        // Map HeyGen status to our status
        if (status === 'completed') {
            newStatus = 'COMPLETED';
            downloadUrl = videoUrl;
        } else if (status === 'failed') {
            newStatus = 'FAILED';
        } else if (status === 'processing' || status === 'pending') {
            newStatus = status === 'processing' ? 'PROCESSING' : 'PENDING';
        }

        // 3. Update DB
        // @ts-ignore
        const updatedVideo = await this.prisma.renderedVideo.update({
            where: { id: videoId },
            data: {
                status: newStatus,
                downloadUrl: downloadUrl,
            },
        });

        return {
            videoId: updatedVideo.id,
            status: updatedVideo.status,
            downloadUrl: updatedVideo.downloadUrl,
        };
    }
}
