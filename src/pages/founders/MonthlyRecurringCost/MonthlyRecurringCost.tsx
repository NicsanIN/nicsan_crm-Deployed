import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit, Trash2, Filter, Search, Calendar, Tag } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserChange } from '../../../hooks/useUserChange';

interface MonthlyCost {
  id: number;
  product_name: string;
  cost_amount: number;
  currency: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'inactive';
  category: string;
  description?: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

interface CostSummary {
  total_costs: number;
  active_costs: number;
  inactive_costs: number;
  total_active_amount: number;
}

interface CategoryBreakdown {
  category: string;
  count: number;
  total_amount: number;
}

const MonthlyRecurringCost: React.FC = () => {
  const { user } = useAuth();
  const { userChanged } = useUserChange();
  const [costs, setCosts] = useState<MonthlyCost[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCost, setEditingCost] = useState<MonthlyCost | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Handle user changes
  useEffect(() => {
    if (userChanged && user) {
      loadCosts();
      loadSummary();
    }
  }, [userChanged, user]);

  useEffect(() => {
    loadCosts();
    loadSummary();
  }, []);

  const loadCosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://staging-api.nicsanin.com/api'}/costs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setCosts(data.data);
      } else {
        setError(data.error || 'Failed to load costs');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load costs');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://staging-api.nicsanin.com/api'}/costs/summary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSummary(data.data.summary);
          setCategoryBreakdown(data.data.categoryBreakdown);
        }
      }
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const handleAddCost = async (costData: Partial<MonthlyCost>) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://staging-api.nicsanin.com/api'}/costs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(costData)
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Cost added successfully');
        setShowAddForm(false);
        loadCosts();
        loadSummary();
      } else {
        setError(data.error || 'Failed to add cost');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add cost');
    }
  };

  const handleUpdateCost = async (id: number, costData: Partial<MonthlyCost>) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://staging-api.nicsanin.com/api'}/costs/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(costData)
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Cost updated successfully');
        setEditingCost(null);
        loadCosts();
        loadSummary();
      } else {
        setError(data.error || 'Failed to update cost');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update cost');
    }
  };

  const handleDeleteCost = async (id: number) => {
    if (!confirm('Are you sure you want to delete this cost?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://staging-api.nicsanin.com/api'}/costs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Cost deleted successfully');
        loadCosts();
        loadSummary();
      } else {
        setError(data.error || 'Failed to delete cost');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to delete cost');
    }
  };

  const filteredCosts = costs.filter(cost => {
    const matchesStatus = filterStatus === 'all' || cost.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || cost.category === filterCategory;
    const matchesSearch = searchTerm === '' || 
      cost.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cost.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const categories = [...new Set(costs.map(cost => cost.category))];

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-green-100 rounded-lg">
          <DollarSign className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Monthly Recurring Costs</h1>
          <p className="text-sm text-gray-600">Track and manage your monthly recurring expenses</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total Costs</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{summary.total_costs}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Active Costs</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{summary.active_costs}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Total Amount</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">₹{summary.total_active_amount ? Number(summary.total_active_amount).toLocaleString() : '0'}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add New Cost
        </button>

        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search costs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cost List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading costs...</p>
          </div>
        ) : filteredCosts.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No costs found</p>
            <p className="text-sm text-gray-500 mt-1">Add your first recurring cost to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCosts.map((cost) => (
                  <tr key={cost.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{cost.product_name}</div>
                        {cost.description && (
                          <div className="text-sm text-gray-500">{cost.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{Number(cost.cost_amount).toLocaleString()}</div>
                      <div className="text-sm text-gray-500">{cost.currency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {cost.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cost.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cost.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(cost.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingCost(cost)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCost(cost.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingCost) && (
        <CostForm
          cost={editingCost}
          onSave={editingCost ? (data) => handleUpdateCost(editingCost.id, data) : handleAddCost}
          onCancel={() => {
            setShowAddForm(false);
            setEditingCost(null);
          }}
        />
      )}
    </div>
  );
};

// Cost Form Component
interface CostFormProps {
  cost?: MonthlyCost | null;
  onSave: (data: Partial<MonthlyCost>) => void;
  onCancel: () => void;
}

const CostForm: React.FC<CostFormProps> = ({ cost, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    product_name: cost?.product_name || '',
    cost_amount: cost?.cost_amount || 0,
    currency: cost?.currency || 'INR',
    start_date: cost?.start_date || '',
    end_date: cost?.end_date || '',
    status: cost?.status || 'active',
    category: cost?.category || '',
    description: cost?.description || ''
  });

  const categories = ['software', 'hardware', 'service'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_name || !formData.cost_amount || !formData.start_date || !formData.category) {
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {cost ? 'Edit Cost' : 'Add New Cost'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              type="text"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_amount}
                onChange={(e) => setFormData({ ...formData, cost_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional description..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {cost ? 'Update Cost' : 'Add Cost'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MonthlyRecurringCost;
