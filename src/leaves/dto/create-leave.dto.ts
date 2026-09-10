import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { LeaveType } from '../schemas/leave.schema';

export class CreateLeaveDto {
  // ==========================================
  // LEAVE TYPE
  // ==========================================

  @IsEnum(LeaveType)
  leaveType: LeaveType;

  // ==========================================
  // START DATE
  // ==========================================

  @IsDateString()
  startDate: string;

  // ==========================================
  // END DATE
  // ==========================================

  @IsDateString()
  endDate: string;

  // ==========================================
  // REASON
  // ==========================================

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(1000)
  reason: string;
}
