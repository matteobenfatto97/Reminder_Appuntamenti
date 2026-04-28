import clsx from 'clsx';
import {
  Activity,
  BellRing,
  CalendarDays,
  LayoutDashboard,
  MessageCircle,
  RefreshCw,
  Settings,
  UsersRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { api } from '../api/client';

export type Page = 'overview' | 'customers' | 'bookings' | 'notifications';

const nav = [
  { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
  { id: 'customers' as const, label: 'Clienti', icon: UsersRound },
  { id: 'bookings' as const, label: 'Prenotazioni', icon: CalendarDays },
  { id: 'notifications' as const, label: 'Notifiche', icon: BellRing },
];

export function Layout({
  page,
  setPage,
  children,
  isFetching,
  onRefresh,
}: {
  page: Page;
  setPage: (page: Page) => void;
  children: ReactNode;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-950 bg-aurora text-slate-100">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="relative grid min-h-screen lg:grid-cols-[300px_1fr]">
        <aside className="hidden border-r border-white/10 bg-slate-950/55 p-5 backdrop-blur-2xl lg:block">
          <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.07] p-4 shadow-glow">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400">Automatic</p>
              <h1 className="text-lg font-black tracking-tight text-white">Reminder OS</h1>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition',
                    active
                      ? 'bg-white text-slate-950 shadow-lg shadow-white/10'
                      : 'text-slate-400 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 rounded-3xl border border-indigo-400/20 bg-indigo-500/10 p-5">
            <div className="flex items-center gap-2 text-indigo-200">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">API online</span>
            </div>
            <p className="mt-3 break-all text-sm text-slate-300">{api.baseUrl}</p>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              Modalità locale: dashboard su 5173, backend su 3000, notifiche in dry-run finché non configuri Twilio/Telegram reali.
            </p>
          </div>

          <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/10 bg-white/[0.05] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-800">
                <Settings className="h-5 w-5 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Workspace locale</p>
                <p className="text-xs text-slate-400">Europe/Rome · Docker</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="relative p-4 md:p-8">
          <header className="mb-7 flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/45 p-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">Appointment Reminder</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">Dashboard operativa</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-2xl border border-white/10 bg-white/[0.04] p-1 lg:hidden">
                {nav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setPage(item.id)}
                      className={clsx(
                        'rounded-xl p-2 transition',
                        page === item.id ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white',
                      )}
                      title={item.label}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
              <button
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
              >
                <RefreshCw className={clsx('h-4 w-4', isFetching && 'animate-spin')} />
                Aggiorna
              </button>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
