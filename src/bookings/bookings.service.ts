import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookingDto) {
    try {
      return await this.prisma.booking.create({
        data: {
          customerId: dto.customerId,
          startsAt: new Date(dto.startsAt),
          status: dto.status,
          notes: dto.notes,
        },
        include: { customer: true },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
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

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async update(id: string, dto: UpdateBookingDto) {
    try {
      return await this.prisma.booking.update({
        where: { id },
        data: {
          customerId: dto.customerId,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          status: dto.status,
          notes: dto.notes,
        },
        include: { customer: true },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.booking.delete({
        where: { id },
        include: { customer: true },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Booking not found');
      }

      if (error.code === 'P2003') {
        throw new BadRequestException('Customer does not exist');
      }
    }

    throw error;
  }
}
