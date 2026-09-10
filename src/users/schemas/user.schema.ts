import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    trim: true,
  })
  firstName: string;

  @Prop({
    required: true,
    trim: true,
  })
  lastName: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
  })
  password: string;

  @Prop({
    required: true,
    enum: UserRole,
  })
  role: UserRole;

  @Prop({
    default: true,
  })
  isActive: boolean;

  @Prop({
    default: 0,
  })
  tokenVersion: number;

  @Prop({
    type: String,
    default: null,
  })
  passwordResetToken?: string | null;

  @Prop({
    type: Date,
    default: null,
  })
  passwordResetExpires?: Date | null;

  @Prop({
    type: String,
    default: null,
  })
  profilePicture?: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
