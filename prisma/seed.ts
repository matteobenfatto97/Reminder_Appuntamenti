import { PrismaClient, NotificationChannel } from '@prisma/client';
import { DateTime } from 'luxon';

const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.customer.upsert({
    where: { phoneNumber: '+393331234567' },
    update: {},
    create: {
      fullName: 'Mario Rossi',
      phoneNumber: '+393331234567',
      email: 'mario.rossi@example.com',
      preferredChannel: NotificationChannel.SMS,
      reminderOptIn: true,
    },
  });

  await prisma.booking.create({
    data: {
      customerId: customer.id,
      startsAt: DateTime.now().setZone('Europe/Rome').plus({ days: 1 }).set({ hour: 10, minute: 30 }).toUTC().toJSDate(),
      notes: 'Prenotazione di esempio per test reminder',
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
