import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: dto });
  }

  findAll() {
    return this.prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customer.delete({ where: { id } });
  }

  async linkTelegramChat(input: { customerId?: string; phoneNumber?: string; telegramChatId: string }) {
    const where: Prisma.CustomerWhereUniqueInput | undefined = input.customerId
      ? { id: input.customerId }
      : input.phoneNumber
        ? { phoneNumber: input.phoneNumber }
        : undefined;

    if (!where) return null;

    try {
      return await this.prisma.customer.update({
        where,
        data: { telegramChatId: input.telegramChatId },
      });
    } catch {
      return null;
    }
  }
}
