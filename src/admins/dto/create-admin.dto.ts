import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CreateAdminDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  designation: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}
