import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { ClassesModule } from './classes/classes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { AdminsModule } from './admins/admins.module';
import { AuthModule } from './auth/auth.module';
import { LeavesModule } from './leaves/leaves.module';
import { EmailModule } from './email/email.module';
import { FeesModule } from './fees/fees.module';
import { AiModule } from './ai/ai.module';
import { RagModule } from './rag/rag.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    // Load .env globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // MongoDB
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_management',
    ),

    // Application modules
    UsersModule,
    StudentsModule,
    TeachersModule,
    ClassesModule,
    SubjectsModule,
    AdminsModule,
    AuthModule,
    LeavesModule,
    EmailModule,
    FeesModule,
    AiModule,
    RagModule,
    PaymentsModule,
  ],
})
export class AppModule {}
