import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import { CalendarDays, Clock3 } from 'lucide-react';
import type { Booking } from '../types/domain';

type CalendarPageProps = {
  bookings: Booking[];
  onOpenBookings: () => void;
};

function formatCalendarDate(value: string) {
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getEventClassName(status: string) {
  if (status === 'COMPLETED') return 'calendar-event-completed';
  if (status === 'CANCELLED') return 'calendar-event-cancelled';
  return 'calendar-event-confirmed';
}

export function CalendarPage({ bookings, onOpenBookings }: CalendarPageProps) {
  const events = bookings.map((booking) => ({
    id: booking.id,
    title: `${booking.customer?.fullName ?? 'Cliente'}${
      booking.notes ? ` — ${booking.notes}` : ''
    }`,
    start: booking.startsAt,
    classNames: [getEventClassName(booking.status)],
    extendedProps: {
      status: booking.status,
      customerName: booking.customer?.fullName ?? 'Cliente',
      notes: booking.notes ?? null,
      reminderSentAt: booking.reminderSentAt,
    },
  }));

  const nextBookings = [...bookings]
    .filter((booking) => booking.status === 'CONFIRMED')
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    )
    .slice(0, 5);

  const handleEventClick = (_event: EventClickArg) => {
    onOpenBookings();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-300">
            Agenda operativa
          </p>

          <h3 className="mt-2 text-3xl font-black text-white">
            Calendario appuntamenti
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Visualizza tutte le prenotazioni in calendario. Clicca su un evento
            per aprire la gestione appuntamenti.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-300">
          <CalendarDays className="h-4 w-4 text-indigo-200" />
          {bookings.length} appuntamenti
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="calendar-shell rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-black/20">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            locale="it"
            firstDay={1}
            height="auto"
            events={events}
            eventClick={handleEventClick}
            nowIndicator
            buttonText={{
              today: 'Oggi',
              month: 'Mese',
              week: 'Settimana',
              day: 'Giorno',
            }}
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-black/20">
          <div className="mb-5">
            <h3 className="text-xl font-black text-white">
              Prossimi appuntamenti
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Le prossime prenotazioni confermate.
            </p>
          </div>

          <div className="space-y-3">
            {nextBookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center">
                <p className="font-black text-white">
                  Nessun appuntamento confermato
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Crea una prenotazione per vederla nel calendario.
                </p>
              </div>
            ) : (
              nextBookings.map((booking) => (
                <button
                  key={booking.id}
                  onClick={onOpenBookings}
                  className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-indigo-400/40 hover:bg-indigo-400/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-400/10">
                      <Clock3 className="h-5 w-5 text-indigo-200" />
                    </div>

                    <div>
                      <p className="font-black text-white">
                        {booking.customer?.fullName ?? 'Cliente'}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {formatCalendarDate(booking.startsAt)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {booking.notes ?? 'Nessuna nota'}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}