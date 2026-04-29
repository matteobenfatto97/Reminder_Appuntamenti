import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

export interface DateRange {
  start: Date;
  end: Date;
}

export type SmartReminderTiming = 'PAST' | 'TODAY' | 'TOMORROW' | 'FUTURE';

@Injectable()
export class DateUtilsService {
  getDayRange(timezone: string, offsetDays = 0, now: Date = new Date()): DateRange {
    const current = DateTime.fromJSDate(now).setZone(timezone);
    const start = current.plus({ days: offsetDays }).startOf('day');
    const end = start.plus({ days: 1 });

    return {
      start: start.toUTC().toJSDate(),
      end: end.toUTC().toJSDate(),
    };
  }

  getTodayRange(timezone: string, now: Date = new Date()): DateRange {
    return this.getDayRange(timezone, 0, now);
  }

  getTomorrowRange(timezone: string, now: Date = new Date()): DateRange {
    return this.getDayRange(timezone, 1, now);
  }

  getRangeFromNow(timezone: string, daysAhead: number, now: Date = new Date()): DateRange {
    const current = DateTime.fromJSDate(now).setZone(timezone);
    const end = current.plus({ days: daysAhead }).endOf('day');

    return {
      start: current.toUTC().toJSDate(),
      end: end.toUTC().toJSDate(),
    };
  }

  getSmartReminderTiming(
    startsAt: Date,
    timezone: string,
    now: Date = new Date(),
  ): SmartReminderTiming {
    const current = DateTime.fromJSDate(now).setZone(timezone);
    const appointment = DateTime.fromJSDate(startsAt).setZone(timezone);

    if (appointment.toMillis() <= current.toMillis()) {
      return 'PAST';
    }

    const currentDay = current.startOf('day');
    const appointmentDay = appointment.startOf('day');
    const daysUntilAppointment = Math.floor(
      appointmentDay.diff(currentDay, 'days').days,
    );

    if (daysUntilAppointment === 0) return 'TODAY';
    if (daysUntilAppointment === 1) return 'TOMORROW';

    return 'FUTURE';
  }

  getSmartReminderRunAt(
    startsAt: Date,
    timezone: string,
    reminderHour = 8,
    now: Date = new Date(),
  ): Date {
    const current = DateTime.fromJSDate(now).setZone(timezone);
    const appointment = DateTime.fromJSDate(startsAt).setZone(timezone);
    const timing = this.getSmartReminderTiming(startsAt, timezone, now);

    if (timing === 'TODAY' || timing === 'TOMORROW' || timing === 'PAST') {
      return current.toUTC().toJSDate();
    }

    const planned = appointment
      .minus({ days: 1 })
      .set({
        hour: reminderHour,
        minute: 0,
        second: 0,
        millisecond: 0,
      });

    if (planned.toMillis() <= current.toMillis()) {
      return current.toUTC().toJSDate();
    }

    return planned.toUTC().toJSDate();
  }

  formatBookingDate(date: Date, timezone: string) {
    const dt = DateTime.fromJSDate(date).setZone(timezone);

    return {
      date: dt.toFormat('dd/LL/yyyy'),
      time: dt.toFormat('HH:mm'),
    };
  }
}