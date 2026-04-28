import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { BookingStatus, NotificationStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { CronJob } from 'cron';
import { DateUtilsService } from '../common/date-utils.service';
import { REMINDER_JOB_NAME, REMINDER_QUEUE } from '../common/constants';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReminderJobPayload } from './reminder.queue';

@Injectable()
export class RemindersService implements OnModuleInit {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly dateUtils: DateUtilsService,
    private readonly notificationsService: NotificationsService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectQueue(REMINDER_QUEUE) private readonly reminderQueue: Queue<ReminderJobPayload>,
  ) {}

  onModuleInit() {
    const cronExpression = this.config.get<string>('REMINDER_CRON', '0 8 * * *');
    const timezone = this.config.get<string>('APP_TIMEZONE', 'Europe/Rome');

    const job = new CronJob(cronExpression, () => {
      void this.scheduleTomorrowReminders();
    }, null, false, timezone);

    this.schedulerRegistry.addCronJob('daily-reminder-scheduler', job as any);
    job.start();
    this.logger.log(`Registered reminder cron job '${cronExpression}' in timezone ${timezone}`);
  }

  async scheduleTomorrowReminders() {
    const timezone = this.config.get<string>('APP_TIMEZONE', 'Europe/Rome');
    const { start, end } = this.dateUtils.getTomorrowRange(timezone);

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        startsAt: { gte: start, lt: end },
        reminderSentAt: null,
        customer: { is: { reminderOptIn: true } },
      },
      include: { customer: true },
    });

    const results: Array<unknown> = [];
    for (const booking of bookings) {
      results.push(await this.enqueueSingleReminder(booking.id, false));
    }

    this.logger.log(`Scheduled ${results.length} reminder job(s) for bookings between ${start.toISOString()} and ${end.toISOString()}`);
    return { scheduled: results.length, start, end, results };
  }

  async enqueueSingleReminder(bookingId: string, force = false) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, notificationLogs: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status !== BookingStatus.CONFIRMED) {
      return { bookingId, queued: false, reason: `Booking status is ${booking.status}` };
    }

    if (booking.reminderSentAt && !force) {
      return { bookingId, queued: false, reason: 'Reminder already sent' };
    }

    const customer = booking.customer;
    const log = await this.notificationsService.upsertPending({
      bookingId: booking.id,
      customerId: customer.id,
      channel: customer.preferredChannel,
    });

    if (log.status === NotificationStatus.SENT && !force) {
      return { bookingId, queued: false, reason: 'Notification already sent' };
    }

    if (!customer.reminderOptIn) {
      await this.notificationsService.markSkipped(log.id, 'Customer has not opted in for reminders');
      return { bookingId, queued: false, reason: 'Customer has not opted in for reminders' };
    }

    await this.reminderQueue.add(
      REMINDER_JOB_NAME,
      { bookingId: booking.id, force },
      {
      jobId: force ? `booking-${booking.id}-manual-${Date.now()}` : `booking-${booking.id}`,
      },
    );

    return { bookingId, queued: true, notificationLogId: log.id };
  }
}
