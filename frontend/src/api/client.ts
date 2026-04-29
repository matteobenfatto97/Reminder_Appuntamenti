import type {
  Booking,
  BookingStatus,
  CreateBookingPayload,
  CreateCustomerPayload,
  Customer,
  NotificationLog,
  SendReminderResponse,
  SettingsStatus,
  TestSmsPayload,
  TestSmsResponse,
  TestTelegramPayload,
  TestTelegramResponse,
  TelegramWebhookStatus,
} from '../types/domain';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message
      ? Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message
      : `Errore HTTP ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export const api = {
  baseUrl: API_BASE_URL,

  customers: {
    list: () => request<Customer[]>('/customers'),

    create: (payload: CreateCustomerPayload) =>
      request<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    update: (id: string, payload: Partial<CreateCustomerPayload>) =>
      request<Customer>(`/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),

    remove: (id: string) =>
      request<Customer>(`/customers/${id}`, {
        method: 'DELETE',
      }),
  },

  bookings: {
    list: () => request<Booking[]>('/bookings'),

    create: (payload: CreateBookingPayload) =>
      request<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    updateStatus: (id: string, status: BookingStatus) =>
      request<Booking>(`/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    sendReminderNow: (id: string) =>
      request<SendReminderResponse>(`/bookings/${id}/send-reminder-now`, {
        method: 'POST',
      }),
  },

  notifications: {
    list: () => request<NotificationLog[]>('/notifications'),
  },

  settings: {
    status: () => request<SettingsStatus>('/settings/status'),

    testSms: (payload: TestSmsPayload) =>
      request<TestSmsResponse>('/settings/test-sms', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    testTelegram: (payload: TestTelegramPayload) =>
      request<TestTelegramResponse>('/settings/test-telegram', {
    method: 'POST',
    body: JSON.stringify(payload),
    }),

    telegramWebhookStatus: () =>
    request<TelegramWebhookStatus>('/settings/telegram-webhook-status'),
  },
};