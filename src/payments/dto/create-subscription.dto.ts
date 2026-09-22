import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateSubscriptionDto {
  @IsMongoId()
  @IsNotEmpty()
  feeId: string;
}
