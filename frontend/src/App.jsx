import { useEffect, useState } from 'react';
import axios from 'axios';
import { GitPullRequest, ServerCog, ShieldCheck } from 'lucide-react';

function App() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await axios.get('http://127.0.0.1:8000/metrics/dashboard');
        setSummary(response.data);
      } catch (err) {
        setError('Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Net Almoner</p>
            <h1 className="text-4xl font-semibold">Network backup dashboard</h1>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-slate-400">Live backup health</span>
          </div>
        </header>

        {loading && <div className="text-slate-300">Loading dashboard...</div>}
        {error && <div className="rounded-2xl bg-rose-500/10 p-4 text-rose-200">{error}</div>}

        {summary && (
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Devices</p>
              <p className="mt-4 text-5xl font-semibold text-white">{summary.total_devices}</p>
              <p className="mt-2 text-sm text-slate-400">Monitored network devices</p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Backups</p>
              <p className="mt-4 text-5xl font-semibold text-white">{summary.backup_stats.total_backups}</p>
              <div className="mt-3 flex items-center gap-4 text-sm text-slate-400">
                <span>{summary.backup_stats.successful_backups} success</span>
                <span>{summary.backup_stats.failed_backups} failed</span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Health rate</p>
              <p className="mt-4 text-5xl font-semibold text-white">{summary.backup_stats.average_success_rate.toFixed(1)}%</p>
              <p className="mt-2 text-sm text-slate-400">Average backup success rate</p>
            </div>
          </section>
        )}

        {summary && (
          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-4 flex items-center gap-3">
                <GitPullRequest className="h-5 w-5 text-sky-400" />
                <h2 className="text-lg font-semibold">Recent Alerts</h2>
              </div>
              {summary.recent_alerts.length ? (
                <ul className="space-y-3 text-sm text-slate-300">
                  {summary.recent_alerts.map((alert) => (
                    <li key={alert} className="rounded-2xl bg-slate-950/50 p-3">
                      {alert}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">No alerts. All monitored devices are healthy.</p>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-4 flex items-center gap-3">
                <ServerCog className="h-5 w-5 text-violet-400" />
                <h2 className="text-lg font-semibold">Device Health</h2>
              </div>
              <div className="space-y-4">
                {summary.device_health.map((device) => (
                  <div key={device.device_id} className="rounded-2xl bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{device.hostname}</p>
                        <p className="text-sm text-slate-500">Last backup: {device.last_backup_at ?? 'never'}</p>
                      </div>
                      <span className="text-sm text-slate-400">{device.success_rate.toFixed(1)}%</span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-900/60 p-3 text-sm text-slate-300">
                        Backups: {device.backup_count}
                      </div>
                      <div className="rounded-2xl bg-slate-900/60 p-3 text-sm text-slate-300">
                        Status: {device.last_backup_status === false ? 'Failed' : 'OK'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
