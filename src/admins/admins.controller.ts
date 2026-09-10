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

import { AdminsService } from './admins.service';

import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { UserRole } from '../users/schemas/user.schema';

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  // Create Admin
  @Post()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminsService.create(createAdminDto);
  }

  // Get all Admins
  @Get()
  findAll() {
    return this.adminsService.findAll();
  }

  // Get one Admin
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminsService.findOne(id);
  }

  // Update Admin
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminsService.update(id, updateAdminDto);
  }

  // Delete Admin
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminsService.remove(id);
  }
}
