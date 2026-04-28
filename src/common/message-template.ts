import { DateUtilsService } from './date-utils.service';

export interface BuildReminderMessageInput {
  template: string;
  fullName: string;
  startsAt: Date;
  timezone: string;
  dateUtils: DateUtilsService;
}

export function buildReminderMessage(input: BuildReminderMessageInput): string {
  const { date, time } = input.dateUtils.formatBookingDate(input.startsAt, input.timezone);

  return input.template
    .replace(/{{\s*nome\s*}}/g, input.fullName)
    .replace(/{{\s*data\s*}}/g, date)
    .replace(/{{\s*ora\s*}}/g, time);
}
