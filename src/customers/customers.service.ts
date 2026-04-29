import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    try {
      return await this.prisma.customer.create({
        data: dto,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  findAll() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    try {
      return await this.prisma.customer.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.customer.delete({
        where: { id },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async linkTelegramChat(input: {
    customerId?: string;
    phoneNumber?: string;
    telegramChatId: string;
  }) {
    const where: Prisma.CustomerWhereUniqueInput | undefined = input.customerId
      ? { id: input.customerId }
      : input.phoneNumber
        ? { phoneNumber: input.phoneNumber }
        : undefined;

    if (!where) {
      return null;
    }

    try {
      return await this.prisma.customer.update({
        where,
        data: {
          telegramChatId: input.telegramChatId,
          preferredChannel: 'TELEGRAM',
          reminderOptIn: true,
        },
      });
    } catch {
      return null;
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target.join(', ')
          : String(error.meta?.target ?? 'campo unico');

        if (target.includes('phoneNumber')) {
          throw new ConflictException('Customer phone number already exists');
        }

        if (target.includes('email')) {
          throw new ConflictException('Customer email already exists');
        }

        throw new ConflictException(`Unique constraint failed on: ${target}`);
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Customer not found');
      }
    }

    throw error;
  }
}