import { useState, useEffect, useCallback } from 'react';
import { List, Download, RefreshCw, X } from 'lucide-react';
import { taskApi, type TaskRow } from '../../services/taskApi';
import WebSocketSyncService from '../../services/websocketSyncService';

export default function MyRequests() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailTask, setDetailTask] = useState<(TaskRow & { documents?: { document_type: string; download_url: string | null }[] }) | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await taskApi.getMyRequests();
    if (res.success && res.data) setTasks(res.data);
    else setError(res.error || 'Failed to load');
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const ws = WebSocketSyncService.getInstance();
    const handler = () => load();
    ws.onTaskCompleted(handler);
    return () => ws.removeTaskCompletedCallback(handler);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <List className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">My Requests</h1>
            <p className="text-sm text-zinc-600">Track status and download quote/issued policy when ready.</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        {loading && tasks.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No requests yet. Create one from Create Request.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left p-3 font-medium text-zinc-700">Customer</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Vehicle</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Company</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Type</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Status</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Assigned To</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Created</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Download</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="p-3">{t.customer_name}</td>
                    <td className="p-3">{t.vehicle_no}</td>
                    <td className="p-3">{t.company}</td>
                    <td className="p-3">{t.action_type} / {t.policy_type}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        t.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        'bg-zinc-100 text-zinc-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3">{t.assigned_to_name || '—'}</td>
                    <td className="p-3">{t.created_at ? new Date(t.created_at).toLocaleString() : '—'}</td>
                    <td className="p-3">
                      {t.status === 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await taskApi.getTask(t.id);
                            if (res.success && res.data) setDetailTask(res.data);
                          }}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" /> View / Download
                        </button>
                      )}
                      {t.status !== 'COMPLETED' && '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Task #{detailTask.id} – Documents</h2>
              <button onClick={() => setDetailTask(null)} className="p-1 rounded hover:bg-zinc-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-zinc-600 mb-3">{detailTask.customer_name} · {detailTask.vehicle_no}</p>
            <div className="space-y-2">
              {detailTask.documents?.filter((d) => d.document_type === 'QUOTE' || d.document_type === 'ISSUED_POLICY').map((d) => (
                <a
                  key={d.document_type}
                  href={d.download_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-blue-600"
                >
                  <Download className="w-4 h-4" /> {d.document_type}
                </a>
              ))}
              {(!detailTask.documents || detailTask.documents.length === 0) && (
                <p className="text-sm text-zinc-500">No documents to download.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
