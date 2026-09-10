import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StudentDocumentDocument = HydratedDocument<StudentDocument>;

export enum StudentDocumentType {
  BIRTH_CERTIFICATE = 'birth_certificate',
  PREVIOUS_SCHOOL_CERTIFICATE = 'previous_school_certificate',
  STUDENT_ID = 'student_id',
  PARENT_GUARDIAN_DOCUMENT = 'parent_guardian_document',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class StudentDocument {
  // ==========================================
  // STUDENT
  // ==========================================

  @Prop({
    type: Types.ObjectId,
    ref: 'Student',
    required: true,
  })
  studentId: Types.ObjectId;

  // ==========================================
  // DOCUMENT TYPE
  // ==========================================

  @Prop({
    required: true,
    enum: StudentDocumentType,
  })
  documentType: StudentDocumentType;

  // ==========================================
  // ORIGINAL FILE NAME
  // ==========================================

  @Prop({
    required: true,
  })
  fileName: string;

  // ==========================================
  // STORED FILE NAME
  // ==========================================

  @Prop({
    required: true,
  })
  storedFileName: string;

  // ==========================================
  // FILE PATH
  // ==========================================

  @Prop({
    required: true,
  })
  filePath: string;

  // ==========================================
  // MIME TYPE
  // ==========================================

  @Prop({
    required: true,
  })
  mimeType: string;

  // ==========================================
  // FILE SIZE
  // ==========================================

  @Prop({
    required: true,
  })
  fileSize: number;
}

export const StudentDocumentSchema =
  SchemaFactory.createForClass(StudentDocument);
