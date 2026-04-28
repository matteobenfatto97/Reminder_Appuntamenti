import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.notificationLog.findMany({
      include: { customer: true, booking: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const notification = await this.prisma.notificationLog.findUnique({
      where: { id },
      include: { customer: true, booking: true },
    });
    if (!notification) throw new NotFoundException('Notification log not found');
    return notification;
  }

  async upsertPending(input: { bookingId: string; customerId: string; channel: NotificationChannel }) {
    const existing = await this.prisma.notificationLog.findUnique({
      where: { bookingId_channel: { bookingId: input.bookingId, channel: input.channel } },
    });

    if (existing?.status === NotificationStatus.SENT) return existing;

    return this.prisma.notificationLog.upsert({
      where: { bookingId_channel: { bookingId: input.bookingId, channel: input.channel } },
      create: { ...input, status: NotificationStatus.PENDING },
      update: {
        status: NotificationStatus.PENDING,
        errorMessage: null,
      },
    });
  }

  markSent(id: string, providerMessageId?: string) {
    return this.prisma.notificationLog.update({
      where: { id },
      data: {
        status: NotificationStatus.SENT,
        providerMessageId,
        errorMessage: null,
        sentAt: new Date(),
      },
    });
  }

  markFailed(id: string, errorMessage: string) {
    return this.prisma.notificationLog.update({
      where: { id },
      data: {
        status: NotificationStatus.FAILED,
        errorMessage,
      },
    });
  }

  markSkipped(id: string, errorMessage: string) {
    return this.prisma.notificationLog.update({
      where: { id },
      data: {
        status: NotificationStatus.SKIPPED,
        errorMessage,
      },
    });
  }

  async updateFromTwilioStatus(providerMessageId: string, providerStatus: string) {
    const status = ['failed', 'undelivered'].includes(providerStatus.toLowerCase())
      ? NotificationStatus.FAILED
      : ['sent', 'delivered', 'read'].includes(providerStatus.toLowerCase())
        ? NotificationStatus.SENT
        : undefined;

    if (!status) return null;

    return this.prisma.notificationLog.updateMany({
      where: { providerMessageId },
      data: {
        status,
        sentAt: status === NotificationStatus.SENT ? new Date() : undefined,
        errorMessage: status === NotificationStatus.FAILED ? `Twilio status: ${providerStatus}` : null,
      },
    });
  }
}
