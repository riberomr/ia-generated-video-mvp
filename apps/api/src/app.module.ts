import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideosModule } from './videos/videos.module';
import { AiScriptsModule } from './ai-scripts/ai-scripts.module';
import { PrismaService } from './database/prisma.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'], // Look in api root and monorepo root
        }),
        AiScriptsModule,
        VideosModule,
    ],
    controllers: [],
    providers: [PrismaService],
})
export class AppModule { }
