import { Body, Controller, Post, Get, Patch, Param } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateScriptDto } from '@eduvideogen/shared-types';
import { Prisma } from '@eduvideogen/database';

@Controller('courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) { }

    @Post('generate-script')
    async generateScript(@Body() dto: CreateCourseDto) {
        return this.coursesService.generateScript(dto);
    }

    @Get('scripts/:id')
    async getScript(@Param('id') id: string) {
        return this.coursesService.getScript(id);
    }

    @Patch('scripts/:id')
    async updateScript(@Param('id') id: string, @Body() dto: UpdateScriptDto) {
        return this.coursesService.updateScript(id, dto);
    }

    @Get()
    async findAll(): Promise<Prisma.CourseGetPayload<{
        include: {
            scripts: {
                include: {
                    videos: true
                }
            }
        }
    }>[]> {
        return this.coursesService.findAll();
    }
}
