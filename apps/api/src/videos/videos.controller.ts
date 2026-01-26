import { Controller, Post, Get, Patch, Param, Body, Res, Query, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { HeyGenService } from './heygen.service';
import { SynthesiaService } from './synthesia.service';
import { CreateVideoFromScratchDto } from './dto/create-video-from-scratch.dto';
import { CreateSynthesiaVideoDto } from './dto/create-synthesia-video.dto';
import { GetAvatarsFilterDto } from './dto/get-avatars-filter.dto';
import { GenerateScriptDto } from './dto/generate-script.dto';
import { GroqService } from '../courses/groq.service';
import { PrismaService } from '../database/prisma.service';
import { RegenerateSceneDto } from './dto/regenerate-scene.dto';

@Controller('videos')
export class VideosController {
    constructor(
        // private readonly heyGenService: HeyGenService,
        private readonly synthesiaService: SynthesiaService,
        private readonly groqService: GroqService,
        private readonly prisma: PrismaService
    ) { }

    @Post('create')
    createFromScratch(@Body() createVideoDto: CreateVideoFromScratchDto) {
        return this.synthesiaService.createVideoFromScratch(createVideoDto);
    }

    @Post('generate-script')
    async generateScript(@Body() generateScriptDto: GenerateScriptDto) {
        const { title, sourceText, sceneCount, scenes } = generateScriptDto;

        // 1. Create SourceContent
        // @ts-ignore
        const sourceContent = await this.prisma.sourceContent.create({
            data: {
                content: sourceText,
                title: title // Save the source title
            }
        });

        const scriptJson = await this.groqService.generateScriptFromScratch(title, sourceText, sceneCount, scenes);

        // Persist to DB
        // @ts-ignore
        const savedScript = await this.prisma.synthesiaVideoScript.create({
            data: {
                title: scriptJson.title || title,
                scenes: scriptJson.input,
                sourceContentId: sourceContent.id
            }
        });

        console.log('Generated & Saved Script:', savedScript.id);

        // Return structured response
        return {
            id: savedScript.id,
            sourceContent: sourceContent,
            ...scriptJson
        };
    }

    @Get('synthesia-video-scripts')
    async getSynthesiaVideoScripts() {
        // @ts-ignore
        return this.prisma.synthesiaVideoScript.findMany({
            orderBy: { createdAt: 'desc' },
            include: { renderedVideos: true }
        });
    }

    @Get('synthesia-scripts/:id')
    async getSynthesiaScript(@Param('id') id: string) {
        // @ts-ignore
        const script = await this.prisma.synthesiaVideoScript.findUnique({
            where: { id },
            include: { sourceContent: true }
        });

        if (!script) {
            throw new NotFoundException('Script not found');
        }

        return script;
    }

    @Patch('synthesia-scripts/:id')
    async updateSynthesiaScript(@Param('id') id: string, @Body() body: any) {
        // Simple update: title and scenes
        // @ts-ignore
        const script = await this.prisma.synthesiaVideoScript.update({
            where: { id },
            data: {
                title: body.title,
                scenes: body.scenes // Expecting Json array
            }
        });

        return script;
    }

    @Post('synthesia-scripts/regenerate-scene')
    async regenerateScene(@Body() dto: RegenerateSceneDto) {
        const { sourceContentText, allScenes, targetSceneIndex, currentSceneData, userFeedback } = dto;

        const regeneratedScene = await this.groqService.regenerateScene(
            sourceContentText,
            allScenes,
            targetSceneIndex,
            currentSceneData,
            userFeedback
        );

        return regeneratedScene;
    }

    // @Get('avatars')
    // async getAvatars(@Query('provider') provider: string = 'heygen') {
    //     if (provider.toLowerCase() === 'synthesia') {
    //         return this.synthesiaService.getAvatars();
    //     }
    //     return this.heyGenService.getAvatars();
    // }

    // @Get('voices')
    // async getVoices(@Query('provider') provider: string = 'heygen') {
    //     if (provider.toLowerCase() === 'synthesia') {
    //         return this.synthesiaService.getVoices();
    //     }
    //     return this.heyGenService.getVoices();
    // }

    // @Get('voices/locales')
    // async getVoicesLocales() {
    //     // Synthesia might not have this exact equivalent exposed cleanly, defaulting to HeyGen for now
    //     return this.heyGenService.getVoicesLocales();
    // }

    @Get('synthesia/templates')
    async getSynthesiaTemplates(@Query('source') source: string) {
        return this.synthesiaService.getTemplates({ source });
    }

    @Get('synthesia/templates/:id')
    async getSynthesiaTemplateDetails(@Param('id') id: string) {
        return this.synthesiaService.getTemplateDetails(id);
    }

    @Get('synthesia/assets/:user_media_asset_id')
    async getSynthesiaAssets(@Param('user_media_asset_id') user_media_asset_id: string) {
        return this.synthesiaService.getAssets({ user_media_asset_id });
    }

    @Get('synthesia/avatars/library')
    async getSynthesiaAvatarLibrary(@Query() filters: GetAvatarsFilterDto) {
        return this.synthesiaService.getLibrary(filters);
    }

    @Post('generate/:scriptId')
    async generateVideo(
        @Param('scriptId') scriptId: string,
        @Body() body: any // Relaxed type to handle both providers
    ) {
        if (body.provider?.toLowerCase() === 'synthesia') {
            return this.synthesiaService.generateVideo(scriptId, body as CreateSynthesiaVideoDto);
        }
        // return this.heyGenService.generateVideo(scriptId, body);
    }

    @Get('status/:videoId')
    async checkStatus(@Param('videoId') videoId: string) {
        // Need to check which provider was used for this video
        // We can either fetch the video first to check provider, or try both (inefficient), 
        // or - better - add a query param? But usually status check just has ID.
        // Let's modify the service to be smart or just try one then the other? 
        // Actually, since we added 'provider' to DB, we should fetch DB record first in a common service or here.
        // For MVP, since the Services do a DB lookup anyway, we can let them fail if ID not found or...
        // Better approach: Peek at the DB record here? Or just try HeyGen defaults.
        // Let's refactor slightly to be safer:
        // Actually, the services throw 'NotFound'.

        // IMPORTANT: We need to know who to ask.
        // I will delegate this logic to the specific service that owns the ID.
        // BUT, since we don't know yet, I'll cheat slightly for MVP and check HeyGen DB record via HeyGenService first? 
        // No, HeyGenService.checkStatus reads the DB.

        // Let's inject PrismaService here or just assume we can call HeyGenService.
        // *Self-correction*: If I call HeyGenService.checkStatus, it fetches the video. If provider is SYNTHESIA, it might fail or proceed weirdly.
        // I should update HeyGenService and SynthesiaService to check the provider field they read.
        // AND/OR: I'll try HeyGen first, if it throws/returns error related to provider, try Synthesia?
        // CLEANER: Inject Prisma here and check provider.
        // BUT I cannot easily inject PrismaService into Controller directly without Module export (it is likely exported).
        // Let's assume PrismaService is available via one of the services.

        // Alternative: The user asked for "SynthesiaService" to be modular.
        // I'll try to determine provider by checking who claims it.
        // For this step, I'll leave it simple:
        // If I can't easily check DB, I might need to rely on the client knowing... but client just polls /status/:id.
        // I will modify the logic to use a helper or try/catch.

        // Let's try to fetch via HeyGenService. If the service sees 'provider: SYNTHESIA', it should return or throw specific.
        // I'll update the services to be smart about 'provider' field.

        // For now, I'll default to HeyGen, but if it fails (not found), try Synthesia? 
        // The ID is unique (UUID).
        // I'll implement a simple "Router" logic here by using one of the services to peek, or just try both.
        // Trying both is safest without direct DB access here.

        // try {
        //     return await this.heyGenService.checkStatus(videoId);
        // } catch (e) {
        // If HeyGen says "Not Found" or "Not HeyGen", try Synthesia
        try {
            return await this.synthesiaService.checkStatus(videoId);
        } catch (e2) {
            throw new NotFoundException('Video not found in any provider');
        }
        // }
    }

    @Get(':videoId/redirect')
    async redirectVideo(@Param('videoId') videoId: string, @Res() res: Response) {
        let downloadUrl: string | undefined;

        // try {
        //     const status = await this.heyGenService.checkStatus(videoId);
        //     downloadUrl = status.downloadUrl;
        // } catch (e) {
        try {
            const status = await this.synthesiaService.checkStatus(videoId);
            downloadUrl = status.downloadUrl;
        } catch (e2) {
            return res.status(404).send('Video not found');
        }
        // }

        if (downloadUrl) {
            return res.redirect(downloadUrl);
        } else {
            return res.status(404).send('Video not ready or not found');
        }
    }
}
