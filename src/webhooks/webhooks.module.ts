import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramWebhookController } from './telegram.controller';
import { TwilioWebhookController } from './twilio.controller';

@Module({
  imports: [ConfigModule, PrismaModule, NotificationsModule],
  controllers: [TelegramWebhookController, TwilioWebhookController],
})
export class WebhooksModule {}