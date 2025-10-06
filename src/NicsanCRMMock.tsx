import React, { useMemo, useState, useRef, useEffect } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, Table2, Settings, LayoutDashboard, Users, BarChart3, BadgeInfo, Filter, Lock, LogOut, Car, SlidersHorizontal, TrendingUp, RefreshCw, CreditCard, Download } from "lucide-react";
import { ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend, Area, AreaChart, XAxis, YAxis, Tooltip } from "recharts";
import { authUtils } from './services/api';
import { policiesAPI } from './services/api';
import DualStorageService from './services/dualStorageService';
import CrossDeviceSyncDemo from './components/CrossDeviceSyncDemo';
import PageExplorer from './pages/founders/SalesExplorer/PageExplorer';
import PageLeaderboard from './pages/founders/RepLeaderboard/PageLeaderboard';
import PageSources from './pages/founders/DataSource/DataSource';
import PagePayments from './pages/founders/Payments/Payments';
import PageOverview from './pages/founders/CompanyOverview/CompanyOverview';
import PageFounderSettings from './pages/founders/Settings/Settings';
import PageKPIs from './pages/founders/KPIDashboard/KPIDashboard';
import PageTests from './pages/founders/DevTest/DevTest';
import PageReview from './pages/operations/ReviewConfirm/ReviewConfirm';
import PageManualGrid from './pages/operations/GridEntry/GridEntry';
import PagePolicyDetail from './pages/operations/PolicyDetail/PolicyDetail';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}


// Environment variables
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';
const ENABLE_MOCK_DATA = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

// --- Nicsan CRM v1 UI/UX Mock (updated) ---
// Adds: Password-protected login, optimized Manual Form, Founder filters, KPI dashboard (your new metrics)
// Now: Manual Form includes ALL requested columns; PDF flow includes a small manual entry panel.
// Tailwind CSS assumed. Static demo state only.

// ---------- AUTH ----------
function LoginPage({ onLogin }: { onLogin: (user: { name: string; email: string; role: "ops" | "founder" }) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Use smart API service with mock fallback
      const response = await DualStorageService.login({ email, password });
      
      
      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        
        
        if (!token) {
          setError('No token received from server');
          return;
        }
        
        // Store token and user data
        
        try {
          // Try authUtils first
          authUtils.setToken(token);
        } catch (error) {
          console.error('🔍 authUtils.setToken failed:', error);
        }
        
        try {
          // Also store directly to verify
          localStorage.setItem('authToken', token);
        } catch (error) {
          console.error('🔍 Direct localStorage storage failed:', error);
        }
        
        // Call onLogin with real user data
        onLogin({ 
          name: userData?.name || email.split('@')[0] || 'User', 
          email: userData?.email || email, 
          role: userData?.role || 'ops' 
        });
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-zinc-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
        <div className="flex items-center gap-2 text-lg font-semibold mb-1"><Lock className="w-5 h-5"/> Nicsan CRM v1</div>
        
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <label className="block mb-3">
          <div className="text-xs text-zinc-600 mb-1">Email</div>
          <input 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" 
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </label>
        <label className="block mb-4">
          <div className="text-xs text-zinc-600 mb-1">Password</div>
          <input 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" 
            placeholder="••••••••"
            disabled={isLoading}
          />
        </label>
        
        <button 
          onClick={handleLogin} 
          disabled={isLoading}
          className="w-full px-4 py-2 rounded-xl bg-zinc-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
        
        
      </div>
    </div>
  )
}

// ---------- LAYOUT ----------
function TopTabs({ tab, setTab, user, onLogout }: { tab: "ops" | "founder"; setTab: (t: "ops" | "founder") => void; user: {name:string; role:"ops"|"founder"}; onLogout: ()=>void }) {
  const founderDisabled = user.role !== 'founder';
  return (
    <div className="w-full border-b border-zinc-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="text-xl font-semibold">Nicsan CRM v1</div>
        <div className="ml-auto flex items-center gap-2">
          <div className="rounded-xl bg-zinc-100 p-1 flex gap-2">
            <button onClick={() => setTab("ops")} className={`px-4 py-2 rounded-lg text-sm ${tab === "ops" ? "bg-white shadow" : "text-zinc-600"}`}>Operations</button>
            <button onClick={() => !founderDisabled && setTab("founder")} className={`px-4 py-2 rounded-lg text-sm ${tab === "founder" ? "bg-white shadow" : founderDisabled?"text-zinc-300 cursor-not-allowed":"text-zinc-600"}`}>Founder</button>
          </div>
          <div className="text-sm text-zinc-600 px-2 py-1 rounded-lg bg-zinc-100">{user.name} · {user.role.toUpperCase()}</div>
          <button onClick={onLogout} className="px-3 py-2 rounded-lg border flex items-center gap-2"><LogOut className="w-4 h-4"/> Logout</button>
        </div>
      </div>
    </div>
  )
}

function Shell({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-6 grid grid-cols-12 gap-6">
      <aside className="col-span-12 lg:col-span-3 space-y-3">{sidebar}</aside>
      <main className="col-span-12 lg:col-span-9 space-y-6">{children}</main>
    </div>
  )
}

function Card({ title, desc, children, actions }: { title: string; desc?: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="font-semibold text-zinc-900">{title}</div>
        {desc && (
          <div className="text-xs text-zinc-500 flex items-center gap-1"><BadgeInfo className="w-4 h-4"/>{desc}</div>
        )}
        <div className="ml-auto">{actions}</div>
      </div>
      {children}
    </div>
  )
}

function Tile({ label, value, sub, info, onClick }: { label: string; value: string; sub?: string; info?: string; onClick?: () => void }) {
  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm border border-zinc-100 p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="text-xs text-zinc-500 flex items-center gap-1">{label} {info && <span className="text-[10px] text-zinc-400">({info})</span>}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-emerald-600 mt-1">{sub}</div>}
    </div>
  )
}

