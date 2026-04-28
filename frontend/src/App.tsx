import { useMemo, useState } from 'react';
import type { ElementType, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BellRing,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageSquareWarning,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from './api/client';
import { Layout, type Page } from './components/Layout';
import {
  BookingStatusBadge,
  Button,
  Card,
  ChannelBadge,
  EmptyState,
  Field,
  Input,
  Modal,
  NotificationStatusBadge,
  Select,
  Textarea,
  Toast,
} from './components/ui';
import {
  bookingStatusLabel,
  channelLabel,
  formatDateTime,
  formatTime,
  isBookingTomorrow,
} from './lib/format';
import { useToast } from './hooks/useToast';
import type { Booking, BookingStatus, Channel, CreateBookingPayload, CreateCustomerPayload, Customer } from './types/domain';
import { SettingsPage } from './pages/SettingsPage';

const CHANNELS: Channel[] = ['SMS', 'WHATSAPP', 'TELEGRAM'];
const BOOKING_STATUSES: BookingStatus[] = ['CONFIRMED', 'CANCELLED', 'COMPLETED'];
const COLORS = ['#818cf8', '#22c55e', '#f59e0b', '#f43f5e', '#38bdf8'];

function App() {
  const [page, setPage] = useState<Page>('overview');
  const queryClient = useQueryClient();
  const toast = useToast();

  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: api.customers.list });
  const bookingsQuery = useQuery({ queryKey: ['bookings'], queryFn: api.bookings.list });
  const notificationsQuery = useQuery({ queryKey: ['notifications'], queryFn: api.notifications.list, refetchInterval: 12000 });
  const settingsQuery = useQuery({
  queryKey: ['settings-status'],
  queryFn: api.settings.status,
  refetchInterval: 15000,
});

  const customers = customersQuery.data ?? [];
  const bookings = bookingsQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];

 const refreshAll = () => {
  queryClient.invalidateQueries({ queryKey: ['customers'] });
  queryClient.invalidateQueries({ queryKey: ['bookings'] });
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
  queryClient.invalidateQueries({ queryKey: ['settings-status'] });
};

 const isFetching =
  customersQuery.isFetching ||
  bookingsQuery.isFetching ||
  notificationsQuery.isFetching ||
  settingsQuery.isFetching;

  return (
    <>
      <Layout page={page} setPage={setPage} isFetching={isFetching} onRefresh={refreshAll}>
  {page === 'overview' && <Overview customers={customers} bookings={bookings} notifications={notifications} setPage={setPage} />}
  {page === 'customers' && (
    <CustomersPage
      customers={customers}
      showToast={toast.showToast}
      telegramBotUsername={settingsQuery.data?.providers.telegram.botUsername ?? null}
    />
  )}
  {page === 'bookings' && <BookingsPage customers={customers} bookings={bookings} showToast={toast.showToast} />}
  {page === 'notifications' && <NotificationsPage notifications={notifications} />}
  {page === 'settings' && (
    <SettingsPage
      status={settingsQuery.data ?? null}
      isLoading={settingsQuery.isFetching}
      showToast={toast.showToast}
    />
  )}
</Layout>
      <Toast message={toast.message} type={toast.type} />
    </>
  );
}

