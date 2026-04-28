export interface SendReminderInput {
  bookingId: string;
  customerId: string;
  fullName: string;
  phoneNumber: string;
  telegramChatId?: string | null;
  startsAt: Date;
}

export interface NotificationResult {
  success: boolean;
  providerMessageId?: string;
  errorMessage?: string;
}

export interface NotificationProvider {
  sendReminder(input: SendReminderInput): Promise<NotificationResult>;
}
