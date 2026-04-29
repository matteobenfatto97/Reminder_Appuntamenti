import { BadRequestException, 
  Body, 
  Controller, 
  Get, 
  Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { TestSmsDto } from './dto/test-sms.dto';
import { TestTelegramDto } from './dto/test-telegram.dto';
  
  

@Controller('settings')
export class SettingsController {
  constructor(private readonly configService: ConfigService) {}

  @Get('status')
  getStatus() {
    const dryRun = this.configService.get<string>('DRY_RUN_NOTIFICATIONS') === 'true';

    const twilioAccountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const twilioSmsFrom = this.configService.get<string>('TWILIO_SMS_FROM');
    const twilioWhatsappFrom = this.configService.get<string>('TWILIO_WHATSAPP_FROM');

    const telegramBotToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    return {
      mode: dryRun ? 'DRY_RUN' : 'PRODUCTION',
      cron: this.configService.get<string>('REMINDER_CRON') || null,
      timezone: this.configService.get<string>('APP_TIMEZONE') || null,
      providers: {
        twilioSms: {
          configured: Boolean(twilioAccountSid && twilioAuthToken && twilioSmsFrom),
          from: twilioSmsFrom ? this.maskPhoneNumber(twilioSmsFrom) : null,
        },
        telegram: {
          configured: Boolean(telegramBotToken),
          botUsername: this.configService.get<string>('TELEGRAM_BOT_USERNAME') || null,
        },
        whatsapp: {
          configured: Boolean(twilioAccountSid && twilioAuthToken && twilioWhatsappFrom),
          from: twilioWhatsappFrom ? this.maskPhoneNumber(twilioWhatsappFrom) : null,
        },
      },
    };
  }

  @Post('test-sms')
  async sendTestSms(@Body() dto: TestSmsDto) {
    const dryRun = this.configService.get<string>('DRY_RUN_NOTIFICATIONS') === 'true';
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
  const telegramBotToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

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

  const data = await response.json();

  if (!response.ok) {
    throw new BadRequestException(
      data?.description ?? 'Telegram test message failed',
    );
  }

  return {
    status: 'SENT',
    providerMessageId: String(data.result?.message_id ?? ''),
    to: dto.telegramChatId,
  };
}
  

  private maskPhoneNumber(phoneNumber: string) {
    if (phoneNumber.length <= 5) return '***';
    return `${phoneNumber.slice(0, 4)}******${phoneNumber.slice(-2)}`;
  }
}