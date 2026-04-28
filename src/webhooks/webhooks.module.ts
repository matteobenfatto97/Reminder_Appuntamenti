import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TelegramWebhookController } from './telegram.controller';
import { TwilioWebhookController } from './twilio.controller';

@Module({
  imports: [CustomersModule, NotificationsModule],
  controllers: [TelegramWebhookController, TwilioWebhookController],
})
export class WebhooksModule {}
