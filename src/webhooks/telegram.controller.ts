import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomersService } from '../customers/customers.service';

interface TelegramWebhookPayload {
  message?: {
    text?: string;
    chat?: { id?: number | string };
    contact?: { phone_number?: string };
  };
}

@Controller('webhooks/telegram')
export class TelegramWebhookController {
  constructor(
    private readonly config: ConfigService,
    private readonly customersService: CustomersService,
  ) {}

  @Post()
  async handleTelegramWebhook(
    @Body() payload: TelegramWebhookPayload,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
  ) {
    const expectedSecret = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (expectedSecret && secretToken !== expectedSecret) {
      throw new UnauthorizedException('Invalid Telegram webhook secret');
    }

    const chatId = payload.message?.chat?.id;
    if (!chatId) return { ok: true, linked: false, reason: 'No chat id in update' };

    const text = payload.message?.text?.trim();
    const contactPhone = payload.message?.contact?.phone_number;

    if (contactPhone) {
      const phoneNumber = contactPhone.startsWith('+') ? contactPhone : `+${contactPhone}`;
      const linked = await this.customersService.linkTelegramChat({ phoneNumber, telegramChatId: String(chatId) });
      return { ok: true, linked: Boolean(linked), mode: 'contact_phone' };
    }

    if (text?.startsWith('/start')) {
      const [, rawArgument] = text.split(' ');
      if (!rawArgument) {
        return {
          ok: true,
          linked: false,
          reason: 'Use /start <customerId> or share your Telegram contact to link the chat.',
        };
      }

      const customerId = this.looksLikeUuid(rawArgument) ? rawArgument : undefined;
      const phoneNumber = rawArgument.startsWith('+') ? rawArgument : undefined;
      const linked = await this.customersService.linkTelegramChat({
        customerId,
        phoneNumber,
        telegramChatId: String(chatId),
      });

      return { ok: true, linked: Boolean(linked), mode: customerId ? 'customer_id' : 'phone_number' };
    }

    return { ok: true, linked: false };
  }

  private looksLikeUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