// ---------- OPS ----------
function OpsSidebar({ page, setPage }: { page: string; setPage: (p: string) => void }) {
  const items = [
    { id: "upload", label: "PDF Upload", icon: Upload },
    { id: "review", label: "Review & Confirm", icon: FileText },
    { id: "manual-form", label: "Manual Form", icon: CheckCircle2 },
    { id: "manual-grid", label: "Grid Entry", icon: Table2 },
    { id: "policy-detail", label: "Policy Detail", icon: FileText },
    { id: "sync-demo", label: "Cross-Device Sync", icon: RefreshCw },
    { id: "settings", label: "Settings", icon: Settings },
  ]
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-2 sticky top-20">
      {items.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => setPage(id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${page===id?"bg-zinc-900 text-white":"hover:bg-zinc-100"}`}>
          <Icon className="w-4 h-4"/> {label}
        </button>
      ))}
      <div className="px-3 pt-2 text-[11px] text-zinc-500">
        Tip: <kbd>Tab</kbd>/<kbd>Shift+Tab</kbd> move · <kbd>Ctrl+S</kbd> save · <kbd>Ctrl+Enter</kbd> save & next
      </div>
    </div>
  )
}

function PageUpload() {
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [selectedInsurer, setSelectedInsurer] = useState<string>('TATA_AIG');
  
  // Available insurers configuration
  const availableInsurers = [
    { value: 'TATA_AIG', label: 'Tata AIG' },
    { value: 'DIGIT', label: 'Digit' },
    { value: 'RELIANCE_GENERAL', label: 'Reliance General' },
    { value: 'LIBERTY_GENERAL', label: 'Liberty General Insurance' },
    { value: 'ICIC', label: 'ICICI Lombard' },
    { value: 'ROYAL_SUNDARAM', label: 'Royal Sundaram General Insurance' },
    { value: 'ZURICH_KOTAK', label: 'Zurich Kotak General Insurance' },
    { value: 'HDFC_ERGO', label: 'HDFC ERGO General Insurance' }
  ];
  const [manualExtras, setManualExtras] = useState({
    executive: '',
    opsExecutive: '',
    callerName: '',
    mobile: '',
    customerEmail: '',
    rollover: '',
    remark: '',
    brokerage: '0',
    cashback: '',
    customerPaid: '',
    customerChequeNo: '',
    ourChequeNo: '',
    branch: '',
    paymentMethod: 'INSURER',
    paymentSubMethod: ''
  });
  const [manualExtrasSaved, setManualExtrasSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [_callerNames, setCallerNames] = useState<string[]>([]);

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    
    if (!selectedInsurer) {
      setUploadStatus('Please select an insurer first');
      return;
    }

    if (!manualExtrasSaved) {
      setUploadStatus('⚠️ Please save your manual extras first before uploading PDF');
      return;
    }

    setUploadStatus('Uploading...');

    try {
      // Create FormData with insurer and manual extras
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('insurer', selectedInsurer);
      
      // Add manual extras to FormData
      Object.entries(manualExtras).forEach(([key, value]) => {
        if (value) {
          formData.append(`manual_${key}`, value);
        }
      });
      
      const result = await DualStorageService.uploadPDF(file, manualExtras, selectedInsurer);
      
      if (result.success) {
        setUploadStatus('Upload successful! Processing with Textract...');
        
        // Use the real upload ID from backend response
        const realUploadId = result.data?.uploadId;
        
        if (!realUploadId) {
          setUploadStatus('Error: No upload ID received from server');
          return;
        }
        
        const newFile = {
          id: realUploadId, // Use real upload ID
          filename: file.name,
          status: 'UPLOADED',
          insurer: selectedInsurer,
          s3_key: result.data?.s3Key || `uploads/${Date.now()}_${file.name}`,
          time: new Date().toLocaleTimeString(),
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
          // Structure that matches Review page expectations
          extracted_data: {
            insurer: selectedInsurer,
            status: 'UPLOADED',
            manual_extras: { ...manualExtras },
            extracted_data: {
              // Mock PDF data for demo (in real app, this comes from Textract)
              policy_number: "TA-" + Math.floor(Math.random() * 10000),
              vehicle_number: "KA01AB" + Math.floor(Math.random() * 1000),
              insurer: availableInsurers.find(ins => ins.value === selectedInsurer)?.label || 'Unknown',
              product_type: "Private Car",
              vehicle_type: "Private Car",
              make: "Maruti",
              model: "Swift",
              cc: "1197",
              manufacturing_year: "2021",
              issue_date: new Date().toISOString().split('T')[0],
              expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              idv: 495000,
              ncb: 20,
              discount: 0,
              net_od: 5400,
              ref: "",
              total_od: 7200,
              net_premium: 10800,
              total_premium: 12150,
              customer_name: 'John Doe',
              confidence_score: 0.86
            }
          }
        };
        
        setUploadedFiles(prev => [newFile, ...prev]);
        
        // Save to localStorage so Review page can access it
        const allUploads = [newFile, ...uploadedFiles];
        localStorage.setItem('nicsan_crm_uploads', JSON.stringify(allUploads));
        console.log('💾 Saved uploads to localStorage:', allUploads);
        
        // Start polling for status updates
        pollUploadStatus(realUploadId);
        
        // Clear manual extras after successful upload
        setManualExtras({
          executive: '',
          opsExecutive: '',
          callerName: '',
          mobile: '',
          customerEmail: '',
          rollover: '',
          remark: '',
          brokerage: '',
          cashback: '',
          customerPaid: '',
          customerChequeNo: '',
          ourChequeNo: '',
          branch: '',
          paymentMethod: 'Cash',
          paymentSubMethod: ''
        });
        setManualExtrasSaved(false);
      } else {
        // Handle insurer mismatch error specifically
        if (result.data?.status === 'INSURER_MISMATCH') {
          setUploadStatus(`❌ Insurer Mismatch: ${result.error}`);
          
          // Add to uploaded files list with INSURER_MISMATCH status
          const newFile = {
            id: result.data.uploadId,
            filename: file.name,
            status: 'INSURER_MISMATCH',
            insurer: selectedInsurer,
            s3_key: result.data?.s3Key || `uploads/${Date.now()}_${file.name}`,
            time: new Date().toLocaleTimeString(),
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            extracted_data: {
              insurer: selectedInsurer,
              status: 'INSURER_MISMATCH',
              error: result.error
            }
          };
          
          setUploadedFiles(prev => [...prev, newFile]);
        } else {
          setUploadStatus(`Upload failed: ${result.error}`);
        }
      }
    } catch (error) {
      setUploadStatus(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const pollUploadStatus = async (uploadId: string) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;
    
    const poll = async () => {
      try {
        const response = await DualStorageService.getUploadById(uploadId);
        
        if (response.success) {
          const status = response.data.status;
          
          // Update local state
          setUploadedFiles(prev => {
            const updated = prev.map(f => 
              f.id === uploadId ? { 
                ...f, 
                status,
                extracted_data: {
                  ...f.extracted_data,
                  status
                }
              } : f
            );
            
            // Update localStorage with new status
            localStorage.setItem('nicsan_crm_uploads', JSON.stringify(updated));
            
            return updated;
          });
          
          if (status === 'REVIEW' || status === 'COMPLETED') {
            setUploadStatus('PDF processed successfully! Ready for review.');
            
            // Show notification for review
            if (status === 'REVIEW') {
              // In a real app, you might want to show a toast notification
              console.log('🎉 PDF ready for review! Check the Review & Confirm page.');
              
              // Show browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('PDF Ready for Review!', {
                  body: 'Your PDF has been processed and is ready for review.',
                  icon: '📄'
                });
              }
              
              // Show alert for demo purposes
              alert('🎉 PDF processed successfully! Ready for review. Go to Review & Confirm page.');
            }
            
            return; // Stop polling
          } else if (status === 'FAILED') {
            setUploadStatus('PDF processing failed. Please try again.');
            return; // Stop polling
          } else if (status === 'INSURER_MISMATCH') {
            setUploadStatus('❌ Insurer mismatch detected. Please check your selection and upload the correct PDF.');
            return; // Stop polling
          }
          
          // Continue polling if still processing
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 2000); // Poll every 2 seconds
          } else {
            setUploadStatus('PDF processing timed out. Please check status.');
          }
        }
      } catch (error) {
        console.error('Status polling failed:', error);
      }
    };
    
    // Start polling
    poll();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleManualExtrasChange = (field: string, value: string) => {
    setManualExtras(prev => ({ ...prev, [field]: value }));
  };

  // Load real caller names on component mount
  useEffect(() => {
    const loadCallerNames = async () => {
      try {
        const response = await DualStorageService.getTelecallers();
        if (response.success && response.data) {
          const names = response.data
            .map((telecaller: any) => telecaller.name)
            .filter((name: string) => name && name !== 'Unknown');
          setCallerNames(names);
        }
      } catch (error) {
        console.warn('Failed to load caller names:', error);
        // Fallback to mock data
        setCallerNames(['Priya Singh', 'Rahul Kumar', 'Anjali Sharma']);
      }
    };
    
    loadCallerNames();
  }, []);

  // Smart suggestions for caller names
  // const __getSmartSuggestions = (fieldName: string) => {
  //   if (fieldName === 'callerName') {
  //     return callerNames; // Real caller names from database
  //   }
  //   return [];
  // };

  // Filtered caller suggestions for autocomplete
  const getFilteredCallerSuggestions = async (input: string): Promise<string[]> => {
    if (input.length < 2) return [];
    
    try {
      const response = await DualStorageService.getTelecallers();
      if (response.success && response.data) {
        const filteredNames = response.data
          .map((telecaller: any) => telecaller.name)
          .filter((name: string) => 
            name && 
            name !== 'Unknown' && 
            name.toLowerCase().includes(input.toLowerCase())
          )
          .slice(0, 5); // Limit to 5 suggestions
        return filteredNames;
      }
    } catch (error) {
      console.warn('Failed to get caller suggestions:', error);
    }
    
    // Fallback to mock data with filtering
    const mockCallers = ['Priya Singh', 'Rahul Kumar', 'Anjali Sharma'];
    return mockCallers.filter(name => 
      name.toLowerCase().includes(input.toLowerCase())
    );
  };

  // Handle adding new telecaller
  const handleAddNewTelecaller = async (telecallerName: string) => {
    try {
      setUploadStatus('Adding new telecaller...');
      
      const result = await DualStorageService.addTelecaller({
        name: telecallerName,
        email: '',
        phone: '',
        branch: manualExtras.branch || 'Default'
      });
      
      if (result.success) {
        setUploadStatus('✅ New telecaller added successfully!');
        
        // Auto-select the new telecaller
        setManualExtras(prev => ({
          ...prev,
          callerName: telecallerName
        }));
        
        // Refresh the caller names list
        const updatedResponse = await DualStorageService.getTelecallers();
        if (updatedResponse.success && updatedResponse.data) {
          const names = updatedResponse.data
            .map((telecaller: any) => telecaller.name)
            .filter((name: string) => name && name !== 'Unknown');
          setCallerNames(names);
        }
      } else {
        setUploadStatus(`❌ Failed to add telecaller: ${result.error}`);
      }
    } catch (error) {
      setUploadStatus(`❌ Error adding telecaller: ${(error as Error).message}`);
    }
  };

  return (
    <>
      <Card title="Drag & Drop PDF" desc="(S3 = cloud folder; Textract = PDF reader bot). Tata AIG & Digit only in v1.">
        {/* Insurer Selection */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Select Insurer</div>
          <div className="grid grid-cols-2 gap-2">
            {availableInsurers.map((insurer) => (
              <label key={insurer.value} className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="insurer"
                  value={insurer.value} 
                  checked={selectedInsurer === insurer.value}
                  onChange={(e) => setSelectedInsurer(e.target.value)}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm">{insurer.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Manual Extras Section */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="text-sm font-medium mb-3 text-blue-800">📝 Manual Extras (from Sales Rep)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-blue-700 mb-1">Executive</label>
              <input 
                type="text" 
                placeholder="Sales rep name"
                value={manualExtras.executive}
                onChange={(e) => handleManualExtrasChange('executive', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Ops Executive</label>
              <input 
                type="text" 
                placeholder="Ops executive name"
                value={manualExtras.opsExecutive}
                onChange={(e) => handleManualExtrasChange('opsExecutive', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <AutocompleteInput 
                label="Caller Name" 
                placeholder="Telecaller name"
                value={manualExtras.callerName}
                onChange={(value) => handleManualExtrasChange('callerName', value)}
                getSuggestions={getFilteredCallerSuggestions}
                onAddNew={handleAddNewTelecaller}
                showAddNew={true}
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Customer Email ID</label>
              <input 
                type="text" 
                placeholder="name@example.com"
                value={manualExtras.customerEmail}
                onChange={(e) => handleManualExtrasChange('customerEmail', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Mobile Number</label>
              <input 
                type="text" 
                placeholder="9xxxxxxxxx"
                value={manualExtras.mobile}
                onChange={(e) => handleManualExtrasChange('mobile', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Rollover/Renewal</label>
              <input 
                type="text" 
                placeholder="Internal code"
                value={manualExtras.rollover}
                onChange={(e) => handleManualExtrasChange('rollover', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div style={{ display: 'none' }}>
              <label className="block text-xs text-blue-700 mb-1">Brokerage (₹)</label>
              <input 
                type="text" 
                placeholder="Commission amount"
                value={manualExtras.brokerage}
                onChange={(e) => handleManualExtrasChange('brokerage', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Cashback (₹)</label>
              <input 
                type="text" 
                placeholder="Total cashback"
                value={manualExtras.cashback}
                onChange={(e) => handleManualExtrasChange('cashback', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Customer Paid (₹)</label>
              <input 
                type="text" 
                placeholder="Amount or text (e.g., 5000 or Pending)"
                value={manualExtras.customerPaid}
                onChange={(e) => handleManualExtrasChange('customerPaid', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Customer Cheque No</label>
              <input 
                type="text" 
                placeholder="Customer's cheque number"
                value={manualExtras.customerChequeNo}
                onChange={(e) => handleManualExtrasChange('customerChequeNo', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Our Cheque No</label>
              <input 
                type="text" 
                placeholder="Your company's cheque number"
                value={manualExtras.ourChequeNo}
                onChange={(e) => handleManualExtrasChange('ourChequeNo', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Branch <span className="text-red-500">*</span></label>
              <input 
                type="text"
                placeholder="Enter branch name"
                value={manualExtras.branch}
                onChange={(e) => handleManualExtrasChange('branch', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Payment Method</label>
              <select 
                value={manualExtras.paymentMethod}
                onChange={(e) => {
                  handleManualExtrasChange('paymentMethod', e.target.value);
                  if (e.target.value !== 'NICSAN') {
                    handleManualExtrasChange('paymentSubMethod', '');
                  }
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="INSURER">INSURER</option>
                <option value="NICSAN">NICSAN</option>
              </select>
            </div>
            {manualExtras.paymentMethod === 'NICSAN' && (
              <div>
                <label className="block text-xs text-blue-700 mb-1">Payment Sub-Method</label>
                <select 
                  value={manualExtras.paymentSubMethod}
                  onChange={(e) => handleManualExtrasChange('paymentSubMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select Sub-Method</option>
                  <option value="DIRECT">DIRECT</option>
                  <option value="EXECUTIVE">EXECUTIVE</option>
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-xs text-blue-700 mb-1">Remark</label>
              <textarea 
                placeholder="Any additional notes or special instructions"
                value={manualExtras.remark}
                onChange={(e) => handleManualExtrasChange('remark', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                rows={2}
              />
            </div>
          </div>
          {/* Submit Button for Manual Extras */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={async () => {
                // Show preview of what will be submitted
                const filledFields = Object.entries(manualExtras).filter(([, value]) => value.trim() !== '');
                // Validate required branch field
                if (!manualExtras.branch || manualExtras.branch.trim() === '') {
                  alert('Branch field is required! Please enter branch name.');
                  return;
                }
                
                if (filledFields.length === 0) {
                  alert('Please fill at least one manual field before proceeding');
                  return;
                }
                
                // Validate Caller Name if provided
                if (manualExtras.callerName && manualExtras.callerName.trim() !== '') {
                  // Format validation
                  if (manualExtras.callerName.trim().length < 2) {
                    alert('Caller Name must be at least 2 characters');
                    return;
                  }
                  
                  // Database existence validation
                  try {
                    const response = await DualStorageService.getTelecallers();
                    if (response.success && response.data) {
                      const telecallerExists = response.data.some(
                        (telecaller: any) => telecaller.name === manualExtras.callerName.trim()
                      );
                      if (!telecallerExists) {
                        alert(`Telecaller "${manualExtras.callerName}" does not exist. Please select from suggestions or add them first.`);
                        return;
                      }
                    }
                  } catch (error) {
                    alert('Failed to validate telecaller. Please try again.');
                    return;
                  }
                }
                
                setManualExtrasSaved(true);
                setUploadStatus('✅ Manual extras saved! Now drop your PDF to complete the upload.');
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              💾 Save Manual Extras
            </button>
          </div>
          
          <div className="text-xs text-blue-600 mt-2">
            💡 Fill the fields above, click "Save Manual Extras", then drop your PDF. Both will be combined for review!
          </div>
        </div>

        {/* Workflow Step Indicator */}
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              manualExtrasSaved ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {manualExtrasSaved ? '✓' : '1'}
            </span>
            <span className={manualExtrasSaved ? 'text-green-800' : 'text-gray-600'}>
              {manualExtrasSaved ? 'Manual Extras Saved ✓' : 'Fill Manual Extras above and click "Save Manual Extras"'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-2">
            <span className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span className="text-gray-600">Drop your PDF below to complete the upload</span>
          </div>
        </div>

        <div 
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
            uploadStatus.includes('Uploading') ? 'border-indigo-400 bg-indigo-50' : 'border-zinc-300 hover:border-zinc-400'
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
          }}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".pdf" 
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="space-y-4">
            <div className="text-6xl">📄</div>
            <div>
              <div className="text-xl font-medium">Drop PDF here or</div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                browse files
              </button>
            </div>
            <div className="text-sm text-zinc-500">PDF will be processed with Textract + your manual extras</div>
            {manualExtrasSaved && (
              <div className="text-sm text-green-600 font-medium">
                ✅ Manual extras ready! Drop PDF to continue
              </div>
            )}
          </div>
        </div>

        {uploadStatus && (
          <div className="mt-4 p-3 rounded-lg bg-zinc-50 text-sm">
            {uploadStatus}
          </div>
        )}

        <div className="mt-6">
          <div className="text-sm font-medium mb-3">Upload History</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="py-2">Time</th><th>Filename</th><th>Insurer</th><th>Size</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {uploadedFiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-zinc-500">
                      No uploads yet. Drag and drop a PDF to get started.
                    </td>
                  </tr>
                ) : (
                  uploadedFiles.map((file) => (
                    <tr key={file.id} className="border-t">
                      <td className="py-2">{file.time}</td>
                      <td className="py-2">{file.filename}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          file.insurer === 'TATA_AIG' 
                            ? 'bg-blue-100 text-blue-700'
                            : file.insurer === 'DIGIT'
                            ? 'bg-green-100 text-green-700'
                            : file.insurer === 'RELIANCE_GENERAL'
                            ? 'bg-purple-100 text-purple-700'
                            : file.insurer === 'LIBERTY_GENERAL'
                            ? 'bg-yellow-100 text-yellow-700'
                            : file.insurer === 'ICIC'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {availableInsurers.find(ins => ins.value === file.insurer)?.label || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-2">{file.size}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          file.status === 'UPLOADED'
                            ? 'bg-blue-100 text-blue-700'
                            : file.status === 'PROCESSING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : file.status === 'REVIEW'
                            ? 'bg-orange-100 text-orange-700'
                            : file.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : file.status === 'FAILED'
                            ? 'bg-red-100 text-red-700'
                            : file.status === 'INSURER_MISMATCH'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {file.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </>
  )
}

function LabeledInput({ label, placeholder, hint, required, value, onChange, error, suggestions }: { 
  label: string; 
  placeholder?: string; 
  hint?: string; 
  required?: boolean; 
  value?: any; 
  onChange?: (v:any)=>void;
  error?: string;
  suggestions?: string[];
}) {
  return (
    <label className="block">
      <div className="text-xs text-zinc-600 mb-1">
        {label} {required && <span className="text-rose-600">*</span>} {hint && <span className="text-[10px] text-zinc-400">({hint})</span>}
      </div>
      <input 
        value={value || ''} 
        onChange={e=>onChange && onChange(e.target.value)} 
        className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
          error ? 'border-red-300 bg-red-50' : 'border-zinc-300'
        }`} 
        placeholder={placeholder} 
      />
      {error && (
        <div className="text-xs text-red-600 mt-1">{error}</div>
      )}
      {suggestions && suggestions.length > 0 && (
        <div className="text-xs text-blue-600 mt-1">
          Suggestions: {suggestions.slice(0, 3).join(', ')}
          {suggestions.length > 3 && ` +${suggestions.length - 3} more`}
        </div>
      )}
    </label>
  )
}

