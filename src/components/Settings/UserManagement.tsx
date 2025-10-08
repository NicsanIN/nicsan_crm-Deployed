import React, { useState, useEffect } from 'react';
import { Users, Search, Edit, Trash2, ToggleLeft, ToggleRight, UserPlus, Save, X } from 'lucide-react';
import { userService } from '../../services/userService';
import type { User, CreateUserRequest, UpdateUserRequest } from '../../services/userService';
import LabeledInput from '../common/LabeledInput';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ops' as 'ops' | 'founder'
  });
  const [editPassword, setEditPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData: CreateUserRequest = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      const response = await userService.createUser(userData);
      
      if (response.success) {
        setSuccess('User created successfully');
        setShowCreateForm(false);
        setFormData({ name: '', email: '', password: '', role: 'ops' });
        loadUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to create user');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const updateData: UpdateUserRequest = {
        name: formData.name,
        email: formData.email,
        role: formData.role
      };

      const response = await userService.updateUser(editingUser.id, updateData);
      
      if (response.success) {
        setSuccess('User updated successfully');
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'ops' });
        setEditPassword('');
        setShowPasswordField(false);
        loadUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to update user');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!editingUser || !editPassword) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await userService.updateUserPassword(editingUser.id, editPassword);
      
      if (response.success) {
        setSuccess('Password updated successfully');
        setEditPassword('');
        setShowPasswordField(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to update password');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await userService.deleteUser(id);
      
      if (response.success) {
        setSuccess(`User "${name}" deleted successfully`);
        loadUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to delete user');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean, name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await userService.toggleUserStatus(id, !currentStatus);
      
      if (response.success) {
        setSuccess(`User "${name}" ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        loadUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to update user status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'ops' });
    setEditPassword('');
    setShowPasswordField(false);
  };

  const cancelCreate = () => {
    setShowCreateForm(false);
    setFormData({ name: '', email: '', password: '', role: 'ops' });
  };

  const filteredUsers = users.filter(user => {
    // Filter out the user being edited
    if (editingUser && user.id === editingUser.id) {
      return false;
    }
    
    // Apply search filter
    return user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.role.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">User Management</h3>
            <p className="text-xs text-gray-500">Manage system users and permissions</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={isLoading}
          className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg border-2 border-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          <UserPlus className="h-3 w-3" />
          Add User
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <X className="h-3 w-3 text-red-500" />
          <span className="text-xs text-red-600">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Save className="h-3 w-3 text-green-500" />
          <span className="text-xs text-green-600">{success}</span>
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingUser) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h4>
            <button
              onClick={editingUser ? cancelEdit : cancelCreate}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <LabeledInput
              label="Full Name"
              value={formData.name}
              onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
              placeholder="Enter full name"
            />
            
            <LabeledInput
              label="Email"
              value={formData.email}
              onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
              type="email"
              placeholder="Enter email address"
            />
            
            {!editingUser && (
              <LabeledInput
                label="Password"
                value={formData.password}
                onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
                type="password"
                placeholder="Enter password (min 8 characters)"
              />
            )}
            
            {editingUser && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowPasswordField(!showPasswordField)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showPasswordField ? 'Hide Password Change' : 'Change Password'}
                </button>
                
                {showPasswordField && (
                  <div className="space-y-2">
                    <LabeledInput
                      label="New Password"
                      value={editPassword}
                      onChange={setEditPassword}
                      type="password"
                      placeholder="Enter new password (min 8 characters)"
                    />
                    <button
                      onClick={handleUpdatePassword}
                      disabled={isLoading || !editPassword || editPassword.length < 8}
                      className="px-2 py-1 bg-orange-600 text-white text-xs font-medium rounded border-2 border-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Update Password
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'ops' | 'founder' }))}
                className="w-full border-2 border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
              >
                <option value="ops">Operations</option>
                <option value="founder">Founder</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              onClick={editingUser ? handleUpdateUser : handleCreateUser}
              disabled={isLoading || !formData.name || !formData.email || (!editingUser && !formData.password)}
              className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg border-2 border-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <Save className="h-3 w-3" />
              {editingUser ? 'Update User' : 'Create User'}
            </button>
            <button
              onClick={editingUser ? cancelEdit : cancelCreate}
              disabled={isLoading}
              className="px-3 py-1.5 bg-white border-2 border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users by name, email, or role..."
          className="w-full pl-6 pr-3 py-1.5 text-xs border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-4 text-gray-500 text-xs">
            Loading users...
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <div key={user.id} className="border border-gray-200 rounded-lg p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-gray-100 rounded">
                    <Users className="h-3 w-3 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-xs">{user.name}</div>
                    <div className="text-xs text-gray-600">{user.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'founder' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'founder' ? 'Founder' : 'Operations'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(user)}
                    disabled={isLoading}
                    className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                    title="Edit user"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  
                  <button
                    onClick={() => handleToggleStatus(user.id, user.is_active, user.name)}
                    disabled={isLoading}
                    className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-50"
                    title={user.is_active ? 'Deactivate user' : 'Activate user'}
                  >
                    {user.is_active ? <ToggleLeft className="h-3 w-3" /> : <ToggleRight className="h-3 w-3" />}
                  </button>
                  
                  <button
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    disabled={isLoading}
                    className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                    title="Delete user"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500 text-xs">
            {users.length === 0 ? 'No users found' : `No users found matching "${searchTerm}"`}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
