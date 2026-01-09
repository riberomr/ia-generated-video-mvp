import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Script, Scene, SynthesiaTemplate, SynthesiaTemplateDetails, SynthesiaAsset } from '@eduvideogen/shared-types';
import { CreateSynthesiaVideoDto } from './dto/create-synthesia-video.dto';
import { CreateVideoFromScratchDto } from './dto/create-video-from-scratch.dto';
import { GroqService } from '../courses/groq.service';


type GetTemplatesParams = {
    source?: string;
}

@Injectable()
export class SynthesiaService {
    private readonly logger = new Logger(SynthesiaService.name);
    // Use environment variable or fallback to a dummy key as requested
    private readonly apiKey = process.env.SYNTHESIA_API_KEY || 'dummy_synthesia_key_12345';
    private readonly baseUrl = 'https://api.synthesia.io/v2';

    constructor(
        private readonly prisma: PrismaService,
        private readonly groqService: GroqService
    ) {
        if (!process.env.SYNTHESIA_API_KEY) {
            this.logger.warn('SYNTHESIA_API_KEY is missing. Using dummy key for development.');
        }
    }

    async createVideoFromScratch(dto: CreateVideoFromScratchDto) {
        this.logger.log(`Creating Video From Scratch: ${dto.title}`);

        try {
            const response = await this.fetchFromSynthesia('/videos', {
                method: 'POST',
                body: JSON.stringify(dto),
            });

            this.logger.log(`Video created successfully: ${response.id}`);

            // ALWAYS persist to DB, regardless of scriptId
            // @ts-ignore
            const savedVideo = await this.prisma.synthesiaRenderedVideo.create({
                data: {
                    synthesiaId: response.id,
                    status: 'processing', // Initial status
                    scriptId: dto.scriptId || null,
                    downloadUrl: null
                }
            });

            return {
                ...response,
                id: savedVideo.id, // Return INTERNAL ID for polling
                synthesiaId: response.id
            };
        } catch (error) {
            this.logger.error(`Failed to create video from scratch: ${error.message}`);
            throw error;
        }
    }

