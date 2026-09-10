import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { LeavesService } from './leaves.service';

import { CreateLeaveDto } from './dto/create-leave.dto';

import { RejectLeaveDto } from './dto/reject-leave.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/decorators/roles.decorator';

import { UserRole } from '../users/schemas/user.schema';

@Controller('leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  // ==========================================
  // SUBMIT LEAVE
  // ==========================================

  @Post()
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
  create(
    @Body()
    createLeaveDto: CreateLeaveDto,

    @Req()
    req: any,
  ) {
    return this.leavesService.create(createLeaveDto, req.user);
  }

  // ==========================================
  // MY LEAVE HISTORY
  // ==========================================

  @Get('my')
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
  findMyLeaves(
    @Req()
    req: any,
  ) {
    return this.leavesService.findMyLeaves(req.user);
  }

  // ==========================================
  // ALL LEAVES
  // ==========================================

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(
    @Req()
    req: any,
  ) {
    return this.leavesService.findAll(req.user);
  }

  // ==========================================
  // GET ONE LEAVE
  // ==========================================

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.TEACHER)
  findOne(
    @Param('id')
    id: string,

    @Req()
    req: any,
  ) {
    return this.leavesService.findOne(id, req.user);
  }

  // ==========================================
  // APPROVE LEAVE
  // ==========================================

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  approve(
    @Param('id')
    id: string,

    @Req()
    req: any,
  ) {
    return this.leavesService.approve(id, req.user);
  }

  // ==========================================
  // REJECT LEAVE
  // ==========================================

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)
  reject(
    @Param('id')
    id: string,

    @Body()
    rejectLeaveDto: RejectLeaveDto,

    @Req()
    req: any,
  ) {
    return this.leavesService.reject(id, rejectLeaveDto, req.user);
  }

  // ==========================================
  // CANCEL / DELETE LEAVE
  // ==========================================

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.STUDENT, UserRole.TEACHER)
  remove(
    @Param('id')
    id: string,

    @Req()
    req: any,
  ) {
    return this.leavesService.remove(id, req.user);
  }
}
