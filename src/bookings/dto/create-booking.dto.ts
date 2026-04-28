import { BookingStatus } from '@prisma/client';
import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  customerId: string;

  @IsISO8601()
  startsAt: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
