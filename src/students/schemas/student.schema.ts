import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import mongoose from 'mongoose';

@Schema({
  timestamps: true,
})
export class Student {
  // ==========================================
  // USER
  // ==========================================

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId: mongoose.Types.ObjectId;

  // ==========================================
  // STUDENT ID
  // AUTOMATICALLY GENERATED
  // ==========================================

  @Prop({
    required: true,
    unique: true,
    trim: true,
    index: true,
  })
  studentId: string;

  // ==========================================
  // ROLL NUMBER
  // ==========================================

  @Prop({
    required: true,
    trim: true,
  })
  rollNumber: string;

  // ==========================================
  // CLASS
  // ==========================================

  @Prop({
    required: true,
    trim: true,
  })
  className: string;

  // ==========================================
  // SECTION
  // ==========================================

  @Prop({
    required: true,
    trim: true,
  })
  section: string;

  // ==========================================
  // ACTIVE STATUS
  // ==========================================

  @Prop({
    default: true,
    index: true,
  })
  isActive: boolean;
}

export const StudentSchema = SchemaFactory.createForClass(Student);
