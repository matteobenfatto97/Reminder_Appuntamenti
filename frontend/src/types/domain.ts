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