function AutocompleteInput({ 
  label, 
  placeholder, 
  hint, 
  required, 
  value, 
  onChange, 
  error, 
  getSuggestions,
  onAddNew,
  showAddNew = false
}: { 
  label: string; 
  placeholder?: string; 
  hint?: string; 
  required?: boolean; 
  value?: any; 
  onChange?: (v:any)=>void;
  error?: string;
  getSuggestions?: (input: string) => Promise<string[]>;
  onAddNew?: (value: string) => void;
  showAddNew?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddNewOption, setShowAddNewOption] = useState(false);

  // Debounced suggestions loading
  const debouncedGetSuggestions = useMemo(
    () => {
      let timeoutId: NodeJS.Timeout;
      return (input: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (input.length >= 2 && getSuggestions) {
            setIsLoading(true);
            try {
              const newSuggestions = await getSuggestions(input);
              setSuggestions(newSuggestions);
              setShowSuggestions(true);
              
              // Show "Add New" option if no suggestions found
              setShowAddNewOption(newSuggestions.length === 0 && showAddNew);
            } catch (error) {
              console.warn('Failed to get suggestions:', error);
              setSuggestions([]);
              setShowAddNewOption(showAddNew);
            } finally {
              setIsLoading(false);
            }
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
            setShowAddNewOption(false);
          }
        }, 300);
      };
    },
    [getSuggestions, showAddNew]
  );

  const handleInputChange = (inputValue: string) => {
    onChange && onChange(inputValue);
    debouncedGetSuggestions(inputValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange && onChange(suggestion);
    setShowSuggestions(false);
    setShowAddNewOption(false);
  };

  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew(value);
    }
    setShowSuggestions(false);
    setShowAddNewOption(false);
  };

  const handleInputFocus = () => {
    if (value && value.length >= 2) {
      setShowSuggestions(suggestions.length > 0);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding to allow click on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <label className="block">
        <div className="text-xs text-blue-700 mb-1">
          {label} {required && <span className="text-rose-600">*</span>} {hint && <span className="text-[10px] text-zinc-400">({hint})</span>}
        </div>
        <input 
          value={value} 
          onChange={e => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${
            error ? 'border-red-300 bg-red-50' : 'border-blue-300'
          }`} 
          placeholder={placeholder} 
        />
        {isLoading && (
          <div className="absolute right-3 top-8 text-blue-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
        {error && (
          <div className="text-xs text-red-600 mt-1">{error}</div>
        )}
      </label>
      
      {/* Enhanced dropdown with Add New option */}
      {showSuggestions && (suggestions.length > 0 || showAddNewOption) && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-zinc-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-zinc-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
          
          {/* Add New Telecaller Option */}
          {showAddNewOption && (
            <div
              className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm border-t border-zinc-200 bg-green-50 text-green-700 font-medium"
              onClick={handleAddNew}
            >
              ➕ Add '{value}' as new Telecaller
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LabeledSelect({ label, value, onChange, options, required, error }: { 
  label: string; 
  value?: any; 
  onChange?: (v:any)=>void; 
  options: string[];
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block text-sm">
      <div className="text-xs text-zinc-600 mb-1">
        {label} {required && <span className="text-rose-600">*</span>}
      </div>
      <select 
        value={value} 
        onChange={e=>onChange && onChange(e.target.value)} 
        className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
          error ? 'border-red-300 bg-red-50' : 'border-zinc-300'
        }`}
      >
        <option value="">Select {label}</option>
        {options.map(o=> <option key={o} value={o}>{o}</option>)}
      </select>
      {error && (
        <div className="text-xs text-red-600 mt-1">{error}</div>
      )}
    </label>
  )
}

