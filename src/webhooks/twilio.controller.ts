import { Body, Controller, Post } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

interface TwilioStatusWebhookPayload {
  MessageSid?: string;
  SmsSid?: string;
  MessageStatus?: string;
  SmsStatus?: string;
}

@Controller('webhooks/twilio')
export class TwilioWebhookController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('status')
  async handleStatusCallback(@Body() payload: TwilioStatusWebhookPayload) {
    const providerMessageId = payload.MessageSid ?? payload.SmsSid;
    const status = payload.MessageStatus ?? payload.SmsStatus;

    if (!providerMessageId || !status) return { ok: true, updated: false };

    const result = await this.notificationsService.updateFromTwilioStatus(providerMessageId, status);
    return { ok: true, updated: Boolean(result?.count), count: result?.count ?? 0 };
  }
}
