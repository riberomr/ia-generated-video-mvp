import { Controller, Post, Get, Param, Body } from '@nestjs/common';
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
}
