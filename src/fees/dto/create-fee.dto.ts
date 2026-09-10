import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { FeeType, PaymentMethod } from '../schemas/fee.schema';

export class CreateFeeDto {
  @IsMongoId()
  @IsNotEmpty()
  studentId: string;

  @IsEnum(FeeType)
  @IsNotEmpty()
  feeType: FeeType;

  @IsString()
  @IsNotEmpty()
  academicSession: string;

  @IsOptional()
  @IsString()
  month?: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}
