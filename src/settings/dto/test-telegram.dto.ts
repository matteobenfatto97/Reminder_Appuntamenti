import { IsNotEmpty, IsString } from 'class-validator';

export class TestTelegramDto {
  @IsString()
  @IsNotEmpty()
  telegramChatId: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}