import { BullModule } from '@nestjs/bullmq';
import { REMINDER_QUEUE } from '../common/constants';

export const ReminderQueueRegistration = BullModule.registerQueue({
  name: REMINDER_QUEUE,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60_000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

export interface ReminderJobPayload {
  bookingId: string;
  force?: boolean;
  scheduledFor?: string;
}