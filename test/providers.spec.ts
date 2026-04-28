import { ConfigService } from '@nestjs/config';
import { DateUtilsService } from '../src/common/date-utils.service';
import { SmsProvider } from '../src/notifications/providers/sms.provider';
import { TelegramProvider } from '../src/notifications/providers/telegram.provider';
import { WhatsAppProvider } from '../src/notifications/providers/whatsapp.provider';

const input = {
  bookingId: 'booking-1',
  customerId: 'customer-1',
  fullName: 'Mario Rossi',
  phoneNumber: '+393331234567',
  telegramChatId: '123456',
  startsAt: new Date('2026-04-29T08:30:00.000Z'),
};

function config() {
  return {
    get: jest.fn((key: string, fallback?: string) => {
      if (key === 'DRY_RUN_NOTIFICATIONS') return 'true';
      if (key === 'APP_TIMEZONE') return 'Europe/Rome';
      return fallback;
    }),
  } as unknown as ConfigService;
}

describe('Notification providers', () => {
  it('SMS provider supports dry run', async () => {
    const provider = new SmsProvider(config(), new DateUtilsService());
    await expect(provider.sendReminder(input)).resolves.toMatchObject({ success: true });
  });

  it('WhatsApp provider supports dry run', async () => {
    const provider = new WhatsAppProvider(config(), new DateUtilsService());
    await expect(provider.sendReminder(input)).resolves.toMatchObject({ success: true });
  });

  it('Telegram provider fails when telegramChatId is missing', async () => {
    const provider = new TelegramProvider(config(), new DateUtilsService());
    await expect(provider.sendReminder({ ...input, telegramChatId: undefined })).resolves.toMatchObject({ success: false });
  });

  it('Telegram provider supports dry run when telegramChatId exists', async () => {
    const provider = new TelegramProvider(config(), new DateUtilsService());
    await expect(provider.sendReminder(input)).resolves.toMatchObject({ success: true });
  });
});
