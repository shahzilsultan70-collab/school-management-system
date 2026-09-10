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
// USER INFORMATION
// ==========================================

export class CreateStudentUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  profilePicture?: string | null;
}

// ==========================================
// STUDENT CREATION
// ==========================================

export class CreateStudentDto {
  @ValidateNested()
  @Type(() => CreateStudentUserDto)
  user: CreateStudentUserDto;

  @IsString()
  @IsNotEmpty()
  rollNumber: string;

  @IsString()
  @IsNotEmpty()
  className: string;

  @IsString()
  @IsNotEmpty()
  section: string;
}
