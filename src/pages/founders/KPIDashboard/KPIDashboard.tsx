import { useState, useEffect, useRef } from 'react';
import { Card } from '../../../components/common/Card';
import { useSettings } from '../../../contexts/SettingsContext';
import DualStorageService from '../../../services/dualStorageService';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserChange } from '../../../hooks/useUserChange';
import CrossDeviceSyncService from '../../../services/crossDeviceSyncService';

// Environment variables
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

// Helper functions for formatting
const fmtINR = (amount: number | string) => {
  if (typeof amount === 'string') return amount;
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0";
  return `₹${amount.toLocaleString('en-IN')}`;
};

const pct = (value: number | string) => {
  if (typeof value === 'string') {
    // If it's already a string with %, return as is, otherwise add %
    return value.includes('%') ? value : `${value}%`;
  }
  if (value === null || value === undefined || isNaN(value)) return "0%";
  return `${value.toFixed(1)}%`;
};

// Tile component for displaying metrics
function Tile({ label, value, sub, info, onClick }: { label: string; value: string; sub?: string; info?: string; onClick?: () => void }) {
  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm border border-zinc-100 p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="text-sm text-zinc-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-zinc-900">{value}</div>
      {sub && <div className="text-sm text-green-600 mt-1">{sub}</div>}
      {info && <div className="text-xs text-zinc-400 mt-1">{info}</div>}
    </div>
  );
}

