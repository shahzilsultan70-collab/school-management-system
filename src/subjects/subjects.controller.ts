import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { SubjectsService } from './subjects.service';

import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { UserRole } from '../users/schemas/user.schema';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  // Create Subject
  @Post()
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }

  // Get all Subjects
  @Get()
  findAll() {
    return this.subjectsService.findAll();
  }

  // Get one Subject
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(+id);
  }

  // Update Subject
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectsService.update(+id, updateSubjectDto);
  }

  // Delete Subject
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(+id);
  }
}
