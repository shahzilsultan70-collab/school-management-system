import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { RagService } from './rag.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/decorators/roles.decorator';

import { UserRole } from '../users/schemas/user.schema';

@Controller('rag')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RagController {
  constructor(private readonly ragService: RagService) {}

  // ============================================================
  // ADD TEXT DOCUMENT
  // ============================================================

  @Post('documents')
  addDocument(
    @Body()
    body: {
      content: string;
      title?: string;
      category?: string;
      role?: string;
      source?: string;
    },
  ) {
    return this.ragService.addDocumentChunks(body.content, {
      title: body.title,
      category: body.category || 'general',
      role: body.role || 'all',
      source: body.source,
    });
  }

  // ============================================================
  // UPLOAD PDF
  // ============================================================

  @Post('documents/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadPdf(
    @UploadedFile()
    file: Express.Multer.File,

    @Body()
    body: {
      title?: string;
      category?: string;
      role?: string;
      source?: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required.');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed.');
    }

    return this.ragService.addPdfDocument(file.buffer, {
      title: body.title || file.originalname,

      category: body.category || 'pdf',

      role: body.role || 'all',

      source: body.source || file.originalname,
    });
  }

  // ============================================================
  // QDRANT INFO
  // ============================================================

  @Get('info')
  getInfo() {
    return this.ragService.getCollectionInfo();
  }
}
