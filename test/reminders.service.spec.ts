import { NotificationChannel, NotificationStatus, BookingStatus } from '@prisma/client';
import { DateUtilsService } from '../src/common/date-utils.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { RemindersService } from '../src/reminders/reminders.service';

describe('RemindersService', () => {
  const booking = {
    id: 'booking-1',
    customerId: 'customer-1',
    startsAt: new Date(),
    status: BookingStatus.CONFIRMED,
    reminderSentAt: null,
    customer: {
      id: 'customer-1',
      preferredChannel: NotificationChannel.SMS,
      reminderOptIn: true,
    },
    notificationLogs: [],
  };

  function createService(overrides: Record<string, unknown> = {}) {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({ ...booking, ...overrides }),
        findMany: jest.fn().mockResolvedValue([{ ...booking, ...overrides }]),
      },
    } as any;

    const queue = { add: jest.fn().mockResolvedValue(undefined) } as any;
    const config = { get: jest.fn((key: string, fallback?: string) => fallback) } as any;
    const notifications = {
      upsertPending: jest.fn().mockResolvedValue({ id: 'log-1', status: NotificationStatus.PENDING }),
      markSkipped: jest.fn(),
    } as unknown as NotificationsService;

    const schedulerRegistry = { addCronJob: jest.fn() } as any;
    const service = new RemindersService(prisma, config, new DateUtilsService(), notifications, schedulerRegistry, queue);
    return { service, prisma, queue, notifications };
  }

  it('queues a valid booking and creates a pending notification log', async () => {
    const { service, queue, notifications } = createService();

    const result = await service.enqueueSingleReminder('booking-1');

    expect(result.queued).toBe(true);
    expect((notifications as any).upsertPending).toHaveBeenCalledWith({
      bookingId: 'booking-1',
      customerId: 'customer-1',
      channel: NotificationChannel.SMS,
    });
    expect(queue.add).toHaveBeenCalled();
  });

  it('skips customers without reminder opt-in', async () => {
    const { service, queue, notifications } = createService({
      customer: { ...booking.customer, reminderOptIn: false },
    });

    const result = await service.enqueueSingleReminder('booking-1');

    expect(result.queued).toBe(false);
    expect((notifications as any).markSkipped).toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('does not queue a booking that already has a reminderSentAt value', async () => {
    const { service, queue } = createService({ reminderSentAt: new Date() });

    const result = await service.enqueueSingleReminder('booking-1');

    expect(result.queued).toBe(false);
    expect(queue.add).not.toHaveBeenCalled();
  });
});
