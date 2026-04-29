import { useState } from 'react';
import type { ElementType } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Radio,
  Send,
  ServerCog,
  ShieldCheck,
  Smartphone,
  TimerReset,
  XCircle,
} from 'lucide-react';
import { api } from '../api/client';
import { Button, Card, Field, Input, Textarea } from '../components/ui';
import type { SettingsStatus } from '../types/domain';

export function SettingsPage({
  status,
  isLoading,
  showToast,
}: {
  status: SettingsStatus | null;
  isLoading: boolean;
  showToast: (message: string, type?: 'success' | 'error') => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsMessage, setSmsMessage] = useState(
    'Test SMS dalla dashboard Appointment Reminder',
  );

  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramMessage, setTelegramMessage] = useState(
    'Test Telegram dalla dashboard Appointment Reminder 🚀',
  );

  const testSmsMutation = useMutation({
    mutationFn: api.settings.testSms,
    onSuccess: (result) => {
      if (result.status === 'SENT') {
        showToast(`SMS inviato. Provider ID: ${result.providerMessageId}`);
        return;
      }

      if (result.status === 'DRY_RUN') {
        showToast(`Dry-run completato. ID: ${result.providerMessageId}`);
        return;
      }

      showToast(result.error ?? 'Invio SMS fallito', 'error');
    },
    onError: (error: Error) => showToast(error.message, 'error'),
  });

  const testTelegramMutation = useMutation({
    mutationFn: api.settings.testTelegram,
    onSuccess: (result) => {
      showToast(`Telegram inviato. Message ID: ${result.providerMessageId}`);
    },
    onError: (error: Error) => showToast(error.message, 'error'),
  });

  const mode = status?.mode ?? 'DRY_RUN';
  const isProduction = mode === 'PRODUCTION';
  const telegramConfigured = Boolean(status?.providers.telegram.configured);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-soft backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-28 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[1fr_auto] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-indigo-200">
              <ServerCog className="h-4 w-4" />
              Control room
            </div>

            <h3 className="mt-5 text-4xl font-black tracking-tight text-white md:text-5xl">
              Impostazioni operative
            </h3>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              Monitora modalità ambiente, provider configurati, cron automatico
              e invia messaggi di test senza esporre token o credenziali sensibili.
            </p>
          </div>

          <div
            className={
              isProduction
                ? 'rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5'
                : 'rounded-[2rem] border border-amber-400/20 bg-amber-400/10 p-5'
            }
          >
            <div className="flex items-center gap-3">
              {isProduction ? (
                <ShieldCheck className="h-8 w-8 text-emerald-200" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-amber-200" />
              )}

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Modalità
                </p>
                <p
                  className={
                    isProduction
                      ? 'text-2xl font-black text-emerald-100'
                      : 'text-2xl font-black text-amber-100'
                  }
                >
                  {isProduction ? 'PRODUZIONE' : 'DRY RUN'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <ProviderCard
          title="Twilio SMS"
          description="Canale SMS reale tramite Twilio Programmable Messaging."
          configured={Boolean(status?.providers.twilioSms.configured)}
          detail={
            status?.providers.twilioSms.from
              ? `Mittente ${status.providers.twilioSms.from}`
              : 'Numero mittente non configurato'
          }
          icon={Smartphone}
        />

        <ProviderCard
          title="Telegram"
          description="Bot Telegram per reminder gratuiti agli utenti collegati."
          configured={telegramConfigured}
          detail={
            status?.providers.telegram.botUsername
              ? `Bot @${status.providers.telegram.botUsername}`
              : telegramConfigured
                ? 'Bot token configurato'
                : 'Bot token mancante'
          }
          icon={MessageCircle}
        />

        <ProviderCard
          title="WhatsApp"
          description="Invio tramite canale ufficiale/Twilio WhatsApp."
          configured={Boolean(status?.providers.whatsapp.configured)}
          detail={
            status?.providers.whatsapp.from
              ? `Mittente ${status.providers.whatsapp.from}`
              : 'Mittente WhatsApp non configurato'
          }
          icon={Radio}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <h3 className="text-xl font-black text-white">Schedulazione</h3>
          <p className="mt-1 text-sm text-slate-400">
            Configurazione letta dalle variabili d’ambiente del backend.
          </p>

          <div className="mt-5 grid gap-3">
            <InfoRow
              icon={TimerReset}
              label="Cron reminder"
              value={status?.cron ?? 'Non configurato'}
            />
            <InfoRow
              icon={Clock3}
              label="Timezone"
              value={status?.timezone ?? 'Non configurata'}
            />
            <InfoRow
              icon={ServerCog}
              label="Stato lettura"
              value={isLoading ? 'Aggiornamento...' : 'Sincronizzato'}
            />
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/45 p-4 text-sm leading-6 text-slate-400">
            I valori sono solo in lettura. Per modificarli cambia il file{' '}
            <span className="font-bold text-slate-200">.env</span> o{' '}
            <span className="font-bold text-slate-200">docker-compose.yml</span>{' '}
            e riavvia Docker.
          </div>
        </Card>

        <Card>
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-xl font-black text-white">Invia SMS di test</h3>
              <p className="mt-1 text-sm text-slate-400">
                Verifica Twilio senza creare una prenotazione.
              </p>
            </div>

            <span
              className={
                isProduction
                  ? 'rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200'
                  : 'rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200'
              }
            >
              {isProduction ? 'Invio reale' : 'Simulazione'}
            </span>
          </div>

          <div className="grid gap-4">
            <Field label="Numero destinatario">
              <Input
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="+39..."
              />
            </Field>

            <Field label="Messaggio">
              <Textarea
                value={smsMessage}
                onChange={(event) => setSmsMessage(event.target.value)}
                placeholder="Scrivi il messaggio di test..."
              />
            </Field>

            <Button
              onClick={() =>
                testSmsMutation.mutate({
                  phoneNumber,
                  message: smsMessage,
                })
              }
              disabled={testSmsMutation.isPending || !phoneNumber || !smsMessage}
            >
              <Send className="h-4 w-4" />
              {testSmsMutation.isPending
                ? 'Invio in corso...'
                : 'Invia SMS di test'}
            </Button>

            <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4 text-xs leading-5 text-slate-400">
              In trial Twilio il destinatario deve essere verificato nella console
              Twilio. Il token non viene mai mostrato nella dashboard.
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-xl font-black text-white">
                Invia Telegram di test
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Verifica il bot Telegram senza creare una prenotazione.
              </p>
            </div>

            <span
              className={
                telegramConfigured
                  ? 'rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200'
                  : 'rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-200'
              }
            >
              {telegramConfigured ? 'Bot attivo' : 'Non configurato'}
            </span>
          </div>

          <div className="grid gap-4">
            <Field label="Telegram Chat ID">
              <Input
                value={telegramChatId}
                onChange={(event) => setTelegramChatId(event.target.value)}
                placeholder="331043592"
              />
            </Field>

            <Field label="Messaggio">
              <Textarea
                value={telegramMessage}
                onChange={(event) => setTelegramMessage(event.target.value)}
                placeholder="Scrivi il messaggio Telegram di test..."
              />
            </Field>

            <Button
              onClick={() =>
                testTelegramMutation.mutate({
                  telegramChatId,
                  message: telegramMessage,
                })
              }
              disabled={
                testTelegramMutation.isPending ||
                !telegramConfigured ||
                !telegramChatId ||
                !telegramMessage
              }
            >
              <Send className="h-4 w-4" />
              {testTelegramMutation.isPending
                ? 'Invio in corso...'
                : 'Invia Telegram di test'}
            </Button>

            <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4 text-xs leading-5 text-slate-400">
              Il Chat ID viene salvato automaticamente quando il cliente apre il
              link Telegram generato dalla dashboard. Per test manuali puoi usare
              il tuo Chat ID personale.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProviderCard({
  title,
  description,
  configured,
  detail,
  icon: Icon,
}: {
  title: string;
  description: string;
  configured: boolean;
  detail: string;
  icon: ElementType;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className={
          configured
            ? 'absolute right-0 top-0 h-28 w-28 rounded-full bg-emerald-500/20 blur-3xl'
            : 'absolute right-0 top-0 h-28 w-28 rounded-full bg-rose-500/20 blur-3xl'
        }
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-slate-950/60">
          <Icon className="h-6 w-6 text-slate-200" />
        </div>

        {configured ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Configurato
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-200">
            <XCircle className="h-3.5 w-3.5" />
            Non configurato
          </span>
        )}
      </div>

      <div className="relative mt-5">
        <h3 className="text-xl font-black text-white">{title}</h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">
          {description}
        </p>
        <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-300">
          {detail}
        </p>
      </div>
    </Card>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950/60">
        <Icon className="h-5 w-5 text-indigo-200" />
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>
        <p className="mt-1 font-bold text-white">{value}</p>
      </div>
    </div>
  );
}