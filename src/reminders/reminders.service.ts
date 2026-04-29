import { InjectQueue } from '@nestjs/bullmq';
import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  BookingStatus,
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from '@prisma/client';
import { Queue } from 'bullmq';
import { CronJob } from 'cron';
import {
  DateUtilsService,
  SmartReminderTiming,
} from '../common/date-utils.service';
import { REMINDER_JOB_NAME, REMINDER_QUEUE } from '../common/constants';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReminderJobPayload } from './reminder.queue';

type BookingWithCustomer = Prisma.BookingGetPayload<{
  include: { customer: true };
}>;

type EnqueueReminderOptions = {
  jobId?: string;
  delayMs?: number;
  runAt?: Date;
};

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
    const cronExpression = this.config.get('REMINDER_CRON', '0 8 * * *');
    const timezone = this.config.get('APP_TIMEZONE', 'Europe/Rome');

    const job = new CronJob(
      cronExpression,
      () => {
        void this.scheduleSmartReminders();
      },
      null,
      false,
      timezone,
    );

    this.schedulerRegistry.addCronJob('smart-reminder-scheduler', job as any);
    job.start();

    this.logger.log(
      `Registered smart reminder cron job '${cronExpression}' in timezone ${timezone}`,
    );
  }

  async scheduleTomorrowReminders() {
    const timezone = this.config.get('APP_TIMEZONE', 'Europe/Rome');
    const { start, end } = this.dateUtils.getTomorrowRange(timezone);

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        startsAt: {
          gte: start,
          lt: end,
        },
        reminderSentAt: null,
        customer: {
          is: {
            reminderOptIn: true,
          },
        },
      },
      include: {
        customer: true,
      },
    });

    const results = [];

    for (const booking of bookings) {
      results.push(await this.enqueueSingleReminder(booking.id, false));
    }

    this.logger.log(
      `Scheduled ${results.length} reminder job(s) for bookings between ${start.toISOString()} and ${end.toISOString()}`,
    );

    return {
      scheduled: results.length,
      start,
      end,
      results,
    };
  }

  async scheduleSmartReminders() {
    const timezone = this.config.get('APP_TIMEZONE', 'Europe/Rome');
    const lookAheadDays = Number(
      this.config.get('SMART_REMINDER_LOOKAHEAD_DAYS', '30'),
    );
    const reminderHour = Number(this.config.get('SMART_REMINDER_HOUR', '8'));

    const { start, end } = this.dateUtils.getRangeFromNow(
      timezone,
      lookAheadDays,
    );

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        startsAt: {
          gte: start,
          lt: end,
        },
        reminderSentAt: null,
      },
      include: {
        customer: true,
      },
      orderBy: {
        startsAt: 'asc',
      },
    });

    const results = [];

    for (const booking of bookings) {
      results.push(
        await this.scheduleSmartReminderForLoadedBooking(
          booking,
          timezone,
          reminderHour,
        ),
      );
    }

    const queued = results.filter((result) => result.queued).length;
    const skipped = results.length - queued;

    this.logger.log(
      `Smart reminder planner scanned ${bookings.length} booking(s): ${queued} queued, ${skipped} skipped`,
    );

    return {
      mode: 'SMART_REMINDERS',
      timezone,
      lookAheadDays,
      reminderHour,
      scanned: bookings.length,
      queued,
      skipped,
      start,
      end,
      results,
    };
  }

  async scheduleSmartReminderForBooking(bookingId: string) {
    const timezone = this.config.get('APP_TIMEZONE', 'Europe/Rome');
    const reminderHour = Number(this.config.get('SMART_REMINDER_HOUR', '8'));

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.scheduleSmartReminderForLoadedBooking(
      booking,
      timezone,
      reminderHour,
    );
  }

  async enqueueSingleReminder(
    bookingId: string,
    force = false,
    options: EnqueueReminderOptions = {},
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        notificationLogs: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.status !== BookingStatus.CONFIRMED) {
      return {
        bookingId,
        queued: false,
        reason: `Booking status is ${booking.status}`,
      };
    }

    if (booking.reminderSentAt && !force) {
      return {
        bookingId,
        queued: false,
        reason: 'Reminder already sent',
      };
    }

    const customer = booking.customer;

    const log = await this.notificationsService.upsertPending({
      bookingId: booking.id,
      customerId: customer.id,
      channel: customer.preferredChannel,
    });

    if (log.status === NotificationStatus.SENT && !force) {
      return {
        bookingId,
        queued: false,
        reason: 'Notification already sent',
      };
    }

    if (!customer.reminderOptIn) {
      await this.notificationsService.markSkipped(
        log.id,
        'Customer has not opted in for reminders',
      );

      return {
        bookingId,
        queued: false,
        reason: 'Customer has not opted in for reminders',
      };
    }

    const preferredChannelWarning = this.getPreferredChannelWarning(
      customer.preferredChannel,
      customer.telegramChatId,
    );

    if (preferredChannelWarning && !this.useFallbackChannels()) {
      await this.notificationsService.markSkipped(log.id, preferredChannelWarning);

      return {
        bookingId,
        queued: false,
        reason: preferredChannelWarning,
      };
    }

    const jobId =
      options.jobId ??
      (force
        ? `booking-${booking.id}-manual-${Date.now()}`
        : `booking-${booking.id}`);

    const delayMs = Math.max(0, Math.floor(options.delayMs ?? 0));

    if (!force) {
      await this.removeExistingJob(jobId);
    }

    await this.reminderQueue.add(
      REMINDER_JOB_NAME,
      {
        bookingId: booking.id,
        force,
        scheduledFor: options.runAt?.toISOString(),
      },
      {
        jobId,
        delay: delayMs,
      },
    );

    return {
      bookingId,
      queued: true,
      notificationLogId: log.id,
      jobId,
      delayMs,
      runAt: options.runAt?.toISOString() ?? new Date().toISOString(),
      warning: preferredChannelWarning ?? null,
    };
  }

  private async scheduleSmartReminderForLoadedBooking(
    booking: BookingWithCustomer,
    timezone: string,
    reminderHour: number,
  ) {
    const timing = this.dateUtils.getSmartReminderTiming(
      booking.startsAt,
      timezone,
    );

    if (timing === 'PAST') {
      const log = await this.notificationsService.upsertPending({
        bookingId: booking.id,
        customerId: booking.customerId,
        channel: booking.customer.preferredChannel,
      });

      await this.notificationsService.markSkipped(
        log.id,
        'Booking is in the past',
      );

      return {
        bookingId: booking.id,
        queued: false,
        timing,
        reason: 'Booking is in the past',
      };
    }

    const runAt = this.dateUtils.getSmartReminderRunAt(
      booking.startsAt,
      timezone,
      reminderHour,
    );

    const delayMs = Math.max(0, runAt.getTime() - Date.now());

    const result = await this.enqueueSingleReminder(booking.id, false, {
      jobId: `booking-${booking.id}-smart`,
      delayMs,
      runAt,
    });

    return {
      ...result,
      timing,
      startsAt: booking.startsAt.toISOString(),
    };
  }

  private async removeExistingJob(jobId: string) {
    const existingJob = await this.reminderQueue.getJob(jobId);

    if (!existingJob) return;

    try {
      await existingJob.remove();
      this.logger.log(`Removed existing reminder job ${jobId} before rescheduling`);
    } catch {
      this.logger.warn(
        `Unable to remove existing reminder job ${jobId}. It may already be active.`,
      );
    }
  }

  private useFallbackChannels() {
    return this.config.get('USE_FALLBACK_CHANNELS', 'true') === 'true';
  }

  private getPreferredChannelWarning(
    preferredChannel: NotificationChannel,
    telegramChatId?: string | null,
  ) {
    if (
      preferredChannel === NotificationChannel.TELEGRAM &&
      !telegramChatId
    ) {
      return 'Preferred Telegram channel is not ready: missing telegramChatId';
    }

    return null;
  }
}