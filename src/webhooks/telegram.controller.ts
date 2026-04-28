import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

type TelegramUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    text?: string;
    chat?: {
      id?: number;
      type?: string;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    from?: {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
  };
};

@Controller('webhooks/telegram')
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @HttpCode(200)
  async handleTelegramWebhook(
    @Body() update: TelegramUpdate,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
  ) {
    this.validateSecretToken(secretToken);

    const message = update.message;
    const chatId = message?.chat?.id;
    const text = message?.text?.trim();

    if (!chatId || !text) {
      return { ok: true, ignored: true, reason: 'No chat id or text' };
    }

    if (!text.startsWith('/start')) {
      await this.sendTelegramMessage(
        chatId,
        'Ciao! Per collegare Telegram ai reminder, usa il comando:\n/start CODICE_CLIENTE',
      );

      return { ok: true, ignored: true, reason: 'Unsupported command' };
    }

    const customerId = this.extractCustomerIdFromStartCommand(text);

    if (!customerId) {
      await this.sendTelegramMessage(
        chatId,
        'Benvenuto! Per collegare il tuo account, usa:\n/start CODICE_CLIENTE',
      );

      return { ok: true, linked: false, reason: 'Missing customer id' };
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      await this.sendTelegramMessage(
        chatId,
        'Codice cliente non valido. Controlla il link o richiedi un nuovo collegamento.',
      );

      return { ok: true, linked: false, reason: 'Customer not found' };
    }

    const updatedCustomer = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        telegramChatId: String(chatId),
        preferredChannel: 'TELEGRAM',
        reminderOptIn: true,
      },
    });

    this.logger.log(
      `Linked Telegram chat ${chatId} to customer ${updatedCustomer.id}`,
    );

    await this.sendTelegramMessage(
      chatId,
      `Telegram collegato correttamente ✅\n\nCiao ${updatedCustomer.fullName}, da ora puoi ricevere i reminder delle prenotazioni su Telegram.`,
    );

    return {
      ok: true,
      linked: true,
      customerId: updatedCustomer.id,
    };
  }

  private extractCustomerIdFromStartCommand(text: string) {
    const parts = text.split(/\s+/);
    const customerId = parts[1];

    if (!customerId) {
      return null;
    }

    return customerId.trim();
  }

  private validateSecretToken(secretToken?: string) {
    const expectedSecret = this.configService.get<string>(
      'TELEGRAM_WEBHOOK_SECRET',
    );

    if (!expectedSecret) {
      return;
    }

    if (secretToken !== expectedSecret) {
      throw new UnauthorizedException('Invalid Telegram webhook secret');
    }
  }

  private async sendTelegramMessage(chatId: number, text: string) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');

    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not configured');
      return;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Telegram sendMessage failed: ${errorText}`);
    }
  }
}