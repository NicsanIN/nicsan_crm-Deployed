import { useState, useEffect, useCallback } from 'react';
import { Inbox, Play, Upload, Download } from 'lucide-react';
import { taskApi, type TaskRow } from '../../../services/taskApi';
import WebSocketSyncService from '../../../services/websocketSyncService';

const STATUS_OPTIONS = ['AVAILABLE', 'BUSY', 'BREAK', 'OFFLINE'] as const;

export default function TaskInbox() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'AVAILABLE' | 'BUSY' | 'BREAK' | 'OFFLINE'>('OFFLINE');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [taskDetail, setTaskDetail] = useState<(TaskRow & { documents?: { document_type: string; download_url: string | null }[] }) | null>(null);
  const [completeDocType, setCompleteDocType] = useState<'QUOTE' | 'ISSUED_POLICY'>('QUOTE');
  const [completeFile, setCompleteFile] = useState<File | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const res = await taskApi.getAssigned();
    if (res.success && res.data) setTasks(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const loadMyStatus = async () => {
      const res = await taskApi.getExecutiveStatus();
      if (res.success && res.data?.status && STATUS_OPTIONS.includes(res.data.status as typeof status)) {
        setStatus(res.data.status as typeof status);
      }
    };
    loadMyStatus();
  }, []);

  useEffect(() => {
    const ws = WebSocketSyncService.getInstance();
    const handler = () => loadTasks();
    ws.onTaskAssigned(handler);
    return () => ws.removeTaskAssignedCallback(handler);
  }, [loadTasks]);

  const handleStatusChange = async (newStatus: typeof status) => {
    setStatusUpdating(true);
    const res = await taskApi.setExecutiveStatus(newStatus);
    setStatusUpdating(false);
    if (res.success) setStatus(newStatus);
  };

  const openDetail = async (id: number) => {
    setSelectedId(id);
    const res = await taskApi.getTask(id);
    if (res.success && res.data) {
      setTaskDetail(res.data);
      setCompleteDocType(res.data.action_type === 'QUOTE' ? 'QUOTE' : 'ISSUED_POLICY');
      setCompleteFile(null);
    }
  };

  const handleStart = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    const res = await taskApi.startTask(selectedId);
    setActionLoading(false);
    if (res.success) {
      loadTasks();
      if (taskDetail) setTaskDetail({ ...taskDetail, status: 'IN_PROGRESS' });
    }
  };

  const handleComplete = async () => {
    if (!selectedId || !taskDetail) return;
    if (taskDetail.action_type === 'QUOTE' && !completeFile) return;
    if (taskDetail.action_type === 'ISSUE_POLICY' && !completeFile) return;
    setActionLoading(true);
    const res = await taskApi.completeTask(selectedId, completeDocType, completeFile);
    setActionLoading(false);
    if (res.success) {
      setSelectedId(null);
      setTaskDetail(null);
      loadTasks();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Inbox className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Task Inbox</h1>
            <p className="text-sm text-zinc-600">Tasks assigned to you. Set availability to receive new tasks.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600">Status:</span>
          <span
            className={`px-2 py-1 rounded-lg text-xs font-medium ${
              status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
              status === 'BUSY' ? 'bg-amber-100 text-amber-800' :
              status === 'BREAK' ? 'bg-blue-100 text-blue-800' :
              'bg-zinc-100 text-zinc-600'
            }`}
          >
            {status}
          </span>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as typeof status)}
            disabled={statusUpdating}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        {loading && tasks.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No tasks assigned. Set status to AVAILABLE to receive tasks.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left p-3 font-medium text-zinc-700">Customer</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Vehicle</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Company</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Action</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Status</th>
                  <th className="text-left p-3 font-medium text-zinc-700">SLA</th>
                  <th className="text-left p-3 font-medium text-zinc-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="p-3">{t.customer_name}</td>
                    <td className="p-3">{t.vehicle_no}</td>
                    <td className="p-3">{t.company}</td>
                    <td className="p-3">{t.action_type}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        t.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>{t.status}</span>
                    </td>
                    <td className="p-3">{t.sla_deadline ? new Date(t.sla_deadline).toLocaleTimeString() : '—'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => openDetail(t.id)}
                        className="text-blue-600 hover:underline"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {taskDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 my-8">
            <h2 className="text-lg font-semibold mb-2">Task #{taskDetail.id}</h2>
            <p className="text-sm text-zinc-600 mb-4">{taskDetail.customer_name} · {taskDetail.vehicle_no} · {taskDetail.company}</p>
            <dl className="grid grid-cols-2 gap-2 text-sm mb-4">
              <dt className="text-zinc-500">Action</dt><dd>{taskDetail.action_type}</dd>
              <dt className="text-zinc-500">Policy type</dt><dd>{taskDetail.policy_type}</dd>
              <dt className="text-zinc-500">Product</dt><dd>{taskDetail.product_type}</dd>
              {taskDetail.phone && <><dt className="text-zinc-500">Phone</dt><dd>{taskDetail.phone}</dd></>}
              {taskDetail.email && <><dt className="text-zinc-500">Email</dt><dd>{taskDetail.email}</dd></>}
              {taskDetail.cashback != null && <><dt className="text-zinc-500">Cashback</dt><dd>₹{taskDetail.cashback}</dd></>}
            </dl>
            <div className="mb-4">
              <p className="text-xs font-medium text-zinc-500 mb-2">Documents (from telecaller)</p>
              <div className="space-y-1">
                {taskDetail.documents?.filter((d) => ['PREVIOUS_POLICY', 'RC', 'KYC'].includes(d.document_type)).map((d) => (
                  <a key={d.document_type} href={d.download_url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 text-sm">
                    <Download className="w-4 h-4" /> {d.document_type}
                  </a>
                ))}
              </div>
            </div>
            {taskDetail.status === 'ASSIGNED' && (
              <button onClick={handleStart} disabled={actionLoading} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-900 text-white text-sm mb-4">
                <Play className="w-4 h-4" /> Start Task
              </button>
            )}
            {(taskDetail.status === 'ASSIGNED' || taskDetail.status === 'IN_PROGRESS') && (
              <>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Upload {completeDocType} PDF to complete</label>
                <input type="file" accept=".pdf,image/*" onChange={(e) => setCompleteFile(e.target.files?.[0] || null)} className="w-full text-sm mb-4" />
                <button onClick={handleComplete} disabled={actionLoading || !completeFile} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-green-600 text-white text-sm">
                  <Upload className="w-4 h-4" /> Mark Complete
                </button>
              </>
            )}
            <button onClick={() => { setSelectedId(null); setTaskDetail(null); }} className="mt-4 w-full py-2 rounded-xl border border-zinc-300 text-sm">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
