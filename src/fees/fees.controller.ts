import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { FeesService } from './fees.service';

import { CreateFeeDto } from './dto/create-fee.dto';
import { UpdateFeeDto } from './dto/update-fee.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('fees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createFeeDto: CreateFeeDto) {
    return this.feesService.create(createFeeDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.feesService.findAll();
  }

  @Get('student/:studentId')
  @Roles(UserRole.ADMIN)
  findByStudent(@Param('studentId') studentId: string) {
    return this.feesService.findByStudent(studentId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.feesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateFeeDto: UpdateFeeDto) {
    return this.feesService.update(id, updateFeeDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.feesService.remove(id);
  }
}
