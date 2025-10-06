import { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
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

// TotalODBreakdown component (placeholder)
function TotalODBreakdown() {
  return (
    <Card title="Total OD Breakdown" desc="Detailed breakdown of outstanding debt">
      <div className="text-center text-gray-500 py-8">
        <p>Total OD Breakdown component will be implemented here</p>
      </div>
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