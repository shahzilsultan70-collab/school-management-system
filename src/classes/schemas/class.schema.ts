import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Class {
  @Prop({ required: true, unique: true })
  className: string;
}

export const ClassSchema = SchemaFactory.createForClass(Class);
