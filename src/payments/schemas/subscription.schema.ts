import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SubscriptionDocument = HydratedDocument<Subscription>;

export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  UNPAID = 'unpaid',
  PAUSED = 'paused',
}

@Schema({ timestamps: true })
export class Subscription {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  studentId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Fee',
    required: true,
    index: true,
  })
  feeId: Types.ObjectId;

  @Prop({
    type: String,
    default: null,
    unique: true,
    sparse: true,
    index: true,
  })
  stripeSubscriptionId: string | null;

  @Prop({
    type: String,
    default: null,
    unique: true,
    sparse: true,
    index: true,
  })
  stripeCheckoutSessionId: string | null;

  @Prop({
    type: String,
    default: null,
    index: true,
  })
  stripeCustomerId: string | null;

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
    enum: Object.values(SubscriptionStatus),
    default: SubscriptionStatus.PENDING,
    index: true,
  })
  status: SubscriptionStatus;

  @Prop({
    type: Boolean,
    default: false,
  })
  cancelAtPeriodEnd: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  currentPeriodEnd: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  canceledAt: Date | null;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
