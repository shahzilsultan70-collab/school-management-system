import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';

import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { UserRole } from '../users/schemas/user.schema';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  // Create Class
  @Post()
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  // Get all Classes
  @Get()
  findAll() {
    return this.classesService.findAll();
  }

  // Get one Class
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }
}
