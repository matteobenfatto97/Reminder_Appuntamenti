import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
import { DateUtilsService } from '../../common/date-utils.service';
import { buildReminderMessage } from '../../common/message-template';
import { NotificationProvider, NotificationResult, SendReminderInput } from './notification-provider.interface';

@Injectable()
export class WhatsAppProvider implements NotificationProvider {
  private readonly logger = new Logger(WhatsAppProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly dateUtils: DateUtilsService,
  ) {}

  async sendReminder(input: SendReminderInput): Promise<NotificationResult> {
    const dryRun = this.config.get<string>('DRY_RUN_NOTIFICATIONS', 'true') === 'true';
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.config.get<string>('TWILIO_WHATSAPP_FROM');
    const contentSid = this.config.get<string>('TWILIO_WHATSAPP_CONTENT_SID');

    if (dryRun || !accountSid || !authToken || !from) {
      this.logger.warn(`WhatsApp dry-run for booking ${input.bookingId}`);
      return { success: true, providerMessageId: `dry-run-whatsapp-${input.bookingId}` };
    }

    try {
      const client = Twilio(accountSid, authToken);
      const to = `whatsapp:${input.phoneNumber}`;
      const fromWhatsapp = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
      const { date, time } = this.dateUtils.formatBookingDate(input.startsAt, this.config.get<string>('APP_TIMEZONE', 'Europe/Rome'));

      const message = contentSid
        ? await client.messages.create({
            from: fromWhatsapp,
            to,
            contentSid,
            contentVariables: JSON.stringify({
              nome: input.fullName,
              data: date,
              ora: time,
              1: input.fullName,
              2: date,
              3: time,
            }),
            statusCallback: this.config.get<string>('TWILIO_STATUS_CALLBACK_URL') || undefined,
          })
        : await client.messages.create({
            from: fromWhatsapp,
            to,
            body: this.buildMessage(input),
            statusCallback: this.config.get<string>('TWILIO_STATUS_CALLBACK_URL') || undefined,
          });

      return { success: true, providerMessageId: message.sid };
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
    return error instanceof Error ? error.message : 'Unknown WhatsApp provider error';
  }
}
