import { Controller, Post, Get, Patch, Param, Body, Res, Query, NotFoundException, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileExtractionService } from './file-extraction.service';

import { SynthesiaService } from './synthesia.service';
import { CreateVideoFromScratchDto } from './dto/create-video-from-scratch.dto';
import { CreateSynthesiaVideoDto } from './dto/create-synthesia-video.dto';
import { GetAvatarsFilterDto } from './dto/get-avatars-filter.dto';
import { GenerateScriptDto } from './dto/generate-script.dto';
import { ScriptGeneratorService } from '../courses/script-generator.service';
import { PrismaService } from '../database/prisma.service';
import { RegenerateSceneDto } from './dto/regenerate-scene.dto';

@Controller('videos')
export class VideosController {
    constructor(
        private readonly synthesiaService: SynthesiaService,
        private readonly scriptGeneratorService: ScriptGeneratorService,
        private readonly prisma: PrismaService,
        private readonly fileExtractionService: FileExtractionService
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

        const scriptJson = await this.scriptGeneratorService.generateScriptFromScratch(title, sourceText, sceneCount, scenes);

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

    @Post('generate-from-files')
    @UseInterceptors(FilesInterceptor('files'))
    async generateScriptFromFiles(
        @UploadedFiles() files: Array<Express.Multer.File>,
        @Body() body: any
    ) {
        // Extract metadata from body
        const {
            title,
            teacherName,
            teacherRole,
            teacherSpecialty,
            instructionalDesigner,
            tone,
            style,
            studentProfile,
            courseName,
            templateId 
        } = body;
        
        if (!files || files.length === 0) {
            throw new NotFoundException('No files uploaded');
        }

        let combinedText = '';

        for (const file of files) {
            combinedText += `\n--- START OF FILE: ${file.originalname} ---\n`;
            
            if (file.mimetype === 'application/pdf') {
                combinedText += await this.fileExtractionService.extractTextFromPdf(file.buffer);
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // docx
                combinedText += await this.fileExtractionService.extractTextFromDocx(file.buffer);
            } else {
                combinedText += `[Unsupported file type: ${file.mimetype}]`;
            }
            combinedText += `\n--- END OF FILE: ${file.originalname} ---\n`;
        }

        // 1. Create SourceContent
        // @ts-ignore
        const sourceContent = await this.prisma.sourceContent.create({
            data: {
                content: combinedText,
                title: title || 'Generated from Files'
            }
        });

        if (templateId) {
            // --- TEMPLATE FLOW ---
            
            // 1. Fetch Template Details
            const template = await this.synthesiaService.getTemplateDetails(templateId);
            
            // 2. Map Script to Template
            const templateJson = JSON.stringify({ variables: template.variables });
            
            const templateData = await this.scriptGeneratorService.mapTechnicalSheetToTemplate(combinedText, templateJson, {
                teacherName, teacherRole, teacherSpecialty, instructionalDesigner, tone, style, studentProfile, courseName
            });

            // 3. Create Course (Required for Script)
            // @ts-ignore
            const course = await this.prisma.course.create({
                data: {
                    topic: courseName || title || 'Course from Files',
                    rawContent: combinedText.substring(0, 5000) // Truncate if too long? Text is usually OK.
                }
            });

            // 4. Create Script (Templated)
            // @ts-ignore
            const savedScript = await this.prisma.script.create({
                data: {
                    courseId: course.id,
                    scenes: [], // Templated scripts store data in templateData
                    originalScenes: [],
                    status: 'DRAFT',
                    isTemplated: true,
                    templateId: templateId,
                    templateData: templateData
                }
            });
            
             console.log('Generated & Saved Templated Script:', savedScript.id);

            return {
                id: savedScript.id,
                type: 'SCRIPT', // Signals frontend to use /editor/:id
                templateId,
                templateData
            };

        } else {
            // --- EXISTING (FROM SCRATCH) FLOW ---
            
            const scriptJson = await this.scriptGeneratorService.generateScriptWithTechnicalSheet(combinedText, {
                teacherName,
                teacherRole,
                teacherSpecialty,
                instructionalDesigner,
                tone,
                style,
                studentProfile,
                courseName: courseName || title 
            });
    
            // Persist to DB (Legacy SynthesiaVideoScript)
            // @ts-ignore
            const savedScript = await this.prisma.synthesiaVideoScript.create({
                data: {
                    title: scriptJson.title || title || 'Untitled Script',
                    scenes: scriptJson.input,
                    sourceContentId: sourceContent.id
                }
            });
    
            console.log('Generated & Saved Script from Files (Scratch):', savedScript.id);
    
            return {
                id: savedScript.id,
                type: 'SYNTHESIA_VIDEO_SCRIPT', // Signals frontend to show raw JSON or use legacy view
                sourceContent: sourceContent,
                ...scriptJson
            };
        }
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

        const regeneratedScene = await this.scriptGeneratorService.regenerateScene(
            sourceContentText,
            allScenes,
            targetSceneIndex,
            currentSceneData,
            userFeedback
        );

        return regeneratedScene;
    }

    @Get('avatars')
    async getAvatars() {
        return this.synthesiaService.getAvatars();
    }

    @Get('voices')
    async getVoices() {
        return this.synthesiaService.getVoices();
    }

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
        @Body() body: any 
    ) {
        // Default to Synthesia
        return this.synthesiaService.generateVideo(scriptId, body as CreateSynthesiaVideoDto);
    }

    @Get('status/:videoId')
    async checkStatus(@Param('videoId') videoId: string) {
        // Only check Synthesia
        try {
            return await this.synthesiaService.checkStatus(videoId);
        } catch (e) {
            throw new NotFoundException('Video not found');
        }
    }

    @Get(':videoId/redirect')
    async redirectVideo(@Param('videoId') videoId: string, @Res() res: Response) {
        let downloadUrl: string | undefined;

        try {
            const status = await this.synthesiaService.checkStatus(videoId);
            downloadUrl = status.downloadUrl;
        } catch (e) {
            return res.status(404).send('Video not found');
        }

        if (downloadUrl) {
            return res.redirect(downloadUrl);
        } else {
            return res.status(404).send('Video not ready or not found');
        }
    }
}
