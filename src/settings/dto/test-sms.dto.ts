import { IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class TestSmsDto {
  @IsPhoneNumber()
  phoneNumber: string;

  @IsString()
  @MinLength(3)
  message: string;
}