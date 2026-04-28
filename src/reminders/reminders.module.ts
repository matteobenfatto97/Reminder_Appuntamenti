import { Module } from '@nestjs/common';
import { DateUtilsService } from '../common/date-utils.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationDispatcherService } from '../notifications/providers/notification-dispatcher.service';
import { SmsProvider } from '../notifications/providers/sms.provider';
import { TelegramProvider } from '../notifications/providers/telegram.provider';
import { WhatsAppProvider } from '../notifications/providers/whatsapp.provider';
import { ReminderProcessor } from './reminder.processor';
import { ReminderQueueRegistration } from './reminder.queue';
import { RemindersService } from './reminders.service';

@Module({
  imports: [ReminderQueueRegistration, NotificationsModule],
  providers: [
    DateUtilsService,
    RemindersService,
    ReminderProcessor,
    NotificationDispatcherService,
    SmsProvider,
    WhatsAppProvider,
    TelegramProvider,
  ],
  exports: [RemindersService, DateUtilsService],
})
export class RemindersModule {}
