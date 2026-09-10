import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';

import { existsSync, mkdirSync } from 'fs';

import { extname, join } from 'path';

import { StudentsService } from './students.service';

import { CreateStudentDto } from './dto/create-student.dto';

import { UpdateStudentDto } from './dto/update-student.dto';

import { UploadStudentDocumentDto } from './dto/upload-student-document.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/decorators/roles.decorator';

import { UserRole } from '../users/schemas/user.schema';

const studentDocumentsPath = join(
  process.cwd(),
  'uploads',
  'students',
  'documents',
);

if (!existsSync(studentDocumentsPath)) {
  mkdirSync(studentDocumentsPath, {
    recursive: true,
  });
}

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // ==========================================
  // CREATE STUDENT
  // ==========================================

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @Body()
    createStudentDto: CreateStudentDto,
  ) {
    return this.studentsService.create(createStudentDto);
  }

  // ==========================================
  // GET ALL STUDENTS
  // ==========================================

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findAll() {
    return this.studentsService.findAll();
  }

  // ==========================================
  // GET ONE STUDENT
  // ==========================================

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.studentsService.findOne(id);
  }

  // ==========================================
  // UPDATE STUDENT
  // ==========================================

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id')
    id: string,

    @Body()
    updateData: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, updateData);
  }

  // ==========================================
  // DELETE STUDENT
  // ==========================================

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('id')
    id: string,
  ) {
    return this.studentsService.remove(id);
  }

  // ==========================================
  // ACTIVATE STUDENT
  // ==========================================

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  activate(
    @Param('id')
    id: string,
  ) {
    return this.studentsService.activate(id);
  }

  // ==========================================
  // DEACTIVATE STUDENT
  // ==========================================

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  deactivate(
    @Param('id')
    id: string,
  ) {
    return this.studentsService.deactivate(id);
  }

  // ==========================================
  // UPLOAD STUDENT DOCUMENT
  // ==========================================

  @Post(':id/documents')
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: studentDocumentsPath,

        filename: (req, file, callback) => {
          const uniqueName = `${Date.now()}-${Math.round(
            Math.random() * 1e9,
          )}${extname(file.originalname)}`;

          callback(null, uniqueName);
        },
      }),

      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'application/pdf',

          'image/jpeg',
          'image/png',
          'image/webp',

          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',

          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

          'application/zip',
        ];

        const allowedExtensions = [
          '.pdf',

          '.jpg',
          '.jpeg',
          '.png',
          '.webp',

          '.doc',
          '.docx',

          '.ppt',
          '.pptx',

          '.xls',
          '.xlsx',

          '.zip',
        ];

        const fileExtension = extname(file.originalname).toLowerCase();

        const validMimeType = allowedMimeTypes.includes(file.mimetype);

        const validExtension = allowedExtensions.includes(fileExtension);

        if (validMimeType || validExtension) {
          callback(null, true);

          return;
        }

        callback(
          new BadRequestException(
            'Invalid document file type. Allowed files: PDF, JPG, JPEG, PNG, WEBP, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP',
          ),
          false,
        );
      },

      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadDocument(
    @Param('id')
    studentId: string,

    @Body()
    uploadDto: UploadStudentDocumentDto,

    @UploadedFile()
    file: Express.Multer.File,

    @Req()
    req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Please upload a document file');
    }

    return this.studentsService.uploadDocument(
      studentId,
      uploadDto.documentType,
      file,
      req.user,
    );
  }

  // ==========================================
  // GET ALL STUDENT DOCUMENTS
  // ==========================================

  @Get(':id/documents')
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  findStudentDocuments(
    @Param('id')
    studentId: string,

    @Req()
    req: any,
  ) {
    return this.studentsService.findStudentDocuments(studentId, req.user);
  }

  // ==========================================
  // GET ONE STUDENT DOCUMENT
  // ==========================================

  @Get(':id/documents/:documentId')
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  findDocument(
    @Param('id')
    studentId: string,

    @Param('documentId')
    documentId: string,

    @Req()
    req: any,
  ) {
    return this.studentsService.findDocument(studentId, documentId, req.user);
  }

  // ==========================================
  // DELETE STUDENT DOCUMENT
  // ==========================================

  @Delete(':id/documents/:documentId')
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  deleteDocument(
    @Param('id')
    studentId: string,

    @Param('documentId')
    documentId: string,

    @Req()
    req: any,
  ) {
    return this.studentsService.deleteDocument(studentId, documentId, req.user);
  }
}
