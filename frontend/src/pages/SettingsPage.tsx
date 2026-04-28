import { Card } from '../components/ui';
import type { SettingsStatus } from '../types/domain';

export function SettingsPage({
  status,
  isLoading,
}: {
  status: SettingsStatus | null;
  isLoading: boolean;
  showToast: (message: string, type?: 'success' | 'error') => void;
}) {
  return (
    <div className="space-y-5">
      <Card>
        <h3 className="text-xl font-black text-white">Impostazioni</h3>
        <p className="mt-2 text-sm text-slate-400">
          Pagina impostazioni collegata correttamente.
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
          <p>
            <strong>Modalità:</strong> {status?.mode ?? 'Caricamento...'}
          </p>
          <p>
            <strong>Cron:</strong> {status?.cron ?? 'Caricamento...'}
          </p>
          <p>
            <strong>Timezone:</strong> {status?.timezone ?? 'Caricamento...'}
          </p>
          <p>
            <strong>Twilio SMS:</strong>{' '}
            {status?.providers.twilioSms.configured ? 'Configurato' : 'Non configurato'}
          </p>
          <p>
            <strong>Stato:</strong> {isLoading ? 'Aggiornamento...' : 'Sincronizzato'}
          </p>
        </div>
      </Card>
    </div>
  );
}