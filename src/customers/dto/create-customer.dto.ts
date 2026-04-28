import { NotificationChannel } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { E164_PHONE_REGEX } from '../../common/constants';

export class CreateCustomerDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsString()
  @Matches(E164_PHONE_REGEX, { message: 'phoneNumber must be in E.164 format, e.g. +393331234567' })
  phoneNumber: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telegramChatId?: string;

  @IsEnum(NotificationChannel)
  preferredChannel: NotificationChannel;

  @IsBoolean()
  reminderOptIn: boolean;
}
