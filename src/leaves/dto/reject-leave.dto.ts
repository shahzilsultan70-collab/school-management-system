import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectLeaveDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  rejectionReason: string;
}
