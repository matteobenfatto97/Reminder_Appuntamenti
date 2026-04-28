import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateBookingDto) {
    return this.prisma.booking.create({
      data: {
        customerId: dto.customerId,
        startsAt: new Date(dto.startsAt),
        status: dto.status,
        notes: dto.notes,
      },
      include: { customer: true },
    });
  }

  findAll() {
    return this.prisma.booking.findMany({
      include: { customer: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { customer: true, notificationLogs: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async update(id: string, dto: UpdateBookingDto) {
    await this.findOne(id);
    return this.prisma.booking.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        status: dto.status,
        notes: dto.notes,
      },
      include: { customer: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.booking.delete({ where: { id } });
  }
}
