# Automatic Booking Reminders

Backend NestJS per inviare automaticamente reminder il giorno prima di una prenotazione tramite WhatsApp, Telegram o SMS.

Il progetto è pensato per essere integrato in una futura applicazione web di gestione prenotazioni: espone API REST, salva clienti e prenotazioni in PostgreSQL, usa Prisma come ORM, schedula i reminder giornalieri e delega gli invii a una coda BullMQ basata su Redis.

## Architettura

```text
Client / Admin Panel
        |
        v
NestJS REST API
        |
        +--> CustomersModule
        +--> BookingsModule
        +--> NotificationsModule
        +--> WebhooksModule
        |
        v
RemindersModule
        |
        +--> Cron giornaliero: cerca prenotazioni di domani
        +--> BullMQ queue: reminder-queue
        +--> ReminderProcessor
              |
              +--> WhatsAppProvider
              +--> TelegramProvider
              +--> SmsProvider
        |
        v
PostgreSQL + NotificationLog
```

## Scelte tecnologiche

- **TypeScript**: riduce errori banali grazie alla type safety e rende il progetto più manutenibile.
- **NestJS**: offre architettura modulare, dependency injection, controller, service, cron job e integrazione pulita con code asincrone.
- **PostgreSQL**: database relazionale affidabile, adatto a prenotazioni, clienti e log di notifica.
- **Prisma ORM**: schema leggibile, migration e query type-safe.
- **BullMQ + Redis**: gestisce invii asincroni, retry, backoff e separazione tra schedulazione e invio reale.
- **Twilio**: gestisce SMS e, se configurato, WhatsApp tramite API ufficiali.
- **Telegram Bot API**: consente di inviare messaggi agli utenti che hanno già avviato/interagito con il bot.
- **Docker Compose**: permette di avviare app, PostgreSQL e Redis con un solo comando.

## Requisiti

- Node.js 22+
- Docker e Docker Compose
- Account Twilio, se vuoi inviare SMS o WhatsApp reali
- Bot Telegram creato con BotFather, se vuoi inviare reminder Telegram reali

## Avvio rapido con Docker

Copia le variabili d'ambiente:

```bash
cp .env.example .env
```

Avvia tutto:

```bash
docker compose up --build
```

L'app sarà disponibile su:

```text
http://localhost:3000
```

Di default `DRY_RUN_NOTIFICATIONS=true`, quindi i provider simulano l'invio e il progetto può partire anche senza credenziali Twilio/Telegram.

## Avvio in sviluppo

```bash
npm install
cp .env.example .env
docker compose up -d postgres redis
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Per popolare dati di esempio:

```bash
npm run seed
```

## Test

```bash
npm test
```

I test coprono:

- calcolo dell'intervallo del giorno successivo nella timezone configurata;
- filtro dei clienti senza opt-in;
- prevenzione dei duplicati quando `reminderSentAt` è già valorizzato;
- provider SMS/WhatsApp/Telegram in dry-run;
- processor BullMQ mockato.

## Configurazione `.env`

```env
PORT=3000
APP_TIMEZONE=Europe/Rome
REMINDER_CRON="0 8 * * *"
USE_FALLBACK_CHANNELS=true
DRY_RUN_NOTIFICATIONS=true
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reminders?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_SMS_FROM=
TWILIO_WHATSAPP_FROM=
TWILIO_WHATSAPP_CONTENT_SID=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
```

## Flusso reminder

1. Il cron job `REMINDER_CRON` parte nella timezone `APP_TIMEZONE`.
2. Il sistema calcola l'intervallo del giorno successivo.
3. Vengono cercate solo prenotazioni:
   - `CONFIRMED`;
   - con `startsAt` nel giorno successivo;
   - con `reminderSentAt = null`;
   - associate a clienti con `reminderOptIn = true`.
4. Per ogni prenotazione viene creato o riusato un `NotificationLog` in stato `PENDING`.
5. Viene inserito un job BullMQ nella coda `reminder-queue`.
6. Il processor rilegge prenotazione e cliente prima dell'invio.
7. Se tutto è ancora valido, invia tramite canale preferito.
8. Se il canale fallisce e `USE_FALLBACK_CHANNELS=true`, prova i canali successivi nell'ordine WhatsApp → Telegram → SMS, evitando di ripetere il canale preferito.
9. Ogni tentativo viene salvato in `NotificationLog`.
10. Al primo invio riuscito, aggiorna `Booking.reminderSentAt`.

## Vincoli dei canali

### WhatsApp

Il progetto usa Twilio WhatsApp, quindi non usa scraping, WhatsApp Web o automazioni non ufficiali. Per messaggi proattivi, fuori dalla finestra conversazionale, devi usare template approvati. Puoi impostare `TWILIO_WHATSAPP_CONTENT_SID` per usare un template creato con Twilio Content Template Builder.

### Telegram

Telegram non permette di inviare un messaggio a un utente conoscendo solo il numero di telefono. L'utente deve prima avviare il bot o condividere il proprio contatto. Il backend salva `telegramChatId` tramite webhook:

```text
POST /webhooks/telegram
```

Modalità supportate:

- `/start <customerId>`
- `/start +393331234567`
- invio del contatto Telegram, se il numero coincide con `Customer.phoneNumber`

### SMS

Gli SMS vengono inviati tramite Twilio Programmable Messaging. I numeri devono essere salvati in formato E.164, ad esempio:

```text
+393331234567
```

## API REST

### Creare un cliente

```bash
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Mario Rossi",
    "phoneNumber": "+393331234567",
    "email": "mario.rossi@example.com",
    "preferredChannel": "SMS",
    "reminderOptIn": true
  }'
