import { DateUtilsService } from '../src/common/date-utils.service';

describe('DateUtilsService', () => {
  it('calculates tomorrow range in Europe/Rome and returns UTC dates', () => {
    const service = new DateUtilsService();
    const now = new Date('2026-04-28T10:00:00.000Z');
    const range = service.getTomorrowRange('Europe/Rome', now);

    expect(range.start.toISOString()).toBe('2026-04-28T22:00:00.000Z');
    expect(range.end.toISOString()).toBe('2026-04-29T22:00:00.000Z');
  });
});
