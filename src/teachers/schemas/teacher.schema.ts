import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Teacher {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true, unique: true })
  employeeId: string;

  @Prop({ required: true })
  qualification: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const TeacherSchema = SchemaFactory.createForClass(Teacher);
