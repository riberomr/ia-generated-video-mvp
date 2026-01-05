import { Controller, Post, Get, Param, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { HeyGenService } from './heygen.service';

@Controller('videos')
export class VideosController {
    constructor(private readonly heyGenService: HeyGenService) { }

    @Get('avatars')
    async getAvatars() {
        return this.heyGenService.getAvatars();
    }

    @Get('voices')
    async getVoices() {
        return this.heyGenService.getVoices();
    }

    @Get('voices/locales')
    async getVoicesLocales() {
        return this.heyGenService.getVoicesLocales();
    }

    @Post('generate/:scriptId')
    async generateVideo(
        @Param('scriptId') scriptId: string,
        @Body() body: { avatarId?: string; voiceId?: string }
    ) {
        return this.heyGenService.generateVideo(scriptId, body);
    }

    @Get('status/:videoId')
    async checkStatus(@Param('videoId') videoId: string) {
        return this.heyGenService.checkStatus(videoId);
    }

    @Get(':videoId/redirect')
    async redirectVideo(@Param('videoId') videoId: string, @Res() res: Response) {
        const { downloadUrl } = await this.heyGenService.checkStatus(videoId);
        if (downloadUrl) {
            return res.redirect(downloadUrl);
        } else {
            // Fallback if no URL found, maybe still processing or failed
            return res.status(404).send('Video not ready or not found');
        }
    }
}
