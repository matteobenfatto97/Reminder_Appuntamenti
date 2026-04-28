import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { NotificationResult, SendReminderInput } from './notification-provider.interface';
import { SmsProvider } from './sms.provider';
import { TelegramProvider } from './telegram.provider';
import { WhatsAppProvider } from './whatsapp.provider';

@Injectable()
export class NotificationDispatcherService {
  constructor(
    private readonly smsProvider: SmsProvider,
    private readonly whatsappProvider: WhatsAppProvider,
    private readonly telegramProvider: TelegramProvider,
  ) {}

  send(channel: NotificationChannel, input: SendReminderInput): Promise<NotificationResult> {
    switch (channel) {
      case NotificationChannel.SMS:
        return this.smsProvider.sendReminder(input);
      case NotificationChannel.WHATSAPP:
        return this.whatsappProvider.sendReminder(input);
      case NotificationChannel.TELEGRAM:
        return this.telegramProvider.sendReminder(input);
    }
  }
}
