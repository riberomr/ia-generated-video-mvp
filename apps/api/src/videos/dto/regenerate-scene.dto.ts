import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { SceneConfigDto } from './generate-script.dto';

export class RegenerateSceneDto {
    @IsString()
    @IsNotEmpty()
    sourceContentText: string;

    @IsArray()
    @ValidateNested({ each: true })
    allScenes: any[];

    @IsNumber()
    @IsNotEmpty()
    targetSceneIndex: number;

    @IsObject()
    currentSceneData: any;

    @IsString()
    @IsOptional()
    userFeedback?: string;
}
