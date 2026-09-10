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

import { TeachersService } from './teachers.service';

import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { UserRole } from '../users/schemas/user.schema';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  // Create Teacher
  @Post()
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  // Get all Teachers
  @Get()
  findAll() {
    return this.teachersService.findAll();
  }

  // Get one Teacher
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  // Update Teacher
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  // Delete Teacher
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }

  // Activate Teacher
  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.teachersService.activate(id);
  }

  // Deactivate Teacher
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.teachersService.deactivate(id);
  }
}
