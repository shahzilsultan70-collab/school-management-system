import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTeacherDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  qualification: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
