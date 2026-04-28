import { ConfigService } from '@nestjs/config';
import { BookingStatus, NotificationChannel, NotificationStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { NotificationsService } from '../src/notifications/notifications.service';
import { NotificationDispatcherService } from '../src/notifications/providers/notification-dispatcher.service';
import { ReminderProcessor } from '../src/reminders/reminder.processor';

describe('ReminderProcessor', () => {
  it('sends a reminder and updates booking.reminderSentAt', async () => {
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'booking-1',
          customerId: 'customer-1',
          startsAt: new Date(),
          status: BookingStatus.CONFIRMED,
          reminderSentAt: null,
          customer: {
            id: 'customer-1',
            fullName: 'Mario Rossi',
            phoneNumber: '+393331234567',
            telegramChatId: null,
            preferredChannel: NotificationChannel.SMS,
            reminderOptIn: true,
          },
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
    } as any;

    const notifications = {
      upsertPending: jest.fn().mockResolvedValue({ id: 'log-1', status: NotificationStatus.PENDING }),
      markSent: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
      markSkipped: jest.fn().mockResolvedValue(undefined),
    } as unknown as NotificationsService;

    const dispatcher = {
      send: jest.fn().mockResolvedValue({ success: true, providerMessageId: 'provider-1' }),
    } as unknown as NotificationDispatcherService;

    const config = { get: jest.fn((key: string, fallback?: string) => (key === 'USE_FALLBACK_CHANNELS' ? 'false' : fallback)) } as unknown as ConfigService;
    const processor = new ReminderProcessor(prisma, notifications, dispatcher, config);

    const result = await processor.process({ data: { bookingId: 'booking-1' } } as Job<any>);

    expect(result).toMatchObject({ sent: true, channel: NotificationChannel.SMS });
    expect((notifications as any).markSent).toHaveBeenCalledWith('log-1', 'provider-1');
    expect(prisma.booking.update).toHaveBeenCalled();
  });
});
