import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateSynthesiaVideoDto {
    @IsString()
    @IsOptional()
    scriptText?: string;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    test?: boolean;

    // Basic Mode
    @IsString()
    @IsOptional()
    avatarId?: string;

    @IsString()
    @IsOptional()
    voiceId?: string;

    @IsString()
    @IsOptional()
    background?: string;

    // Template Mode
    @IsString()
    @IsOptional()
    templateId?: string;

    @IsObject()
    @IsOptional()
    templateData?: Record<string, any>;
}
