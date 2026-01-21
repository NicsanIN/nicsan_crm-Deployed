import { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { Download, Filter } from 'lucide-react';
import DualStorageService from '../../../services/dualStorageService';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserChange } from '../../../hooks/useUserChange';

// Mock data for demo purposes
const demoReps = [
  {
    name: "John Doe",
    leads_assigned: 25,
    converted: 8,
    gwp: 150000,
    brokerage: 12000,
    cashback: 8000,
    net_revenue: 4000,
    total_od: 45000,
    cac: 500
  },
  {
    name: "Jane Smith", 
    leads_assigned: 30,
    converted: 12,
    gwp: 200000,
    brokerage: 16000,
    cashback: 10000,
    net_revenue: 6000,
    total_od: 60000,
    cac: 400
  }
];

function PageLeaderboard() {
  const { user } = useAuth();
  const { userChanged } = useUserChange();
  const [reps, setReps] = useState<any[]>([]);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'ytd' | null>(null);

  // Function to get date range based on selected period
  const getDateRange = (period: 'week' | 'month' | 'ytd' | null): { month?: string; fromDate?: string; toDate?: string } | null => {
    if (period === null) {
      return null; // No filtering - show all data
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    today.setHours(23, 59, 59, 999); // End of today
    
    switch (period) {
      case 'week':
        // Current week: Sunday to today
        const weekStart = new Date(today);
        const dayOfWeek = weekStart.getDay(); // 0 = Sunday, 6 = Saturday
        weekStart.setDate(weekStart.getDate() - dayOfWeek); // Go back to Sunday
        weekStart.setHours(0, 0, 0, 0);
        return {
          fromDate: weekStart.toISOString().split('T')[0],
          toDate: today.toISOString().split('T')[0]
        };
        
      case 'month':
        // Current month: 1st of month to today
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        return {
          fromDate: monthStart.toISOString().split('T')[0],
          toDate: today.toISOString().split('T')[0]
        };
        
      case 'ytd':
        // Financial Year to Date: April 1st of current financial year to today
        // Financial year in India: April 1 to March 31
        const currentMonth = today.getMonth(); // 0 = January, 3 = April
        let financialYearStart: Date;
        
        if (currentMonth >= 3) {
          // If we're in April (3) or later, financial year started this calendar year
          financialYearStart = new Date(today.getFullYear(), 3, 1); // April 1st (month 3 = April)
        } else {
          // If we're in Jan, Feb, or March, financial year started last calendar year
          financialYearStart = new Date(today.getFullYear() - 1, 3, 1); // April 1st of previous year
        }
        
        financialYearStart.setHours(0, 0, 0, 0);
        return {
          fromDate: financialYearStart.toISOString().split('T')[0],
          toDate: today.toISOString().split('T')[0]
        };
        
      default:
        return null;
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedReps = () => {
    if (!sortField) return reps;
    
    return [...reps].sort((a, b) => {
      let aValue = 0;
      let bValue = 0;
      
      switch (sortField) {
        case 'converted':
          aValue = a.converted || 0;
          bValue = b.converted || 0;
          break;
        case 'gwp':
          aValue = a.gwp || 0;
          bValue = b.gwp || 0;
          break;
        case 'brokerage':
          aValue = a.brokerage || 0;
          bValue = b.brokerage || 0;
          break;
        case 'cashback':
          aValue = a.cashback || 0;
          bValue = b.cashback || 0;
          break;
        case 'net':
          aValue = a.net_revenue || a.net || 0;
          bValue = b.net_revenue || b.net || 0;
          break;
        case 'totalOd':
          aValue = a.total_od || 0;
          bValue = b.total_od || 0;
          break;
        default:
          return 0;
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  const downloadRolloverCSV = async () => {
    // Get current month (YYYY-MM format)
    const currentMonth = new Date().toISOString().slice(0, 7); // '2024-01'
    
    // Fetch month-specific data
    let monthReps = reps;
    try {
      const response = await DualStorageService.getSalesReps(currentMonth);
      if (response.success && Array.isArray(response.data)) {
        monthReps = response.data;
      }
    } catch (error) {
      console.error('Failed to load month-specific data, using current data:', error);
    }
    
    const headers = ['Telecaller', 'Leads Assigned', 'Converted', 'Total OD'];
    
    const csvContent = [
      headers.join(','),
      ...monthReps
        .filter(rep => (rep.rollover_policies || 0) > 0)
        .sort((a, b) => (b.rollover_total_od || 0) - (a.rollover_total_od || 0))
        .map(rep => {
          return [
            `"${rep.name || ''}"`,
            rep.rollover_policies || 0,
            rep.rollover_policies || 0,
            rep.rollover_total_od || 0
          ].join(',');
        })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rep-leaderboard-rollover-${currentMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadRenewalCSV = async () => {
    // Get current month (YYYY-MM format)
    const currentMonth = new Date().toISOString().slice(0, 7); // '2024-01'
    
    // Fetch month-specific data
    let monthReps = reps;
    try {
      const response = await DualStorageService.getSalesReps(currentMonth);
      if (response.success && Array.isArray(response.data)) {
        monthReps = response.data;
      }
    } catch (error) {
      console.error('Failed to load month-specific data, using current data:', error);
    }
    
    const headers = ['Telecaller', 'Leads Assigned', 'Converted', 'Total OD'];
    
    const csvContent = [
      headers.join(','),
      ...monthReps
        .filter(rep => (rep.renewal_policies || 0) > 0)
        .sort((a, b) => (b.renewal_total_od || 0) - (a.renewal_total_od || 0))
        .map(rep => {
          return [
            `"${rep.name || ''}"`,
            rep.renewal_policies || 0,
            rep.renewal_policies || 0,
            rep.renewal_total_od || 0
          ].join(',');
        })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rep-leaderboard-renewal-${currentMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle user changes - reset leaderboard data when user changes
  useEffect(() => {
    if (userChanged && user) {
      setReps([]);
      setSortField('');
      setSortDirection('asc');
      setSelectedPeriod(null);
    }
  }, [userChanged, user]);

  useEffect(() => {
    const loadSalesReps = async () => {
      try {
        const dateRange = getDateRange(selectedPeriod);
        
        if (dateRange === null) {
          // No filtering - show all data
          const response = await DualStorageService.getSalesReps();
          if (response.success) {
            setReps(Array.isArray(response.data) ? response.data : []);
          }
        } else {
          // Use date range filtering
          const response = await DualStorageService.getSalesReps(
            dateRange.month, // month (null for date ranges)
            dateRange.fromDate,
            dateRange.toDate
          );
          
          if (response.success) {
            setReps(Array.isArray(response.data) ? response.data : []);
          }
        }
      } catch (error) {
        console.error('Failed to load sales reps:', error);
        setReps(demoReps);
      }
    };
    
    loadSalesReps();
  }, [selectedPeriod]);

  return (
    <Card title="Rep Leaderboard">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-2 rounded-xl bg-zinc-100 p-1">
          <button 
            onClick={() => setSelectedPeriod('week')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              selectedPeriod === 'week' 
                ? 'bg-white shadow text-zinc-900 font-medium' 
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Current Week
          </button>
          <button 
            onClick={() => setSelectedPeriod('month')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              selectedPeriod === 'month' 
                ? 'bg-white shadow text-zinc-900 font-medium' 
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Current Month
          </button>
          <button 
            onClick={() => setSelectedPeriod('ytd')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              selectedPeriod === 'ytd' 
                ? 'bg-white shadow text-zinc-900 font-medium' 
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            YTD
          </button>
          {selectedPeriod && (
            <button 
              onClick={() => setSelectedPeriod(null)}
              className="px-3 py-1 rounded-lg text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <button 
            onClick={downloadRolloverCSV}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4"/>
            Rollover CSV
          </button>
          <button 
            onClick={downloadRenewalCSV}
            className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4"/>
            Renewal CSV
          </button>
          <Filter className="w-4 h-4"/> <span>Sort by</span>
          <select className="border rounded-lg px-2 py-1">
            <option>Net</option>
            <option>Least Cashback %</option>
            <option>Net per ₹ Cashback</option>
          </select>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500">
              <th className="py-2">Telecaller</th>
              <th>Leads Assigned</th>
              <th 
                className="cursor-pointer hover:bg-zinc-100 px-2 py-1 rounded transition-colors"
                onClick={() => handleSort('converted')}
              >
                Converted {sortField === 'converted' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="cursor-pointer hover:bg-zinc-100 px-2 py-1 rounded transition-colors"
                onClick={() => handleSort('gwp')}
              >
                GWP {sortField === 'gwp' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="cursor-pointer hover:bg-zinc-100 px-2 py-1 rounded transition-colors"
                onClick={() => handleSort('brokerage')}
              >
                Brokerage {sortField === 'brokerage' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="cursor-pointer hover:bg-zinc-100 px-2 py-1 rounded transition-colors"
                onClick={() => handleSort('cashback')}
              >
                Cashback {sortField === 'cashback' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="cursor-pointer hover:bg-zinc-100 px-2 py-1 rounded transition-colors"
                onClick={() => handleSort('net')}
              >
                Net {sortField === 'net' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="cursor-pointer hover:bg-zinc-100 px-2 py-1 rounded transition-colors"
                onClick={() => handleSort('totalOd')}
              >
                Total OD {sortField === 'totalOd' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Lead→Sale %</th>
              <th>CAC/Policy</th>
            </tr>
          </thead>
          <tbody>
            {getSortedReps().map((r,i)=> (
              <tr key={i} className="border-t">
                <td className="py-2 font-medium">{r.name}</td>
                <td>{r.leads_assigned || r.leads}</td>
                <td>{r.converted}</td>
                <td>₹{((r.gwp || 0)/1000).toFixed(1)}k</td>
                <td>₹{((r.brokerage || 0)/1000).toFixed(1)}k</td>
                <td>₹{((r.cashback || 0)/1000).toFixed(1)}k</td>
                <td>₹{((r.net_revenue || r.net || 0)/1000).toFixed(1)}k</td>
                <td>₹{((r.total_od || 0)/1000).toFixed(1)}k</td>
                <td>{(((r.converted || 0)/((r.leads_assigned || r.leads) || 1))*100).toFixed(1)}%</td>
                <td>₹{(r.cac || 0).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default PageLeaderboard;
