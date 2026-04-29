import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { TestSmsDto } from './dto/test-sms.dto';
import { TestTelegramDto } from './dto/test-telegram.dto';

type TelegramSendMessageResponse = {
  ok?: boolean;
  description?: string;
  result?: {
    message_id?: number;
  };
};

type TelegramWebhookInfoResponse = {
  ok?: boolean;
  description?: string;
  result?: {
    url?: string;
    has_custom_certificate?: boolean;
    pending_update_count?: number;
    last_error_date?: number;
    last_error_message?: string;
    max_connections?: number;
    allowed_updates?: string[];
  };
};

@Controller('settings')
export class SettingsController {
  constructor(private readonly configService: ConfigService) {}

  @Get('status')
  getStatus() {
    const dryRun =
      this.configService.get<string>('DRY_RUN_NOTIFICATIONS') === 'true';

    const twilioAccountSid =
      this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const twilioAuthToken =
      this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const twilioSmsFrom = this.configService.get<string>('TWILIO_SMS_FROM');
    const twilioWhatsappFrom =
      this.configService.get<string>('TWILIO_WHATSAPP_FROM');

    const telegramBotToken =
      this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    return {
      mode: dryRun ? 'DRY_RUN' : 'PRODUCTION',
      cron: this.configService.get<string>('REMINDER_CRON') || null,
      timezone: this.configService.get<string>('APP_TIMEZONE') || null,
      providers: {
        twilioSms: {
          configured: Boolean(
            twilioAccountSid && twilioAuthToken && twilioSmsFrom,
          ),
          from: twilioSmsFrom ? this.maskPhoneNumber(twilioSmsFrom) : null,
        },
        telegram: {
          configured: Boolean(telegramBotToken),
          botUsername:
            this.configService.get<string>('TELEGRAM_BOT_USERNAME') || null,
        },
        whatsapp: {
          configured: Boolean(
            twilioAccountSid && twilioAuthToken && twilioWhatsappFrom,
          ),
          from: twilioWhatsappFrom
            ? this.maskPhoneNumber(twilioWhatsappFrom)
            : null,
        },
      },
    };
  }

  @Post('test-sms')
  async sendTestSms(@Body() dto: TestSmsDto) {
    const dryRun =
      this.configService.get<string>('DRY_RUN_NOTIFICATIONS') === 'true';

    if (dryRun) {
      return {
        status: 'DRY_RUN',
        providerMessageId: `dry-run-test-sms-${Date.now()}`,
        to: this.maskPhoneNumber(dto.phoneNumber),
      };
    }

    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.configService.get<string>('TWILIO_SMS_FROM');

    if (!accountSid || !authToken || !from) {
      return {
        status: 'FAILED',
        error: 'Twilio SMS is not configured',
      };
    }

    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      from,
      to: dto.phoneNumber,
      body: dto.message,
    });

    return {
      status: 'SENT',
      providerMessageId: message.sid,
      to: this.maskPhoneNumber(dto.phoneNumber),
    };
  }

  @Post('test-telegram')
  async testTelegram(@Body() dto: TestTelegramDto) {
    const telegramBotToken =
      this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!telegramBotToken) {
      throw new BadRequestException('Telegram bot token is not configured');
    }

    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: dto.telegramChatId,
          text: dto.message,
        }),
      },
    );

    const data = (await response.json()) as TelegramSendMessageResponse;

    if (!response.ok || !data.ok) {
      throw new BadRequestException(
        data.description ?? 'Telegram test message failed',
      );
    }

    return {
      status: 'SENT',
      providerMessageId: String(data.result?.message_id ?? ''),
      to: dto.telegramChatId,
    };
  }

  @Get('telegram-webhook-status')
  async getTelegramWebhookStatus() {
    const telegramBotToken =
      this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!telegramBotToken) {
      throw new BadRequestException('Telegram bot token is not configured');
    }

    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/getWebhookInfo`,
    );

    const data = (await response.json()) as TelegramWebhookInfoResponse;

    if (!response.ok || !data.ok) {
      throw new BadRequestException(
        data.description ?? 'Unable to read Telegram webhook info',
      );
    }

    const result = data.result;

    return {
      configured: Boolean(result?.url),
      url: result?.url || null,
      pendingUpdateCount: result?.pending_update_count ?? 0,
      lastErrorMessage: result?.last_error_message || null,
      lastErrorDate: result?.last_error_date
        ? new Date(result.last_error_date * 1000).toISOString()
        : null,
      maxConnections: result?.max_connections ?? null,
      allowedUpdates: result?.allowed_updates ?? [],
      checkedAt: new Date().toISOString(),
    };
  }

  private maskPhoneNumber(phoneNumber: string) {
    if (phoneNumber.length <= 5) {
      return '***';
    }

    return `${phoneNumber.slice(0, 4)}******${phoneNumber.slice(-2)}`;
  }
}