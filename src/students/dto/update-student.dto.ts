import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

// ==========================================
// USER UPDATE INFORMATION
// ==========================================

export class UpdateStudentUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string | null;
}

// ==========================================
// STUDENT UPDATE
// ==========================================

export class UpdateStudentDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateStudentUserDto)
  user?: UpdateStudentUserDto;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  rollNumber?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  className?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  section?: string;
}