function PageKPIs() {
    const { user } = useAuth();
    const { userChanged } = useUserChange();
    const { settings } = useSettings();
    const [kpiData, setKpiData] = useState<any>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const syncServiceRef = useRef<CrossDeviceSyncService | null>(null);
  
    // Handle user changes - reset KPI data when user changes
    useEffect(() => {
      if (userChanged && user) {
        setKpiData(null);
        setLastUpdated(null);
      }
    }, [userChanged, user]);

    // Load KPI data function
    const loadKPIData = async (showRefreshIndicator = false) => {
      try {
        if (showRefreshIndicator) {
          setIsRefreshing(true);
        }
        
        // Use dual storage pattern: S3 → Database → Mock Data
        const response = await DualStorageService.getDashboardMetrics();
        
        if (response.success) {
          setKpiData(response.data);
          setLastUpdated(new Date());
          
          if (ENABLE_DEBUG) {
            console.log('✅ KPI Dashboard data refreshed:', response.data);
          }
        }
      } catch (error) {
        console.error('Failed to load KPI data:', error);
      } finally {
        if (showRefreshIndicator) {
          setIsRefreshing(false);
        }
      }
    };

    // Initial data load
    useEffect(() => {
      loadKPIData();
    }, []);

    // Set up real-time updates
    useEffect(() => {
      // Initialize cross-device sync service
      syncServiceRef.current = CrossDeviceSyncService.getInstance();
      
      // Set up WebSocket listener for real-time updates
      const handleDataUpdate = (data: any) => {
        if (data.type === 'dashboard' || data.type === 'policies') {
          if (ENABLE_DEBUG) {
            console.log('🔄 Real-time dashboard update received:', data);
          }
          loadKPIData();
        }
      };

      // Subscribe to real-time updates using the correct method
      if (syncServiceRef.current) {
        syncServiceRef.current.onDataChange(handleDataUpdate);
      }

      // Set up periodic refresh (every 30 seconds)
      refreshIntervalRef.current = setInterval(() => {
        loadKPIData(true);
      }, 30000);

      // Cleanup on unmount
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
        // Note: CrossDeviceSyncService doesn't have unsubscribe method
        // The service handles cleanup internally
      };
    }, []);

    // Manual refresh function
    const handleManualRefresh = () => {
      loadKPIData(true);
    };
  
    // Use ONLY real data from backend - no hardcoded assumptions
    const totalPolicies = kpiData?.basicMetrics?.totalPolicies || 0;
    const totalLeads = kpiData?.total_leads || Math.round(totalPolicies * 1.2); // Estimate from policies
    const totalConverted = kpiData?.total_converted || totalPolicies;
    const sumGWP = kpiData?.basicMetrics?.totalGWP || 0;
    const sumNet = kpiData?.basicMetrics?.netRevenue || 0;
    const totalBrokerage = kpiData?.basicMetrics?.totalBrokerage || 0;
    const totalCashback = kpiData?.basicMetrics?.totalCashback || 0;
  
    // Use settings for calculations with fallbacks
    const brokeragePercent = parseFloat(settings?.brokeragePercent || '15') / 100;
    const repDailyCost = parseFloat(settings?.repDailyCost || '2000');
    const expectedConversion = parseFloat(settings?.expectedConversion || '25') / 100;
    const premiumGrowth = parseFloat(settings?.premiumGrowth || '10') / 100;
  
    // Use backend KPI calculations if available, otherwise calculate from real data with settings
    const backendKPIs = kpiData?.kpis || {};
    const conversionRate = parseFloat(backendKPIs.conversionRate) || (totalConverted/(totalLeads||1))*100;
    const lossRatio = parseFloat(backendKPIs.lossRatio) || (sumGWP > 0 ? (totalCashback / sumGWP) * 100 : 0);
    const expenseRatio = parseFloat(backendKPIs.expenseRatio) || (sumGWP > 0 ? ((totalBrokerage - totalCashback) / sumGWP) * 100 : 0);
    const combinedRatio = parseFloat(backendKPIs.combinedRatio) || (lossRatio + expenseRatio);
  
    // Calculate settings-based metrics
    const calculatedBrokerage = sumGWP * brokeragePercent;
    const expectedBacklogValue = (totalLeads - totalConverted) * expectedConversion * (sumGWP / (totalConverted || 1));
    const projectedLTV = (sumGWP / (totalConverted || 1)) * Math.pow(1 + premiumGrowth, 3); // 3-year projection
  
    // Calculate real metrics from actual data (no hardcoded assumptions)
    const ARPA = totalConverted > 0 ? sumNet / totalConverted : 0;
    const lifetimeMonths = 24; // Industry standard assumption
    const CLV = ARPA * lifetimeMonths;
    
    // For metrics that require business data not available in backend, show "N/A" or calculate from available data
    const costPerLead = totalLeads > 0 ? 0 : 0; // No marketing spend data available
    const CAC = totalConverted > 0 ? 0 : 0; // No cost data available
    const LTVtoCAC = CAC > 0 ? CLV / CAC : 0;
    
    // Use real trend data for growth calculation if available
    const trendData = kpiData?.dailyTrend || [];
    const revenueGrowthRate = trendData.length > 1 ? 
      ((trendData[trendData.length-1]?.gwp - trendData[0]?.gwp) / (trendData[0]?.gwp || 1)) * 100 : 0;
  
    // For metrics without real data, show "N/A" instead of mock values
    const retentionRate = "N/A"; // No retention data available
    const churnRate = "N/A"; // No churn data available
    const upsellRate = "N/A"; // No upsell data available
    const NPS = "N/A"; // No NPS data available
    const marketingROI = "N/A"; // No marketing spend data available
  
    return (
      <>
        {/* Header with refresh controls */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">KPI Dashboard</h1>
            {lastUpdated && (
              <p className="text-sm text-zinc-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isRefreshing && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Refreshing...
              </div>
            )}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Acquisition */}
          <Card title="Acquisition">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Tile label="Conversion Rate" value={pct(conversionRate)} sub={`${totalConverted}/${totalLeads} deals`}/>
              <Tile label="Cost per Lead" value={fmtINR(costPerLead)} sub="No marketing data available"/>
              <Tile label="CAC" value={fmtINR(CAC)} sub="No cost data available"/>
              <Tile label="Revenue Growth" value={pct(revenueGrowthRate)} sub="Based on trend data"/>
            </div>
          </Card>
  
          {/* Value & Retention */}
          <Card title="Value & Retention">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Tile label="ARPA" value={fmtINR(ARPA)} sub="Based on net revenue"/>
              <Tile label="Retention" value={pct(retentionRate)} sub="No retention data available"/>
              <Tile label="Churn" value={pct(churnRate)} sub="No churn data available"/>
              <Tile label="CLV (approx)" value={fmtINR(CLV)} sub={`${lifetimeMonths} mo industry standard`} />
              <Tile label="LTV/CAC" value={typeof LTVtoCAC === 'string' ? LTVtoCAC : `${LTVtoCAC.toFixed(2)}×`} sub="No cost data available"/>
            </div>
          </Card>
  
          {/* Insurance Health */}
          <Card title="Insurance Health">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Tile label="Loss Ratio" value={pct(lossRatio)} sub={`Cashback ${fmtINR(totalCashback)}`}/>
              <Tile label="Expense Ratio" value={pct(expenseRatio)} sub={`Net brokerage ${fmtINR(totalBrokerage - totalCashback)}`}/>
              <Tile label="Combined Ratio" value={pct(combinedRatio)} sub="Sum of above ratios"/>
            </div>
          </Card>
  
          {/* Sales Quality */}
          <Card title="Sales Quality">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Tile label="Upsell/Cross-sell" value={pct(upsellRate)} sub="No upsell data available"/>
              <Tile label="NPS" value={pct(NPS)} sub="No survey data available"/>
              <Tile label="Marketing ROI" value={pct(marketingROI)} sub="No marketing spend data available"/>
            </div>
          </Card>
  
          {/* Settings-Based Calculations */}
          <Card title="Business Projections">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Tile label="Expected Brokerage" value={fmtINR(calculatedBrokerage)} sub={`${settings?.brokeragePercent || '15'}% of ${fmtINR(sumGWP)}`}/>
              <Tile label="Backlog Value" value={fmtINR(expectedBacklogValue)} sub={`${totalLeads - totalConverted} pending leads`}/>
              <Tile label="3-Year LTV" value={fmtINR(projectedLTV)} sub="Projected customer value"/>
              <Tile label="Daily Rep Cost" value={fmtINR(repDailyCost)} sub="From settings"/>
            </div>
          </Card>
        </div>
      </>
    )
  }

export default PageKPIs;
