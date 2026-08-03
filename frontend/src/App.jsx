import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { GitPullRequest, ServerCog, ShieldCheck, PlusCircle, RefreshCw, Eye, X, ArrowLeftRight } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

const blankForm = {
  hostname: '',
  ip_address: '',
  vendor: '',
  username: '',
  password: '',
  secret: '',
  port: '22',
};

function App() {
  const [summary, setSummary] = useState(null);
  const [devices, setDevices] = useState([]);
  const [backups, setBackups] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [detailDeviceId, setDetailDeviceId] = useState(null);
  const [selectedBaseBackupId, setSelectedBaseBackupId] = useState(null);
  const [selectedCompareBackupId, setSelectedCompareBackupId] = useState(null);
  const [diffLines, setDiffLines] = useState([]);
  const [diffLoading, setDiffLoading] = useState(false);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId) ?? null,
    [devices, selectedDeviceId],
  );

  const detailDevice = useMemo(
    () => devices.find((device) => device.id === detailDeviceId) ?? null,
    [devices, detailDeviceId],
  );

  async function loadDashboard() {
    try {
      const response = await axios.get(`${API_BASE}/metrics/dashboard`);
      setSummary(response.data);
    } catch (err) {
      setError('Unable to load dashboard data.');
    }
  }

  async function loadDevices() {
    try {
      const response = await axios.get(`${API_BASE}/devices/`);
      setDevices(response.data);
      if (!selectedDeviceId && response.data.length) {
        setSelectedDeviceId(response.data[0].id);
      }
    } catch (err) {
      setError('Unable to load devices.');
    }
  }

  async function loadBackups(deviceId) {
    if (!deviceId) {
      setBackups([]);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/backups/`, { params: { device_id: deviceId } });
      setBackups(response.data);
    } catch (err) {
      setError('Unable to load backup history.');
    }
  }

  async function loadDiff(baseId, compareId) {
    setDiffLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/backups/diff`, {
        params: { base_id: baseId, compare_id: compareId },
      });
      setDiffLines(response.data.diff_lines ?? []);
    } catch (err) {
      setError('Unable to load backup diff.');
    } finally {
      setDiffLoading(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([loadDashboard(), loadDevices()]);
      setLoading(false);
    }

    loadData();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      loadBackups(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setStatusMessage(null);

    const payload = {
      hostname: form.hostname,
      ip_address: form.ip_address,
      vendor: form.vendor,
      username: form.username,
      port: Number(form.port),
    };

    if (form.password) {
      payload.password = form.password;
    }
    if (form.secret) {
      payload.secret = form.secret;
    }

    try {
      if (editingDeviceId) {
        const updatePayload = Object.fromEntries(
          Object.entries(payload).filter(([, value]) => value !== '')
        );
        await axios.patch(`${API_BASE}/devices/${editingDeviceId}`, updatePayload);
        setStatusMessage('Device updated.');
      } else {
        await axios.post(`${API_BASE}/devices/`, payload);
        setStatusMessage('Device created.');
      }

      setForm(blankForm);
      setEditingDeviceId(null);
      await loadDevices();
      await loadDashboard();
    } catch (err) {
      setError('The device could not be saved.');
    }
  }

  function startEdit(device) {
    setEditingDeviceId(device.id);
    setForm({
      hostname: device.hostname,
      ip_address: device.ip_address,
      vendor: device.vendor,
      username: device.username,
      password: '',
      secret: '',
      port: String(device.port),
    });
  }

  async function handleDelete(deviceId) {
    if (!window.confirm('Remove this device?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/devices/${deviceId}`);
      setStatusMessage('Device removed.');
      await loadDevices();
      await loadDashboard();
    } catch (err) {
      setError('Unable to delete device.');
    }
  }

  async function handleBackup(deviceId) {
    try {
      await axios.post(`${API_BASE}/backups/manual`, null, { params: { device_id: deviceId } });
      setStatusMessage('Backup request completed.');
      await loadBackups(deviceId);
      await loadDashboard();
    } catch (err) {
      setError('The backup request failed.');
    }
  }

  function openDetailModal(device) {
    setDetailDeviceId(device.id);
    setSelectedDeviceId(device.id);
    setSelectedBaseBackupId(null);
    setSelectedCompareBackupId(null);
    setDiffLines([]);
  }

  function closeDetailModal() {
    setDetailDeviceId(null);
    setSelectedBaseBackupId(null);
    setSelectedCompareBackupId(null);
    setDiffLines([]);
  }

  async function handleShowDiff() {
    if (!selectedBaseBackupId || !selectedCompareBackupId) {
      setError('Select one backup as the base and one as the comparison target.');
      return;
    }

    if (selectedBaseBackupId === selectedCompareBackupId) {
      setError('Choose two different backups to compare.');
      return;
    }

    await loadDiff(selectedBaseBackupId, selectedCompareBackupId);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Net Almoner</p>
            <h1 className="text-4xl font-semibold">Network backup dashboard</h1>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-slate-400">Live backup health</span>
          </div>
        </header>

        {error && <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-200">{error}</div>}
        {statusMessage && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">{statusMessage}</div>}

        {loading ? (
          <div className="text-slate-300">Loading dashboard...</div>
        ) : (
          <>
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

            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Device management</p>
                    <h2 className="text-xl font-semibold">Create and edit devices</h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-800 px-3 py-2 text-sm text-slate-300">
                    <PlusCircle className="h-4 w-4" />
                    {editingDeviceId ? 'Edit mode' : 'Create mode'}
                  </div>
                </div>

                <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                  <input name="hostname" value={form.hostname} onChange={updateForm} required className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" placeholder="Hostname" />
                  <input name="ip_address" value={form.ip_address} onChange={updateForm} required className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" placeholder="IP address" />
                  <input name="vendor" value={form.vendor} onChange={updateForm} required className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" placeholder="Vendor" />
                  <input name="username" value={form.username} onChange={updateForm} required className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" placeholder="Username" />
                  <input name="password" type="password" value={form.password} onChange={updateForm} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" placeholder="Password" />
                  <input name="secret" type="password" value={form.secret} onChange={updateForm} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" placeholder="Enable secret" />
                  <input name="port" type="number" value={form.port} onChange={updateForm} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3" placeholder="Port" />
                  <div className="md:col-span-2 flex gap-3">
                    <button type="submit" className="rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white">{editingDeviceId ? 'Save changes' : 'Create device'}</button>
                    {editingDeviceId && (
                      <button type="button" onClick={() => { setEditingDeviceId(null); setForm(blankForm); }} className="rounded-2xl border border-slate-700 px-4 py-3 text-slate-300">Cancel</button>
                    )}
                  </div>
                </form>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Managed devices</p>
                    <h2 className="text-xl font-semibold">Select a device to back up</h2>
                  </div>
                  <button onClick={() => { loadDevices(); loadDashboard(); }} className="rounded-2xl border border-slate-700 px-3 py-2 text-sm text-slate-300">
                    <RefreshCw className="mr-2 inline h-4 w-4" />Refresh
                  </button>
                </div>

                <div className="space-y-3">
                  {devices.map((device) => (
                    <div key={device.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{device.hostname}</p>
                          <p className="text-sm text-slate-400">{device.ip_address} • {device.vendor}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(device)} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300">Edit</button>
                          <button onClick={() => handleDelete(device.id)} className="rounded-xl border border-rose-500/30 px-3 py-2 text-sm text-rose-300">Delete</button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button onClick={() => openDetailModal(device)} className="rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-200">
                          <Eye className="mr-2 inline h-4 w-4" />Details
                        </button>
                        <button onClick={() => handleBackup(device.id)} className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white">Run backup</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <GitPullRequest className="h-5 w-5 text-sky-400" />
                  <h2 className="text-lg font-semibold">Recent Alerts</h2>
                </div>
                {summary?.recent_alerts.length ? (
                  <ul className="space-y-3 text-sm text-slate-300">
                    {summary.recent_alerts.map((alert) => (
                      <li key={alert} className="rounded-2xl bg-slate-950/50 p-3">{alert}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">No alerts. All monitored devices are healthy.</p>
                )}
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <ServerCog className="h-5 w-5 text-violet-400" />
                  <h2 className="text-lg font-semibold">Backup history</h2>
                </div>
                {selectedDevice ? (
                  <>
                    <p className="mb-4 text-sm text-slate-400">Showing history for {selectedDevice.hostname}</p>
                    {backups.length ? (
                      <div className="space-y-3">
                        {backups.map((backup) => (
                          <div key={backup.id} className="rounded-2xl bg-slate-950/50 p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-semibold text-white">{backup.success ? 'Successful backup' : 'Failed backup'}</p>
                                <p className="text-sm text-slate-500">{backup.created_at}</p>
                              </div>
                              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">{backup.success ? 'OK' : 'ERR'}</span>
                            </div>
                            {backup.notes && <p className="mt-2 text-sm text-slate-400">{backup.notes}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500">No backups have been captured for this device yet.</p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500">Select a device to view its backup history.</p>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {detailDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Device detail</p>
                <h3 className="text-2xl font-semibold text-white">{detailDevice.hostname}</h3>
              </div>
              <button onClick={closeDetailModal} className="rounded-full border border-slate-700 p-2 text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <h4 className="mb-4 text-lg font-semibold text-white">Connection profile</h4>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex justify-between gap-4 rounded-2xl bg-slate-900/70 px-3 py-2">
                    <span className="text-slate-500">IP address</span>
                    <span className="font-medium text-white">{detailDevice.ip_address}</span>
                  </div>
                  <div className="flex justify-between gap-4 rounded-2xl bg-slate-900/70 px-3 py-2">
                    <span className="text-slate-500">Vendor</span>
                    <span className="font-medium text-white">{detailDevice.vendor}</span>
                  </div>
                  <div className="flex justify-between gap-4 rounded-2xl bg-slate-900/70 px-3 py-2">
                    <span className="text-slate-500">Username</span>
                    <span className="font-medium text-white">{detailDevice.username}</span>
                  </div>
                  <div className="flex justify-between gap-4 rounded-2xl bg-slate-900/70 px-3 py-2">
                    <span className="text-slate-500">Port</span>
                    <span className="font-medium text-white">{detailDevice.port}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white">Backup comparison</h4>
                    <p className="text-sm text-slate-400">Choose two snapshots and inspect the diff.</p>
                  </div>
                  <button onClick={handleShowDiff} className="rounded-2xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white">
                    <ArrowLeftRight className="mr-2 inline h-4 w-4" />Show diff
                  </button>
                </div>

                {backups.length ? (
                  <div className="space-y-3">
                    {backups.map((backup) => (
                      <div key={backup.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">{backup.success ? 'Successful backup' : 'Failed backup'}</p>
                            <p className="text-sm text-slate-500">{backup.created_at}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setSelectedBaseBackupId(backup.id)} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300">Use as base</button>
                            <button onClick={() => setSelectedCompareBackupId(backup.id)} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300">Use as compare</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No backup history available for this device yet.</p>
                )}

                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-400">
                  <p>Base backup: {selectedBaseBackupId ?? 'none'}</p>
                  <p>Compare backup: {selectedCompareBackupId ?? 'none'}</p>
                </div>

                {diffLoading ? (
                  <div className="mt-4 text-sm text-slate-400">Loading diff…</div>
                ) : diffLines.length ? (
                  <div className="mt-4 max-h-72 overflow-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-3 font-mono text-sm text-slate-300">
                    {diffLines.map((line, index) => (
                      <div key={`${line}-${index}`} className={line.startsWith('+') ? 'text-emerald-300' : line.startsWith('-') ? 'text-rose-300' : 'text-slate-400'}>
                        {line}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-slate-500">Select two backups to view a configuration diff.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
