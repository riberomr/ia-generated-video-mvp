import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideosModule } from './videos/videos.module';
import { CoursesModule } from './courses/courses.module';
import { ScriptsModule } from './scripts/scripts.module';
import { SynthesiaAssetModule } from './assets/synthesia-asset.module';
import { PrismaService } from './database/prisma.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'], // Look in api root and monorepo root
        }),
        CoursesModule,
        ScriptsModule,
        SynthesiaAssetModule,
        VideosModule,
    ],
    controllers: [],
    providers: [PrismaService],
})
export class AppModule { }
