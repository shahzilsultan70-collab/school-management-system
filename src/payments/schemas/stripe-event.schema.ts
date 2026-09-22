import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StripeEventDocument = HydratedDocument<StripeEvent>;

@Schema({ timestamps: true })
export class StripeEvent {
  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
  })
  eventId: string;

  @Prop({
    type: String,
    required: true,
  })
  type: string;
}

export const StripeEventSchema = SchemaFactory.createForClass(StripeEvent);
