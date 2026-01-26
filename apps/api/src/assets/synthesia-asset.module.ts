import { Module } from '@nestjs/common';
import { SynthesiaAssetService } from './synthesia-asset.service';
import { SynthesiaAssetController } from './synthesia-asset.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
    controllers: [SynthesiaAssetController],
    providers: [SynthesiaAssetService, PrismaService],
})
export class SynthesiaAssetModule { }
