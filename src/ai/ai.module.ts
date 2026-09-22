import { Module } from '@nestjs/common';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiActionService } from './actions/ai-action.service';

import { StudentsModule } from '../students/students.module';
import { TeachersModule } from '../teachers/teachers.module';
import { FeesModule } from '../fees/fees.module';
import { LeavesModule } from '../leaves/leaves.module';
import { AdminsModule } from '../admins/admins.module';
import { ClassesModule } from '../classes/classes.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    StudentsModule,
    TeachersModule,
    FeesModule,
    LeavesModule,
    AdminsModule,
    ClassesModule,
    SubjectsModule,
    RagModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiActionService],
})
export class AiModule {}
