/**
 * Task Engine API client (telecaller, executive, founder).
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function getToken(): string {
  return localStorage.getItem('authToken') || '';
}

function headers(): Record<string, string> {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };
}

async function handleRes<T>(res: Response): Promise<{ success: boolean; data?: T; error?: string }> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, error: json.error || res.statusText };
  return { success: true, data: json.data ?? json };
}

export interface TaskRow {
  id: number;
  telecaller_id: number;
  assigned_to: number | null;
  customer_name: string;
  vehicle_no: string;
  company: string;
  action_type: 'QUOTE' | 'ISSUE_POLICY';
  policy_type: 'RENEWAL' | 'ROLLOVER';
  product_type: string;
  phone: string | null;
  email: string | null;
  cashback: number | null;
  status: string;
  sla_deadline: string | null;
  assigned_at: string | null;
  first_pickup_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_to_name?: string | null;
  documents?: { id: number; document_type: string; download_url: string | null }[];
}

export const taskApi = {
  async createTask(form: FormData): Promise<{ success: boolean; data?: TaskRow; error?: string }> {
    const token = getToken();
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    return handleRes<TaskRow>(res);
  },

  async getMyRequests(): Promise<{ success: boolean; data?: TaskRow[]; error?: string }> {
    const res = await fetch(`${API_BASE}/tasks/my-requests`, { headers: headers() });
    return handleRes<TaskRow[]>(res);
  },

  async getAssigned(): Promise<{ success: boolean; data?: TaskRow[]; error?: string }> {
    const res = await fetch(`${API_BASE}/tasks/assigned`, { headers: headers() });
    return handleRes<TaskRow[]>(res);
  },

  async getTask(id: number): Promise<{ success: boolean; data?: TaskRow & { documents?: { document_type: string; download_url: string | null }[] }; error?: string }> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { headers: headers() });
    return handleRes(res);
  },

  async startTask(id: number): Promise<{ success: boolean; data?: TaskRow; error?: string }> {
    const res = await fetch(`${API_BASE}/tasks/${id}/start`, {
      method: 'POST',
      headers: headers(),
    });
    return handleRes<TaskRow>(res);
  },

  async completeTask(id: number, documentType: 'QUOTE' | 'ISSUED_POLICY', file: File | null): Promise<{ success: boolean; data?: TaskRow; error?: string }> {
    const token = getToken();
    const form = new FormData();
    form.append('document_type', documentType);
    if (file) form.append('document', file);
    const res = await fetch(`${API_BASE}/tasks/${id}/complete`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    return handleRes<TaskRow>(res);
  },

  async getExecutiveStatus(): Promise<{ success: boolean; data?: { status: string }; error?: string }> {
    const res = await fetch(`${API_BASE}/tasks/executives/me/status`, { headers: headers() });
    return handleRes<{ status: string }>(res);
  },

  async setExecutiveStatus(status: 'AVAILABLE' | 'BUSY' | 'BREAK' | 'OFFLINE'): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/tasks/executives/me/status`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ status }),
    });
    const out = await handleRes(res);
    return { success: out.success, error: out.error };
  },

  async getTaskSummary(): Promise<{
    success: boolean;
    data?: {
      total: number;
      pending: number;
      completed: number;
      sla_breached: number;
      sla_compliance_percent: number;
      by_status: Record<string, number>;
      recent: any[];
    };
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/tasks/summary`, { headers: headers() });
    return handleRes(res);
  },

  async reassignTask(taskId: number, executiveId: number): Promise<{ success: boolean; data?: TaskRow; error?: string }> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/reassign`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ executive_id: executiveId }),
    });
    return handleRes<TaskRow>(res);
  },
};