    private async fetchFromSynthesia(endpoint: string, options: RequestInit = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        this.logger.log(`Calling Synthesia API: ${url}`);

        const res = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `${this.apiKey}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },

        });

        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            // If response is not JSON (e.g. 404 HTML, 502 Bad Gateway)
            this.logger.error(`Synthesia API Non-JSON Response [${endpoint}]: ${text.substring(0, 500)}`);
            throw new InternalServerErrorException(`Synthesia API returned invalid format: ${res.status} ${res.statusText}`);
        }

        if (!res.ok) {
            this.logger.error(`Synthesia API Error [${endpoint}]: ${JSON.stringify(data)}`);
            throw new InternalServerErrorException(`Synthesia API call failed: ${data.message || res.statusText}`);
        }

        return data;
    }

    /**
     * Synthesia API V2 to list avatars.
     * Mapped to match HeyGen's response structure for frontend compatibility where reasonable.
     */
    /**
     * Get list of Avatars from local database.
     */
    async getAvatars() {
        // @ts-ignore
        const avatars = await this.prisma.synthesiaAvatar.findMany({
            orderBy: { name: 'asc' },
        });

        return avatars.map((a: any) => ({
            avatar_id: a.id,
            avatar_name: a.name,
            gender: a.gender,
            preview_image_url: null, // Not available in static data
        }));
    }

    /**
     * Get list of Voices from local database.
     */
    async getVoices() {
        // @ts-ignore
        const voices = await this.prisma.synthesiaVoice.findMany({
            orderBy: { language: 'asc' },
        });

        return voices.map((v: any) => ({
            voice_id: v.id,
            name: v.name,
            language: v.language,
            gender: v.gender,
        }));
    }

    async getTemplates({ source }: GetTemplatesParams): Promise<SynthesiaTemplate[]> {

        let endpoint = '/templates';

        if (source) {
            endpoint += `?source=${source}`;
        }

        const response = await this.fetchFromSynthesia(endpoint);
        return (response.templates || response || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            thumbnail_url: t.thumbnail_url,
        }));
    }

    async getTemplateDetails(id: string): Promise<SynthesiaTemplateDetails> {
        const response = await this.fetchFromSynthesia(`/templates/${id}`);
        // Response might be the template object directly or wrapped
        const t = response.template || response;
        return {
            id: t.id,
            title: t.title,
            description: t.description,
            variables: t.variables || {}, // Synthesia might expose placeholders
            createdAt: t.created_at,
            updatedAt: t.updated_at,
        };
    }


    async getAssets({ user_media_asset_id }: { user_media_asset_id: string }): Promise<SynthesiaAsset[]> {
        let endpoint = '/assets';

        if (user_media_asset_id) {
            endpoint += `?user_media_asset_id=${user_media_asset_id}`;
        }

        const response = await this.fetchFromSynthesia(endpoint);
        return (response.assets || response || []).map((a: any) => ({
            id: a.id,
            title: a.title,
            type: a.type,
            url: a.url,
        }));
    }


    // async generateScriptFromTemplate(topic: string, templateId: string): Promise<any> {
    //     // 1. Get Template Details to have the variables and description
    //     const template = await this.getTemplateDetails(templateId);

    //     // 2. Prepare Template JSON for LLM
    //     const templateJson = JSON.stringify({
    //         description: template.description || '',
    //         variables: template.variables || [],
    //     }, null, 2);

    //     // 3. Generate Script using Groq
    //     const generatedData = await this.groqService.generateSynthesiaScript(topic, templateJson);

    //     return generatedData;
    // }

    async generateVideo(scriptId: string, dto: CreateSynthesiaVideoDto) {
        // 1. Retrieve Script
        // @ts-ignore
        const script = await this.prisma.script.findUnique({
            where: { id: scriptId },
        });

        if (!script) {
            throw new NotFoundException(`Script with ID ${scriptId} not found`);
        }

        let input: any[] = [];
        let test = dto.test !== undefined ? dto.test : true; // Default to test=true
        let endpoint = '/videos';
        let payload: any = {};

        // Case 1: Templated Script (New Logic)
        const typedScript = script as unknown as Script;
        if (typedScript.isTemplated && typedScript.templateId) {
            endpoint = '/videos/fromTemplate';

            // 1.1 Validation
            if (!typedScript.templateId) throw new InternalServerErrorException("Templated script missing templateId");

            // 1.2 Construct Input Data from Template Data (Source of Truth)
            const dbTemplateData = (typedScript.templateData as Record<string, any>) || {};
            let templateData = { ...dbTemplateData };

            // 1.3 Voice Script is already inside templateData as scene_voice_text_N
            // No need to merge manually.

            // Merge any overrides from DTO
            if (dto.templateData) {
                templateData = { ...templateData, ...dto.templateData };
            }

            payload = {
                test: test,
                templateId: typedScript.templateId,
                templateData: templateData,
                title: dto.title || `Script ${scriptId}`,
                description: dto.description,
            };
        }
        // Case 2: Frontend explicit template override (Legacy/Manual)
        else if (dto.templateId) {
            endpoint = '/videos/fromTemplate';
            payload = {
                test: test,
                templateId: dto.templateId,
                templateData: dto.templateData || {},
                title: dto.title || `Script ${scriptId}`,
                description: dto.description,
            };
        }
        // ...
        // 3. Call API
        this.logger.log(`Synthesia Payload [${endpoint}]: ${JSON.stringify(payload)}`);
        const response = await this.fetchFromSynthesia(endpoint, {
            method: 'POST',
            body: JSON.stringify(payload),

        });

        // Synthesia returns { id: "...", status: "..." }
        const externalId = response.id;

        if (!externalId) {
            throw new InternalServerErrorException('Failed to get video ID from Synthesia response');
        }

        this.logger.log(`Synthesia video generation started. External ID: ${externalId}`);

        // 4. Create RenderedVideo record
        // @ts-ignore
        const renderedVideo = await this.prisma.renderedVideo.create({
            data: {
                scriptId: script.id,
                externalId: externalId,
                status: 'PENDING', // Synthesia starts with created/queued
                provider: 'SYNTHESIA',
                requestPayload: payload,
            },
        });

        return {
            message: 'Video generation started (Synthesia)',
            videoId: renderedVideo.id,
            externalId: renderedVideo.externalId,
            status: renderedVideo.status,
            provider: 'SYNTHESIA'
        };
    }

    async checkStatus(videoId: string) {
        // 1. Check New Table first (SynthesiaRenderedVideo)
        // @ts-ignore
        const newVideo = await this.prisma.synthesiaRenderedVideo.findUnique({
            where: { id: videoId }
        });

        if (newVideo) {
            return this.checkStatusNew(newVideo);
        }

        // 2. Legacy Check (RenderedVideo)
        // @ts-ignore
        const video = await this.prisma.renderedVideo.findUnique({
            where: { id: videoId },
        });

        if (!video) {
            throw new NotFoundException(`Video with ID ${videoId} not found`);
        }

        if (video.provider !== 'SYNTHESIA') {
            // Should not happen if routed correctly, but safe check
            throw new InternalServerErrorException(`Video ${videoId} is not a Synthesia video`);
        }

        if (!video.externalId) {
            throw new InternalServerErrorException(`Video record ${videoId} has no external ID`);
        }

        // 3. Call API
        const response = await this.fetchFromSynthesia(`/videos/${video.externalId}`);

        // Synthesia V2 video object: { id, status: "complete", download: "url", ... }
        const status = response.status; // 'created', 'queued', 'in_progress', 'complete'
        const downloadUrl = response.download;

        this.logger.log(`Checked Synthesia status for ${video.externalId}: ${status}`);

        let newStatus = video.status;

        if (status === 'complete') {
            newStatus = 'COMPLETED';
        } else if (['created', 'queued'].includes(status)) {
            newStatus = 'PENDING';
        } else if (status === 'in_progress') {
            newStatus = 'PROCESSING';
        } else {
            // fail safe
            // if status is failed/error?
            // Synthesia might not have explicit 'failed', need to check valid values. Assuming standard.
            if (status?.includes('fail') || status === 'error') { // Hypothetical
                newStatus = 'FAILED';
            }
        }

        // 4. Update DB
        // @ts-ignore
        const updatedVideo = await this.prisma.renderedVideo.update({
            where: { id: videoId },
            data: {
                status: newStatus,
                downloadUrl: downloadUrl || video.downloadUrl,
            },
        });

        return {
            videoId: updatedVideo.id,
            status: updatedVideo.status,
            downloadUrl: updatedVideo.downloadUrl,
            provider: 'SYNTHESIA'
        };
    }

    // Helper for new table
    private async checkStatusNew(video: any) {
        const response = await this.fetchFromSynthesia(`/videos/${video.synthesiaId}`);
        const status = response.status;
        const downloadUrl = response.download;

        let newStatus = video.status;

        // Map statuses
        // status: 'created', 'queued', 'in_progress', 'complete'
        // We used lowercase 'processing', 'completed', 'failed' in schema comment?
        // Schema comment: // e.g., 'processing', 'completed', 'failed'
        // Let's stick to raw or normalized? The prompt examples used lowercase.

        if (status === 'complete') newStatus = 'completed';
        else if (status === 'in_progress') newStatus = 'processing';
        else if (['created', 'queued'].includes(status)) newStatus = 'processing'; // or 'pending' if we want distinction
        else if (status === 'failed' || status === 'error') newStatus = 'failed';

        // Update DB
        // @ts-ignore
        const updated = await this.prisma.synthesiaRenderedVideo.update({
            where: { id: video.id },
            data: {
                status: newStatus,
                downloadUrl: downloadUrl || video.downloadUrl
            }
        });

        return {
            videoId: updated.id,
            status: updated.status,
            downloadUrl: updated.downloadUrl, // Front end expects this
            synthesiaId: updated.synthesiaId
        };
    }
}
