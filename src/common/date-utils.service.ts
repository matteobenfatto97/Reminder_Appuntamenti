import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

export interface DateRange {
  start: Date;
  end: Date;
}

@Injectable()
export class DateUtilsService {
  getTomorrowRange(timezone: string, now: Date = new Date()): DateRange {
    const current = DateTime.fromJSDate(now).setZone(timezone);
    const start = current.plus({ days: 1 }).startOf('day');
    const end = start.plus({ days: 1 });

    return {
      start: start.toUTC().toJSDate(),
      end: end.toUTC().toJSDate(),
    };
  }

  formatBookingDate(date: Date, timezone: string) {
    const dt = DateTime.fromJSDate(date).setZone(timezone);
    return {
      date: dt.toFormat('dd/LL/yyyy'),
      time: dt.toFormat('HH:mm'),
    };
  }
}
