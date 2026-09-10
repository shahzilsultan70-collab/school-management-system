import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';

import { Teacher, TeacherSchema } from './schemas/teacher.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Teacher.name,
        schema: TeacherSchema,
      },
    ]),
  ],

  controllers: [TeachersController],

  providers: [TeachersService],
})
export class TeachersModule {}
