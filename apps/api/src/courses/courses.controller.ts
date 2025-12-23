import { Body, Controller, Post, Get } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from '@eduvideogen/shared-types';
import { Prisma } from '@eduvideogen/database';

@Controller('courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) { }

    @Post('generate-script')
    async generateScript(@Body() dto: CreateCourseDto) {
        return this.coursesService.generateScript(dto);
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
