import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class SceneConfigDto {
    @IsString()
    @IsNotEmpty()
    topic: string;

    @IsNumber()
    @IsOptional()
    duration?: number; // Default 10s

    @IsString()
    @IsOptional()
    emotion?: string; // Default 'neutral'

    @IsString()
    @IsOptional()
    visual_context?: string;

    @IsEnum(['hook', 'educational', 'call_to_action', 'transition', 'joke'])
    @IsOptional()
    objective?: 'hook' | 'educational' | 'call_to_action' | 'transition' | 'joke';

    @IsEnum(['child', 'general', 'technical', 'academic'])
    @IsOptional()
    complexity?: 'child' | 'general' | 'technical' | 'academic';

    @IsEnum(['first_person', 'second_person', 'third_person'])
    @IsOptional()
    pov?: 'first_person' | 'second_person' | 'third_person';

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    keywords?: string[];
}

export class GenerateScriptDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    sourceText: string;

    @IsNumber()
    @IsNotEmpty()
    sceneCount: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SceneConfigDto)
    scenes: SceneConfigDto[];
}
