import { IsEnum, IsNotEmpty } from 'class-validator';

import { StudentDocumentType } from '../schemas/student-document.schema';

export class UploadStudentDocumentDto {
  @IsNotEmpty()
  @IsEnum(StudentDocumentType, {
    message: 'Invalid document type',
  })
  documentType: StudentDocumentType;
}
