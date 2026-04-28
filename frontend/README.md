# Appointment Reminder Dashboard

Dashboard React/Vite per il backend NestJS Automatic Booking Reminders.

## Avvio con Docker Compose

Dalla root del progetto:

```bash
docker compose up --build
```

Poi apri:

```text
http://localhost:5173
```

## Avvio standalone

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

La dashboard usa `VITE_API_BASE_URL`, di default `http://localhost:3000`.
