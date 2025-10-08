import { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { RefreshCw } from 'lucide-react';
import DualStorageService from '../../../services/dualStorageService';

// Environment variables
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

// Mock data for demo purposes
const demoTrend = [
  { day: 'D-1', gwp: 45000, net: 12000 },
  { day: 'D-2', gwp: 52000, net: 15000 },
  { day: 'D-3', gwp: 38000, net: 10000 },
  { day: 'D-4', gwp: 61000, net: 18000 },
  { day: 'D-5', gwp: 55000, net: 16000 },
  { day: 'D-6', gwp: 48000, net: 14000 },
  { day: 'D-7', gwp: 67000, net: 20000 },
  { day: 'D-8', gwp: 59000, net: 17000 },
  { day: 'D-9', gwp: 72000, net: 22000 },
  { day: 'D-10', gwp: 65000, net: 19000 },
  { day: 'D-11', gwp: 58000, net: 16500 },
  { day: 'D-12', gwp: 63000, net: 18500 },
  { day: 'D-13', gwp: 69000, net: 20500 },
  { day: 'D-14', gwp: 75000, net: 23000 }
];

// Tile component for displaying metrics
function Tile({ label, value, sub, info, onClick }: { label: string; value: string; sub?: string; info?: string; onClick?: () => void }) {
  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm border border-zinc-100 p-4 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200 transition-all' : ''}`}
      onClick={onClick}
    >
      <div className="text-sm text-zinc-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-zinc-900">{value}</div>
      {sub && <div className="text-sm text-green-600 mt-1">{sub}</div>}
      {info && <div className="text-xs text-zinc-400 mt-1">{info}</div>}
    </div>
  );
}

