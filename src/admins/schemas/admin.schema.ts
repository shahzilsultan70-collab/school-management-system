import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Admin {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    trim: true,
  })
  phone: string;

  @Prop({
    required: true,
    trim: true,
  })
  designation: string;

  @Prop({
    required: true,
    trim: true,
  })
  address: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
