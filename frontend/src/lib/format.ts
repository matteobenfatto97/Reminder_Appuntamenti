import { format, isTomorrow, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Booking, BookingStatus, Channel, NotificationStatus } from '../types/domain';

export function formatDateTime(value: string) {
  return format(parseISO(value), 'dd MMM yyyy · HH:mm', { locale: it });
}

export function formatDate(value: string) {
  return format(parseISO(value), 'dd MMM yyyy', { locale: it });
}

export function formatTime(value: string) {
  return format(parseISO(value), 'HH:mm', { locale: it });
}

export function isBookingTomorrow(booking: Booking) {
  return isTomorrow(parseISO(booking.startsAt));
}

export function channelLabel(channel: Channel) {
  return {
    SMS: 'SMS',
    WHATSAPP: 'WhatsApp',
    TELEGRAM: 'Telegram',
  }[channel];
}

export function notificationStatusLabel(status: NotificationStatus) {
  return {
    SENT: 'Inviato',
    FAILED: 'Fallito',
    SKIPPED: 'Saltato',
    PENDING: 'In coda',
  }[status];
}

export function bookingStatusLabel(status: BookingStatus) {
  return {
    CONFIRMED: 'Confermata',
    CANCELLED: 'Cancellata',
    COMPLETED: 'Completata',
  }[status];
}
