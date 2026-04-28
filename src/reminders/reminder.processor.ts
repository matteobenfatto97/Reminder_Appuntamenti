import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingStatus, NotificationChannel, NotificationStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { REMINDER_QUEUE } from '../common/constants';
import { NotificationDispatcherService } from '../notifications/providers/notification-dispatcher.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReminderJobPayload } from './reminder.queue';

@Injectable()
@Processor(REMINDER_QUEUE)
export class ReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly dispatcher: NotificationDispatcherService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<ReminderJobPayload>) {
    const { bookingId, force } = job.data;
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true },
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const initialLog = await this.notificationsService.upsertPending({
      bookingId: booking.id,
      customerId: booking.customerId,
      channel: booking.customer.preferredChannel,
    });

    if (booking.status !== BookingStatus.CONFIRMED) {
      await this.notificationsService.markSkipped(initialLog.id, `Booking status is ${booking.status}`);
      return { skipped: true, reason: `Booking status is ${booking.status}` };
    }

    if (!booking.customer.reminderOptIn) {
      await this.notificationsService.markSkipped(initialLog.id, 'Customer has not opted in for reminders');
      return { skipped: true, reason: 'Customer has not opted in for reminders' };
    }

    if (booking.reminderSentAt && !force) {
      await this.notificationsService.markSkipped(initialLog.id, 'Reminder already sent');
      return { skipped: true, reason: 'Reminder already sent' };
    }

    const channels = this.getChannelsToTry(booking.customer.preferredChannel);
    const errors: string[] = [];

    for (const channel of channels) {
      const log = await this.notificationsService.upsertPending({
        bookingId: booking.id,
        customerId: booking.customerId,
        channel,
      });

      if (log.status === NotificationStatus.SENT && !force) {
        await this.prisma.booking.update({ where: { id: booking.id }, data: { reminderSentAt: new Date() } });
        return { sent: true, channel, reusedExistingLog: true };
      }

      const result = await this.dispatcher.send(channel, {
        bookingId: booking.id,
        customerId: booking.customerId,
        fullName: booking.customer.fullName,
        phoneNumber: booking.customer.phoneNumber,
        telegramChatId: booking.customer.telegramChatId,
        startsAt: booking.startsAt,
      });

      if (result.success) {
        await this.notificationsService.markSent(log.id, result.providerMessageId);
        await this.prisma.booking.update({ where: { id: booking.id }, data: { reminderSentAt: new Date() } });
        this.logger.log(`Reminder sent for booking ${booking.id} via ${channel}`);
        return { sent: true, channel, providerMessageId: result.providerMessageId };
      }

      const error = `${channel}: ${result.errorMessage ?? 'Unknown provider error'}`;
      errors.push(error);
      await this.notificationsService.markFailed(log.id, error);
    }

    throw new Error(`All reminder channels failed for booking ${booking.id}. ${errors.join(' | ')}`);
  }

  private getChannelsToTry(preferred: NotificationChannel): NotificationChannel[] {
    const useFallback = this.config.get<string>('USE_FALLBACK_CHANNELS', 'true') === 'true';
    if (!useFallback) return [preferred];

    const fallbackOrder = [NotificationChannel.WHATSAPP, NotificationChannel.TELEGRAM, NotificationChannel.SMS];
    return [preferred, ...fallbackOrder.filter((channel) => channel !== preferred)];
  }
}
