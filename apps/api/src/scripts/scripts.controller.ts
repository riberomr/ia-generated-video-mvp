import { Controller, Post, Body, InternalServerErrorException, Logger } from '@nestjs/common';
import { ScriptsService } from './scripts.service';
import { AnalyzeScriptDto, CreateScriptDto } from '@eduvideogen/shared-types';

@Controller('scripts')
export class ScriptsController {
    private readonly logger = new Logger(ScriptsController.name);

    constructor(private readonly scriptsService: ScriptsService) { }

    @Post('analyze-and-map')
    async analyzeAndMap(@Body() dto: AnalyzeScriptDto) {
        this.logger.log(`Analyzing script for template ${dto.templateId} on topic: ${dto.topic}`);
        try {
            return await this.scriptsService.analyzeAndMapScript(dto);
        } catch (error) {
            this.logger.error(`Error analyzing script`, error);
            throw new InternalServerErrorException('Failed to analyze script');
        }
    }
    @Post()
    async createScript(@Body() dto: CreateScriptDto) {
        return this.scriptsService.createScript(dto);
    }
}
