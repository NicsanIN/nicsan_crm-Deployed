export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AdminPasswordChangeRequest {
  targetUserId: number;
  newPassword: string;
  reason: string;
}

export interface PasswordHistoryItem {
  id: number;
  action: string;
  timestamp: string;
  changed_by_name: string;
  target_user_name: string;
  reason?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  is_active: boolean;
}
