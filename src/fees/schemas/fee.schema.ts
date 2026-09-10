import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FeeDocument = HydratedDocument<Fee>;

export enum FeeType {
  TUITION = 'tuition',
  ADMISSION = 'admission',
  EXAM = 'exam',
  TRANSPORT = 'transport',
  OTHER = 'other',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK = 'bank',
  ONLINE = 'online',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Fee {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  studentId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(FeeType),
    required: true,
  })
  feeType: FeeType;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  academicSession: string;

  @Prop({
    type: String,
    trim: true,
    default: null,
  })
  month: string | null;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  totalAmount: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  paidAmount: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  remainingAmount: number;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Prop({
    type: Date,
    required: true,
  })
  dueDate: Date;

  @Prop({
    type: Date,
    default: null,
  })
  paymentDate: Date | null;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    default: null,
  })
  paymentMethod: PaymentMethod | null;

  @Prop({
    type: String,
    trim: true,
    default: null,
  })
  notes: string | null;
}

export const FeeSchema = SchemaFactory.createForClass(Fee);
