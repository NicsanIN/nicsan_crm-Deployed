import { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { RefreshCw } from 'lucide-react';
import DualStorageService from '../../../services/dualStorageService';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserChange } from '../../../hooks/useUserChange';

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
      className={`bg-white rounded-2xl shadow-sm border border-zinc-100 p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="text-sm text-zinc-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-zinc-900">{value}</div>
      {sub && <div className="text-sm text-zinc-600 mt-1">{sub}</div>}
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
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { userChanged } = useUserChange();
    const [policyType, setPolicyType] = useState<'motor' | 'health'>('motor'); // Default: motor
    const [metrics, setMetrics] = useState<any>(null);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [dataSource, setDataSource] = useState<string>('');
    const [showTotalODBreakdown, setShowTotalODBreakdown] = useState(false);
  
    // Handle user changes - reset dashboard data when user changes
    useEffect(() => {
      if (userChanged && user) {
        setMetrics(null);
        setTrendData([]);
        setDataSource('');
        setShowTotalODBreakdown(false);
        setPolicyType('motor'); // Reset to motor default
      }
    }, [userChanged, user]);

    useEffect(() => {
      const loadDashboardData = async () => {
        try {
          let metricsResponse;
          
          if (policyType === 'motor') {
            // Load motor policy data (existing logic)
            metricsResponse = await DualStorageService.getDashboardMetrics();
          } else {
            // Load health insurance data (premium only)
            metricsResponse = await DualStorageService.getHealthInsuranceMetrics();
          }
          
          if (metricsResponse.success) {
            setMetrics(metricsResponse.data);
            setDataSource(metricsResponse.source);
            
            // Transform trend data based on policy type
            let transformedTrend = demoTrend;
            if (metricsResponse.data.dailyTrend && Array.isArray(metricsResponse.data.dailyTrend)) {
              if (policyType === 'motor') {
                // Motor policy trend data
                transformedTrend = metricsResponse.data.dailyTrend.map((item: any, index: number) => ({
                  day: `D-${index + 1}`,
                  gwp: item.gwp || 0,
                  net: item.net || 0
                }));
              } else {
                // Health insurance trend data (premium only)
                transformedTrend = metricsResponse.data.dailyTrend.map((item: any, index: number) => ({
                  day: `D-${index + 1}`,
                  premium: item.premium || 0
                }));
              }
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
    }, [policyType]); // Re-load when policy type changes
  
    const formatCurrency = (amount: number) => {
      if (amount === null || amount === undefined || isNaN(amount)) {
        return "₹0.0L";
      }
      return `₹${(amount / 100000).toFixed(1)}L`;
    };
  
    return (
      <>
        {/* Policy Type Toggle */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-medium text-zinc-700">Policy Type:</span>
          <div className="flex bg-zinc-100 rounded-lg p-1">
            <button
              onClick={() => setPolicyType('motor')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                policyType === 'motor' 
                  ? 'bg-white text-zinc-900 shadow-sm' 
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Motor Policies
            </button>
            <button
              onClick={() => setPolicyType('health')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                policyType === 'health' 
                  ? 'bg-white text-zinc-900 shadow-sm' 
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Health Policies
            </button>
          </div>
        </div>

        {/* Motor Policy Metrics */}
        {policyType === 'motor' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Tile 
              label="GWP" 
              info="(Gross Written Premium)" 
              value={metrics ? formatCurrency(metrics.basicMetrics?.totalGWP) : "₹10.7L"} 
              sub="▲ 8% vs last 14d"
            />
            <Tile 
              label="Brokerage" 
              info="(% of GWP)" 
              value={metrics ? formatCurrency(metrics.basicMetrics?.totalBrokerage) : "₹1.60L"}
            />
            <Tile 
              label="Cashback" 
              info="(Cash we give back)" 
              value={metrics ? formatCurrency(metrics.basicMetrics?.totalCashback) : "₹0.34L"}
            />
            <Tile 
              label="Net" 
              info="(Brokerage − Cashback)" 
              value={metrics ? formatCurrency(metrics.basicMetrics?.netRevenue) : "₹1.26L"}
            />
            <Tile 
              label="Total OD" 
              info="(Outstanding Debt)" 
              value={metrics ? formatCurrency(metrics.basicMetrics?.totalOutstandingDebt) : "₹0.00L"}
              sub="Total outstanding amount"
              onClick={() => setShowTotalODBreakdown(!showTotalODBreakdown)}
            />
          </div>
        )}

        {/* Health Insurance Metrics - Premium Only */}
        {policyType === 'health' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile 
              label="Total Premium" 
              info="(Health Insurance)" 
              value={metrics ? formatCurrency(metrics.basicMetrics?.totalPremium) : "₹7.5L"} 
              sub="▲ 12% vs last 14d"
            />
            <Tile 
              label="Avg Premium" 
              info="(Per Policy)" 
              value={metrics ? formatCurrency(metrics.basicMetrics?.avgPremium) : "₹15.0L"}
            />
            <Tile 
              label="Min Premium" 
              info="(Lowest Policy)" 
              value={metrics ? formatCurrency(metrics.basicMetrics?.minPremium) : "₹5.0L"}
            />
            <Tile 
              label="Max Premium" 
              info="(Highest Policy)" 
              value={metrics ? formatCurrency(metrics.basicMetrics?.maxPremium) : "₹25.0L"}
            />
          </div>
        )}
        {/* Motor Policy Trend Chart */}
        {policyType === 'motor' && (
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
        )}

        {/* Health Insurance Premium Trend Chart */}
        {policyType === 'health' && (
          <Card title="14-day Premium Trend" desc={`Health Insurance Premium (Data Source: ${dataSource || 'Loading...'})`}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee"/>
                  <XAxis dataKey="day"/>
                  <YAxis/>
                  <Tooltip/>
                  <Area 
                    type="monotone" 
                    dataKey="premium" 
                    stroke="#10b981" 
                    fill="url(#healthGradient)" 
                    name="Premium"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
        
        {/* Total OD Breakdown Section - Only for Motor Policies */}
        {policyType === 'motor' && showTotalODBreakdown && <TotalODBreakdown />}
      </>
    )
  }

export default PageOverview;