function Overview({
  customers,
  bookings,
  notifications,
  setPage,
}: {
  customers: Customer[];
  bookings: Booking[];
  notifications: Awaited<ReturnType<typeof api.notifications.list>>;
  setPage: (page: Page) => void;
}) {
  const confirmedBookings = bookings.filter((booking) => booking.status === 'CONFIRMED');
  const tomorrowBookings = confirmedBookings.filter(isBookingTomorrow);
  const sent = notifications.filter((item) => item.status === 'SENT').length;
  const skipped = notifications.filter((item) => item.status === 'SKIPPED').length;
  const failed = notifications.filter((item) => item.status === 'FAILED').length;
  const withoutOptIn = customers.filter((customer) => !customer.reminderOptIn).length;

  const channelData = CHANNELS.map((channel) => ({
    name: channelLabel(channel),
    value: customers.filter((customer) => customer.preferredChannel === channel).length,
  })).filter((item) => item.value > 0);

  const statusData = [
    { name: 'Inviati', value: sent },
    { name: 'Saltati', value: skipped },
    { name: 'Falliti', value: failed },
  ].filter((item) => item.value > 0);

  const upcoming = [...confirmedBookings]
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-7">
      <Card className="relative overflow-hidden p-7">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-32 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[1.4fr_0.6fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-indigo-200">
              <Sparkles className="h-4 w-4" /> Sistema reminder attivo
            </div>
            <h3 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
              Controlla prenotazioni, consenso e notifiche da una cabina di regia.
            </h3>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Una dashboard locale per governare invii automatici, testare canali, leggere log e intervenire sulle prenotazioni critiche.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={() => setPage('bookings')}>
                <CalendarDays className="h-4 w-4" /> Gestisci prenotazioni
              </Button>
              <Button variant="secondary" onClick={() => setPage('notifications')}>
                <BellRing className="h-4 w-4" /> Apri log notifiche
              </Button>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-5">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Mission control</p>
            <div className="mt-5 grid gap-3">
              <MiniMetric label="Backend" value="Online" tone="emerald" />
              <MiniMetric label="Provider" value="Dry-run" tone="indigo" />
              <MiniMetric label="Timezone" value="Europe/Rome" tone="cyan" />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Prenotazioni domani" value={tomorrowBookings.length} icon={CalendarClock} subtitle="Confermate" />
        <StatCard title="Reminder inviati" value={sent} icon={CheckCircle2} subtitle="Log SENT" tone="emerald" />
        <StatCard title="Reminder saltati" value={skipped} icon={MessageSquareWarning} subtitle="Log SKIPPED" tone="amber" />
        <StatCard title="Senza consenso" value={withoutOptIn} icon={ShieldCheck} subtitle="Opt-in assente" tone="rose" />
        <StatCard title="Errori invio" value={failed} icon={XCircle} subtitle="Log FAILED" tone="rose" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-white">Prossime prenotazioni</h3>
              <p className="text-sm text-slate-400">Le prossime confermate in ordine cronologico.</p>
            </div>
            <Button variant="ghost" onClick={() => setPage('bookings')}>Vedi tutte</Button>
          </div>
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <EmptyState title="Nessuna prenotazione confermata" description="Crea una prenotazione per visualizzarla qui." />
            ) : (
              upcoming.map((booking) => <BookingRow key={booking.id} booking={booking} compact />)
            )}
          </div>
        </Card>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
          <Card>
            <h3 className="text-xl font-black text-white">Canali preferiti</h3>
            <p className="mb-4 text-sm text-slate-400">Distribuzione clienti per canale.</p>
            {channelData.length === 0 ? (
              <EmptyState title="Nessun dato" description="Aggiungi clienti per vedere il grafico." />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis allowDecimals={false} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16 }} />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#818cf8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-xl font-black text-white">Esito notifiche</h3>
            <p className="mb-4 text-sm text-slate-400">Ultimo stato registrato nei log.</p>
            {statusData.length === 0 ? (
              <EmptyState title="Nessun log" description="Invia un reminder per popolare questa sezione." />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={5}>
                      {statusData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function CustomersPage({
  customers,
  showToast,
  telegramBotUsername,
}: {
  customers: Customer[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  telegramBotUsername: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: api.customers.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast('Cliente creato con successo');
      setOpen(false);
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateCustomerPayload> }) => api.customers.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast('Cliente aggiornato');
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  const filtered = customers.filter((customer) => {
    const query = search.toLowerCase();
    return (
      customer.fullName.toLowerCase().includes(query) ||
      customer.phoneNumber.includes(query) ||
      customer.email?.toLowerCase().includes(query)
    );
  });
const copyTelegramLink = async (customerId: string) => {
  if (!telegramBotUsername) {
    showToast('Configura TELEGRAM_BOT_USERNAME nel file .env', 'error');
    return;
  }

  const cleanUsername = telegramBotUsername.replace(/^@/, '');
  const link = `https://t.me/${cleanUsername}?start=${customerId}`;

  await navigator.clipboard.writeText(link);
  showToast('Link Telegram copiato negli appunti');
};
  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Rubrica"
        title="Clienti"
        description="Gestisci opt-in, canale preferito e dati di contatto. Il sistema non invia senza consenso."
        action={<Button onClick={() => setOpen(true)}><UserPlus className="h-4 w-4" /> Nuovo cliente</Button>}
      />

      <Card>
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca nome, telefono o email..." />
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-300">
            {filtered.length} clienti
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr className="border-b border-white/10">
                <th className="py-3">Cliente</th>
                <th>Contatto</th>
                <th>Canale</th>
                <th>Consenso</th>
                <th>Telegram</th>
                <th className="text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} className="border-b border-white/5 last:border-0">
                  <td className="py-4">
                    <p className="font-bold text-white">{customer.fullName}</p>
                    <p className="text-xs text-slate-500">ID {customer.id.slice(0, 8)}</p>
                  </td>
                  <td>
                    <p className="text-slate-200">{customer.phoneNumber}</p>
                    <p className="text-xs text-slate-500">{customer.email ?? 'Email non inserita'}</p>
                  </td>
                  <td><ChannelBadge channel={customer.preferredChannel} /></td>
                  <td>
                    <button
                      onClick={() => updateMutation.mutate({ id: customer.id, payload: { reminderOptIn: !customer.reminderOptIn } })}
                      className={customer.reminderOptIn ? 'rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200' : 'rounded-full bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-200'}
                    >
                      {customer.reminderOptIn ? 'Opt-in attivo' : 'Opt-in assente'}
                    </button>
                  </td>
                  <td className="text-slate-400">{customer.telegramChatId ? 'Collegato' : 'Non collegato'}</td>
                 <td className="text-right">
  <div className="flex flex-wrap justify-end gap-2">
    <button
      onClick={() => copyTelegramLink(customer.id)}
      className="rounded-2xl border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs font-bold text-sky-200 transition hover:bg-sky-400/20"
    >
      Copia link Telegram
    </button>

    <Select
      value={customer.preferredChannel}
      onChange={(e) =>
        updateMutation.mutate({
          id: customer.id,
          payload: { preferredChannel: e.target.value as Channel },
        })
      }
      className="max-w-40"
    >
      {CHANNELS.map((channel) => (
        <option key={channel} value={channel}>
          {channelLabel(channel)}
        </option>
      ))}
    </Select>
  </div>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState title="Nessun cliente trovato" description="Crea un cliente o modifica la ricerca." />}
      </Card>

      <CustomerModal open={open} onClose={() => setOpen(false)} isLoading={createMutation.isPending} onSubmit={(payload) => createMutation.mutate(payload)} />
    </div>
  );
}

function BookingsPage({ customers, bookings, showToast }: { customers: Customer[]; bookings: Booking[]; showToast: (message: string, type?: 'success' | 'error') => void }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | BookingStatus>('ALL');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: api.bookings.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      showToast('Prenotazione creata');
      setOpen(false);
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) => api.bookings.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      showToast('Stato prenotazione aggiornato');
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  const reminderMutation = useMutation({
    mutationFn: api.bookings.sendReminderNow,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      showToast(result.queued ? 'Reminder inserito in coda' : result.reason ?? 'Reminder non accodato', result.queued ? 'success' : 'error');
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  const filtered = bookings
    .filter((booking) => filter === 'ALL' || booking.status === filter)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Agenda"
        title="Prenotazioni"
        description="Crea appuntamenti, cambia stato e invia reminder manuali per testare il flusso end-to-end."
        action={<Button onClick={() => setOpen(true)} disabled={customers.length === 0}><Plus className="h-4 w-4" /> Nuova prenotazione</Button>}
      />

      <Card>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {(['ALL', ...BOOKING_STATUSES] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={filter === status ? 'rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-950' : 'rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-400 transition hover:text-white'}
            >
              {status === 'ALL' ? 'Tutte' : bookingStatusLabel(status)}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {filtered.map((booking) => (
            <div key={booking.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
              <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
                <BookingRow booking={booking} />
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <Select
                    value={booking.status}
                    onChange={(e) => statusMutation.mutate({ id: booking.id, status: e.target.value as BookingStatus })}
                    className="max-w-44"
                  >
                    {BOOKING_STATUSES.map((status) => <option key={status} value={status}>{bookingStatusLabel(status)}</option>)}
                  </Select>
                  <Button variant="secondary" onClick={() => reminderMutation.mutate(booking.id)} disabled={reminderMutation.isPending}>
                    <Send className="h-4 w-4" /> Invia ora
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <EmptyState title="Nessuna prenotazione" description="Crea una prenotazione o cambia filtro." />}
        </div>
      </Card>

      <BookingModal
        open={open}
        customers={customers}
        onClose={() => setOpen(false)}
        isLoading={createMutation.isPending}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
    </div>
  );
}

function NotificationsPage({ notifications }: { notifications: Awaited<ReturnType<typeof api.notifications.list>> }) {
  const [filter, setFilter] = useState<'ALL' | 'SENT' | 'FAILED' | 'SKIPPED' | 'PENDING'>('ALL');
  const filtered = notifications.filter((notification) => filter === 'ALL' || notification.status === filter);

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Audit trail"
        title="Log notifiche"
        description="Ogni tentativo è tracciato: stato, providerMessageId, errore e cliente collegato."
      />
      <Card>
        <div className="mb-5 flex flex-wrap gap-2">
          {(['ALL', 'SENT', 'SKIPPED', 'FAILED', 'PENDING'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={filter === status ? 'rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-950' : 'rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-400 transition hover:text-white'}
            >
              {status === 'ALL' ? 'Tutti' : status}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr className="border-b border-white/10">
                <th className="py-3">Stato</th>
                <th>Cliente</th>
                <th>Canale</th>
                <th>Prenotazione</th>
                <th>Provider ID</th>
                <th>Errore</th>
                <th>Creato</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((notification) => (
                <tr key={notification.id} className="border-b border-white/5 align-top last:border-0">
                  <td className="py-4"><NotificationStatusBadge status={notification.status} /></td>
                  <td>
                    <p className="font-bold text-white">{notification.customer?.fullName ?? 'Cliente'}</p>
                    <p className="text-xs text-slate-500">{notification.customer?.phoneNumber}</p>
                  </td>
                  <td><ChannelBadge channel={notification.channel} /></td>
                  <td>
                    <p className="text-slate-200">{notification.booking ? formatDateTime(notification.booking.startsAt) : notification.bookingId.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500">{notification.booking?.notes ?? '—'}</p>
                  </td>
                  <td className="max-w-56 break-all text-xs text-slate-400">{notification.providerMessageId ?? '—'}</td>
                  <td className="max-w-72 text-xs text-slate-400">{notification.errorMessage ?? '—'}</td>
                  <td className="text-slate-400">{formatDateTime(notification.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState title="Nessun log" description="Invia un reminder per visualizzare il tracciamento." />}
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'indigo',
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: ElementType;
  tone?: 'indigo' | 'emerald' | 'amber' | 'rose';
}) {
  const tones = {
    indigo: 'from-indigo-500/30 to-indigo-500/5 text-indigo-200',
    emerald: 'from-emerald-500/30 to-emerald-500/5 text-emerald-200',
    amber: 'from-amber-500/30 to-amber-500/5 text-amber-200',
    rose: 'from-rose-500/30 to-rose-500/5 text-rose-200',
  };
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-400">{title}</p>
          <p className="mt-2 text-4xl font-black text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${tones[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'indigo' | 'cyan' }) {
  const color = {
    emerald: 'bg-emerald-400',
    indigo: 'bg-indigo-400',
    cyan: 'bg-cyan-400',
  }[tone];
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="inline-flex items-center gap-2 text-sm font-black text-white"><span className={`h-2 w-2 rounded-full ${color}`} /> {value}</span>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-300">{eyebrow}</p>
        <h3 className="mt-2 text-3xl font-black text-white">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {action}
    </div>
  );
}

function BookingRow({ booking, compact = false }: { booking: Booking; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10">
          <Clock3 className="h-6 w-6 text-indigo-200" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-white">{booking.customer?.fullName ?? 'Cliente'}</p>
            <BookingStatusBadge status={booking.status} />
            {booking.customer && <ChannelBadge channel={booking.customer.preferredChannel} />}
          </div>
          <p className="mt-1 text-sm text-slate-400">{formatDateTime(booking.startsAt)} · {booking.notes ?? 'Nessuna nota'}</p>
          {!compact && <p className="mt-1 text-xs text-slate-500">Reminder: {booking.reminderSentAt ? `inviato alle ${formatTime(booking.reminderSentAt)}` : 'non ancora inviato'}</p>}
        </div>
      </div>
    </div>
  );
}

function CustomerModal({
  open,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCustomerPayload) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<CreateCustomerPayload>({
    fullName: '',
    phoneNumber: '+39',
    email: '',
    preferredChannel: 'SMS',
    reminderOptIn: true,
  });

  return (
    <Modal open={open} onClose={onClose} title="Nuovo cliente" description="Inserisci numero in formato E.164, per esempio +393331234567.">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ ...form, email: form.email || undefined });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome completo"><Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Mario Rossi" /></Field>
          <Field label="Telefono"><Input required value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} placeholder="+39333..." /></Field>
          <Field label="Email"><Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="cliente@email.it" /></Field>
          <Field label="Canale preferito">
            <Select value={form.preferredChannel} onChange={(e) => setForm({ ...form, preferredChannel: e.target.value as Channel })}>
              {CHANNELS.map((channel) => <option key={channel} value={channel}>{channelLabel(channel)}</option>)}
            </Select>
          </Field>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
          <input type="checkbox" checked={form.reminderOptIn} onChange={(e) => setForm({ ...form, reminderOptIn: e.target.checked })} />
          Cliente autorizza la ricezione dei reminder
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Annulla</Button>
          <Button type="submit" disabled={isLoading}>Salva cliente</Button>
        </div>
      </form>
    </Modal>
  );
}

function BookingModal({
  open,
  customers,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  customers: Customer[];
  onClose: () => void;
  onSubmit: (payload: CreateBookingPayload) => void;
  isLoading: boolean;
}) {
  const tomorrowLocal = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(10, 30, 0, 0);
    return date.toISOString().slice(0, 16);
  }, []);
  const [form, setForm] = useState({ customerId: customers[0]?.id ?? '', startsAt: tomorrowLocal, status: 'CONFIRMED' as BookingStatus, notes: '' });

  return (
    <Modal open={open} onClose={onClose} title="Nuova prenotazione" description="Crea un appuntamento e lascia che il cron invii il reminder il giorno prima.">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ ...form, startsAt: new Date(form.startsAt).toISOString(), notes: form.notes || undefined });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Cliente">
            <Select required value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              <option value="" disabled>Seleziona cliente</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.fullName}</option>)}
            </Select>
          </Field>
          <Field label="Data e ora">
            <Input type="datetime-local" required value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          </Field>
          <Field label="Stato">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BookingStatus })}>
              {BOOKING_STATUSES.map((status) => <option key={status} value={status}>{bookingStatusLabel(status)}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Note"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Prima visita, controllo, appuntamento urgente..." /></Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Annulla</Button>
          <Button type="submit" disabled={isLoading || customers.length === 0}>Salva prenotazione</Button>
        </div>
      </form>
    </Modal>
  );
}

export default App;
