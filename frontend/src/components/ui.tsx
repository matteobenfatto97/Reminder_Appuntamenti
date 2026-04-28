import clsx from 'clsx';
import type { ReactNode } from 'react';
import type { BookingStatus, Channel, NotificationStatus } from '../types/domain';
import { bookingStatusLabel, channelLabel, notificationStatusLabel } from '../lib/format';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={clsx(
        'rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-soft backdrop-blur-xl',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  const variants = {
    primary:
      'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-400 disabled:bg-indigo-500/40',
    secondary:
      'border border-white/10 bg-white/10 text-white hover:bg-white/15 disabled:bg-white/5',
    ghost: 'text-slate-300 hover:bg-white/10 hover:text-white disabled:text-slate-600',
    danger: 'bg-rose-500 text-white hover:bg-rose-400 disabled:bg-rose-500/40',
  };
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-400/70 disabled:cursor-not-allowed',
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20',
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        'w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20',
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        'min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20',
        props.className,
      )}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-300">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-indigo-950/50">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
      <p className="text-lg font-bold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}

export function ChannelBadge({ channel }: { channel: Channel }) {
  const style = {
    SMS: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
    WHATSAPP: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    TELEGRAM: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  }[channel];
  return <span className={clsx('rounded-full border px-2.5 py-1 text-xs font-bold', style)}>{channelLabel(channel)}</span>;
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const style = {
    CONFIRMED: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-200',
    CANCELLED: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
    COMPLETED: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  }[status];
  return <span className={clsx('rounded-full border px-2.5 py-1 text-xs font-bold', style)}>{bookingStatusLabel(status)}</span>;
}

export function NotificationStatusBadge({ status }: { status: NotificationStatus }) {
  const style = {
    SENT: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    FAILED: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
    SKIPPED: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    PENDING: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
  }[status];
  return <span className={clsx('rounded-full border px-2.5 py-1 text-xs font-bold', style)}>{notificationStatusLabel(status)}</span>;
}

export function Toast({ message, type }: { message: string | null; type: 'success' | 'error' }) {
  if (!message) return null;
  return (
    <div
      className={clsx(
        'fixed right-5 top-5 z-[60] rounded-2xl border px-5 py-4 text-sm font-semibold shadow-2xl backdrop-blur-xl',
        type === 'success'
          ? 'border-emerald-400/30 bg-emerald-950/80 text-emerald-100'
          : 'border-rose-400/30 bg-rose-950/80 text-rose-100',
      )}
    >
      {message}
    </div>
  );
}
