import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';

import { Teacher, TeacherSchema } from './schemas/teacher.schema';

import { User, UserSchema } from '../users/schemas/user.schema';

import { Counter, CounterSchema } from '../students/schemas/counter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Teacher.name,
        schema: TeacherSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Counter.name,
        schema: CounterSchema,
      },
    ]),
  ],

  controllers: [TeachersController],

  providers: [TeachersService],

  exports: [TeachersService],
})
export class TeachersModule {}
