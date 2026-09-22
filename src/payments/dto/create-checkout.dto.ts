import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateCheckoutDto {
  @IsMongoId()
  @IsNotEmpty()
  feeId: string;
}
