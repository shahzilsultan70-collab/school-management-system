import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument, Types } from 'mongoose';

export type LeaveDocument = HydratedDocument<Leave>;

export enum LeaveType {
  SICK = 'sick',
  CASUAL = 'casual',
  EMERGENCY = 'emergency',
  FAMILY = 'family',
  OTHER = 'other',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({
  timestamps: true,
})
export class Leave {
  // ==========================================
  // REQUESTING USER
  // ==========================================

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId;

  // ==========================================
  // STUDENT
  // ==========================================

  @Prop({
    type: Types.ObjectId,
    ref: 'Student',
    default: null,
  })
  studentId?: Types.ObjectId | null;

  // ==========================================
  // TEACHER
  // ==========================================

  @Prop({
    type: Types.ObjectId,
    ref: 'Teacher',
    default: null,
  })
  teacherId?: Types.ObjectId | null;

  // ==========================================
  // LEAVE TYPE
  // ==========================================

  @Prop({
    required: true,
    enum: LeaveType,
  })
  leaveType: LeaveType;

  // ==========================================
  // START DATE
  // ==========================================

  @Prop({
    required: true,
    type: Date,
  })
  startDate: Date;

  // ==========================================
  // END DATE
  // ==========================================

  @Prop({
    required: true,
    type: Date,
  })
  endDate: Date;

  // ==========================================
  // REASON
  // ==========================================

  @Prop({
    required: true,
    trim: true,
  })
  reason: string;

  // ==========================================
  // STATUS
  // ==========================================

  @Prop({
    required: true,
    enum: LeaveStatus,
    default: LeaveStatus.PENDING,
  })
  status: LeaveStatus;

  // ==========================================
  // REJECTION REASON
  // ==========================================

  @Prop({
    type: String,
    default: null,
  })
  rejectionReason?: string | null;

  // ==========================================
  // REVIEWED BY
  // ==========================================

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    default: null,
  })
  reviewedBy?: Types.ObjectId | null;

  // ==========================================
  // REVIEWED AT
  // ==========================================

  @Prop({
    type: Date,
    default: null,
  })
  reviewedAt?: Date | null;
}

export const LeaveSchema = SchemaFactory.createForClass(Leave);
