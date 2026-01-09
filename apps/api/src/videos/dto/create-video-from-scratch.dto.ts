import { Type } from 'class-transformer';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsEnum,
    IsArray,
    ValidateNested,
    IsNumber,
    Min,
    Max
} from 'class-validator';
import {
    SynthesiaVisibility,
    SynthesiaAspectRatio,
    SynthesiaSoundtrack
} from '@eduvideogen/shared-types';

export class CtaSettingsDto {
    @IsString()
    @IsNotEmpty()
    label: string;

    @IsString()
    @IsNotEmpty()
    url: string;
}

export class VideoSettingsDto {
    @IsString()
    @IsOptional()
    @IsEnum(['freeze', 'loop', 'slow_down'])
    shortBackgroundContentMatchMode?: 'freeze' | 'loop' | 'slow_down';

    @IsString()
    @IsOptional()
    @IsEnum(['trim', 'speed_up'])
    longBackgroundContentMatchMode?: 'trim' | 'speed_up';
}

export class BackgroundSettingsDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => VideoSettingsDto)
    videoSettings?: VideoSettingsDto;
}

export class AvatarSettingsDto {
    @IsString()
    @IsOptional()
    voice?: string;

    @IsString()
    @IsOptional()
    @IsEnum(['left', 'center', 'right'])
    horizontalAlign?: 'left' | 'center' | 'right';

    @IsNumber()
    @IsOptional()
    scale?: number;

    @IsString()
    @IsOptional()
    @IsEnum(['rectangular', 'circular'])
    style?: 'rectangular' | 'circular';

    @IsString()
    @IsOptional()
    backgroundColor?: string;

    @IsBoolean()
    @IsOptional()
    seamless?: boolean;
}

export class InputSceneDto {
    @IsString()
    @IsNotEmpty()
    scriptText: string;

    @IsString()
    @IsOptional()
    scriptAudio?: string;

    @IsString()
    @IsOptional()
    scriptLanguage?: string;

    @IsString()
    @IsNotEmpty()
    avatar: string;

    @IsString()
    @IsNotEmpty()
    background: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => AvatarSettingsDto)
    avatarSettings?: AvatarSettingsDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => BackgroundSettingsDto)
    backgroundSettings?: BackgroundSettingsDto;
}

export class CreateVideoFromScratchDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(SynthesiaVisibility)
    @IsNotEmpty()
    visibility: SynthesiaVisibility;

    @IsEnum(SynthesiaAspectRatio)
    @IsNotEmpty()
    aspectRatio: SynthesiaAspectRatio;

    @IsBoolean()
    @IsOptional()
    test?: boolean;

    @IsEnum(SynthesiaSoundtrack)
    @IsOptional()
    soundtrack?: SynthesiaSoundtrack;

    @IsString()
    @IsOptional()
    callbackId?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CtaSettingsDto)
    ctaSettings?: CtaSettingsDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InputSceneDto)
    input: InputSceneDto[];

    @IsString()
    @IsOptional()
    scriptId?: string;
}
