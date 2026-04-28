export type Channel = 'SMS' | 'WHATSAPP' | 'TELEGRAM';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';

export interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  telegramChatId: string | null;
  preferredChannel: Channel;
  reminderOptIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  startsAt: string;
  status: BookingStatus;
  notes: string | null;
  reminderSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
}

export interface NotificationLog {
  id: string;
  bookingId: string;
  customerId: string;
  channel: Channel;
  status: NotificationStatus;
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  booking?: Booking;
}

export interface CreateCustomerPayload {
  fullName: string;
  phoneNumber: string;
  email?: string;
  telegramChatId?: string;
  preferredChannel: Channel;
  reminderOptIn: boolean;
}

export interface CreateBookingPayload {
  customerId: string;
  startsAt: string;
  status: BookingStatus;
  notes?: string;
}

export interface SendReminderResponse {
  bookingId: string;
  queued: boolean;
  reason?: string;
  jobId?: string;
}

export interface SettingsStatus {
  mode: 'DRY_RUN' | 'PRODUCTION';
  cron: string | null;
  timezone: string | null;
  providers: {
    twilioSms: {
      configured: boolean;
      from: string | null;
    };
    telegram: {
      configured: boolean;
    };
    whatsapp: {
      configured: boolean;
      from: string | null;
    };
  };
}

export interface TestSmsPayload {
  phoneNumber: string;
  message: string;
}

export interface TestSmsResponse {
  status: 'SENT' | 'FAILED' | 'DRY_RUN';
  providerMessageId?: string;
  error?: string;
  to?: string;
}