// Optimized manual form with QuickFill and two-way cashback calc
function PageManualForm() {
  const [form, setForm] = useState<any>({
    insurer: "",
    productType: "",
    vehicleType: "",
    make: "",
    model: "",
    cc: "",
    manufacturingYear: "",
    policyNumber: "",
    vehicleNumber: "",
    issueDate: "",
    expiryDate: "",
    idv: "",
    ncb: "",
    discount: "",
    netOd: "",
    ref: "",
    totalOd: "",
    netPremium: "",
    totalPremium: "",
    cashbackPct: "",
    cashbackAmt: "",
    customerPaid: "",
    customerChequeNo: "",
    ourChequeNo: "",
    executive: "",
    opsExecutive: "",
    callerName: "",
    mobile: "",
            rollover: "",
            remark: "",
            brokerage: "0",
            cashback: "",
            customerName: "",
            customerEmail: "",
            branch: "",
            paymentMethod: "INSURER",
            paymentSubMethod: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [_validationHistory, setValidationHistory] = useState<any[]>([]);
  const [fieldTouched, setFieldTouched] = useState<{[key: string]: boolean}>({});
  const [vehicleSearchResults, setVehicleSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [validationMode, setValidationMode] = useState<'progressive' | 'strict'>('progressive');
  const [_callerNames, setCallerNames] = useState<string[]>([]);
  
  const set = (k:string,v:any)=> {
    setForm((f:any)=>({ ...f, [k]: v }));
    // Mark field as touched for progressive validation
    setFieldTouched(prev => ({ ...prev, [k]: true }));
  };
  const number = (v:any)=> (v===''||v===null)?0:parseFloat(v.toString().replace(/[^0-9.]/g,''))||0;

  // Two-way binding for cashback
  const onTotalChange = (v:any)=> {
    const tp = number(v);
    const pct = number(form.cashbackPct);
    const amt = pct? Math.round(tp * pct / 100): number(form.cashbackAmt);
    setForm({ ...form, totalPremium: v, cashbackAmt: amt?amt.toString():"" })
  }
  const onPctChange = (v:any)=> {
    const tp = number(form.totalPremium); const pct = number(v);
    const amt = tp? Math.round(tp * pct / 100): 0; setForm({ ...form, cashbackPct: v, cashbackAmt: amt?amt.toString():"" })
  }
  const onAmtChange = (v:any)=> {
    const tp = number(form.totalPremium); const amt = number(v);
    const pct = tp? ((amt/tp)*100).toFixed(1): ""; setForm({ ...form, cashbackAmt: v, cashbackPct: pct })
  }

  // Advanced validation engine with business rules
  const validateField = (fieldName: string, value: any, _context?: any) => {
    const errors: string[] = [];
    
    // Progressive validation - only validate touched fields or all fields in strict mode
    if (validationMode === 'progressive' && !fieldTouched[fieldName]) {
      return errors;
    }

    switch (fieldName) {
      case 'policyNumber':
        if (!value) {
          errors.push('Policy Number is required');
        } else if (!/^[A-Z0-9\-_\/ ]{3,50}$/.test(value)) {
          errors.push('Policy Number must be 3-50 characters (letters, numbers, hyphens, underscores, forward slashes, spaces)');
        }
        break;
        
        case 'vehicleNumber':
          if (!value) {
            errors.push('Vehicle Number is required');
          } else {
            const cleanValue = value.replace(/\s/g, '');
            const traditionalPattern = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
            const bhSeriesPattern = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
            if (!traditionalPattern.test(cleanValue) && !bhSeriesPattern.test(cleanValue)) {
              errors.push('Vehicle Number must be in format: KA01AB1234, KA 51 MM 1214, or 23 BH 7699 J');
            }
          }
          break;
        
      case 'insurer':
        if (!value) {
          errors.push('Insurer (Company) is required');
        } else if (value.length < 3) {
          errors.push('Insurer name must be at least 3 characters');
        }
        break;
        
      case 'productType':
        if (!value) {
          errors.push('Product Type is required');
        }
        break;
        
      case 'vehicleType':
        if (!value) {
          errors.push('Vehicle Type is required');
        }
        break;
        
      case 'make':
        if (!value) {
          errors.push('Make is required');
        } else if (value.length < 2) {
          errors.push('Make must be at least 2 characters');
        }
        break;
        
      case 'model':
        if (!value) {
          errors.push('Model is required');
        } else if (value.length < 2) {
          errors.push('Model must be at least 2 characters');
        }
        break;
        
      case 'cc':
        if (!value) {
          errors.push('CC (engine size) is required');
        } else if (!/^\d{3,5}$/.test(value)) {
          errors.push('CC must be 3-5 digits');
        }
        break;
        
      case 'manufacturingYear':
        if (!value) {
          errors.push('Manufacturing Year is required');
        } else {
          const year = parseInt(value);
          const currentYear = new Date().getFullYear();
          if (isNaN(year) || year < 1990 || year > currentYear + 1) {
            errors.push(`Manufacturing Year must be between 1990 and ${currentYear + 1}`);
          }
        }
        break;
        
      case 'issueDate':
        if (!value) {
          errors.push('Issue Date is required');
        } else {
          const issueDate = new Date(value);
          const today = new Date();
          if (isNaN(issueDate.getTime()) || issueDate > today) {
            errors.push('Issue Date must be a valid date not in the future');
          }
        }
        break;
        
      case 'expiryDate':
        if (!value) {
          errors.push('Expiry Date is required');
        } else {
          const expiryDate = new Date(value);
          const issueDate = form.issueDate ? new Date(form.issueDate) : new Date();
          if (isNaN(expiryDate.getTime()) || expiryDate <= issueDate) {
            errors.push('Expiry Date must be after Issue Date');
          }
        }
        break;
        
      case 'idv':
        if (!value) {
          errors.push('IDV (₹) is required');
        } else {
          const idv = number(value);
          if (idv <= 0 || idv > 100000000) {
            errors.push('IDV must be between ₹1 and ₹10 crore');
          }
        }
        break;
        
      case 'discount':
        if (!value) {
          errors.push('Discount (%) is required');
        } else {
          const discount = number(value);
          if (discount < 0 || discount > 100) {
            errors.push('Discount must be between 0% and 100%');
          }
        }
        break;
        
      case 'netOd':
        if (!value) {
          errors.push('Net OD (₹) is required');
        } else {
          const netOd = number(value);
          if (netOd < 0 || netOd > 10000000) {
            errors.push('Net OD must be between ₹0 and ₹1 crore');
          }
        }
        break;
        
      case 'totalOd':
        if (!value) {
          errors.push('Total OD (₹) is required');
        } else {
          const totalOd = number(value);
          const netOd = number(form.netOd);
          if (totalOd < 0 || totalOd > 10000000) {
            errors.push('Total OD must be between ₹0 and ₹1 crore');
          } else if (totalOd < netOd) {
            errors.push('Total OD cannot be less than Net OD');
          }
        }
        break;
        
      case 'totalPremium':
        if (!value) {
          errors.push('Total Premium (₹) is required');
        } else {
          const totalPremium = number(value);
          if (totalPremium <= 0 || totalPremium > 1000000) {
            errors.push('Total Premium must be between ₹1 and ₹10 lakh');
          }
        }
        break;
        
      case 'customerPaid':
        if (!value) {
          errors.push('Customer Paid is required');
        } else if (value.length < 1) {
          errors.push('Customer Paid must be at least 1 character');
        } else if (value.length > 50) {
          errors.push('Customer Paid must be less than 50 characters');
        }
        break;
        
      // Brokerage validation removed - field is hidden
      // case 'brokerage':
      //   if (!value) {
      //     errors.push('Brokerage (₹) is required');
      //   } else {
      //     const brokerage = number(value);
      //     const totalPremium = number(form.totalPremium);
      //     if (brokerage < 0 || brokerage > 100000) {
      //       errors.push('Brokerage must be between ₹0 and ₹1 lakh');
      //     } else if (brokerage > totalPremium * 0.15) {
      //       errors.push('Brokerage cannot exceed 15% of Total Premium');
      //     }
      //   }
      //   break;
        
      case 'callerName':
        if (!value) {
          errors.push('Caller Name is required');
        } else if (value.length < 2) {
          errors.push('Caller Name must be at least 2 characters');
        }
        break;
        
      case 'mobile':
        if (!value) {
          errors.push('Mobile Number is required');
        } else if (!/^[6-9]\d{9}$/.test(value)) {
          errors.push('Mobile Number must be 10 digits starting with 6-9');
        }
        break;
        
      case 'rollover':
        if (!value) {
          errors.push('Rollover/Renewal is required');
        } else if (value.length < 3) {
          errors.push('Rollover/Renewal must be at least 3 characters');
        }
        break;
        
      case 'remark':
        if (!value) {
          errors.push('Remark is required');
        } else if (value.length < 5) {
          errors.push('Remark must be at least 5 characters');
        }
        break;
    }
    
    return errors;
  };

  // Cross-field validation
  const validateCrossFields = () => {
    const errors: string[] = [];
    
    // Premium validation
    const netPremium = number(form.netPremium);
    const totalPremium = number(form.totalPremium);
    const netOd = number(form.netOd);
    const totalOd = number(form.totalOd);
    
    if (netPremium > totalPremium) {
      errors.push('Net Premium cannot exceed Total Premium');
    }
    
    if (netOd > totalOd) {
      errors.push('Net OD cannot exceed Total OD');
    }
    
    // Cashback validation
    const cashbackPct = number(form.cashbackPct);
    const cashbackAmt = number(form.cashbackAmt);
    
    if (cashbackPct > 50) {
      errors.push('Cashback percentage cannot exceed 50%');
    }
    
    if (cashbackAmt > totalPremium * 0.5) {
      errors.push('Cashback amount cannot exceed 50% of Total Premium');
    }
    
    // Date validation
    if (form.issueDate && form.expiryDate) {
      const issueDate = new Date(form.issueDate);
      const expiryDate = new Date(form.expiryDate);
      const diffTime = expiryDate.getTime() - issueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        errors.push('Policy duration must be at least 30 days');
      }
      
      if (diffDays > 1095) {
        errors.push('Policy duration cannot exceed 3 years');
      }
    }
    
    return errors;
  };

  // Business rule validation
  const validateBusinessRules = () => {
    const errors: string[] = [];
    
    // NCB validation
    const ncb = number(form.ncb);
    if (ncb < 0 || ncb > 50) {
      errors.push('NCB must be between 0% and 50%');
    }
    
    // IDV vs Premium validation
    const idv = number(form.idv);
    const totalPremium = number(form.totalPremium);
    if (totalPremium > idv * 0.1) {
      errors.push('Total Premium cannot exceed 10% of IDV');
    }
    
    // Executive validation
    if (!form.executive) {
      errors.push('Executive name is required');
    } else if (form.executive.length < 2) {
      errors.push('Executive name must be at least 2 characters');
    }
    
    return errors;
  };

  // Get field-specific errors for progressive validation
  // const __getFieldErrors = (fieldName: string) => {
  //   if (validationMode === 'progressive' && !fieldTouched[fieldName]) {
  //     return [];
  //   }
  //   
  //   // For policy number, return async errors
  //   if (fieldName === 'policyNumber') {
  //     return asyncErrors[fieldName] || [];
  //   }
  //   
  //   // For other fields, return synchronous validation
  //   return validateField(fieldName, form[fieldName]);
  // };

  // Smart suggestions based on patterns
  // const __getSmartSuggestions = (fieldName: string) => {
  //   const suggestions: string[] = [];
  //   
  //   switch (fieldName) {
  //     case 'make':
  //       suggestions.push('Maruti', 'Hyundai', 'Honda', 'Tata', 'Mahindra', 'Toyota', 'Ford', 'Nissan');
  //       break;
  //     case 'model':
  //       if (form.make === 'Maruti') {
  //         suggestions.push('Swift', 'Dzire', 'Alto', 'WagonR', 'Baleno', 'Ertiga');
  //       } else if (form.make === 'Hyundai') {
  //         suggestions.push('i20', 'i10', 'Verna', 'Creta', 'Venue', 'Santro');
  //       }
  //       break;
  //     case 'insurer':
  //       suggestions.push('Tata AIG', 'ICICI Lombard', 'Bajaj Allianz', 'HDFC Ergo', 'Reliance General', 'Oriental Insurance');
  //       break;
  //     case 'callerName':
  //       return callerNames; // Real caller names from database
  //   }
  //   
  //   return suggestions;
  // };

  // Filtered caller suggestions for autocomplete
  const getFilteredCallerSuggestions = async (input: string): Promise<string[]> => {
    if (input.length < 2) return [];
    
    try {
      const response = await DualStorageService.getTelecallers();
      if (response.success && response.data) {
        const filteredNames = response.data
          .map((telecaller: any) => telecaller.name)
          .filter((name: string) => 
            name && 
            name !== 'Unknown' && 
            name.toLowerCase().includes(input.toLowerCase())
          )
          .slice(0, 5); // Limit to 5 suggestions
        return filteredNames;
      }
    } catch (error) {
      console.warn('Failed to get caller suggestions:', error);
    }
    
    // Fallback to mock data with filtering
    const mockCallers = ['Priya Singh', 'Rahul Kumar', 'Anjali Sharma'];
    return mockCallers.filter(name => 
      name.toLowerCase().includes(input.toLowerCase())
    );
  };

  // Handle adding new telecaller
  const handleAddNewTelecaller = async (telecallerName: string) => {
    try {
      // Auto-select the new telecaller
      set('callerName', telecallerName);
      
      const result = await DualStorageService.addTelecaller({
        name: telecallerName,
        email: '',
        phone: '',
        branch: form.branch || 'Default'
      });
      
      if (result.success) {
        // Refresh the caller names list
        const updatedResponse = await DualStorageService.getTelecallers();
        if (updatedResponse.success && updatedResponse.data) {
          const names = updatedResponse.data
            .map((telecaller: any) => telecaller.name)
            .filter((name: string) => name && name !== 'Unknown');
          setCallerNames(names);
        }
      }
    } catch (error) {
      console.error('Error adding telecaller:', error);
    }
  };

  const handleVehicleNumberChange = async (vehicleNumber: string) => {
    set('vehicleNumber', vehicleNumber);
    
    if (vehicleNumber && vehicleNumber.length >= 4) {
      setIsSearching(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/policies/search/vehicle/${encodeURIComponent(vehicleNumber)}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success) {
          setVehicleSearchResults(data.data || []);
        } else {
          setVehicleSearchResults([]);
        }
      } catch (error) {
        console.error('Vehicle search failed:', error);
        setVehicleSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setVehicleSearchResults([]);
    }
  };

  const quickFill = async () => {
    if (vehicleSearchResults.length > 0) {
      // Use most recent policy data (already sorted by created_at DESC)
      const lastPolicy = vehicleSearchResults[0] as any;
      
      setForm((f: any) => ({
        ...f,
        insurer: lastPolicy.insurer || f.insurer,
        productType: lastPolicy.product_type || f.productType,
        vehicleType: lastPolicy.vehicle_type || f.vehicleType,
        make: lastPolicy.make || f.make,
        model: lastPolicy.model || f.model,
        cc: lastPolicy.cc || f.cc,
        manufacturingYear: lastPolicy.manufacturing_year || f.manufacturingYear,
        idv: lastPolicy.idv || f.idv,
        ncb: lastPolicy.ncb || f.ncb,
        discount: lastPolicy.discount || f.discount,
        netOd: lastPolicy.net_od || f.netOd,
        ref: lastPolicy.ref || f.ref,
        totalOd: lastPolicy.total_od || f.totalOd,
        netPremium: lastPolicy.net_premium || f.netPremium,
        totalPremium: lastPolicy.total_premium || f.totalPremium,
        brokerage: lastPolicy.brokerage || f.brokerage,
        cashback: lastPolicy.cashback_amount || f.cashback,
        branch: lastPolicy.branch || f.branch,
        rollover: lastPolicy.rollover || f.rollover,
        callerName: lastPolicy.caller_name || f.callerName,
        executive: lastPolicy.executive || f.executive,
        opsExecutive: lastPolicy.ops_executive || f.opsExecutive,
      }));
    } else {
      // Fallback to demo data if no search results
    setForm((f:any)=> ({ ...f,
      insurer: f.insurer || "Tata AIG",
      productType: f.productType || "Private Car",
      vehicleType: f.vehicleType || "Private Car",
      make: f.make || "Maruti",
      model: f.model || "Swift",
      cc: f.cc || "1197",
      manufacturingYear: f.manufacturingYear || "2021",
      idv: f.idv || "495000",
      ncb: f.ncb || "20",
      discount: f.discount || "0",
      netOd: f.netOd || "5400",
      ref: f.ref || "",
      totalOd: f.totalOd || "7200",
      netPremium: f.netPremium || "10800",
      totalPremium: f.totalPremium || "12150",
      brokerage: f.brokerage || "500",
      cashback: f.cashback || "600",
    }))
    }
  }

  // Form submission handlers
  const handleSave = async () => {
    await submitForm(false);
  };

  const handleSaveAndNew = async () => {
    await submitForm(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSaveAndNew();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const submitForm = async (clearAfterSave: boolean) => {
    // Clear previous messages
    setSubmitMessage(null);
    
    // Validate required branch field
    if (!form.branch || form.branch.trim() === '') {
      setSubmitMessage({ type: 'error', message: 'Branch field is required! Please enter branch name.' });
      setIsSubmitting(false);
      return;
    }
    
    // Validate form
    if (errors.length > 0) {
      setSubmitMessage({ type: 'error', message: 'Please fix the errors before saving' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API - including all fields
      const policyData = {
        policy_number: form.policyNumber,
        vehicle_number: form.vehicleNumber,
        insurer: form.insurer,
        product_type: form.productType || 'Private Car',
        vehicle_type: form.vehicleType || 'Private Car',
        make: form.make || 'Unknown',
        model: form.model || '',
        cc: form.cc || '',
        manufacturing_year: form.manufacturingYear || '',
        issue_date: form.issueDate || new Date().toISOString().split('T')[0],
        expiry_date: form.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        idv: (parseFloat(form.idv) || 0).toString(),
        ncb: (parseFloat(form.ncb) || 0).toString(),
        discount: (parseFloat(form.discount) || 0).toString(),
        net_od: (parseFloat(form.netOd) || 0).toString(),
        ref: form.ref || '',
        total_od: (parseFloat(form.totalOd) || 0).toString(),
        net_premium: (parseFloat(form.netPremium) || 0).toString(),
        total_premium: parseFloat(form.totalPremium).toString(),
        cashback_percentage: parseFloat(form.cashbackPct) || 0,
        cashback_amount: (parseFloat(form.cashbackAmt) || 0).toString(),
        customer_paid: form.customerPaid || '',
        customer_email: form.customerEmail || '',
        customer_cheque_no: form.customerChequeNo || '',
        our_cheque_no: form.ourChequeNo || '',
        executive: form.executive || 'Unknown',
        caller_name: form.callerName || 'Unknown',
        mobile: form.mobile || '0000000000',
        rollover: form.rollover || '',
        remark: form.remark || '',
        customer_name: form.customerName || '',
        branch: form.branch || '',
        brokerage: (parseFloat(form.brokerage) || 0).toString(),
        cashback: (parseFloat(form.cashback) || 0).toString(),
        payment_method: form.paymentMethod || 'INSURER',
        payment_sub_method: form.paymentSubMethod || '',
        source: 'MANUAL_FORM'
      };

      // Debug: Log the policy data being sent
      console.log('🔍 Manual Form - Policy data being sent:', policyData);

      // Submit to API
      const response = await DualStorageService.saveManualForm(policyData);
      
      // Debug: Log the response
      console.log('🔍 Manual Form - API Response:', response);
      console.log('🔍 Manual Form - Response success:', response?.success);
      console.log('🔍 Manual Form - Response data:', response?.data);
      
      if (response && response.success) {
        setSubmitMessage({ 
          type: 'success', 
          message: `Policy saved successfully! Policy ID: ${response.data?.id || 'N/A'}` 
        });
        
        if (clearAfterSave) {
          // Reset form for new entry
          setForm({
            insurer: "",
            productType: "",
            vehicleType: "",
            make: "",
            model: "",
            cc: "",
            manufacturingYear: "",
            policyNumber: "",
            vehicleNumber: "",
            issueDate: "",
            expiryDate: "",
            idv: "",
            ncb: "",
            discount: "",
            netOd: "",
            ref: "",
            totalOd: "",
            netPremium: "",
            totalPremium: "",
            cashbackPct: "",
            cashbackAmt: "",
            customerPaid: "",
            customerChequeNo: "",
            ourChequeNo: "",
            executive: "",
            callerName: "",
            mobile: "",
            rollover: "",
            remark: "",
            brokerage: "",
            cashback: "",
            customerName: "",
            branch: "",
          });
        }
      } else {
        setSubmitMessage({ 
          type: 'error', 
          message: response.error || 'Failed to save policy' 
        });
      }
    } catch (error) {
      setSubmitMessage({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // State for async validation errors
  const [asyncErrors, setAsyncErrors] = useState<{[key: string]: string[]}>({});

  // Load real caller names on component mount
  useEffect(() => {
    const loadCallerNames = async () => {
      try {
        const response = await DualStorageService.getTelecallers();
        if (response.success && response.data) {
          const names = response.data
            .map((telecaller: any) => telecaller.name)
            .filter((name: string) => name && name !== 'Unknown');
          setCallerNames(names);
        }
      } catch (error) {
        console.warn('Failed to load caller names:', error);
        // Fallback to mock data
        setCallerNames(['Priya Singh', 'Rahul Kumar', 'Anjali Sharma']);
      }
    };
    
    loadCallerNames();
  }, []);

  // Comprehensive validation (synchronous part)
  const errors = useMemo(() => {
    const allErrors: string[] = [];
    
    // Field-level validation (synchronous only)
    Object.keys(form).forEach(field => {
      if (field !== 'policyNumber') { // Skip async fields
        const fieldErrors = validateField(field, form[field]);
        allErrors.push(...fieldErrors);
      }
    });
    
    // Cross-field validation
    const crossFieldErrors = validateCrossFields();
    allErrors.push(...crossFieldErrors);
    
    // Business rule validation
    const businessRuleErrors = validateBusinessRules();
    allErrors.push(...businessRuleErrors);
    
    // Add async errors
    Object.values(asyncErrors).forEach(fieldErrors => {
      allErrors.push(...fieldErrors);
    });
    
    // Log validation history for analytics
    if (allErrors.length > 0) {
      setValidationHistory(prev => [...prev, {
        timestamp: new Date().toISOString(),
        errors: allErrors,
        formData: { ...form }
      }]);
    }
    
    return allErrors;
  }, [form, fieldTouched, validationMode, asyncErrors]);

  // Async validation for policy number
  const validatePolicyNumberAsync = async (value: string) => {
    const errors: string[] = [];
    
    if (!value) {
      return errors;
    }
    
    if (!/^[A-Z0-9\-_\/ ]{3,50}$/.test(value)) {
      return errors; // Format validation handled by sync validation
    }
    
    try {
      const response = await policiesAPI.checkDuplicate(value);
      if (response.success && response.data?.exists) {
        errors.push('Policy number already exists. Please use a different number.');
      }
    } catch (error) {
      console.warn('Policy number duplicate check failed:', error);
      // Don't add error if check fails - allow user to proceed
    }
    
    return errors;
  };

  // Handle async validation for policy number
  useEffect(() => {
    const validatePolicyNumber = async () => {
      if (form.policyNumber && fieldTouched.policyNumber) {
        try {
          const fieldErrors = await validatePolicyNumberAsync(form.policyNumber);
          setAsyncErrors(prev => ({
            ...prev,
            policyNumber: fieldErrors
          }));
        } catch (error) {
          console.warn('Policy number validation failed:', error);
        }
      }
    };

    const timeoutId = setTimeout(validatePolicyNumber, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [form.policyNumber, fieldTouched.policyNumber]);

  return (
    <>
      <Card title="Manual Entry — Enterprise Validation Mode" desc="Comprehensive validation with business rules, progressive feedback, and data quality assurance">
        {/* Success/Error Messages */}
        {submitMessage && (
          <div className={`mb-4 p-3 rounded-xl text-sm ${
            submitMessage.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {submitMessage.message}
          </div>
        )}
        
        {/* Validation Mode Toggle */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-blue-800">
              🎯 Validation Mode: {validationMode === 'progressive' ? 'Progressive (Validates as you type)' : 'Strict (Validates all fields)'}
            </div>
            <button 
              onClick={() => setValidationMode(prev => prev === 'progressive' ? 'strict' : 'progressive')}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Switch to {validationMode === 'progressive' ? 'Strict' : 'Progressive'}
            </button>
          </div>
        </div>
        
        {/* Top row: Vehicle + QuickFill */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <LabeledInput label="Vehicle Number" required placeholder="KA01AB1234 or KA 51 MM 1214" value={form.vehicleNumber} onChange={handleVehicleNumberChange}/>
          <button onClick={quickFill} className="px-4 py-2 rounded-xl bg-indigo-600 text-white h-[42px] mt-6">Prefill from last policy</button>
          <div className="ml-auto flex items-center gap-2 text-xs text-zinc-600"><Car className="w-4 h-4"/> Make/Model autofill in v1.1</div>
        </div>

        {/* Vehicle Search Results */}
        {isSearching && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Searching for previous policies...
            </div>
          </div>
        )}

        {vehicleSearchResults.length > 0 && !isSearching && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-2">
              Found {vehicleSearchResults.length} previous policy(ies) for this vehicle:
            </div>
            {vehicleSearchResults.slice(0, 3).map((policy: any, index) => (
              <div key={policy.id} className="text-xs text-green-700 mb-1">
                {index + 1}. Policy: {policy.policy_number} | 
                Insurer: {policy.insurer} | 
                Date: {new Date(policy.created_at).toLocaleDateString()}
              </div>
            ))}
            <button 
              onClick={quickFill}
              className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
            >
              Use Most Recent Policy Data
            </button>
          </div>
        )}

        {/* Policy & Vehicle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabeledInput label="Policy Number" required value={form.policyNumber} onChange={v=>set('policyNumber', v)}/>
          <LabeledInput label="Insurer (Company)" required placeholder="e.g., Tata AIG" value={form.insurer} onChange={v=>set('insurer', v)}/>
          <LabeledSelect label="Product Type" value={form.productType} onChange={v=>set('productType', v)} options={["Life Insurance", "Motor Insurance", "Health Insurance", "Travel Insurance", "Home Insurance", "Cyber Insurance"]}/>
          <LabeledSelect label="Vehicle Type" value={form.vehicleType} onChange={v=>set('vehicleType', v)} options={["Private Car","GCV", "LCV", "MCV", "HCV"]}/>
          <LabeledInput label="Make" placeholder="Maruti / Hyundai / …" value={form.make} onChange={v=>set('make', v)}/>
          <LabeledInput label="Model" placeholder="Swift / i20 / …" value={form.model} onChange={v=>set('model', v)}/>
          <LabeledInput label="CC" hint="engine size" value={form.cc} onChange={v=>set('cc', v)}/>
          <LabeledInput label="MFG Year" value={form.manufacturingYear} onChange={v=>set('manufacturingYear', v)}/>
        </div>

        {/* Dates & Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <LabeledInput label="Issue Date" value={form.issueDate} onChange={v=>set('issueDate', v)}/>
          <LabeledInput label="Expiry Date" value={form.expiryDate} onChange={v=>set('expiryDate', v)}/>
          <LabeledInput label="IDV (₹)" value={form.idv} onChange={v=>set('idv', v)}/>
          <LabeledInput label="NCB (%)" value={form.ncb} onChange={v=>set('ncb', v)}/>
          <LabeledInput label="DIS (%)" hint="discount" value={form.discount} onChange={v=>set('discount', v)}/>
          <LabeledInput label="Net Addon" hint="net addon" value={form.ref} onChange={v=>set('ref', v)}/>
        </div>

        {/* Premiums */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <LabeledInput label="Net OD (₹)" hint="Own Damage" value={form.netOd} onChange={v=>set('netOd', v)}/>
          <LabeledInput label="Total OD (₹)" value={form.totalOd} onChange={v=>set('totalOd', v)}/>
          <LabeledInput label="Net Premium (₹)" value={form.netPremium} onChange={v=>set('netPremium', v)}/>
          <LabeledInput label="Total Premium (₹)" required value={form.totalPremium} onChange={onTotalChange}/>
        </div>

        {/* Cashback & Payments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <LabeledInput label="Cashback %" hint="auto-calculates amount" value={form.cashbackPct} onChange={onPctChange}/>
          <LabeledInput label="Cashback Amount (₹)" hint="fills when % given" value={form.cashbackAmt} onChange={onAmtChange}/>
          <LabeledInput label="Customer Paid (₹)" value={form.customerPaid} onChange={v=>set('customerPaid', v)}/>
          <LabeledInput label="Customer Cheque No" value={form.customerChequeNo} onChange={v=>set('customerChequeNo', v)}/>
          <LabeledInput label="Our Cheque No" value={form.ourChequeNo} onChange={v=>set('ourChequeNo', v)}/>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Payment Method</label>
            <select 
              value={form.paymentMethod}
              onChange={(e) => {
                set('paymentMethod', e.target.value);
                if (e.target.value !== 'NICSAN') {
                  set('paymentSubMethod', '');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="INSURER">INSURER</option>
              <option value="NICSAN">NICSAN</option>
            </select>
          </div>
          {form.paymentMethod === 'NICSAN' && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Payment Sub-Method</label>
              <select 
                value={form.paymentSubMethod}
                onChange={(e) => set('paymentSubMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select Sub-Method</option>
                <option value="DIRECT">DIRECT</option>
                <option value="EXECUTIVE">EXECUTIVE</option>
              </select>
            </div>
          )}
        </div>

        {/* Brokerage & Additional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div style={{ display: 'none' }}>
            <LabeledInput label="Brokerage (₹)" hint="commission amount" value={form.brokerage} onChange={v=>set('brokerage', v)}/>
          </div>
          <LabeledInput label="Cashback (₹)" hint="total cashback amount" value={form.cashback} onChange={v=>set('cashback', v)}/>
        </div>

        {/* People & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <LabeledInput label="Executive" value={form.executive} onChange={v=>set('executive', v)}/>
          <LabeledInput label="Ops Executive" value={form.opsExecutive} onChange={v=>set('opsExecutive', v)}/>
          <AutocompleteInput label="Caller Name" value={form.callerName} onChange={v=>set('callerName', v)} getSuggestions={getFilteredCallerSuggestions} onAddNew={handleAddNewTelecaller} showAddNew={true}/>
          <LabeledInput label="Mobile Number" required placeholder="9xxxxxxxxx" value={form.mobile} onChange={v=>set('mobile', v)}/>
          <LabeledInput label="Rollover/Renewal" hint="internal code" value={form.rollover} onChange={v=>set('rollover', v)}/>
          <LabeledInput label="Customer Name" value={form.customerName} onChange={v=>set('customerName', v)}/>
          <LabeledInput label="Customer Email ID" value={form.customerEmail} onChange={v=>set('customerEmail', v)}/>
          <LabeledInput label="Branch" required value={form.branch} onChange={v=>set('branch', v)}/>
          <LabeledInput label="Remark" placeholder="Any note" value={form.remark} onChange={v=>set('remark', v)}/>
        </div>

        {/* Assist panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="bg-amber-50 text-amber-800 rounded-xl p-3 text-sm">
            <div className="font-medium mb-1">Error tray</div>
            {errors.length? <ul className="list-disc pl-5">{errors.map((e,i)=>(<li key={i}>{e}</li>))}</ul>:<div>No blocking errors.</div>}
          </div>
          <div className="bg-zinc-50 rounded-xl p-3 text-sm">
            <div className="font-medium mb-1">Shortcuts</div>
            <div>Ctrl+S save · Ctrl+Enter save & new · Alt+E first error</div>
          </div>
          <div className="bg-emerald-50 text-emerald-800 rounded-xl p-3 text-sm">
            <div className="font-medium mb-1">Smart autofill</div>
            <div>Typing a vehicle no. offers last-year data to copy.</div>
          </div>
        </div>

        <div className="sticky bottom-4 mt-4 flex gap-3 justify-end bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/60 p-2 rounded-xl">
          <button className="px-4 py-2 rounded-xl bg-white border">Save Draft</button>
          <button 
            onClick={handleSave} 
            disabled={errors.length > 0 || isSubmitting}
            className="px-4 py-2 rounded-xl bg-zinc-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
          <button 
            onClick={handleSaveAndNew} 
            disabled={errors.length > 0 || isSubmitting}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save & New'}
          </button>
        </div>
      </Card>
    </>
  )
}







// ---------- FOUNDER ----------
function FounderSidebar({ page, setPage }: { page: string; setPage: (p: string) => void }) {
  const items = [
    { id: "overview", label: "Company Overview", icon: LayoutDashboard },
    { id: "kpis", label: "KPI Dashboard", icon: TrendingUp },
    { id: "leaderboard", label: "Rep Leaderboard", icon: Users },
    { id: "explorer", label: "Sales Explorer", icon: BarChart3 },
    { id: "sources", label: "Data Sources", icon: BarChart3 },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "tests", label: "Dev/Test", icon: SlidersHorizontal },
    { id: "settings", label: "Settings", icon: Settings },
  ]
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-2 sticky top-20">
      {items.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => setPage(id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${page===id?"bg-zinc-900 text-white":"hover:bg-zinc-100"}`}>
          <Icon className="w-4 h-4"/> {label}
        </button>
      ))}
      <div className="px-3 pt-2 text-[11px] text-zinc-500">Definitions in (brackets). Example: GWP = Gross Written Premium.</div>
    </div>
  )
}

const demoTrend = Array.from({length: 14}).map((_,i)=> ({ day: `D-${14-i}`, gwp: 80000 + i*2500 + (i%3?3000:0), net: 65000 + i*2100 }))
const demoSources = [
  { name: "PDF_TATA", policies: 62, gwp: 725000 },
  { name: "PDF_DIGIT", policies: 58, gwp: 690000 },
  { name: "MANUAL_FORM", policies: 40, gwp: 410000 },
  { name: "MANUAL_GRID", policies: 60, gwp: 620000 },
  { name: "CSV_IMPORT", policies: 200, gwp: 2050000 },
]
const demoReps = [
  { name: "Priya Singh", leads: 120, converted: 22, gwp: 260000, brokerage: 39000, cashback: 10000, net: 29000, total_od: 450000, cac: Math.round(1800 / 22) },
  { name: "Rahul Kumar", leads: 110, converted: 18, gwp: 210000, brokerage: 31500, cashback: 9000, net: 22500, total_od: 380000, cac: Math.round(1800 / 18) },
  { name: "Anjali Sharma", leads: 90, converted: 20, gwp: 240000, brokerage: 36000, cashback: 8000, net: 28000, total_od: 420000, cac: Math.round(1800 / 20) },
]
const demoPolicies = [
  { rep: 'Priya Singh', make: 'Maruti', model: 'Swift', policies: 12, gwp: 130000, cashbackPctAvg: 2.4, cashback: 3100, net: 16900 },
  { rep: 'Priya Singh', make: 'Hyundai', model: 'i20', policies: 10, gwp: 130000, cashbackPctAvg: 1.9, cashback: 2500, net: 17500 },
  { rep: 'Rahul Kumar', make: 'Hyundai', model: 'i20', policies: 9, gwp: 115000, cashbackPctAvg: 1.1, cashback: 1200, net: 17100 },
  { rep: 'Anjali Sharma', make: 'Maruti', model: 'Baleno', policies: 11, gwp: 125000, cashbackPctAvg: 0.9, cashback: 1100, net: 17800 },
]

// ---- KPI helpers ----
const fmtINR = (n:number|string)=> typeof n === 'string' ? n : `₹${Math.round(n).toLocaleString('en-IN')}`;
const pct = (n:number|string)=> typeof n === 'string' ? n : `${(n).toFixed(1)}%`;

// Total OD Breakdown Component













// ---------- KPI DASHBOARD ----------


// ---------- DEV/TESTS ----------


function NicsanCRMMock() {
  const [user, setUser] = useState<{name:string; email?:string; role:"ops"|"founder"}|null>(null);
  const [tab, setTab] = useState<"ops"|"founder">("ops");
  const [opsPage, setOpsPage] = useState("upload");
  const [founderPage, setFounderPage] = useState("overview");
  const [backendStatus, setBackendStatus] = useState<any>(null);

  // Check backend status on component mount
  useEffect(() => {
    const checkBackendStatus = async () => {
      const status = DualStorageService.getEnvironmentInfo();
      setBackendStatus(status);
      
      if (ENABLE_DEBUG) {
      }
    };
    
    checkBackendStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return <LoginPage onLogin={(u)=>{ setUser(u); setTab(u.role==='founder'?'founder':'ops')}}/>

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Backend Status Indicator */}
      {ENABLE_DEBUG && backendStatus && (
        <div className={`px-4 py-2 text-xs font-medium ${
          backendStatus.backendAvailable 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          🔗 Backend: {backendStatus.backendAvailable ? 'Connected' : 'Disconnected'} 
          | Mock: {ENABLE_MOCK_DATA ? 'Enabled' : 'Disabled'}
          | Debug: {ENABLE_DEBUG ? 'On' : 'Off'}
        </div>
      )}
      
      <TopTabs tab={tab} setTab={setTab} user={user} onLogout={()=>setUser(null)} />
      {tab === "ops" ? (
        <Shell sidebar={<OpsSidebar page={opsPage} setPage={setOpsPage} />}>
          {opsPage === "upload" && <PageUpload/>}
          {opsPage === "review" && <PageReview/>}
          {opsPage === "manual-form" && <PageManualForm/>}
          {opsPage === "manual-grid" && <PageManualGrid/>}
          {opsPage === "policy-detail" && <PagePolicyDetail/>}
          {opsPage === "sync-demo" && <CrossDeviceSyncDemo/>}
          {opsPage === "settings" && (
            <Card title="Ops Settings" desc="Keyboard shortcuts + defaults (makes data entry faster)">
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li><b>Hotkeys</b>: Ctrl+S (save), Ctrl+Enter (save & next), Alt+E (jump to first error)</li>
                <li><b>Autofill</b>: Type a vehicle number to fetch last-year data (quick fill)</li>
                <li><b>Validation</b>: Hard stops on must-have fields; warnings for minor issues</li>
                <li><b>Dedupe</b>: Same Policy No. blocked; Vehicle+IssueDate warns</li>
              </ul>
            </Card>
          )}
        </Shell>
      ) : (
        <Shell sidebar={<FounderSidebar page={founderPage} setPage={setFounderPage} />}>
          {founderPage === "overview" && <PageOverview/>}
          {founderPage === "kpis" && <PageKPIs/>}
          {founderPage === "leaderboard" && <PageLeaderboard/>}
          {founderPage === "explorer" && <PageExplorer/>}
          {founderPage === "sources" && <PageSources/>}
          {founderPage === "payments" && <PagePayments/>}
          {founderPage === "tests" && <PageTests/>}
          {founderPage === "settings" && <PageFounderSettings/>}
        </Shell>
      )}
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <NicsanCRMMock />
    </SettingsProvider>
  );
}
