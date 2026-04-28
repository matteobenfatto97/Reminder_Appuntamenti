import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateUtilsService } from '../../common/date-utils.service';
import { buildReminderMessage } from '../../common/message-template';
import { NotificationProvider, NotificationResult, SendReminderInput } from './notification-provider.interface';

@Injectable()
export class TelegramProvider implements NotificationProvider {
  private readonly logger = new Logger(TelegramProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly dateUtils: DateUtilsService,
  ) {}

  async sendReminder(input: SendReminderInput): Promise<NotificationResult> {
    if (!input.telegramChatId) {
      return { success: false, errorMessage: 'Missing telegramChatId: the customer must start the Telegram bot first.' };
    }

    const dryRun = this.config.get<string>('DRY_RUN_NOTIFICATIONS', 'true') === 'true';
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');

    if (dryRun || !token) {
      this.logger.warn(`Telegram dry-run for booking ${input.bookingId}`);
      return { success: true, providerMessageId: `dry-run-telegram-${input.bookingId}` };
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: input.telegramChatId,
          text: this.buildMessage(input),
          disable_web_page_preview: true,
        }),
      });

      const data = (await response.json()) as { ok?: boolean; result?: { message_id?: number }; description?: string };
      if (!response.ok || !data.ok) {
        return { success: false, errorMessage: data.description ?? `Telegram HTTP ${response.status}` };
      }

      return { success: true, providerMessageId: String(data.result?.message_id ?? '') };
    } catch (error) {
      return { success: false, errorMessage: this.toErrorMessage(error) };
    }
  }

  private buildMessage(input: SendReminderInput) {
    return buildReminderMessage({
      template: this.config.get<string>('DEFAULT_REMINDER_MESSAGE_TEMPLATE') ?? 'Ciao {{nome}}, ti ricordiamo la prenotazione del {{data}} alle {{ora}}.',
      fullName: input.fullName,
      startsAt: input.startsAt,
      timezone: this.config.get<string>('APP_TIMEZONE', 'Europe/Rome'),
      dateUtils: this.dateUtils,
    });
  }

  private toErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown Telegram provider error';
  }
}
