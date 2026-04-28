CREATE TYPE "NotificationChannel" AS ENUM ('WHATSAPP', 'TELEGRAM', 'SMS');
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

CREATE TABLE "Customer" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "email" TEXT,
  "telegramChatId" TEXT,
  "preferredChannel" "NotificationChannel" NOT NULL DEFAULT 'SMS',
  "reminderOptIn" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
  "notes" TEXT,
  "reminderSentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationLog" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "providerMessageId" TEXT,
  "errorMessage" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Customer_phoneNumber_key" ON "Customer"("phoneNumber");
CREATE UNIQUE INDEX "Customer_telegramChatId_key" ON "Customer"("telegramChatId");
CREATE INDEX "Customer_preferredChannel_idx" ON "Customer"("preferredChannel");
CREATE INDEX "Customer_reminderOptIn_idx" ON "Customer"("reminderOptIn");

CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");
CREATE INDEX "Booking_status_startsAt_idx" ON "Booking"("status", "startsAt");
CREATE INDEX "Booking_reminderSentAt_idx" ON "Booking"("reminderSentAt");

CREATE UNIQUE INDEX "NotificationLog_bookingId_channel_key" ON "NotificationLog"("bookingId", "channel");
CREATE INDEX "NotificationLog_customerId_idx" ON "NotificationLog"("customerId");
CREATE INDEX "NotificationLog_status_createdAt_idx" ON "NotificationLog"("status", "createdAt");
CREATE INDEX "NotificationLog_providerMessageId_idx" ON "NotificationLog"("providerMessageId");

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