// TotalODBreakdown component
function TotalODBreakdown() {
  const [breakdownType, setBreakdownType] = useState<'daily' | 'monthly' | 'financial-year'>('daily');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<string>('');

  useEffect(() => {
    loadBreakdownData();
  }, [breakdownType]);

  const loadBreakdownData = async () => {
    setLoading(true);
    try {
      let response;
      if (breakdownType === 'daily') {
        response = await DualStorageService.getTotalODDaily('30d');
      } else if (breakdownType === 'monthly') {
        response = await DualStorageService.getTotalODMonthly('12m');
      } else {
        response = await DualStorageService.getTotalODFinancialYear(3);
      }
      
      if (response.success) {
        setData(response.data);
        setDataSource(response.source);
      }
    } catch (error) {
      console.error('Failed to load Total OD breakdown:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "₹0.0L";
    }
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  const formatDate = (dateStr: string) => {
    if (breakdownType === 'financial-year') {
      return `FY ${dateStr}`;
    } else if (breakdownType === 'monthly') {
      return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    } else {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
  };

  const getDataKey = () => {
    switch (breakdownType) {
      case 'daily': return 'date';
      case 'monthly': return 'month';
      case 'financial-year': return 'financial_year';
      default: return 'date';
    }
  };

  return (
    <Card title="Total OD Breakdown" desc={`${breakdownType} analysis (Data Source: ${dataSource || 'Loading...'})`}>
      <div className="mb-4">
        <div className="flex gap-2">
          <button 
            onClick={() => setBreakdownType('daily')}
            className={`px-3 py-1 rounded text-sm ${breakdownType === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Daily
          </button>
          <button 
            onClick={() => setBreakdownType('monthly')}
            className={`px-3 py-1 rounded text-sm ${breakdownType === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setBreakdownType('financial-year')}
            className={`px-3 py-1 rounded text-sm ${breakdownType === 'financial-year' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Financial Year
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <div>Loading Total OD breakdown...</div>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey={getDataKey()} 
                tickFormatter={formatDate}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Total OD']}
                labelFormatter={(label) => `Date: ${formatDate(label)}`}
              />
              <Bar dataKey="total_od" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {data.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          {/* Daily Breakdown Table */}
          <div className="mt-6">
            <div className="font-medium mb-3">Daily Breakdown</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left border-b">Date</th>
                    <th className="px-3 py-2 text-right border-b">Policies</th>
                    <th className="px-3 py-2 text-right border-b">Total OD</th>
                    <th className="px-3 py-2 text-right border-b">Avg OD</th>
                    <th className="px-3 py-2 text-right border-b">Max OD</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 border-b">{formatDate(item.date || item.month || item.financial_year)}</td>
                      <td className="px-3 py-2 text-right border-b">{item.policy_count || 0}</td>
                      <td className="px-3 py-2 text-right border-b">{formatCurrency(item.total_od || 0)}</td>
                      <td className="px-3 py-2 text-right border-b">{formatCurrency(item.avg_od_per_policy || 0)}</td>
                      <td className="px-3 py-2 text-right border-b">{formatCurrency(item.max_od || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function PageOverview() {
    const [metrics, setMetrics] = useState<any>(null);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [dataSource, setDataSource] = useState<string>('');
    const [showTotalODBreakdown, setShowTotalODBreakdown] = useState(false);
  
    useEffect(() => {
      const loadDashboardData = async () => {
        try {
          // Use dual storage pattern: S3 → Database → Mock Data
          const metricsResponse = await DualStorageService.getDashboardMetrics();
          
          if (metricsResponse.success) {
            setMetrics(metricsResponse.data);
            setDataSource(metricsResponse.source);
            
            
            // Use real trend data from backend instead of demo data
            let transformedTrend = demoTrend;
            if (metricsResponse.data.dailyTrend && Array.isArray(metricsResponse.data.dailyTrend)) {
              // Transform backend data to match chart expectations
              transformedTrend = metricsResponse.data.dailyTrend.map((item: any, index: number) => ({
                day: `D-${index + 1}`, // Convert date to day format for chart
                gwp: item.gwp || 0,
                net: item.net || 0
              }));
            }
            setTrendData(transformedTrend);
            
            if (ENABLE_DEBUG) {
            }
          }
        } catch (error) {
          console.error('Failed to load dashboard data:', error);
        }
      };
      
      loadDashboardData();
    }, []);
  
    const formatCurrency = (amount: number) => {
      if (amount === null || amount === undefined || isNaN(amount)) {
        return "₹0.0L";
      }
      return `₹${(amount / 100000).toFixed(1)}L`;
    };
  
    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Tile 
            label="GWP" 
            value={metrics ? formatCurrency(metrics.basicMetrics?.totalGWP) : "₹10.7L"} 
            sub="▲ 8% vs last 14d"
          />
          <Tile 
            label="Brokerage" 
            value={metrics ? formatCurrency(metrics.basicMetrics?.totalBrokerage) : "₹1.60L"}
          />
          <Tile 
            label="Cashback" 
            value={metrics ? formatCurrency(metrics.basicMetrics?.totalCashback) : "₹0.34L"}
          />
          <Tile 
            label="Net" 
            value={metrics ? formatCurrency(metrics.basicMetrics?.netRevenue) : "₹1.26L"}
          />
          <Tile 
            label="Total OD" 
            value={metrics ? formatCurrency(metrics.basicMetrics?.totalOutstandingDebt) : "₹0.00L"}
            sub="Click to expand"
            onClick={() => setShowTotalODBreakdown(!showTotalODBreakdown)}
          />
        </div>
        <Card title="14-day Trend" desc={`GWP & Net (Data Source: ${dataSource || 'Loading...'})`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee"/>
                <XAxis dataKey="day"/>
                <YAxis/>
                <Tooltip/>
                <Area type="monotone" dataKey="gwp" stroke="#6366f1" fill="url(#g1)" name="GWP"/>
                <Area type="monotone" dataKey="net" stroke="#10b981" fill="url(#g2)" name="Net"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Total OD Breakdown Section */}
        {showTotalODBreakdown && <TotalODBreakdown />}
      </>
    )
  }

export default PageOverview;