```

### Creare una prenotazione

```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUSTOMER_ID",
    "startsAt": "2026-04-29T10:30:00.000+02:00",
    "status": "CONFIRMED",
    "notes": "Prima visita"
  }'
```

### Inviare subito un reminder manuale

```bash
curl -X POST http://localhost:3000/bookings/BOOKING_ID/send-reminder-now
```

### Vedere i log

```bash
curl http://localhost:3000/notifications
```

### Aggiornare opt-in o canale preferito

```bash
curl -X PATCH http://localhost:3000/customers/CUSTOMER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "preferredChannel": "WHATSAPP",
    "reminderOptIn": true
  }'
```

## Protezione da duplicati

Il database contiene un vincolo unico su:

```prisma
@@unique([bookingId, channel])
```

Questo impedisce di creare più log per la stessa prenotazione e lo stesso canale. Inoltre, `Booking.reminderSentAt` blocca ulteriori invii automatici dopo il primo successo.

## Privacy e sicurezza

Il sistema:

- non invia reminder senza `reminderOptIn`;
- non salva token nel codice sorgente;
- usa `.env` per le credenziali;
- non logga token o credenziali;
- conserva solo i dati necessari per reminder e tracciamento;
- permette di disattivare i reminder aggiornando `reminderOptIn=false`.

Per un uso in produzione, aggiungi anche autenticazione, autorizzazione, rate limit, audit log e una policy di conservazione dei dati.

## Possibili miglioramenti futuri

- Autenticazione JWT per area admin.
- Dashboard web per clienti, prenotazioni e log.
- Gestione preferenze avanzate per singolo cliente.
- Template messaggi multilingua.
- Reminder multipli, ad esempio 48 ore prima e 2 ore prima.
- Conferma o cancellazione prenotazione tramite link sicuro.
- Integrazione calendario Google/Microsoft.
- Webhook di delivery più dettagliati per Twilio.
- Endpoint per configurare il webhook Telegram automaticamente.

---

## Dashboard web locale

Questa versione include anche una dashboard React/Vite in `frontend/`.

Avvio completo:

```bash
docker compose up --build
```

URL locali:

```text
Backend API: http://localhost:3000
Dashboard:   http://localhost:5173
```

La dashboard permette di:

- vedere metriche operative su clienti, prenotazioni e reminder;
- creare clienti con canale preferito e consenso reminder;
- creare prenotazioni;
- cambiare stato alle prenotazioni;
- inviare reminder manuali;
- consultare i log `SENT`, `SKIPPED`, `FAILED` e `PENDING`;
- visualizzare grafici su canali preferiti ed esiti notifiche.

Il frontend usa `VITE_API_BASE_URL=http://localhost:3000` e comunica direttamente con il backend NestJS.
