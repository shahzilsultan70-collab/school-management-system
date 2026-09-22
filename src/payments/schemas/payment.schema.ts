import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

export enum PaymentType {
  ONE_TIME = 'one_time',
  SUBSCRIPTION = 'subscription',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  studentId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Fee',
    required: true,
  })
  feeId: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  amount: number;

  @Prop({
    type: String,
    default: 'usd',
    lowercase: true,
    trim: true,
  })
  currency: string;

  @Prop({
    type: String,
    enum: Object.values(PaymentType),
    required: true,
  })
  paymentType: PaymentType;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  /*
  |--------------------------------------------------------------------------
  | Stripe IDs
  |--------------------------------------------------------------------------
  */

  @Prop({
    type: String,
    default: null,
    index: true,
  })
  stripeCustomerId: string | null;

  @Prop({
    type: String,
    default: null,
    index: true,
  })
  stripeCheckoutSessionId: string | null;

  @Prop({
    type: String,
    default: null,
    index: true,
  })
  stripePaymentIntentId: string | null;

  @Prop({
    type: String,
    default: null,
    index: true,
  })
  stripeSubscriptionId: string | null;

  @Prop({
    type: String,
    default: null,
    index: true,
  })
  stripeInvoiceId: string | null;

  /*
  |--------------------------------------------------------------------------
  | Refund
  |--------------------------------------------------------------------------
  */

  @Prop({
    type: String,
    default: null,
    index: true,
  })
  stripeRefundId: string | null;

  @Prop({
    type: Number,
    default: null,
    min: 0,
  })
  refundAmount: number | null;

  @Prop({
    type: Date,
    default: null,
  })
  refundedAt: Date | null;

  /*
  |--------------------------------------------------------------------------
  | Receipt
  |--------------------------------------------------------------------------
  */

  @Prop({
    type: String,
    default: null,
    unique: true,
    sparse: true,
  })
  receiptNumber: string | null;

  /*
  |--------------------------------------------------------------------------
  | Payment timestamps
  |--------------------------------------------------------------------------
  */

  @Prop({
    type: Date,
    default: null,
  })
  paidAt: Date | null;

  /*
  |--------------------------------------------------------------------------
  | Failure information
  |--------------------------------------------------------------------------
  */

  @Prop({
    type: String,
    default: null,
  })
  failureReason: string | null;

  @Prop({
    type: String,
    default: null,
  })
  failureCode: string | null;

  @Prop({
    type: String,
    default: null,
  })
  failureMessage: string | null;

  /*
  |--------------------------------------------------------------------------
  | Fee tracking
  |--------------------------------------------------------------------------
  |
  | true  = this payment increases the Fee.paidAmount
  | false = recurring subscription renewal only
  |
  */

  @Prop({
    type: Boolean,
    default: true,
  })
  feeApplied: boolean;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
