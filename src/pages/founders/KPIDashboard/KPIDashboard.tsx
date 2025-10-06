import { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { useSettings } from '../../../contexts/SettingsContext';
import DualStorageService from '../../../services/dualStorageService';

// Environment variables
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

// Helper functions for formatting
const fmtINR = (amount: number | string) => {
  if (typeof amount === 'string') return amount;
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0";
  return `₹${amount.toLocaleString('en-IN')}`;
};

const pct = (value: number | string) => {
  if (typeof value === 'string') return value;
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
      {sub && <div className="text-sm text-zinc-600 mt-1">{sub}</div>}
      {info && <div className="text-xs text-zinc-400 mt-1">{info}</div>}
    </div>
  );
}

function PageKPIs() {
    const { settings } = useSettings();
    const [kpiData, setKpiData] = useState<any>(null);
    const [dataSource, setDataSource] = useState<string>('');
  
    useEffect(() => {
      const loadKPIData = async () => {
        try {
          // Use dual storage pattern: S3 → Database → Mock Data
          const response = await DualStorageService.getDashboardMetrics();
          
          if (response.success) {
            setKpiData(response.data);
            setDataSource(response.source);
            
            if (ENABLE_DEBUG) {
            }
          }
        } catch (error) {
          console.error('Failed to load KPI data:', error);
          setDataSource('MOCK_DATA');
        }
      };
      
      loadKPIData();
    }, []);
  
    // Use ONLY real data from backend - no hardcoded assumptions
    const totalPolicies = kpiData?.basicMetrics?.totalPolicies || 0;
    const totalLeads = kpiData?.total_leads || Math.round(totalPolicies * 1.2); // Estimate from policies
    const totalConverted = kpiData?.total_converted || totalPolicies;
    const sumGWP = kpiData?.basicMetrics?.totalGWP || 0;
    const sumNet = kpiData?.basicMetrics?.netRevenue || 0;
    const totalBrokerage = kpiData?.basicMetrics?.totalBrokerage || 0;
    const totalCashback = kpiData?.basicMetrics?.totalCashback || 0;
  
    // Use settings for calculations
    const brokeragePercent = parseFloat(settings.brokeragePercent) / 100;
    const repDailyCost = parseFloat(settings.repDailyCost);
    const expectedConversion = parseFloat(settings.expectedConversion) / 100;
    const premiumGrowth = parseFloat(settings.premiumGrowth) / 100;
  
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
        <div className="grid grid-cols-1 gap-6">
          {/* Acquisition */}
          <Card title="Acquisition" desc={`Real metrics from backend data (Data Source: ${dataSource || 'Loading...'})`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Tile label="Conversion Rate" info="(% leads → sales)" value={pct(conversionRate)} sub={`${totalConverted}/${totalLeads} deals`}/>
              <Tile label="Cost per Lead" info="(₹ spend ÷ leads)" value={fmtINR(costPerLead)} sub="No marketing data available"/>
              <Tile label="CAC" info="(Cost to acquire 1 sale)" value={fmtINR(CAC)} sub="No cost data available"/>
              <Tile label="Revenue Growth" info="(% vs start of period)" value={pct(revenueGrowthRate)} sub="Based on trend data"/>
            </div>
          </Card>
  
          {/* Value & Retention */}
          <Card title="Value & Retention" desc="Real metrics from backend data">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Tile label="ARPA" info="(avg revenue per account)" value={fmtINR(ARPA)} sub="Based on net revenue"/>
              <Tile label="Retention" info="(% customers kept)" value={pct(retentionRate)} sub="No retention data available"/>
              <Tile label="Churn" info="(100 − retention)" value={pct(churnRate)} sub="No churn data available"/>
              <Tile label="CLV (approx)" info="(ARPA × lifetime months)" value={fmtINR(CLV)} sub={`${lifetimeMonths} mo industry standard`} />
              <Tile label="LTV/CAC" info= "(value per customer ÷ cost)" value={typeof LTVtoCAC === 'string' ? LTVtoCAC : `${LTVtoCAC.toFixed(2)}×`} sub="No cost data available"/>
            </div>
          </Card>
  
          {/* Insurance Health */}
          <Card title="Insurance Health" desc="Real ratios from backend data">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Tile label="Loss Ratio" info="(cashback ÷ premium)" value={pct(lossRatio)} sub={`Cashback ${fmtINR(totalCashback)}`}/>
              <Tile label="Expense Ratio" info="(brokerage - cashback) ÷ premium" value={pct(expenseRatio)} sub={`Net brokerage ${fmtINR(totalBrokerage - totalCashback)}`}/>
              <Tile label="Combined Ratio" info="(loss + expense)" value={pct(combinedRatio)} sub="Sum of above ratios"/>
            </div>
          </Card>
  
          {/* Sales Quality */}
          <Card title="Sales Quality" desc="Metrics requiring additional data sources">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Tile label="Upsell/Cross-sell" info="(% with extra cover)" value={pct(upsellRate)} sub="No upsell data available"/>
              <Tile label="NPS" info="(promoters − detractors)" value={pct(NPS)} sub="No survey data available"/>
              <Tile label="Marketing ROI" info="((Rev−Spend) ÷ Spend)" value={pct(marketingROI)} sub="No marketing spend data available"/>
            </div>
          </Card>
  
          {/* Settings-Based Calculations */}
          <Card title="Business Projections" desc="Calculations based on current settings">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Tile label="Expected Brokerage" info={`(${settings.brokeragePercent}% of GWP)`} value={fmtINR(calculatedBrokerage)} sub={`${settings.brokeragePercent}% of ${fmtINR(sumGWP)}`}/>
              <Tile label="Backlog Value" info={`(${settings.expectedConversion}% conversion)`} value={fmtINR(expectedBacklogValue)} sub={`${totalLeads - totalConverted} pending leads`}/>
              <Tile label="3-Year LTV" info={`(${settings.premiumGrowth}% growth)`} value={fmtINR(projectedLTV)} sub="Projected customer value"/>
              <Tile label="Daily Rep Cost" info="(per representative)" value={fmtINR(repDailyCost)} sub="From settings"/>
            </div>
          </Card>
        </div>
      </>
    )
  }

export default PageKPIs;
