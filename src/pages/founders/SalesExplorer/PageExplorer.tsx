import { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import DualStorageService from '../../../services/dualStorageService';

// Environment variables
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

// Mock data for demo purposes
const demoPolicies = [
  {
    rep: "John Doe",
    make: "Honda",
    model: "City",
    insurer: "Bajaj Allianz",
    issueDate: "2024-01-15",
    expiryDate: "2025-01-14",
    rollover: "New",
    branch: "Mumbai",
    policies: 5,
    gwp: 25000,
    totalPremium: 20000,
    totalOD: 5000,
    cashbackPctAvg: 8.5,
    cashback: 1700,
    net: 18300,
    vehicleNumber: "MH01AB1234"
  },
  {
    rep: "Jane Smith",
    make: "Maruti",
    model: "Swift",
    insurer: "ICICI Lombard",
    issueDate: "2024-02-10",
    expiryDate: "2025-02-09",
    rollover: "Renewal",
    branch: "Delhi",
    policies: 3,
    gwp: 18000,
    totalPremium: 15000,
    totalOD: 3000,
    cashbackPctAvg: 12.0,
    cashback: 1800,
    net: 13200,
    vehicleNumber: "DL02CD5678"
  }
];

function PageExplorer() {
  const [make, setMake] = useState("All");
  const [model, setModel] = useState("All");
  const [insurer, setInsurer] = useState("All");
  const [branch, setBranch] = useState("All");
  const [rollover, setRollover] = useState("All");
  const [rep, setRep] = useState("All");
  const [vehiclePrefix, setVehiclePrefix] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expiryFromDate, setExpiryFromDate] = useState("");
  const [expiryToDate, setExpiryToDate] = useState("");
  const [cashbackMax, setCashbackMax] = useState(20);

  const handleRefresh = () => {
    setMake('All');
    setModel('All');
    setInsurer('All');
    setCashbackMax(20);
    setBranch('All');
    setRollover('All');
    setRep('All');
    setVehiclePrefix('All');
    setFromDate('');
    setToDate('');
    setExpiryFromDate('');
    setExpiryToDate('');
  };

  const downloadCSV = () => {
    const headers = ['Telecaller', 'Make', 'Model', 'Insurer', 'Issue Date', 'Expiry Date', 'Type of Business', 'Branch', '# Policies', 'GWP', 'Total Premium', 'Total OD', 'Avg Cashback %', 'Cashback (₹)', 'Net (₹)'];
    const csvContent = [
      headers.join(','),
      ...filtered.map(row => [
        row.rep,
        `"${row.make}"`,
        `"${row.model}"`,
        `"${row.insurer}"`,
        row.issueDate && row.issueDate !== 'N/A' ? new Date(row.issueDate).toLocaleDateString('en-GB') : 'N/A',
        row.expiryDate && row.expiryDate !== 'N/A' ? new Date(row.expiryDate).toLocaleDateString('en-GB') : 'N/A',
        row.rollover,
        row.branch,
        row.policies,
        row.gwp,
        row.totalPremium || 0,
        row.totalOD || 0,
        parseFloat(row.cashbackPctAvg || 0).toFixed(1),
        row.cashback,
        row.net
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-explorer-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const [policies, setPolicies] = useState<any[]>([]);
  const [dataSource, setDataSource] = useState<string>('');
  const [makes, setMakes] = useState(["All"]);
  const [models, setModels] = useState(["All"]);
  const [insurers, setInsurers] = useState(["All"]);
  const [branches, setBranches] = useState(["All"]);
  const [rollovers, setRollovers] = useState(["All"]);
  const [reps, setReps] = useState(["All"]);
  const [vehiclePrefixes, setVehiclePrefixes] = useState(["All"]);

  // Extract unique prefixes from vehicle numbers
  const extractPrefixes = (data: any[]) => {
    const prefixes = data.map(item => {
      const cleaned = item.vehicleNumber.replace(/\s/g, "").toUpperCase();
      
      // Check if it's BH series format: YYBH####X
      if (/^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/.test(cleaned)) {
        return "BH";  // Extract BH for Bharat Series
      }
      
      // Traditional format: State + District + Series + Number
      if (/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/.test(cleaned)) {
        return cleaned.substring(0, 2);  // Extract state code (e.g., KA, MH)
      }
      
      // Fallback for unknown formats
      return cleaned.substring(0, 2);
    }).filter(Boolean);
    
    const uniquePrefixes = ["All", ...new Set(prefixes)];
    setVehiclePrefixes(uniquePrefixes);
  };

  // Get state name for prefix
  const getStateName = (prefix: string) => {
    const stateNames: { [key: string]: string } = {
      "KA": "Karnataka",
      "TN": "Tamil Nadu",
      "MH": "Maharashtra",
      "DL": "Delhi",
      "GJ": "Gujarat",
      "WB": "West Bengal",
      "AP": "Andhra Pradesh",
      "UP": "Uttar Pradesh",
      "MP": "Madhya Pradesh",
      "RJ": "Rajasthan",
      "KL": "Kerala",
      "PB": "Punjab",
      "HR": "Haryana",
      "BR": "Bihar",
      "OR": "Odisha",
      "AS": "Assam",
      "JK": "Jammu & Kashmir",
      "HP": "Himachal Pradesh",
      "UT": "Uttarakhand",
      "CH": "Chandigarh",
      "PY": "Puducherry",
      "GA": "Goa",
      "AN": "Andaman & Nicobar",
      "LD": "Lakshadweep",
      "DN": "Dadra & Nagar Haveli",
      "DD": "Daman & Diu"
    };
    return stateNames[prefix] || "Unknown State";
  };

  useEffect(() => {
    const loadSalesExplorer = async () => {
      try {
        // Use dual storage pattern: S3 → Database → Mock Data
        const filters = { make, model, insurer, cashbackMax, branch, rollover, rep, vehiclePrefix, fromDate, toDate, expiryFromDate, expiryToDate };
        const response = await DualStorageService.getSalesExplorer(filters);
        
        if (response.success) {
          const data = Array.isArray(response.data) ? response.data : [];
          
          // Extract unique values for dynamic filters
          const uniqueMakes = ["All", ...new Set(data.map(item => item.make).filter(Boolean))];
          const uniqueModels = ["All", ...new Set(data.map(item => item.model).filter(Boolean))];
          const uniqueInsurers = ["All", ...new Set(data.map(item => item.insurer).filter(Boolean))];
          const uniqueBranches = ["All", ...new Set(data.map(item => item.branch).filter(Boolean))];
          const uniqueRollovers = ["All", ...new Set(data.map(item => item.rollover).filter(Boolean))];
          const uniqueReps = ["All", ...new Set(data.map(item => item.rep).filter(Boolean))];
          
          setMakes(uniqueMakes);
          setModels(uniqueModels);
          setInsurers(uniqueInsurers);
          setBranches(uniqueBranches);
          setRollovers(uniqueRollovers);
          setReps(uniqueReps);
          
          // Extract unique prefixes from vehicle numbers
          extractPrefixes(data);
          
          setPolicies(data);
          setDataSource(response.source);
        }
      } catch (error) {
        console.error('Failed to load sales explorer:', error);
        setPolicies(demoPolicies);
        setDataSource('MOCK_DATA');
      }
    };
    
    loadSalesExplorer();
  }, [make, model, insurer, cashbackMax, branch, rollover, rep, vehiclePrefix, fromDate, toDate, expiryFromDate, expiryToDate]);

  const filtered = (policies || []).filter(p => {
    const makeMatch = make === 'All' || p.make === make;
    const modelMatch = model === 'All' || p.model === model;
    const insurerMatch = insurer === 'All' || p.insurer === insurer;
    const branchMatch = branch === 'All' || p.branch === branch;
    const rolloverMatch = rollover === 'All' || p.rollover === rollover;
    const repMatch = rep === 'All' || p.rep === rep;
    const vehicleMatch = vehiclePrefix === 'All' || (() => {
      const cleanVehicleNumber = p.vehicleNumber.replace(/\s/g, '').toUpperCase();
      
      // Handle BH series format: YYBH####X
      if (vehiclePrefix === 'BH') {
        return /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/.test(cleanVehicleNumber);
      }
      
      // Handle traditional format: State + District + Series + Number
      return cleanVehicleNumber.startsWith(vehiclePrefix);
    })();
    const cashbackMatch = (p.cashbackPctAvg || 0) <= cashbackMax;
    
    const passes = makeMatch && modelMatch && insurerMatch && branchMatch && rolloverMatch && repMatch && vehicleMatch && cashbackMatch;
    
    if (ENABLE_DEBUG && !passes) {
      console.log('🔍 Sales Explorer: Filtered out policy', {
        policy: p,
        filters: { make, model, insurer, cashbackMax, branch, rollover, rep, vehiclePrefix },
        matches: { makeMatch, modelMatch, insurerMatch, branchMatch, rolloverMatch, repMatch, vehicleMatch, cashbackMatch },
        passes
      });
    }
    
    return passes;
  });
  
  return (
    <>
      <Card title="Sales Explorer (Motor)">
        <div className="space-y-4 mb-6">
          {/* Primary Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Make</label>
              <select value={make} onChange={e=>setMake(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {makes.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Model</label>
              <select value={model} onChange={e=>setModel(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {models.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Insurer</label>
              <select value={insurer} onChange={e=>setInsurer(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {insurers.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Max Cashback %</label>
                <div className="flex gap-1">
                  <button 
                    onClick={handleRefresh}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 focus:ring-1 focus:ring-blue-500 transition-colors"
                  >
                    🔄
                  </button>
                  <button 
                    onClick={downloadCSV}
                    className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 focus:ring-1 focus:ring-green-500 transition-colors"
                  >
                    📥
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <input type="range" min={0} max={20} value={cashbackMax} onChange={e=>setCashbackMax(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
                <div className="text-sm text-gray-600 text-center font-medium">{cashbackMax}%</div>
              </div>
            </div>
          </div>
          
          {/* Secondary Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Branch</label>
              <select value={branch} onChange={e=>setBranch(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {branches.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Type of Business</label>
              <select value={rollover} onChange={e=>setRollover(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {rollovers.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Telecaller</label>
              <select value={rep} onChange={e=>setRep(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {reps.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Vehicle State</label>
              <select value={vehiclePrefix} onChange={e=>setVehiclePrefix(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {vehiclePrefixes.map(prefix => (
                  <option key={prefix} value={prefix}>
                    {prefix === "All" ? "All States" : `${prefix} (${getStateName(prefix)})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Date Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Issue From Date</label>
              <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Issue To Date</label>
              <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Expiry From Date</label>
              <input type="date" value={expiryFromDate} onChange={e=>setExpiryFromDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Expiry To Date</label>
              <input type="date" value={expiryToDate} onChange={e=>setExpiryToDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"/>
            </div>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-2 px-2">Telecaller</th><th className="px-2">Make</th><th className="px-2">Model</th><th className="px-2">Insurer</th><th className="px-2">Issue Date</th><th className="px-2">Expiry Date</th><th className="px-2">Type of Business</th><th className="px-2">Branch</th><th className="px-2"># Policies</th><th className="px-2">GWP</th><th className="px-2">Total Premium</th><th className="px-2">Total OD</th><th className="px-2">Avg Cashback %</th><th className="px-2">Cashback (₹)</th><th className="px-2">Net (₹)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r,i)=> (
                <tr key={i} className="border-t">
                  <td className="py-2 px-2 font-medium">{r.rep}</td>
                  <td className="px-2">{r.make}</td>
                  <td className="px-2">{r.model}</td>
                  <td className="px-2">{r.insurer}</td>
                  <td className="px-2">{r.issueDate && r.issueDate !== 'N/A' ? new Date(r.issueDate).toLocaleDateString('en-GB') : 'N/A'}</td>
                  <td className="px-2">{r.expiryDate && r.expiryDate !== 'N/A' ? new Date(r.expiryDate).toLocaleDateString('en-GB') : 'N/A'}</td>
                  <td className="px-2">{r.rollover}</td>
                  <td className="px-2">{r.branch}</td>
                  <td className="px-2">{r.policies}</td>
                  <td className="px-2">₹{(r.gwp/1000).toFixed(1)}k</td>
                  <td className="px-2">₹{((r.totalPremium || 0)/1000).toFixed(1)}k</td>
                  <td className="px-2">₹{((r.totalOD || 0)/1000).toFixed(1)}k</td>
                  <td className="px-2">{parseFloat(r.cashbackPctAvg || 0).toFixed(1)}%</td>
                  <td className="px-2">₹{r.cashback}</td>
                  <td className="px-2">₹{r.net}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-zinc-600 mt-2">Tip: Sort by <b>Net per ₹ Cashback</b> to find "most sales with least cashback".</div>
        
        {/* Debug Info */}
        {ENABLE_DEBUG && (
          <div className="mt-4 p-3 bg-zinc-100 rounded-lg text-xs">
            <div className="font-medium text-zinc-700 mb-2">🔍 Debug Info:</div>
            <div>• Total policies loaded: {policies.length}</div>
            <div>• Filtered policies: {filtered.length}</div>
            <div>• Data source: {dataSource}</div>
            <div>• Current filters: Make={make}, Model={model}, Insurer={insurer}, CashbackMax={cashbackMax}%</div>
            {policies.length > 0 && (
              <div className="mt-2">
                <div className="font-medium">Raw data:</div>
                <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                  {JSON.stringify(policies, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  )
}

export default PageExplorer;
