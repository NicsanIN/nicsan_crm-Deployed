import React, { useState, useEffect } from 'react';
import { Users, Search, ToggleLeft, ToggleRight } from 'lucide-react';

const TelecallerManagement: React.FC = () => {
  const [telecallers, setTelecallers] = useState<any[]>([]);
  const [telecallerSearch, setTelecallerSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTelecallers();
  }, []);

  const loadTelecallers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/telecallers/all', {
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
        setTelecallers(data.data);
      } else {
        setError(data.error || 'Failed to load telecallers');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load telecallers');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTelecallerStatus = async (id: number, currentStatus: boolean, name: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/telecallers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: name,
          is_active: !currentStatus 
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setSuccess(`Telecaller ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        loadTelecallers(); // Refresh list
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update telecaller');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update telecaller');
    }
  };

  const filteredTelecallers = telecallers.filter(telecaller => 
    telecaller.name.toLowerCase().includes(telecallerSearch.toLowerCase())
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Telecaller Management</h3>
          <p className="text-xs text-gray-500">Activate or deactivate telecallers in the system</p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-xs text-red-800">{error}</div>
        </div>
      )}
      
      {success && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-xs text-green-800">{success}</div>
        </div>
      )}
      
      {/* Search Input */}
      <div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search telecaller by name..."
            value={telecallerSearch}
            onChange={(e) => setTelecallerSearch(e.target.value)}
            className="w-full pl-6 pr-3 py-1.5 text-xs border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      </div>
      
      {/* Telecaller List */}
      <div className="space-y-2">
        {filteredTelecallers.map(telecaller => (
          <div key={telecaller.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900 text-xs">{telecaller.name}</div>
                <div className="text-xs text-gray-500">
                  {telecaller.policy_count} policies • 
                  Created: {new Date(telecaller.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                telecaller.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {telecaller.is_active ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => toggleTelecallerStatus(telecaller.id, telecaller.is_active, telecaller.name)}
                disabled={isLoading}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  telecaller.is_active 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                } disabled:opacity-50`}
              >
                {telecaller.is_active ? (
                  <>
                    <ToggleLeft className="h-3 w-3" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ToggleRight className="h-3 w-3" />
                    Activate
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty State */}
      {telecallers.length === 0 && !isLoading && (
        <div className="text-center py-4">
          <Users className="h-6 w-6 text-gray-400 mx-auto mb-2" />
          <div className="text-gray-500 text-xs">No telecallers found</div>
          <div className="text-gray-400 text-xs">Telecallers will appear here once they are added to the system</div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="text-gray-500 text-xs">Loading telecallers...</div>
        </div>
      )}
      
      {/* No Search Results */}
      {telecallerSearch.length >= 2 && filteredTelecallers.length === 0 && !isLoading && (
        <div className="text-center py-3">
          <Search className="h-4 w-4 text-gray-400 mx-auto mb-1" />
          <div className="text-gray-500 text-xs">No telecallers found matching "{telecallerSearch}"</div>
        </div>
      )}
    </div>
  );
};

export default TelecallerManagement;
