import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { StudentsController } from './students.controller';

import { StudentsService } from './students.service';

import { Student, StudentSchema } from './schemas/student.schema';

import {
  StudentDocument,
  StudentDocumentSchema,
} from './schemas/student-document.schema';

import { Counter, CounterSchema } from './schemas/counter.schema';

import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      // ==========================================
      // STUDENT
      // ==========================================

      {
        name: Student.name,
        schema: StudentSchema,
      },

      // ==========================================
      // STUDENT DOCUMENT
      // ==========================================

      {
        name: StudentDocument.name,
        schema: StudentDocumentSchema,
      },

      // ==========================================
      // COUNTER
      // USED FOR AUTOMATIC STUDENT ID GENERATION
      // ==========================================

      {
        name: Counter.name,
        schema: CounterSchema,
      },

      // ==========================================
      // USER
      // USED TO CREATE LINKED STUDENT ACCOUNTS
      // ==========================================

      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],

  controllers: [StudentsController],

  providers: [StudentsService],

  exports: [StudentsService],
})
export class StudentsModule {}
