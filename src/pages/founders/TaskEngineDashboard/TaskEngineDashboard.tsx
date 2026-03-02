import { useState, useEffect } from 'react';
import { LayoutDashboard, RefreshCw, UserPlus } from 'lucide-react';
import { taskApi } from '../../../services/taskApi';
import { userService } from '../../../services/userService';

function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-4">
      <div className="text-sm text-zinc-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-zinc-900">{value}</div>
      {sub && <div className="text-xs text-zinc-400 mt-1">{sub}</div>}
    </div>
  );
}

const REASSIGNABLE_STATUSES = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'SLA_BREACHED'];

export default function TaskEngineDashboard() {
  const [summary, setSummary] = useState<{
    total: number;
    pending: number;
    completed: number;
    sla_breached: number;
    sla_compliance_percent: number;
    by_status: Record<string, number>;
    recent: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reassignTaskId, setReassignTaskId] = useState<number | null>(null);
  const [reassignExecutiveId, setReassignExecutiveId] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignError, setReassignError] = useState('');
  const [opsUsers, setOpsUsers] = useState<{ id: number; name: string; status?: string }[]>([]);

  const fetchOps = async () => {
    try {
      const users = await userService.getAllUsers();
      setOpsUsers(users.filter((u) => u.role === 'ops' && u.is_active !== false).map((u) => ({ id: u.id, name: u.name, status: u.status })));
    } catch {
      setOpsUsers([]);
    }
  };

  const load = async () => {
    setLoading(true);
    setError('');
    const res = await taskApi.getTaskSummary();
    if (res.success && res.data) setSummary(res.data);
    else setError(res.error || 'Failed to load');
    setLoading(false);
    fetchOps();
  };

  useEffect(() => {
    load();
  }, []);

  const handleReassign = async () => {
    if (!reassignTaskId || !reassignExecutiveId) return;
    setReassignLoading(true);
    setReassignError('');
    const res = await taskApi.reassignTask(reassignTaskId, parseInt(reassignExecutiveId, 10));
    setReassignLoading(false);
    if (res.success) {
      setReassignTaskId(null);
      setReassignExecutiveId('');
      load();
    } else {
      setReassignError(res.error || 'Failed to reassign');
    }
  };

  if (loading && !summary) {
    return <div className="p-8 text-center text-zinc-500">Loading...</div>;
  }
  if (error && !summary) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }
  const s = summary!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <LayoutDashboard className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Task Engine Dashboard</h1>
            <p className="text-sm text-zinc-600">Overview of task allocation and SLA.</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <h2 className="p-4 border-b border-zinc-100 text-sm font-medium text-zinc-700">Operations members status</h2>
        {opsUsers.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No ops members.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left p-3 font-medium text-zinc-700">Name</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {opsUsers.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-100">
                    <td className="p-3">{u.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        u.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                        u.status === 'BUSY' ? 'bg-amber-100 text-amber-800' :
                        u.status === 'BREAK' ? 'bg-blue-100 text-blue-800' :
                        'bg-zinc-100 text-zinc-600'
                      }`}>{u.status || 'OFFLINE'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Total tasks" value={s.total} />
        <Tile label="Pending" value={s.pending} sub="ASSIGNED + IN_PROGRESS + PENDING" />
        <Tile label="Completed" value={s.completed} />
        <Tile label="SLA compliance" value={`${s.sla_compliance_percent}%`} sub={`Breached: ${s.sla_breached}`} />
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <h2 className="p-4 border-b border-zinc-100 text-sm font-medium text-zinc-700">Recent tasks</h2>
        {s.recent.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No tasks yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left p-3 font-medium text-zinc-700">ID</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Customer</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Vehicle</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Company</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Action</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Status</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Assigned To</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Created</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {s.recent.map((t: any) => (
                  <tr key={t.id} className="border-b border-zinc-100">
                    <td className="p-3">{t.id}</td>
                    <td className="p-3">{t.customer_name}</td>
                    <td className="p-3">{t.vehicle_no}</td>
                    <td className="p-3">{t.company}</td>
                    <td className="p-3">{t.action_type}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        t.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        t.status === 'SLA_BREACHED' ? 'bg-red-100 text-red-800' :
                        'bg-zinc-100 text-zinc-700'
                      }`}>{t.status}</span>
                    </td>
                    <td className="p-3">{t.assigned_to_name || '—'}</td>
                    <td className="p-3">{t.created_at ? new Date(t.created_at).toLocaleString() : '—'}</td>
                    <td className="p-3">
                      {REASSIGNABLE_STATUSES.includes(t.status) && (
                        <button
                          onClick={() => { setReassignTaskId(t.id); setReassignExecutiveId(''); setReassignError(''); }}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Reassign
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reassignTaskId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-2">Reassign Task #{reassignTaskId}</h2>
            <p className="text-sm text-zinc-600 mb-4">Select a new executive to assign this task to.</p>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Executive</label>
            <select
              value={reassignExecutiveId}
              onChange={(e) => setReassignExecutiveId(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm mb-4"
            >
              <option value="">— Select executive —</option>
              {opsUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            {reassignError && (
              <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{reassignError}</div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleReassign}
                disabled={reassignLoading || !reassignExecutiveId}
                className="flex-1 py-2 rounded-xl bg-zinc-900 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reassignLoading ? 'Reassigning...' : 'Reassign'}
              </button>
              <button
                onClick={() => { setReassignTaskId(null); setReassignError(''); }}
                disabled={reassignLoading}
                className="px-4 py-2 rounded-xl border border-zinc-300 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
