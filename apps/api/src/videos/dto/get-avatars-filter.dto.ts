import { IsOptional, IsString } from 'class-validator';

export class GetAvatarsFilterDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    gender?: string;

    @IsOptional()
    @IsString()
    gaze?: string;

    @IsOptional()
    @IsString()
    subject?: string;

    @IsOptional()
    @IsString()
    shotZoom?: string;

    @IsOptional()
    @IsString()
    shotCamera?: string;
}
