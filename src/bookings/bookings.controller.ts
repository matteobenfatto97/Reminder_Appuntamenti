import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RemindersService } from '../reminders/reminders.service';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly remindersService: RemindersService,
  ) {}

  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @Post('schedule-smart-reminders')
  scheduleSmartReminders() {
    return this.remindersService.scheduleSmartReminders();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.bookingsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }

  @Post(':id/schedule-smart-reminder')
  scheduleSmartReminder(@Param('id') id: string) {
    return this.remindersService.scheduleSmartReminderForBooking(id);
  }

  @Post(':id/send-reminder-now')
  sendReminderNow(@Param('id') id: string) {
    return this.remindersService.enqueueSingleReminder(id, true);
  }
}