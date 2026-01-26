import { Controller, Post, Get, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SynthesiaAssetService } from './synthesia-asset.service';

@Controller('assets')
export class SynthesiaAssetController {
    constructor(private readonly service: SynthesiaAssetService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
                ],
            }),
        ) file: Express.Multer.File
    ) {
        return this.service.uploadAsset(file);
    }

    @Get()
    async findAll() {
        return this.service.findAll();
    }
    @Get(':id/check')
    async checkStatus(@Param('id') id: string) {
        return this.service.checkAssetStatus(id);
    }
}
