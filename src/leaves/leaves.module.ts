import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';

import { Leave, LeaveSchema } from './schemas/leave.schema';

import { Student, StudentSchema } from '../students/schemas/student.schema';

import { Teacher, TeacherSchema } from '../teachers/schemas/teacher.schema';

import { User, UserSchema } from '../users/schemas/user.schema';

import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Leave.name,
        schema: LeaveSchema,
      },
      {
        name: Student.name,
        schema: StudentSchema,
      },
      {
        name: Teacher.name,
        schema: TeacherSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),

    EmailModule,
  ],

  controllers: [LeavesController],

  providers: [LeavesService],

  exports: [LeavesService],
})
export class LeavesModule {}
