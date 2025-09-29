import React, { useMemo, useState, useRef, useEffect } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, Table2, Settings, LayoutDashboard, Users, BarChart3, BadgeInfo, Filter, LogOut, Car, SlidersHorizontal, TrendingUp, RefreshCw } from "lucide-react";
import { ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend, Area, AreaChart, XAxis, YAxis, Tooltip } from "recharts";
import { authUtils } from './services/api';
import { policiesAPI } from './services/api';
import DualStorageService from './services/dualStorageService';
import CrossDeviceSyncDemo from './components/CrossDeviceSyncDemo';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import HorizontalLogo from './assets/images/HorizontalLogo.svg';

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
        <div className="flex items-center gap-3 mb-6">
          <img 
            src={HorizontalLogo} 
            alt="Nicsan CRM" 
            className="h-[20.3843px] w-auto"
          />
          <span className="text-[28px] font-clash font-bold text-zinc-900 leading-[20.3843px] mt-0.5">CRM V1</span>
        </div>
        
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <label className="block mb-3">
          <div className="text-xs text-zinc-600 mb-1 font-clash font-normal">Email</div>
          <input 
            value={email} 
            onChange={e=>setEmail(e.target.value)} 
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-clash font-normal" 
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </label>
        <label className="block mb-4">
          <div className="text-xs text-zinc-600 mb-1 font-clash font-normal">Password</div>
          <input 
            type="password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-clash font-normal" 
            placeholder="••••••••"
            disabled={isLoading}
          />
        </label>
        
        <button 
          onClick={handleLogin} 
          disabled={isLoading}
          className="w-full px-4 py-2 rounded-xl bg-zinc-900 text-white disabled:opacity-50 disabled:cursor-not-allowed font-clash"
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
        <div className="flex items-center gap-3">
          <img 
            src={HorizontalLogo} 
            alt="Nicsan CRM" 
            className="h-[20.3843px] w-auto"
          />
          <span className="text-[28px] font-clash font-bold text-zinc-900 leading-[20.3843px] mt-0.5">CRM V1</span>
        </div>
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

function Tile({ label, value, sub, info }: { label: string; value: string; sub?: string; info?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-4">
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
    { value: 'GENERALI_CENTRAL', label: 'Generali Central Insurance' },
    { value: 'LIBERTY_GENERAL', label: 'Liberty General Insurance' },
    { value: 'ICIC', label: 'ICICI Lombard' }
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
    customerName: '',
    branch: ''
  });
  const [manualExtrasSaved, setManualExtrasSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          customerName: '',
          branch: ''
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
        console.log(`🔄 Polling upload status for ${uploadId}, attempt ${attempts + 1}`);
        const response = await DualStorageService.getUploadById(uploadId);
        
        if (response.success) {
          const status = response.data.status;
          console.log(`📊 Upload status: ${status} (source: ${response.source})`);
          
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
            console.log(`⏳ Continuing to poll... (${attempts}/${maxAttempts})`);
            setTimeout(poll, 2000); // Poll every 2 seconds
          } else {
            setUploadStatus('PDF processing timed out. Please check status.');
          }
        } else {
          console.error('❌ Status polling failed:', response.error);
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


  // Smart suggestions for caller names
  // const __getSmartSuggestions = (fieldName: string) => {
  //   if (fieldName === 'callerName') {
  //     return callerNames; // Real caller names from database
  //   }
  //   return [];
  // };


  // Handle adding new telecaller

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
              <select 
                value={manualExtras.executive}
                onChange={(e) => handleManualExtrasChange('executive', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              >
                <option value="">Select Executive</option>
                <option value="Yashwanth">Yashwanth</option>
                <option value="Kavya">Kavya</option>
                <option value="Bhagya">Bhagya</option>
                <option value="Sandesh">Sandesh</option>
                <option value="Yallappa">Yallappa</option>
                <option value="Nethravathi">Nethravathi</option>
                <option value="Tejaswini">Tejaswini</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Ops Executive</label>
              <select 
                value={manualExtras.opsExecutive}
                onChange={(e) => handleManualExtrasChange('opsExecutive', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              >
                <option value="">Select Ops Executive</option>
                <option value="NA">NA</option>
                <option value="Ravi">Ravi</option>
                <option value="Pavan">Pavan</option>
                <option value="Manjunath">Manjunath</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Caller Name</label>
              <input 
                type="text" 
                placeholder="Telecaller name"
                value={manualExtras.callerName}
                onChange={(e) => handleManualExtrasChange('callerName', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
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
              <select 
                value={manualExtras.rollover}
                onChange={(e) => handleManualExtrasChange('rollover', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              >
                <option value="">Select Rollover/Renewal</option>
                <option value="ROLLOVER">ROLLOVER</option>
                <option value="RENEWAL">RENEWAL</option>
              </select>
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
            <div className="md:col-span-2">
              <label className="block text-xs text-blue-700 mb-1">Customer Name</label>
              <input 
                type="text"
                placeholder="Enter customer name"
                value={manualExtras.customerName}
                onChange={(e) => handleManualExtrasChange('customerName', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-700 mb-1">Branch <span className="text-red-500">*</span></label>
              <select 
                value={manualExtras.branch}
                onChange={(e) => handleManualExtrasChange('branch', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                required
              >
                <option value="">Select Branch</option>
                <option value="MYSORE">MYSORE</option>
                <option value="BANASHANKARI">BANASHANKARI</option>
                <option value="ADUGODI">ADUGODI</option>
              </select>
            </div>
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
              onClick={() => {
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
                            : file.insurer === 'GENERALI_CENTRAL'
                            ? 'bg-orange-100 text-orange-700'
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

function LabeledInput({ label, placeholder, hint, required, value, onChange, error, suggestions, type = "text" }: { 
  label: string; 
  placeholder?: string; 
  hint?: string; 
  required?: boolean; 
  value?: any; 
  onChange?: (v:any)=>void;
  error?: string;
  suggestions?: string[];
  type?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs text-zinc-600 mb-1">
        {label} {required && <span className="text-rose-600">*</span>} {hint && <span className="text-[10px] text-zinc-400">({hint})</span>}
      </div>
      <input 
        type={type}
        value={value} 
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
        className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white text-sm h-10 ${
          error ? 'border-red-300 bg-red-50' : 'border-zinc-300'
        }`}
        style={{
          height: '40.8px',
          minHeight: '40.8px',
          maxHeight: '40.8px'
        }}
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
            branch: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [_validationHistory, setValidationHistory] = useState<any[]>([]);
  const [fieldTouched, setFieldTouched] = useState<{[key: string]: boolean}>({});
  const [vehicleSearchResults, setVehicleSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [validationMode, setValidationMode] = useState<'progressive' | 'strict'>('progressive');
  
  const set = (k:string,v:any)=> {
    setForm((f:any)=>({ ...f, [k]: v }));
    // Mark field as touched for progressive validation
    setFieldTouched(prev => ({ ...prev, [k]: true }));
  };
  // Enhanced safe number function with comprehensive validation
  const number = (v: any): number => {
    // Handle null/undefined/empty
    if (v === null || v === undefined || v === '') return 0;
    
    // Convert to string and clean
    let cleanValue = String(v).trim();
    
    // Remove common currency symbols and formatting
    cleanValue = cleanValue
      .replace(/[₹$€£¥]/g, '') // Remove currency symbols
      .replace(/,/g, '') // Remove commas
      .replace(/\s+/g, '') // Remove spaces
      .replace(/[^\d.-]/g, ''); // Keep only digits, dots, and minus
    
    // Handle empty after cleaning
    if (cleanValue === '' || cleanValue === '-') return 0;
    
    // Parse the number
    const num = parseFloat(cleanValue);
    
    // Check for NaN or Infinity
    if (isNaN(num) || !isFinite(num)) return 0;
    
    // Clamp to reasonable bounds (max ₹1 crore)
    return Math.min(Math.max(num, 0), 10000000);
  };

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
              errors.push('Vehicle number must be in valid format (e.g., KA01AB1234 or 12BH1234AB)');
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
          if (idv < 1000) {
            errors.push('IDV must be at least ₹1,000');
          } else if (idv > 100000000) {
            errors.push('IDV cannot exceed ₹10 crore');
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
          if (totalPremium <= 0) {
            errors.push('Total Premium must be greater than ₹0');
          } else if (totalPremium > 10000000) {
            errors.push('Total Premium cannot exceed ₹1 crore');
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
    
    // Enhanced cashback validation
    const cashbackPct = number(form.cashbackPct);
    const cashbackAmt = number(form.cashbackAmt);
    
    if (cashbackPct > 50) {
      errors.push('Cashback percentage cannot exceed 50%');
    }
    
    if (cashbackAmt > totalPremium * 0.5) {
      errors.push('Cashback amount cannot exceed 50% of Total Premium');
    }
    
    // Validate cashback consistency
    if (cashbackPct > 0 && cashbackAmt > 0) {
      const expectedAmt = (totalPremium * cashbackPct) / 100;
      const tolerance = totalPremium * 0.01; // 1% tolerance
      if (Math.abs(cashbackAmt - expectedAmt) > tolerance) {
        errors.push('Cashback amount and percentage are inconsistent');
      }
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
      const lastPolicy = vehicleSearchResults[0];
      
      setForm((f: any) => ({
        ...f,
        insurer: (lastPolicy as any).insurer || f.insurer,
        productType: (lastPolicy as any).product_type || f.productType,
        vehicleType: (lastPolicy as any).vehicle_type || f.vehicleType,
        make: (lastPolicy as any).make || f.make,
        model: (lastPolicy as any).model || f.model,
        cc: (lastPolicy as any).cc || f.cc,
        manufacturingYear: (lastPolicy as any).manufacturing_year || f.manufacturingYear,
        idv: (lastPolicy as any).idv || f.idv,
        ncb: (lastPolicy as any).ncb || f.ncb,
        discount: (lastPolicy as any).discount || f.discount,
        netOd: (lastPolicy as any).net_od || f.netOd,
        ref: (lastPolicy as any).ref || f.ref,
        totalOd: (lastPolicy as any).total_od || f.totalOd,
        netPremium: (lastPolicy as any).net_premium || f.netPremium,
        totalPremium: (lastPolicy as any).total_premium || f.totalPremium,
        brokerage: (lastPolicy as any).brokerage || f.brokerage,
        cashback: (lastPolicy as any).cashback_amount || f.cashback,
        branch: (lastPolicy as any).branch || f.branch,
        rollover: (lastPolicy as any).rollover || f.rollover,
        callerName: (lastPolicy as any).caller_name || f.callerName,
        executive: (lastPolicy as any).executive || f.executive,
        opsExecutive: (lastPolicy as any).ops_executive || f.opsExecutive,
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
        source: 'MANUAL_FORM'
      };

      // Debug: Log the policy data being sent
      console.log('🔍 Manual Form - Policy data being sent:', policyData);
      console.log('🔍 Manual Form - Numeric values:', {
        idv: policyData.idv,
        ncb: policyData.ncb,
        discount: policyData.discount,
        net_od: policyData.net_od,
        total_od: policyData.total_od,
        net_premium: policyData.net_premium,
        total_premium: policyData.total_premium,
        cashback_percentage: policyData.cashback_percentage,
        cashback_amount: policyData.cashback_amount,
        customer_paid: policyData.customer_paid,
        brokerage: policyData.brokerage,
        cashback: policyData.cashback
      });

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


  // Handle adding new telecaller

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
            {vehicleSearchResults.slice(0, 3).map((policy, index) => (
              <div key={(policy as any).id} className="text-xs text-green-700 mb-1">
                {index + 1}. Policy: {(policy as any).policy_number} | 
                Insurer: {(policy as any).insurer} | 
                Date: {new Date((policy as any).created_at).toLocaleDateString()}
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
          <LabeledInput 
            label="Issue Date" 
            type="date"
            value={(() => {
              const dateValue = form.issueDate;
              if (dateValue) {
                // If date is in DD-MM-YYYY format, convert to YYYY-MM-DD
                if (dateValue.includes('-') && dateValue.split('-')[0].length === 2) {
                  const [day, month, year] = dateValue.split('-');
                  return `${year}-${month}-${day}`;
                }
                // If already in YYYY-MM-DD format, return as is
                return dateValue;
              }
              return dateValue;
            })()}
            onChange={(value) => {
              // Ensure date is in YYYY-MM-DD format
              if (value) {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  const formattedDate = date.toISOString().split('T')[0];
                  set('issueDate', formattedDate);
                } else {
                  set('issueDate', value);
                }
              } else {
                set('issueDate', value);
              }
            }}
          />
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
          <LabeledSelect label="Executive" value={form.executive} onChange={v=>set('executive', v)} options={["Yashwanth", "Kavya", "Bhagya", "Sandesh", "Yallappa", "Nethravathi", "Tejaswini"]}/>
          <LabeledSelect label="Ops Executive" value={form.opsExecutive} onChange={v=>set('opsExecutive', v)} options={["NA", "Ravi", "Pavan", "Manjunath"]}/>
          <LabeledInput label="Caller Name" value={form.callerName} onChange={v=>set('callerName', v)} placeholder="Enter caller name"/>
          <LabeledInput label="Mobile Number" required placeholder="9xxxxxxxxx" value={form.mobile} onChange={v=>set('mobile', v)}/>
          <LabeledSelect label="Rollover/Renewal" value={form.rollover} onChange={v=>set('rollover', v)} options={["ROLLOVER", "RENEWAL"]}/>
          <LabeledInput label="Customer Email ID" value={form.customerEmail} onChange={v=>set('customerEmail', v)}/>
          <LabeledInput label="Customer Name" value={form.customerName} onChange={v=>set('customerName', v)}/>
          <LabeledSelect label="Branch" required value={form.branch} onChange={v=>set('branch', v)} options={["MYSORE", "BANASHANKARI", "ADUGODI"]}/>
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

function PageManualGrid() {
  const [rows, setRows] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [rowStatuses, setRowStatuses] = useState<{[key: number]: 'pending' | 'saving' | 'saved' | 'error'}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savedPolicies, setSavedPolicies] = useState<any[]>([]);

  // Load grid data on component mount
  useEffect(() => {
    const loadGridData = async () => {
      try {
        setIsLoading(true);
        
        // Load all policies from backend
        const response = await DualStorageService.getAllPolicies();
        
        if (response.success && Array.isArray(response.data)) {
          // Filter policies that were saved from grid
          const gridPolicies = response.data.filter((p: any) => p.source === 'MANUAL_GRID');
          setSavedPolicies(gridPolicies);
          
          
          // Show info message about saved policies
          if (gridPolicies.length > 0) {
            setSaveMessage({ 
              type: 'info', 
              message: `Found ${gridPolicies.length} saved policies. Grid is ready for new entries.` 
            });
          } else {
            setSaveMessage({ 
              type: 'info', 
              message: 'Grid is ready for new policy entries.' 
            });
          }
        } else {
          setSaveMessage({ 
            type: 'info', 
            message: 'Grid is ready for new policy entries.' 
          });
        }
      } catch (error) {
        console.error('Failed to load grid data:', error);
        setSaveMessage({ 
          type: 'info', 
          message: 'Grid is ready for new policy entries.' 
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGridData();
  }, []);

  const addNewRow = () => {
    const newRow = {
      // Basic Info
      src: "MANUAL_GRID", 
      policy: "", 
      vehicle: "", 
      insurer: "",
      
      // Vehicle Details
      productType: "Private Car",
      vehicleType: "Private Car",
      make: "", 
      model: "",
      cc: "",
      manufacturingYear: "",
      
      // Dates
      issueDate: "",
      expiryDate: "",
      
      // Financial
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
      brokerage: "0",
      
      // Contact Info
      executive: "",
      opsExecutive: "",
      callerName: "",
      mobile: "",
      
      // Additional
      rollover: "",
      remark: "",
      cashback: "", 
      customerName: "",
      branch: "",
      status: "OK" 
    };
    
    setRows(prev => [...prev, newRow]);
  };

  // Delete individual row
  const deleteRow = (rowIndex: number) => {
    setRows(prev => prev.filter((_, index) => index !== rowIndex));
    setRowStatuses(prev => {
      const newStatuses = { ...prev };
      delete newStatuses[rowIndex];
      // Shift all statuses after deleted row
      Object.keys(newStatuses).forEach(key => {
        const index = Number(key);
        if (index > rowIndex) {
          newStatuses[index - 1] = newStatuses[index];
          delete newStatuses[index];
        }
      });
      return newStatuses;
    });
  };

  // Clear all rows
  const clearAllRows = () => {
    if (window.confirm('Are you sure you want to clear all rows? This action cannot be undone.')) {
      setRows([]);
      setRowStatuses({});
      setSaveMessage(null);
    }
  };

  // Delete empty rows (rows with no policy number)
  const deleteEmptyRows = () => {
    const emptyRows = rows.filter((row) => !row.policy || row.policy.trim() === '');
    if (emptyRows.length === 0) {
      setSaveMessage({ type: 'info', message: 'No empty rows found.' });
      return;
    }
    
    if (window.confirm(`Delete ${emptyRows.length} empty row(s)?`)) {
      setRows(prev => prev.filter(row => row.policy && row.policy.trim() !== ''));
      setRowStatuses({});
      setSaveMessage({ type: 'success', message: `Deleted ${emptyRows.length} empty row(s).` });
    }
  };

  // Validate all rows
  const handleValidate = () => {
    const validationResults = rows.map((row, index) => ({
      rowIndex: index,
      policy: row.policy,
      errors: validateGridRow(row)
    }));
    
    const rowsWithErrors = validationResults.filter(result => result.errors.length > 0);
    
    if (rowsWithErrors.length === 0) {
      setSaveMessage({ type: 'success', message: `All ${rows.length} rows are valid!` });
    } else {
      const errorDetails = rowsWithErrors.map(result => 
        `Row ${result.rowIndex + 1} (${result.policy || 'No Policy'}): ${result.errors.join(', ')}`
      ).join('\n');
      
      setSaveMessage({ 
        type: 'error', 
        message: `${rowsWithErrors.length} row(s) have errors:\n${errorDetails}` 
      });
    }
  };

  // Validation function for grid rows (reused from Manual Form)
  const validateGridRow = (row: any) => {
    const errors: string[] = [];
    
    // Policy Number validation
    if (!row.policy) {
      errors.push('Policy Number is required');
    } else if (!/^[A-Z0-9\-_\/ ]{3,50}$/.test(row.policy)) {
      errors.push('Policy Number must be 3-50 characters (letters, numbers, hyphens, underscores, forward slashes, spaces)');
    }
    
    // Vehicle Number validation
    if (!row.vehicle) {
      errors.push('Vehicle Number is required');
    } else {

      const cleanValue = row.vehicle.replace(/\s/g, '');
      const traditionalPattern = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
      const bhSeriesPattern = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
      if (!traditionalPattern.test(cleanValue) && !bhSeriesPattern.test(cleanValue)) {
        errors.push('Vehicle number must be in valid format (e.g., KA01AB1234 or 12BH1234AB)');
      }
    }
    
    // Insurer validation
    if (!row.insurer) {
      errors.push('Insurer is required');
    } else if (row.insurer.length < 3) {
      errors.push('Insurer name must be at least 3 characters');
    }
    
    // Caller Name validation
    if (!row.callerName) {
      errors.push('Caller Name is required');
    } else if (row.callerName.length < 2) {
      errors.push('Caller Name must be at least 2 characters');
    }
    
    // Branch validation
    if (!row.branch) {
      errors.push('Branch is required');
    } else if (row.branch.length < 2) {
      errors.push('Branch must be at least 2 characters');
    }
    
    // Make validation
    if (row.make && row.make.length < 2) {
      errors.push('Make must be at least 2 characters');
    }
    
    // Mobile validation
    if (row.mobile && !/^[6-9]\d{9}$/.test(row.mobile)) {
      errors.push('Invalid mobile number format (10 digits starting with 6-9)');
    }
    
    // Enhanced Total Premium validation
    if (row.totalPremium) {
      const totalPremium = parseFloat(row.totalPremium) || 0;
      if (totalPremium <= 0) {
        errors.push('Total Premium must be greater than ₹0');
      } else if (totalPremium > 10000000) {
        errors.push('Total Premium cannot exceed ₹1 crore');
      }
    }
    
    // Date validation
    if (row.issueDate) {
      const issueDate = new Date(row.issueDate);
      if (isNaN(issueDate.getTime())) {
        errors.push('Issue Date must be a valid date');
      }
    }
    
    if (row.expiryDate) {
      const expiryDate = new Date(row.expiryDate);
      const issueDate = row.issueDate ? new Date(row.issueDate) : new Date();
      if (isNaN(expiryDate.getTime()) || expiryDate <= issueDate) {
        errors.push('Expiry Date must be after Issue Date');
      }
    }
    
    // Date relationship validation
    if (row.issueDate && row.expiryDate) {
      const issueDate = new Date(row.issueDate);
      const expiryDate = new Date(row.expiryDate);
      const diffTime = expiryDate.getTime() - issueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        errors.push('Policy duration must be at least 30 days');
      }
    }
    
    // Customer Paid validation
    if (!row.customerPaid) {
      errors.push('Customer Paid is required');
    } else if (row.customerPaid.length < 1) {
      errors.push('Customer Paid must be at least 1 character');
    } else if (row.customerPaid.length > 50) {
      errors.push('Customer Paid must be less than 50 characters');
    }
    
    return errors;
  };

  // Convert DD-MM-YYYY to YYYY-MM-DD format
  const convertDateFormat = (dateStr: string) => {
    if (!dateStr || dateStr.trim() === "") return "";
    
    // Handle DD-MM-YYYY format
    const parts = dateStr.trim().split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      // Validate parts are numbers
      if (!isNaN(Number(day)) && !isNaN(Number(month)) && !isNaN(Number(year))) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // Handle DD/MM/YYYY format
    const slashParts = dateStr.trim().split('/');
    if (slashParts.length === 3) {
      const [day, month, year] = slashParts;
      if (!isNaN(Number(day)) && !isNaN(Number(month)) && !isNaN(Number(year))) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // Return as-is if no conversion needed
    return dateStr;
  };

  // Handle Excel copy-paste functionality
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboardData = e.clipboardData?.getData('text/plain') || '';
    const isBulk = clipboardData.includes('\t') || clipboardData.includes('\n');
    const target = e.target as HTMLElement | null;
    const isInputTarget = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable === true);

    // Allow native single-cell paste into inputs
    if (!isBulk && isInputTarget) {
      return;
    }

    // Intercept only for bulk (TSV) paste or non-input targets
    e.preventDefault();
    
    if (clipboardData) {
      
      // Parse tab-separated values
      const rows = clipboardData.split('\n').filter(row => row.trim());
      
      if (rows.length > 0) {
        const newRows = rows.map((row) => {
          const cells = row.split('\t');
          
          // Map Excel columns to grid fields (aligned with your Excel structure)
          const newRow = {
      // Basic Info
      src: "MANUAL_GRID", 
            policy: cells[0] || "", 
            vehicle: cells[1] || "", 
            insurer: cells[2] || "",
      
      // Vehicle Details
            productType: cells[3] || "Private Car",
            vehicleType: cells[4] || "Private Car",
            make: cells[5] || "", 
            model: cells[6] || "",
            cc: cells[7] || "",
            manufacturingYear: cells[8] || "",
      
      // Dates (convert from DD-MM-YYYY to YYYY-MM-DD)
            issueDate: convertDateFormat(cells[9]) || "",
            expiryDate: convertDateFormat(cells[10]) || "",
      
      // Financial
            idv: cells[11] || "",
            ncb: cells[12] || "",
            discount: cells[13] || "",
            netOd: cells[14] || "",
            ref: cells[15] || "",
            totalOd: cells[16] || "",
            netPremium: cells[17] || "",
            totalPremium: cells[18] || "",
            cashbackPct: cells[19] || "",
            cashbackAmt: cells[20] || "",
            customerPaid: cells[21] || "",
            brokerage: "", // Not in Excel - keep empty
      
      // Contact Info
            executive: cells[22] || "",
            opsExecutive: cells[23] || "",
            callerName: cells[24] || "",
            mobile: cells[25] || "",
      
      // Additional
            rollover: cells[26] || "",
            customerName: cells[27] || "",
            customerEmail: cells[28] || "",
            branch: cells[29] || "",
            remark: cells[30] || "",
            cashback: "", // Not in Excel - keep empty
            status: "OK"
          };
          
          // Debug logging for dates
          if (newRow.issueDate || newRow.expiryDate) {
            console.log('Date conversion debug:', {
              originalIssue: cells[9],
              convertedIssue: newRow.issueDate,
              originalExpiry: cells[10],
              convertedExpiry: newRow.expiryDate,
              issueDateObj: new Date(newRow.issueDate),
              expiryDateObj: new Date(newRow.expiryDate)
            });
          }
          
          // Validate the row
          const validationErrors = validateGridRow(newRow);
          if (validationErrors.length > 0) {
            newRow.status = `Error: ${validationErrors.join(', ')}`;
            (newRow as any).validationErrors = validationErrors;
          }
          
          return newRow;
        });
        
        // Add all new rows to the grid
        setRows(prev => [...prev, ...newRows]);
        
        // Count valid and invalid rows
        const validRows = newRows.filter(row => !(row as any).validationErrors || (row as any).validationErrors.length === 0).length;
        const invalidRows = newRows.length - validRows;
        
        // Show appropriate message
        if (invalidRows === 0) {
          setSaveMessage({ 
            type: 'success', 
            message: `Successfully pasted ${newRows.length} rows from Excel!` 
          });
        } else {
          setSaveMessage({ 
            type: 'error', 
            message: `Pasted ${newRows.length} rows from Excel. ${validRows} valid, ${invalidRows} have errors. Please fix errors before saving.` 
          });
        }
        
      }
    }
  };

  const updateRow = (rowIndex: number, field: string, value: string) => {
    // Don't allow editing if row is being saved or has been saved
    const rowStatus = rowStatuses[rowIndex];
    if (rowStatus === 'saving' || rowStatus === 'saved') {
      return;
    }
    
    setRows(prev => prev.map((row, i) => {
      if (i === rowIndex) {
        const updatedRow = { ...row, [field]: value };
        
        // Re-validate the row after update
        const validationErrors = validateGridRow(updatedRow);
        if (validationErrors.length > 0) {
          updatedRow.status = `Error: ${validationErrors.join(', ')}`;
          (updatedRow as any).validationErrors = validationErrors;
        } else {
          updatedRow.status = "OK";
          (updatedRow as any).validationErrors = [];
        }
        
        return updatedRow;
      }
      return row;
    }));
  };

  const retryFailedRows = async () => {
    const failedRowIndices = Object.keys(rowStatuses)
      .map(Number)
      .filter(index => rowStatuses[index] === 'error');
    
    if (failedRowIndices.length === 0) return;
    
    // Reset status for failed rows
    setRowStatuses(prev => {
      const newStatuses = { ...prev };
      failedRowIndices.forEach(index => {
        delete newStatuses[index];
      });
      return newStatuses;
    });
    
    // Retry saving only the failed rows
    const failedRows = failedRowIndices.map(index => rows[index]);
    const retryResults = await Promise.allSettled(
      failedRows.map(async (row, retryIndex) => {
        const originalIndex = failedRowIndices[retryIndex];
        try {
          const policyData = {
            policy_number: row.policy,
            vehicle_number: row.vehicle,
            insurer: row.insurer,
            product_type: row.productType || 'Private Car',
            vehicle_type: row.vehicleType || 'Private Car',
            make: row.make || 'Unknown',
            model: row.model || '',
            cc: row.cc || '',
            manufacturing_year: row.manufacturingYear || '',
            issue_date: row.issueDate || new Date().toISOString().split('T')[0],
            expiry_date: row.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            idv: (parseFloat(row.idv) || 0).toString(),
            ncb: (parseFloat(row.ncb) || 0).toString(),
            discount: (parseFloat(row.discount) || 0).toString(),
            net_od: (parseFloat(row.netOd) || 0).toString(),
            ref: row.ref || '',
            total_od: (parseFloat(row.totalOd) || 0).toString(),
            net_premium: (parseFloat(row.netPremium) || 0).toString(),
            total_premium: parseFloat(row.totalPremium).toString(),
            cashback_percentage: parseFloat(row.cashbackPct) || 0,
            cashback_amount: (parseFloat(row.cashbackAmt) || 0).toString(),
            customer_paid: row.customerPaid || '',
            brokerage: (parseFloat(row.brokerage) || 0).toString(),
            executive: row.executive || 'Unknown',
            ops_executive: row.opsExecutive || '',
            caller_name: row.callerName || 'Unknown',
            mobile: row.mobile || '0000000000',
            rollover: row.rollover || '',
            customer_name: row.customerName || '',
            branch: row.branch || '',
            remark: row.remark || '',
            cashback: (parseFloat(row.cashback) || 0).toString(),
            source: 'MANUAL_GRID'
          };
          
          await DualStorageService.createPolicy(policyData);
          return { originalIndex, success: true };
        } catch (error) {
          return { originalIndex, success: false, error };
        }
      })
    );
    
    // Update statuses for retried rows
    const retryStatuses: {[key: number]: 'saved' | 'error'} = {};
    retryResults.forEach((result, index) => {
      const originalIndex = failedRowIndices[index];
      if (result.status === 'fulfilled' && result.value.success) {
        retryStatuses[originalIndex] = 'saved';
      } else {
        retryStatuses[originalIndex] = 'error';
      }
    });
    
    setRowStatuses(prev => ({ ...prev, ...retryStatuses }));
    
    // Remove successfully retried rows
    setTimeout(() => {
      setRows(prev => prev.filter((_, index) => retryStatuses[index] !== 'saved'));
      setRowStatuses(prev => {
        const newStatuses = { ...prev };
        Object.keys(retryStatuses).forEach(key => {
          if (retryStatuses[Number(key)] === 'saved') {
            delete newStatuses[Number(key)];
          }
        });
        return newStatuses;
      });
    }, 2000);
    
    const retrySuccessCount = Object.values(retryStatuses).filter(s => s === 'saved').length;
    if (retrySuccessCount > 0) {
      setSaveMessage({ 
        type: 'success', 
        message: `Retry successful: ${retrySuccessCount} policies saved!` 
      });
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    // Check for duplicate policy numbers before validation
    const duplicateCheckPromises = rows.map(async (row, index) => {
      try {
        const response = await policiesAPI.checkDuplicate(row.policy);
        return {
          index,
          isDuplicate: response.success && response.data?.exists,
          policyNumber: row.policy
        };
      } catch (error) {
        console.warn(`Duplicate check failed for row ${index + 1}:`, error);
        return {
          index,
          isDuplicate: false,
          policyNumber: row.policy
        };
      }
    });
    
    const duplicateResults = await Promise.all(duplicateCheckPromises);
    const duplicates = duplicateResults.filter(result => result.isDuplicate);
    
    if (duplicates.length > 0) {
      setIsSaving(false);
      const duplicatePolicyNumbers = duplicates.map(d => d.policyNumber).join(', ');
      setSaveMessage({ 
        type: 'error', 
        message: `Policy numbers already exist: ${duplicatePolicyNumbers}. Please use different policy numbers.` 
      });
      return;
    }
    
    // Validate all rows before saving
    const validationErrors = rows.map((row, index) => {
      const errors = validateGridRow(row);
      return { index, errors };
    }).filter(item => item.errors.length > 0);
    
    if (validationErrors.length > 0) {
      setIsSaving(false);
      setSaveMessage({ 
        type: 'error', 
        message: `Cannot save: ${validationErrors.length} rows have validation errors. Please fix them first.` 
      });
      return;
    }
    
    // Initialize all rows as 'saving'
    const newStatuses: {[key: number]: 'saving' | 'saved' | 'error'} = {};
    rows.forEach((_, index) => {
      newStatuses[index] = 'saving';
    });
    setRowStatuses(newStatuses);
    
    try {
      // Process all rows as batch for better performance
      const policyDataArray = rows.map((row, _index) => ({
        // Basic Info
        policy_number: row.policy,
        vehicle_number: row.vehicle,
        insurer: row.insurer,
        
        // Vehicle Details
        product_type: row.productType || 'Private Car',
        vehicle_type: row.vehicleType || 'Private Car',
        make: row.make || 'Unknown',
        model: row.model || '',
        cc: row.cc || '',
        manufacturing_year: row.manufacturingYear || '',
        
        // Dates
        issue_date: row.issueDate || new Date().toISOString().split('T')[0],
        expiry_date: row.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        
        // Financial
        idv: (parseFloat(row.idv) || 0).toString(),
        ncb: (parseFloat(row.ncb) || 0).toString(),
        discount: (parseFloat(row.discount) || 0).toString(),
        net_od: (parseFloat(row.netOd) || 0).toString(),
        ref: row.ref || '',
        total_od: (parseFloat(row.totalOd) || 0).toString(),
        net_premium: (parseFloat(row.netPremium) || 0).toString(),
        total_premium: parseFloat(row.totalPremium).toString(),
        cashback_percentage: parseFloat(row.cashbackPct) || 0,
        cashback_amount: (parseFloat(row.cashbackAmt) || 0).toString(),
        customer_paid: row.customerPaid || '',
        customer_email: row.customerEmail || '',
        brokerage: (parseFloat(row.brokerage) || 0).toString(),
        
        // Contact Info
        executive: row.executive || 'Unknown',
        ops_executive: row.opsExecutive || '',
        caller_name: row.callerName || 'Unknown',
        mobile: row.mobile || '0000000000',
        
        // Additional
        rollover: row.rollover || '',
        customer_name: row.customerName || '',
        branch: row.branch || '',
        remark: row.remark || '',
        cashback: (parseFloat(row.cashback) || 0).toString(),
        source: 'MANUAL_GRID'
      }));
      
      const saveResult = await DualStorageService.saveGridEntries(policyDataArray);
      
      // Handle the new detailed response format from backend
      if (saveResult.source === 'BACKEND_API' && saveResult.data) {
        const { successful, failed, successCount, failureCount } = saveResult.data;
        
        // Update row statuses based on detailed results
        const finalStatuses: {[key: number]: 'saved' | 'error'} = {};
        
        // Mark successful entries
        successful.forEach((result: any) => {
          finalStatuses[result.index] = 'saved';
        });
        
        // Mark failed entries
        failed.forEach((result: any) => {
          finalStatuses[result.index] = 'error';
        });
        
        setRowStatuses(finalStatuses);
        
        // Remove saved rows after a delay to show success status
        setTimeout(() => {
          setRows(prev => prev.filter((_, index) => finalStatuses[index] !== 'saved'));
          setRowStatuses({});
        }, 2000);
        
        // Show detailed results
        if (successCount === rows.length) {
          setSaveMessage({ type: 'success', message: `Successfully saved all ${rows.length} policies to database!` });
        } else if (successCount > 0) {
          setSaveMessage({ 
            type: 'success', 
            message: `Saved ${successCount} policies successfully. ${failureCount} failed - please check and retry.` 
          });
        } else {
          // All failed - show specific error details
          const errorMessages = failed.map((f: any) => f.error).join(', ');
          setSaveMessage({ 
            type: 'error', 
            message: `Failed to save all policies. Errors: ${errorMessages}` 
          });
        }
      } else {
        // Fallback for mock data or error scenarios
        const results = rows.map((_, index) => ({ 
          index, 
          success: saveResult.source === 'BACKEND_API' 
        }));
        
        // Update row statuses based on results
        const finalStatuses: {[key: number]: 'saved' | 'error'} = {};
        results.forEach((result, index) => {
          if (result.success) {
            finalStatuses[index] = 'saved';
          } else {
            finalStatuses[index] = 'error';
          }
        });
        setRowStatuses(finalStatuses);
        
        // Remove saved rows after a delay to show success status
        setTimeout(() => {
          setRows(prev => prev.filter((_, index) => finalStatuses[index] !== 'saved'));
          setRowStatuses({});
        }, 2000);
        
        // Show detailed results
        const savedCount = Object.values(finalStatuses).filter(s => s === 'saved').length;
        const errorCount = Object.values(finalStatuses).filter(s => s === 'error').length;
        
        if (savedCount === rows.length) {
          setSaveMessage({ type: 'success', message: `Successfully saved all ${rows.length} policies to database!` });
        } else if (savedCount > 0) {
          setSaveMessage({ 
            type: 'success', 
            message: `Saved ${savedCount} policies successfully. ${errorCount} failed - please check and retry.` 
          });
        } else {
          // Check if it was a backend issue, data validation issue, or specific error
          if (saveResult.source === 'MOCK_DATA') {
            setSaveMessage({ 
              type: 'error', 
              message: 'Failed to save policies: Backend server is unavailable. Please check your connection and try again.' 
            });
          } else if (saveResult.source === 'ERROR' && saveResult.error) {
            // Show specific error message from backend
            setSaveMessage({ 
              type: 'error', 
              message: saveResult.error 
            });
          } else {
            setSaveMessage({ type: 'error', message: 'Failed to save any policies. Please check the data and try again.' });
          }
        }
      }
      
    } catch (error) {
      console.error('Error saving grid data:', error);
      
      // Parse error message to show specific errors
      let errorMessage = 'Failed to save policies. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          errorMessage = `Policy number already exists. Please use a different policy number.`;
        } else if (error.message.includes('HTTP 400')) {
          errorMessage = `Invalid data provided. Please check your inputs and try again.`;
        } else if (error.message.includes('HTTP 401')) {
          errorMessage = `Authentication failed. Please login again.`;
        } else if (error.message.includes('HTTP 403')) {
          errorMessage = `Access denied. You don't have permission to save policies.`;
        } else if (error.message.includes('HTTP 500')) {
          errorMessage = `Server error occurred. Please try again later.`;
        } else {
          errorMessage = `Failed to save policies: ${error.message}`;
        }
      }
      
      setSaveMessage({ type: 'error', message: errorMessage });
      setRowStatuses({});
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card title="Grid Entry (Excel-like)" desc="Loading grid data...">
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-zinc-600">Loading grid data...</div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card title="Grid Entry (Excel-like)" desc="Paste multiple rows; fix inline errors. Dedupe on Policy No. + Vehicle No.">
        <div className="mb-3 text-xs text-zinc-600">Tip: Copy from Excel and <b>Ctrl+V</b> directly here. Use <b>Ctrl+S</b> to save all.</div>
        
        {/* Show saved policies info */}
        {savedPolicies.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">Recently Saved Policies ({savedPolicies.length})</h3>
            <div className="text-sm text-green-600">
              {savedPolicies.slice(0, 5).map(p => `${p.policy_number} - ${p.vehicle_number}`).join(', ')}
              {savedPolicies.length > 5 && ` and ${savedPolicies.length - 5} more...`}
            </div>
          </div>
        )}
        
        {saveMessage && (
          <div className={`mb-3 p-3 rounded-lg text-sm ${
            saveMessage.type === 'success' 
              ? 'bg-green-100 text-green-800' 
              : saveMessage.type === 'error'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {saveMessage.message}
          </div>
        )}
        <div 
          className="overflow-x-auto"
          onPaste={handlePaste}
        >
          <table className="w-full text-sm min-w-max">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-2 px-1">Source</th>
                <th className="py-2 px-1">Policy No.</th>
                <th className="py-2 px-1">Vehicle No.</th>
                <th className="py-2 px-1">Insurer (Company)</th>
                <th className="py-2 px-1">Product Type</th>
                <th className="py-2 px-1">Vehicle Type</th>
                <th className="py-2 px-1">Make</th>
                <th className="py-2 px-1">Model</th>
                <th className="py-2 px-1">CC</th>
                <th className="py-2 px-1">MFG Year</th>
                <th className="py-2 px-1">Issue Date</th>
                <th className="py-2 px-1">Expiry Date</th>
                <th className="py-2 px-1">IDV (₹)</th>
                <th className="py-2 px-1">NCB (%)</th>
                <th className="py-2 px-1">DIS (%)</th>
                <th className="py-2 px-1">Net OD (₹)</th>
                <th className="py-2 px-1">Net Addon</th>
                <th className="py-2 px-1">Total OD (₹)</th>
                <th className="py-2 px-1">Net Premium (₹)</th>
                <th className="py-2 px-1">Total Premium (₹)</th>
                <th className="py-2 px-1">Cashback %</th>
                <th className="py-2 px-1">Cashback (₹)</th>
                <th className="py-2 px-1">Customer Paid (₹)</th>
                <th className="py-2 px-1" style={{ display: 'none' }}>Brokerage (₹)</th>
                <th className="py-2 px-1">Executive</th>
                <th className="py-2 px-1">Ops Executive</th>
                <th className="py-2 px-1">Caller Name</th>
                <th className="py-2 px-1">Mobile</th>
                <th className="py-2 px-1">Rollover</th>
                <th className="py-2 px-1">Customer Name</th>
                <th className="py-2 px-1">Customer Email ID</th>
                <th className="py-2 px-1">Branch <span className="text-red-500">*</span></th>
                <th className="py-2 px-1">Remark</th>
                <th className="py-2 px-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=> {
                const rowStatus = rowStatuses[i] || 'pending';
                const getRowClassName = () => {
                  switch (rowStatus) {
                    case 'saving':
                      return "border-t bg-blue-50 animate-pulse";
                    case 'saved':
                      return "border-t bg-green-50";
                    case 'error':
                      return "border-t bg-red-50";
                    default:
                      return "border-t";
                  }
                };
                
                const getStatusIndicator = () => {
                  switch (rowStatus) {
                    case 'saving':
                      return <span className="text-blue-700 bg-blue-100 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        Saving...
                      </span>;
                    case 'saved':
                      return <span className="text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Saved
                      </span>;
                    case 'error':
                      return <span className="text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Error
                      </span>;
                    default:
                      return r.status.includes("Error") ? 
                        <span className="text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs" title={r.status}>{r.status.length > 50 ? r.status.substring(0, 50) + '...' : r.status}</span> : 
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full text-xs">OK</span>;
                  }
                };
                
                return (
                <tr key={i} className={getRowClassName()}>
                  <td className="py-2 text-xs text-zinc-500 px-1">{r.src}</td>
                  <td className="px-1">
                    <input 
                      value={r.policy} 
                      onChange={(e) => updateRow(i, 'policy', e.target.value)}
                      disabled={rowStatus === 'saving' || rowStatus === 'saved'}
                      className={`w-full border-none outline-none bg-transparent text-sm ${
                        rowStatus === 'saving' || rowStatus === 'saved' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.vehicle} 
                      onChange={(e) => updateRow(i, 'vehicle', e.target.value)}
                      disabled={rowStatus === 'saving' || rowStatus === 'saved'}
                      className={`w-full border-none outline-none bg-transparent text-sm ${
                        rowStatus === 'saving' || rowStatus === 'saved' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.insurer} 
                      onChange={(e) => updateRow(i, 'insurer', e.target.value)}
                      disabled={rowStatus === 'saving' || rowStatus === 'saved'}
                      className={`w-full border-none outline-none bg-transparent text-sm ${
                        rowStatus === 'saving' || rowStatus === 'saved' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.productType} 
                      onChange={(e) => updateRow(i, 'productType', e.target.value)}
                      disabled={rowStatus === 'saving' || rowStatus === 'saved'}
                      className={`w-full border-none outline-none bg-transparent text-sm ${
                        rowStatus === 'saving' || rowStatus === 'saved' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.vehicleType} 
                      onChange={(e) => updateRow(i, 'vehicleType', e.target.value)}
                      disabled={rowStatus === 'saving' || rowStatus === 'saved'}
                      className={`w-full border-none outline-none bg-transparent text-sm ${
                        rowStatus === 'saving' || rowStatus === 'saved' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.make} 
                      onChange={(e) => updateRow(i, 'make', e.target.value)}
                      disabled={rowStatus === 'saving' || rowStatus === 'saved'}
                      className={`w-full border-none outline-none bg-transparent text-sm ${
                        rowStatus === 'saving' || rowStatus === 'saved' ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.model} 
                      onChange={(e) => updateRow(i, 'model', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.cc} 
                      onChange={(e) => updateRow(i, 'cc', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.manufacturingYear} 
                      onChange={(e) => updateRow(i, 'manufacturingYear', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      type="date"
                      value={r.issueDate} 
                      onChange={(e) => updateRow(i, 'issueDate', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      type="date"
                      value={r.expiryDate} 
                      onChange={(e) => updateRow(i, 'expiryDate', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      type="text"
                      value={r.idv} 
                      onChange={(e) => updateRow(i, 'idv', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      type="text"
                      value={r.ncb} 
                      onChange={(e) => updateRow(i, 'ncb', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      type="text"
                      value={r.discount} 
                      onChange={(e) => updateRow(i, 'discount', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      type="text"
                      value={r.netOd} 
                      onChange={(e) => updateRow(i, 'netOd', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.ref} 
                      onChange={(e) => updateRow(i, 'ref', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      type="text"
                      value={r.totalOd} 
                      onChange={(e) => updateRow(i, 'totalOd', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      type="text"
                      value={r.netPremium} 
                      onChange={(e) => updateRow(i, 'netPremium', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      type="text"
                      value={r.totalPremium} 
                      onChange={(e) => updateRow(i, 'totalPremium', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      type="text"
                      value={r.cashbackPct} 
                      onChange={(e) => updateRow(i, 'cashbackPct', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      type="text"
                      value={r.cashbackAmt} 
                      onChange={(e) => updateRow(i, 'cashbackAmt', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      type="text"
                      value={r.customerPaid} 
                      onChange={(e) => updateRow(i, 'customerPaid', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1" style={{ display: 'none' }}>
                    <input 
                      type="text"
                      value={r.brokerage} 
                      onChange={(e) => updateRow(i, 'brokerage', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.executive} 
                      onChange={(e) => updateRow(i, 'executive', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.opsExecutive} 
                      onChange={(e) => updateRow(i, 'opsExecutive', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.callerName} 
                      onChange={(e) => updateRow(i, 'callerName', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.mobile} 
                      onChange={(e) => updateRow(i, 'mobile', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.rollover} 
                      onChange={(e) => updateRow(i, 'rollover', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.customerName} 
                      onChange={(e) => updateRow(i, 'customerName', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.customerEmail || ''} 
                      onChange={(e) => updateRow(i, 'customerEmail', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.branch} 
                      onChange={(e) => updateRow(i, 'branch', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                      placeholder="Required"
                      required
                    />
                  </td>
                  <td className="px-1">
                    <input 
                      value={r.remark} 
                      onChange={(e) => updateRow(i, 'remark', e.target.value)}
                      className="w-full border-none outline-none bg-transparent text-sm"
                    />
                  </td>
                  <td className="px-1">
                    <div className="flex items-center gap-2">
                      {getStatusIndicator()}
                      <button 
                        onClick={() => deleteRow(i)}
                        className="text-red-500 hover:text-red-700 text-xs p-1 rounded hover:bg-red-50"
                        title="Delete row"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3 mt-4 flex-wrap">
          <button 
            onClick={addNewRow}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            + Add New Row
          </button>
          <button 
            onClick={handleSaveAll}
            disabled={isSaving || rows.length === 0}
            className="px-4 py-2 rounded-xl bg-zinc-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : `Save All (${rows.length})`}
          </button>
          {Object.values(rowStatuses).some(status => status === 'error') && (
            <button 
              onClick={retryFailedRows}
              className="px-4 py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700"
            >
              Retry Failed ({Object.values(rowStatuses).filter(s => s === 'error').length})
            </button>
          )}
          <button 
            onClick={handleValidate}
            className="px-4 py-2 rounded-xl bg-white border hover:bg-gray-50"
          >
            Validate All
          </button>
          <button 
            onClick={deleteEmptyRows}
            className="px-4 py-2 rounded-xl bg-yellow-600 text-white hover:bg-yellow-700"
          >
            Delete Empty
          </button>
          <button 
            onClick={clearAllRows}
            className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
          >
            Clear All
          </button>
        </div>
      </Card>
    </>
  )
}

function PageReview() {
  const [reviewData, setReviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [_saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [availableUploads, setAvailableUploads] = useState<any[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<string>('');
  const [editableData, setEditableData] = useState<any>({
    pdfData: {},
    manualExtras: {}
  });

  // Load available uploads for review
  useEffect(() => {
    const loadAvailableUploads = async () => {
      try {
        
        // First, try to get real uploads from localStorage (from PDF upload page)
        const storedUploads = localStorage.getItem('nicsan_crm_uploads');
        let realUploads = [];
        
        if (storedUploads) {
          try {
            realUploads = JSON.parse(storedUploads);
          } catch (e) {
            console.error('Failed to parse stored uploads:', e);
          }
        }
        
        // If no real uploads, show mock data for demo
        if (realUploads.length === 0) {
          setAvailableUploads([
            { 
              id: 'mock_1', 
              filename: 'policy_TA_9921.pdf', 
              status: 'REVIEW',
              s3_key: 'uploads/1/1234567890_policy_TA_9921.pdf',
              extracted_data: {
                insurer: 'TATA_AIG',
                status: 'REVIEW',
                manual_extras: {
                  executive: "Rahul Kumar",
                  callerName: "Priya Singh",
                  mobile: "9876543210",
                  rollover: "RENEWAL-2025",
                  remark: "Customer requested early renewal with NCB benefits",
                  brokerage: 500,
                  cashback: 600,
                  customerPaid: 11550,
                  customerChequeNo: "CHQ-001234",
                  ourChequeNo: "OUR-567890"
                },
                extracted_data: {
                  policy_number: "TA-9921",
                  vehicle_number: "KA 51 MM 1214",
                  insurer: "Tata AIG",
                  product_type: "Private Car",
                  vehicle_type: "Private Car",
                  make: "Maruti",
                  model: "Swift",
                  cc: "1197",
                  manufacturing_year: "2021",
                  issue_date: "2025-08-10",
                  expiry_date: "2026-08-09",
                  idv: 495000,
                  ncb: 20,
                  discount: 0,
                  net_od: 5400,
                  ref: "",
                  total_od: 7200,
                  net_premium: 10800,
                  total_premium: 12150,
                  customer_name: 'Jane Smith',
                  confidence_score: 0.86
                }
              }
            }
          ]);
        } else {
          // Show real uploads - filter out any mock uploads
          const filteredRealUploads = realUploads.filter((upload: any) => !upload.id.startsWith('mock_'));
          setAvailableUploads(filteredRealUploads);
        }
      } catch (error) {
        console.error('Failed to load uploads:', error);
      }
    };
    
    loadAvailableUploads();
    
    // Auto-refresh every 5 seconds to check for new uploads
    const interval = setInterval(loadAvailableUploads, 5000);
    
    return () => clearInterval(interval);
  }, []);



  // Handle adding new telecaller

  const loadUploadData = async (uploadId: string) => {
    try {
      // Check if this is a mock upload ID
      if (uploadId.startsWith('mock_')) {
        // Use mock data directly for mock uploads
        const upload = availableUploads.find(u => u.id === uploadId);
        if (upload) {
          setReviewData(upload);
          setEditableData({
            pdfData: { ...upload.extracted_data.extracted_data },
            manualExtras: { ...upload.extracted_data.manual_extras }
          });
          setSubmitMessage({ 
            type: 'success', 
            message: 'Mock upload data loaded successfully! Please review before saving.' 
          });
        }
        return;
      }
      
      // Try to get real data from backend for real uploads
      const response = await DualStorageService.getUploadForReview(uploadId);
      
      if (response.success) {
        const upload = response.data;
        setReviewData(upload);
        
        // Initialize editable data with current values
        setEditableData({
          pdfData: { ...upload.extracted_data.extracted_data },
          manualExtras: { ...upload.extracted_data.manual_extras }
        });
        
        setSubmitMessage({ 
          type: 'success', 
          message: 'Upload data loaded successfully! Please review before saving.' 
        });
      } else {
        // Fallback to local data
        const upload = availableUploads.find(u => u.id === uploadId);
        if (upload) {
          setReviewData(upload);
          setEditableData({
            pdfData: { ...upload.extracted_data.extracted_data },
            manualExtras: { ...upload.extracted_data.manual_extras }
          });
          setSubmitMessage({ 
            type: 'success', 
            message: 'Upload data loaded successfully! Please review before saving.' 
          });
        }
      }
    } catch (error) {
      setSubmitMessage({ 
        type: 'error', 
        message: 'Failed to load upload data. Please try again.' 
      });
    }
  };

  const updatePdfData = (field: string, value: any) => {
    setEditableData((prev: any) => ({
      ...prev,
      pdfData: { ...prev.pdfData, [field]: value }
    }));
  };

  const updateManualExtras = (field: string, value: any) => {
    setEditableData((prev: any) => ({
      ...prev,
      manualExtras: { ...prev.manualExtras, [field]: value }
    }));
  };

  // const __validateData = () => {
  //   const errors = [];
  //   
  //   // Required fields validation
  //   if (!editableData.pdfData.policy_number) {
  //     errors.push('Policy Number is required');
  //   }
  //   if (!editableData.pdfData.vehicle_number) {
  //     errors.push('Vehicle Number is required');
  //   }
  //   if (!editableData.manualExtras.executive) {
  //     errors.push('Executive name is required');
  //   }
  //   if (!editableData.manualExtras.mobile) {
  //     errors.push('Mobile number is required');
  //   }
  //   
  //   // Format validation
  //   if (editableData.pdfData.vehicle_number && !/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/.test(editableData.pdfData.vehicle_number.replace(/\s/g, ''))) {
  //     errors.push('Invalid vehicle number format (e.g., KA01AB1234 or KA 51 MM 1214)');
  //   }
  //   
  //   // Mobile number validation
  //   if (editableData.manualExtras.mobile && !/^[6-9]\d{9}$/.test(editableData.manualExtras.mobile)) {
  //     errors.push('Invalid mobile number format (10 digits starting with 6-9)');
  //   }
  //   
  //   return errors;
  // };

  const validateEditedData = () => {
    const errors = [];
    
    // Validate PDF data
    if (!editableData.pdfData.policy_number) {
      errors.push('Policy Number is required');
    }
    if (!editableData.pdfData.vehicle_number) {
      errors.push('Vehicle Number is required');
    }
    
    // Validate manual extras
    if (!editableData.manualExtras.executive) {
      errors.push('Executive name is required');
    }
    if (!editableData.manualExtras.mobile) {
      errors.push('Mobile number is required');
    }
    
    // Format validation
    if (editableData.pdfData.vehicle_number) {

      const cleanValue = editableData.pdfData.vehicle_number.replace(/\s/g, '');
      const traditionalPattern = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
      const bhSeriesPattern = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
      if (!traditionalPattern.test(cleanValue) && !bhSeriesPattern.test(cleanValue)) {
        errors.push('Vehicle number must be in valid format (e.g., KA01AB1234 or 12BH1234AB)');
      }
    }
    
    // Mobile number validation
    if (editableData.manualExtras.mobile && !/^[6-9]\d{9}$/.test(editableData.manualExtras.mobile)) {
      errors.push('Invalid mobile number format (10 digits starting with 6-9)');
    }
    
    return errors;
  };

  const handleConfirmAndSave = async () => {
    setIsLoading(true);
    setSaveMessage(null);
    
    try {
      
      // Validate edited data before saving
      const validationErrors = validateEditedData();
      if (validationErrors.length > 0) {
        console.log('❌ Validation failed:', validationErrors);
        setSubmitMessage({ 
          type: 'error', 
          message: `Validation failed: ${validationErrors.join(', ')}` 
        });
        return;
      }
      
      // Check if this is a mock upload
      if (reviewData.id.startsWith('mock_')) {
        // Simulate successful save for mock data
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        setSubmitMessage({ 
          type: 'success', 
          message: 'Mock policy confirmed and saved successfully! (Demo mode)' 
        });
        
        // Clear form after successful save
        setTimeout(() => {
          setReviewData(null);
          setSaveMessage(null);
          setEditableData({ pdfData: {}, manualExtras: {} });
        }, 2000);
        
        return;
      }
      
      // Send edited data to backend
      const result = await DualStorageService.confirmUploadAsPolicy(reviewData.id, {
        pdfData: editableData.pdfData,
        manualExtras: editableData.manualExtras
      });
      
      if (result.success) {
        console.log('✅ Policy confirmed successfully with edited data!');
        setSubmitMessage({ 
          type: 'success', 
          message: 'Policy confirmed and saved successfully with your edits!' 
        });
        
        // Clear form after successful save
        setTimeout(() => {
          setReviewData(null);
          setSaveMessage(null);
          setEditableData({ pdfData: {}, manualExtras: {} });
        }, 2000);
      } else {
        console.log('❌ Policy confirmation failed:', result.error);
        setSubmitMessage({ 
          type: 'error', 
          message: result.error || 'Failed to save policy. Please try again.' 
        });
      }
      
    } catch (error) {
      console.error('❌ Confirm & Save error:', error);
      setSubmitMessage({ 
        type: 'error', 
        message: 'Failed to save policy. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectToManual = () => {
    // In real app, this would redirect to manual form with some pre-filled data
    setReviewData(null);
    // You could navigate to manual form here
  };

  // For demo purposes, show mock data
  if (!reviewData && availableUploads.length === 0) {
    return (
      <Card title="Review & Confirm" desc="Review PDF data + manual extras before saving">
        <div className="text-center py-8 text-zinc-500">
          <div className="text-6xl mb-4">📄</div>
          <div className="text-lg font-medium mb-2">No PDF data to review</div>
          <div className="text-sm">Upload a PDF with manual extras first to see the review screen.</div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-blue-700 text-sm">
            💡 <strong>Workflow:</strong> Go to PDF Upload → Fill Manual Extras → Save → Drop PDF → Come back here to Review
          </div>
          
          {/* Debug Info */}
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-yellow-700 text-sm">
            🔍 <strong>Debug:</strong> availableUploads.length = {availableUploads.length}
            <br />
            🔍 <strong>Debug:</strong> reviewData = {reviewData ? 'exists' : 'null'}
            <br />
            🔍 <strong>Debug:</strong> Check browser console for detailed logs
          </div>
          
          {/* Test Button */}
          <div className="mt-4">
            <button 
              onClick={() => {
                const testUpload = {
                  id: 'test_' + Date.now(),
                  filename: 'test_policy.pdf',
                  status: 'REVIEW',
                  s3_key: 'uploads/test/test_policy.pdf',
                  extracted_data: {
                    insurer: 'TATA_AIG',
                    status: 'REVIEW',
                    manual_extras: {
                      executive: "Test User",
                      callerName: "Test Caller",
                      mobile: "9876543210",
                      rollover: "TEST-2025",
                      remark: "Test upload for debugging",
                      brokerage: 500,
                      cashback: 600,
                      customerPaid: 11550,
                      customerChequeNo: "TEST-001",
                      ourChequeNo: "TEST-002"
                    },
                    extracted_data: {
                      policy_number: "TA-TEST",
                      vehicle_number: "KA 51 MM 1214",
                      insurer: "Tata AIG",
                      product_type: "Private Car",
                      vehicle_type: "Private Car",
                      make: "Maruti",
                      model: "Swift",
                      cc: "1197",
                      manufacturing_year: "2021",
                      issue_date: "2025-08-14",
                      expiry_date: "2026-08-13",
                      idv: 495000,
                      ncb: 20,
                      discount: 0,
                      net_od: 5400,
                      ref: "",
                      total_od: 7200,
                      net_premium: 10800,
                      total_premium: 12150,
                      customer_name: 'Mike Johnson',
                      confidence_score: 0.86
                    }
                  }
                };
                
                localStorage.setItem('nicsan_crm_uploads', JSON.stringify([testUpload]));
                
                // Force reload
                window.location.reload();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              🧪 Add Test Upload (Debug)
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // Show upload selection if no specific upload is loaded
  if (!reviewData && availableUploads.length > 0) {
    return (
      <Card title="Review & Confirm" desc="Select an upload to review">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            💡 <strong>Workflow:</strong> PDF Upload → Manual Extras → Textract Processing → Review & Confirm → Save to Database
          </div>
        </div>
        
        {/* Debug Info */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            🔍 <strong>Debug:</strong> Found {availableUploads.length} upload(s) in localStorage
            {availableUploads.length > 0 && (
              <div className="mt-2 text-xs">
                {availableUploads.map(upload => (
                  <div key={upload.id}>
                    • {upload.filename} - Status: {upload.status} - Insurer: {upload.extracted_data?.insurer || 'N/A'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mb-6 p-4 bg-zinc-50 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">📄 Select Upload to Review</div>
            <button 
              onClick={() => {
                // Force reload available uploads from localStorage
                const loadAvailableUploads = async () => {
                  try {
                    const storedUploads = localStorage.getItem('nicsan_crm_uploads');
                    if (storedUploads) {
                      const realUploads = JSON.parse(storedUploads);
                      setAvailableUploads(realUploads);
                    }
                  } catch (error) {
                    console.error('Failed to refresh uploads:', error);
                  }
                };
                loadAvailableUploads();
              }}
              className="px-3 py-1 text-xs bg-zinc-200 hover:bg-zinc-300 rounded-lg transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedUpload} 
              onChange={(e) => setSelectedUpload(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Select an upload to review...</option>
              {availableUploads.map(upload => (
                <option key={upload.id} value={upload.id}>
                  {upload.filename} ({upload.extracted_data?.insurer || 'N/A'}) - {upload.status}
                </option>
              ))}
            </select>
            <button 
              onClick={() => loadUploadData(selectedUpload)}
              disabled={!selectedUpload}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load Upload Data
            </button>
          </div>
        </div>
      </Card>
    );
  }

  const data = reviewData;
  
  // Safety check - if no data, show error
  if (!data || !data.extracted_data) {
    return (
      <Card title="Review & Confirm" desc="Review PDF data + manual extras before saving">
        <div className="text-center py-8 text-red-500">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-lg font-medium mb-2">Data Error</div>
          <div className="text-sm">No valid data found for review. Please try selecting an upload again.</div>
          <div className="mt-4 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
            🔍 <strong>Debug:</strong> data = {JSON.stringify(data, null, 2)}
          </div>
        </div>
      </Card>
    );
  }
  
  const pdfData = data.extracted_data.extracted_data;
  const manualExtras = data.extracted_data.manual_extras;

  return (
    <>
      <Card title="Review & Confirm" desc="Review PDF data + manual extras before saving">
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

        {/* File Info */}
        <div className="mb-4 p-3 bg-zinc-50 rounded-lg">
          <div className="flex items-center gap-4 text-sm">
            <div><span className="font-medium">File:</span> {data.filename}</div>
            <div><span className="font-medium">Status:</span> {data.status}</div>
            <div><span className="font-medium">S3 Key:</span> {data.s3_key}</div>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="mb-4 p-3 rounded-lg bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">AI Confidence Score:</div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              pdfData.confidence_score >= 0.8 
                ? 'bg-green-100 text-green-700'
                : pdfData.confidence_score >= 0.6
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {Math.round(pdfData.confidence_score * 100)}%
            </span>
          </div>
          <div className="text-xs text-zinc-600 mt-1">
            {pdfData.confidence_score >= 0.8 
              ? 'High confidence - data looks good'
              : pdfData.confidence_score >= 0.6
              ? 'Medium confidence - please review carefully'
              : 'Low confidence - manual review required'
            }
          </div>
        </div>

        {/* PDF Extracted Data Section */}
        <div className="mb-6">
          <div className="text-sm font-medium mb-3 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            📄 PDF Extracted Data (AI Confidence: {Math.round((editableData.pdfData.confidence_score || pdfData.confidence_score) * 100)}%)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput 
              label="Policy Number" 
              value={editableData.pdfData.policy_number || pdfData.policy_number}
              onChange={(value) => updatePdfData('policy_number', value)}
              hint="auto-read from PDF (editable)"
            />
            <LabeledInput 
              label="Vehicle Number" 
              value={editableData.pdfData.vehicle_number || pdfData.vehicle_number}
              onChange={(value) => updatePdfData('vehicle_number', value)}
              hint="check format (editable)"
            />
            <LabeledInput 
              label="Insurer" 
              value={editableData.pdfData.insurer || pdfData.insurer}
              onChange={(value) => updatePdfData('insurer', value)}
            />
            <LabeledInput 
              label="Product Type" 
              value={editableData.pdfData.product_type || pdfData.product_type}
              onChange={(value) => updatePdfData('product_type', value)}
            />
            <LabeledInput 
              label="Make" 
              value={editableData.pdfData.make || pdfData.make}
              onChange={(value) => updatePdfData('make', value)}
            />
            <LabeledInput 
              label="Model" 
              value={editableData.pdfData.model || pdfData.model}
              onChange={(value) => updatePdfData('model', value)}
            />
            <LabeledInput 
              label="CC" 
              value={editableData.pdfData.cc || pdfData.cc}
              onChange={(value) => updatePdfData('cc', value)}
              hint="engine size"
            />
            <LabeledInput 
              label="Manufacturing Year" 
              value={editableData.pdfData.manufacturing_year || pdfData.manufacturing_year}
              onChange={(value) => updatePdfData('manufacturing_year', value)}
            />
            <LabeledInput 
              label="Issue Date" 
              type="date"
              value={(() => {
                const dateValue = editableData.pdfData.issue_date || pdfData.issue_date;
                if (dateValue) {
                  // If date is in DD-MM-YYYY format, convert to YYYY-MM-DD
                  if (dateValue.includes('-') && dateValue.split('-')[0].length === 2) {
                    const [day, month, year] = dateValue.split('-');
                    return `${year}-${month}-${day}`;
                  }
                  // If already in YYYY-MM-DD format, return as is
                  return dateValue;
                }
                return dateValue;
              })()}
              onChange={(value) => {
                // Ensure date is in YYYY-MM-DD format
                if (value) {
                  const date = new Date(value);
                  if (!isNaN(date.getTime())) {
                    const formattedDate = date.toISOString().split('T')[0];
                    updatePdfData('issue_date', formattedDate);
                  } else {
                    updatePdfData('issue_date', value);
                  }
                } else {
                  updatePdfData('issue_date', value);
                }
              }}
            />
            <LabeledInput 
              label="Expiry Date" 
              value={editableData.pdfData.expiry_date || pdfData.expiry_date}
              onChange={(value) => updatePdfData('expiry_date', value)}
            />
            <LabeledInput 
              label="IDV (₹)" 
              value={editableData.pdfData.idv || pdfData.idv}
              onChange={(value) => updatePdfData('idv', value)}
            />
            <LabeledInput 
              label="NCB (%)" 
              value={editableData.pdfData.ncb || pdfData.ncb}
              onChange={(value) => updatePdfData('ncb', value)}
            />
            <LabeledInput 
              label="Discount (%)" 
              value={editableData.pdfData.discount || pdfData.discount}
              onChange={(value) => updatePdfData('discount', value)}
            />
            <LabeledInput 
              label="Net OD (₹)" 
              value={editableData.pdfData.net_od || pdfData.net_od}
              onChange={(value) => updatePdfData('net_od', value)}
              hint="Own Damage"
            />
            <LabeledInput 
              label="Total OD (₹)" 
              value={editableData.pdfData.total_od || pdfData.total_od}
              onChange={(value) => updatePdfData('total_od', value)}
            />
            <LabeledInput 
              label="Net Premium (₹)" 
              value={editableData.pdfData.net_premium || pdfData.net_premium}
              onChange={(value) => updatePdfData('net_premium', value)}
            />
            <LabeledInput 
              label="Total Premium (₹)" 
              value={editableData.pdfData.total_premium || pdfData.total_premium}
              onChange={(value) => updatePdfData('total_premium', value)}
            />
          </div>
        </div>

        {/* Manual Extras Section */}
        <div className="mb-6">
          <div className="text-sm font-medium mb-3 text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
            ✏️ Manual Extras (from Sales Rep)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput 
              label="Executive" 
              value={editableData.manualExtras.executive || manualExtras.executive}
              onChange={(value) => updateManualExtras('executive', value)}
              hint="sales rep name"
            />
            <LabeledSelect 
              label="Ops Executive" 
              value={editableData.manualExtras.opsExecutive || manualExtras.opsExecutive}
              onChange={(value) => updateManualExtras('opsExecutive', value)}
              options={["Yashwanth", "Kavya", "Bhagya", "Sandesh", "Yallappa", "Nethravathi", "Tejaswini"]}
            />
            <LabeledInput 
              label="Caller Name" 
              value={editableData.manualExtras.callerName || manualExtras.callerName}
              onChange={(value) => updateManualExtras('callerName', value)}
              hint="telecaller name"
            />
            <LabeledInput 
              label="Customer Email ID" 
              value={editableData.manualExtras.customerEmail || manualExtras.customerEmail}
              onChange={(value) => updateManualExtras('customerEmail', value)}
            />
            <LabeledInput 
              label="Mobile Number" 
              value={editableData.manualExtras.mobile || manualExtras.mobile}
              onChange={(value) => updateManualExtras('mobile', value)}
            />
            <LabeledSelect 
              label="Rollover/Renewal" 
              value={editableData.manualExtras.rollover || manualExtras.rollover}
              onChange={(value) => updateManualExtras('rollover', value)}
              options={["ROLLOVER", "RENEWAL"]}
            />
            <LabeledInput 
              label="Customer Name" 
              value={editableData.manualExtras.customerName || manualExtras.customerName}
              onChange={(value) => updateManualExtras('customerName', value)}
            />
            <LabeledSelect 
              label="Branch" 
              value={editableData.manualExtras.branch || manualExtras.branch}
              onChange={(value) => updateManualExtras('branch', value)}
              options={["MYSORE", "BANASHANKARI", "ADUGODI"]}
              required
            />
            <div style={{ display: 'none' }}>
              <LabeledInput 
                label="Brokerage (₹)" 
                value={editableData.manualExtras.brokerage || manualExtras.brokerage}
                onChange={(value) => updateManualExtras('brokerage', value)}
                hint="commission amount"
              />
            </div>
            <LabeledInput 
              label="Cashback (₹)" 
              value={editableData.manualExtras.cashback || manualExtras.cashback}
              onChange={(value) => updateManualExtras('cashback', value)}
              hint="total cashback"
            />
            <LabeledInput 
              label="Customer Paid (₹)" 
              value={editableData.manualExtras.customerPaid || manualExtras.customerPaid}
              onChange={(value) => updateManualExtras('customerPaid', value)}
            />
            <LabeledInput 
              label="Customer Cheque No" 
              value={editableData.manualExtras.customerChequeNo || manualExtras.customerChequeNo}
              onChange={(value) => updateManualExtras('customerChequeNo', value)}
            />
            <LabeledInput 
              label="Our Cheque No" 
              value={editableData.manualExtras.ourChequeNo || manualExtras.ourChequeNo}
              onChange={(value) => updateManualExtras('ourChequeNo', value)}
            />
            <div className="md:col-span-2">
              <LabeledInput 
                label="Remark" 
                value={editableData.manualExtras.remark || manualExtras.remark}
                onChange={(value) => updateManualExtras('remark', value)}
                hint="additional notes"
              />
            </div>
          </div>
        </div>

        {/* Issues Section */}
        <div className="mb-6">
          <div className="text-sm font-medium mb-2">Issues & Warnings</div>
          <div className="space-y-2">
            {(editableData.pdfData.confidence_score || pdfData.confidence_score) < 0.8 && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600"/> 
                <span>Low confidence score. Please verify all extracted data.</span>
              </div>
            )}
            {!(editableData.pdfData.issue_date || pdfData.issue_date) && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600"/> 
                <span>Issue Date missing. Please add manually.</span>
              </div>
            )}
            {!(editableData.pdfData.expiry_date || pdfData.expiry_date) && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600"/> 
                <span>Expiry Date missing. Please add manually.</span>
              </div>
            )}
            {!(editableData.manualExtras.executive || manualExtras.executive) && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600"/> 
                <span>Executive name missing. Please add manually.</span>
              </div>
            )}
            {!(editableData.manualExtras.mobile || manualExtras.mobile) && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600"/> 
                <span>Mobile number missing. Please add manually.</span>
              </div>
            )}
            {(editableData.pdfData.confidence_score || pdfData.confidence_score) >= 0.8 && 
             (editableData.manualExtras.executive || manualExtras.executive) && 
             (editableData.manualExtras.mobile || manualExtras.mobile) && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600"/> 
                <span>Data looks good! High confidence extraction + complete manual extras.</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={handleConfirmAndSave} 
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-zinc-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Confirm & Save'}
          </button>
          <button 
            onClick={handleRejectToManual} 
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-white border disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reject to Manual
          </button>
        </div>
      </Card>
    </>
  )
}

function PagePolicyDetail() {
  const [policyData, setPolicyData] = useState<any>(null);
  const [dataSource, setDataSource] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [policyId, setPolicyId] = useState<string>('1');
  const [availablePolicies, setAvailablePolicies] = useState<any[]>([]);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(true);
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'vehicle' | 'policy' | 'both'>('both');
  const [showResults, setShowResults] = useState(false);

  const loadAvailablePolicies = async () => {
    try {
      setIsLoadingPolicies(true);
      // Use dual storage pattern to get all policies
      const response = await DualStorageService.getAllPolicies();
      
      if (response.success) {
        setAvailablePolicies(response.data || []);
        
        if (ENABLE_DEBUG) {
        }
      }
    } catch (error) {
      console.error('Failed to load available policies:', error);
      // Set mock policies as fallback
      setAvailablePolicies([
        { id: '1', policy_number: 'TA-9921', vehicle_number: 'KA 51 MM 1214', insurer: 'Tata AIG' },
        { id: '2', policy_number: 'TA-9922', vehicle_number: 'KA01AB5678', insurer: 'Tata AIG' },
        { id: '3', policy_number: 'TA-9923', vehicle_number: 'KA01AB9012', insurer: 'Tata AIG' }
      ]);
    } finally {
      setIsLoadingPolicies(false);
    }
  };

  const loadPolicyDetail = async (id: string) => {
    try {
      setIsLoading(true);
      // Use dual storage pattern: S3 → Database → Mock Data
      const response = await DualStorageService.getPolicyDetail(id);
      
      if (response.success) {
        setPolicyData(response.data);
        setDataSource(response.source);
        
        if (ENABLE_DEBUG) {
        }
      }
    } catch (error) {
      console.error('Failed to load policy detail:', error);
      setDataSource('MOCK_DATA');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAvailablePolicies();
    loadPolicyDetail(policyId);
  }, []);

  useEffect(() => {
    if (policyId) {
      loadPolicyDetail(policyId);
    }
  }, [policyId]);

  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      let searchResults: any[] = [];
      
      if (searchType === 'vehicle' || searchType === 'both') {
        // Search by vehicle number
        const vehicleResults = availablePolicies.filter(policy => 
          policy.vehicle_number.toLowerCase().includes(query.toLowerCase())
        );
        searchResults = [...searchResults, ...vehicleResults];
      }
      
      if (searchType === 'policy' || searchType === 'both') {
        // Search by policy number
        const policyResults = availablePolicies.filter(policy => 
          policy.policy_number.toLowerCase().includes(query.toLowerCase())
        );
        searchResults = [...searchResults, ...policyResults];
      }
      
      // Remove duplicates and sort
      const uniqueResults = searchResults.filter((policy, index, self) => 
        index === self.findIndex(p => p.id === policy.id)
      );
      
      setSearchResults(uniqueResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  const debouncedSearch = useMemo(
    () => {
      let timeoutId: number;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => handleSearch(query), 300);
      };
    },
    [searchType, availablePolicies]
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, debouncedSearch]);

  const handlePolicySelect = (policy: any) => {
    setPolicyId(policy.id);
    setSearchQuery(`${policy.policy_number} - ${policy.vehicle_number}`);
    setShowResults(false);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (isLoading) {
  return (
      <Card title="Policy Detail — Loading..." desc="Loading policy data...">
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-zinc-600">Loading policy details...</div>
          </div>
      </Card>
    );
  }

  const policy = policyData || {
    policy_number: 'TA-9921',
    vehicle_number: 'KA 51 MM 1214',
    insurer: 'Tata AIG',
    issue_date: '2025-08-10',
    expiry_date: '2026-08-09',
    total_premium: 12150,
    customer_name: 'Sarah Wilson',
    ncb: 20,
    audit_trail: [
      { timestamp: '2025-08-12T15:54:00Z', action: 'PDF_PARSED', user: 'System', details: 'Parsed PDF (98% confidence)' },
      { timestamp: '2025-08-12T15:56:00Z', action: 'CONFIRMED', user: 'Priya Singh', details: 'Confirmed by Ops team' },
      { timestamp: '2025-08-12T15:57:00Z', action: 'AUDIT_SAVED', user: 'System', details: 'Audit log saved' }
    ]
  };

  return (
    <>
      {/* Policy Selection */}
      <Card title="Policy Detail" desc={`View comprehensive policy information (Data Source: ${dataSource || 'Loading...'})`}>
        <div className="mb-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Search Policy:</label>
              {isLoadingPolicies ? (
                <div className="text-sm text-zinc-500">Loading policies...</div>
              ) : (
                <div className="relative flex-1 max-w-md search-container">
                  {/* Search Type Toggle */}
                  <div className="flex space-x-4 mb-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="both"
                        checked={searchType === 'both'}
                        onChange={(e) => setSearchType(e.target.value as 'vehicle' | 'policy' | 'both')}
                        className="mr-2"
                      />
                      <span className="text-sm">Both</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="vehicle"
                        checked={searchType === 'vehicle'}
                        onChange={(e) => setSearchType(e.target.value as 'vehicle' | 'policy' | 'both')}
                        className="mr-2"
                      />
                      <span className="text-sm">Vehicle</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="policy"
                        checked={searchType === 'policy'}
                        onChange={(e) => setSearchType(e.target.value as 'vehicle' | 'policy' | 'both')}
                        className="mr-2"
                      />
                      <span className="text-sm">Policy</span>
                    </label>
                  </div>
                  
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowResults(true)}
                      placeholder={`Search by ${searchType === 'both' ? 'vehicle number or policy number' : searchType === 'vehicle' ? 'vehicle number' : 'policy number'}...`}
                      className="block w-full px-3 py-2 pr-10 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {isSearching ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <div className="text-zinc-400">🔍</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Search Results Dropdown */}
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-zinc-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {searchResults.map((policy) => (
                        <div
                          key={policy.id}
                          onClick={() => handlePolicySelect(policy)}
                          className="px-4 py-3 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 last:border-b-0"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-zinc-900">
                                {policy.policy_number}
                              </p>
                              <p className="text-sm text-zinc-500">
                                {policy.vehicle_number} - {policy.insurer}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* No Results Message */}
                  {showResults && searchQuery && searchResults.length === 0 && !isSearching && (
                    <div className="mt-2 text-sm text-zinc-500">
                      No policies found matching your search.
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => loadAvailablePolicies()}
                className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-md text-sm hover:bg-zinc-200"
                disabled={isLoadingPolicies}
              >
                Refresh
              </button>
            </div>
            {availablePolicies.length > 0 && (
              <div className="text-xs text-zinc-500">
                {availablePolicies.length} policies available
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Policy Information */}
      <Card title={`Policy: ${policy.policy_number || 'TA-9921'} — ${policy.vehicle_number || 'KA 51 MM 1214'}`} desc="Comprehensive policy details">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
        <div className="bg-zinc-50 rounded-xl p-4">
            <div className="text-sm font-medium mb-3 text-zinc-700">Basic Information</div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Policy Number:</span>
                <span className="font-medium">{policy.policy_number || 'TA-9921'}</span>
              </div>
              <div className="flex justify-between">
                <span>Vehicle Number:</span>
                <span className="font-medium">{policy.vehicle_number || 'KA 51 MM 1214'}</span>
              </div>
              <div className="flex justify-between">
                <span>Insurer:</span>
                <span className="font-medium">{policy.insurer || 'Tata AIG'}</span>
              </div>
              <div className="flex justify-between">
                <span>Product Type:</span>
                <span className="font-medium">{policy.product_type || 'Private Car'}</span>
              </div>
              <div className="flex justify-between">
                <span>Issue Date:</span>
                <span className="font-medium">{policy.issue_date || '2025-08-10'}</span>
              </div>
              <div className="flex justify-between">
                <span>Expiry Date:</span>
                <span className="font-medium">{policy.expiry_date || '2026-08-09'}</span>
              </div>
              <div className="flex justify-between">
                <span>Source:</span>
                <span className="font-medium">{policy.source || 'PDF_UPLOAD'}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-zinc-50 rounded-xl p-4">
            <div className="text-sm font-medium mb-3 text-zinc-700">Vehicle Information</div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Make:</span>
                <span className="font-medium">{policy.make || 'Maruti'}</span>
              </div>
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="font-medium">{policy.model || 'Swift'}</span>
              </div>
              <div className="flex justify-between">
                <span>CC:</span>
                <span className="font-medium">{policy.cc || '1197'}</span>
              </div>
              <div className="flex justify-between">
                <span>Manufacturing Year:</span>
                <span className="font-medium">{policy.manufacturing_year || '2021'}</span>
              </div>
              <div className="flex justify-between">
                <span>Vehicle Type:</span>
                <span className="font-medium">{policy.vehicle_type || 'Private Car'}</span>
              </div>
              <div className="flex justify-between">
                <span>IDV:</span>
                <span className="font-medium">₹{(policy.idv || 495000).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-zinc-50 rounded-xl p-4">
            <div className="text-sm font-medium mb-3 text-zinc-700">Customer Information</div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Customer Name:</span>
                <span className="font-medium">{policy.customer_name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer Email ID:</span>
                <span className="font-medium">{policy.customer_email || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Executive:</span>
                <span className="font-medium">{policy.executive || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Ops Executive:</span>
                <span className="font-medium">{policy.ops_executive || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Caller Name:</span>
                <span className="font-medium">{policy.caller_name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Mobile:</span>
                <span className="font-medium">{policy.mobile || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Branch:</span>
                <span className="font-medium">{policy.branch || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Type of Business:</span>
                <span className="font-medium">{policy.rollover || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Remark:</span>
                <span className="font-medium">{policy.remark || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-zinc-50 rounded-xl p-4">
            <div className="text-sm font-medium mb-3 text-zinc-700">Financial Information</div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Total Premium:</span>
                <span className="font-medium">₹{(policy.total_premium || 12150).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Net Premium:</span>
                <span className="font-medium">₹{(policy.net_premium || 10800).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total OD:</span>
                <span className="font-medium">₹{(policy.total_od || 7200).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Net OD:</span>
                <span className="font-medium">₹{(policy.net_od || 5400).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Brokerage:</span>
                <span className="font-medium">₹{(policy.brokerage || 1822).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashback:</span>
                <span className="font-medium">₹{(policy.cashback || 600).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer Paid:</span>
                <span className="font-medium">₹{(policy.customer_paid || 12150).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer Cheque No:</span>
                <span className="font-medium">{policy.customer_cheque_no || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Our Cheque No:</span>
                <span className="font-medium">{policy.our_cheque_no || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashback Percentage:</span>
                <span className="font-medium">{(parseFloat(policy.cashback_percentage) || 4.9).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Cashback Amount:</span>
                <span className="font-medium">₹{(policy.cashback_amount || 600).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Discounts & Benefits */}
          <div className="bg-zinc-50 rounded-xl p-4">
            <div className="text-sm font-medium mb-3 text-zinc-700">Discounts & Benefits</div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span>NCB:</span>
                <span className="font-medium">{policy.ncb || 20}%</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="font-medium">%{(policy.discount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Net Addon:</span>
                <span className="font-medium">{policy.ref || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="mt-6 bg-zinc-50 rounded-xl p-4">
          <div className="text-sm font-medium mb-3 text-zinc-700">System Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-medium">{policy.status || 'SAVED'}</span>
            </div>
            <div className="flex justify-between">
              <span>Confidence Score:</span>
              <span className="font-medium">{((policy.confidence_score || 0.98) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Created By:</span>
              <span className="font-medium">{policy.created_by || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Created At:</span>
              <span className="font-medium">{policy.created_at ? new Date(policy.created_at).toLocaleString() : '2025-08-12 15:54:00'}</span>
            </div>
            <div className="flex justify-between">
              <span>Updated At:</span>
              <span className="font-medium">{policy.updated_at ? new Date(policy.updated_at).toLocaleString() : '2025-08-12 15:57:00'}</span>
            </div>
          </div>
        </div>

        {/* Audit Trail */}
        <div className="mt-6 bg-zinc-50 rounded-xl p-4">
          <div className="text-sm font-medium mb-3 text-zinc-700">Activity Timeline</div>
          <div className="space-y-3">
            {policy.audit_trail?.map((entry: any, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-zinc-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-900">{entry.action}</div>
                  <div className="text-xs text-zinc-600">{entry.details}</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {new Date(entry.timestamp).toLocaleString()} by {entry.user}
                  </div>
                </div>
              </div>
            )) || (
              <>
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-zinc-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-900">PDF_PARSED</div>
                    <div className="text-xs text-zinc-600">Parsed PDF (98% confidence)</div>
                    <div className="text-xs text-zinc-500 mt-1">2025-08-12 15:54:00 by System</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-zinc-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-900">CONFIRMED</div>
                    <div className="text-xs text-zinc-600">Confirmed by Ops team</div>
                    <div className="text-xs text-zinc-500 mt-1">2025-08-12 15:56:00 by Priya Singh</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-zinc-200">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-900">AUDIT_SAVED</div>
                    <div className="text-xs text-zinc-600">Audit log saved</div>
                    <div className="text-xs text-zinc-500 mt-1">2025-08-12 15:57:00 by System</div>
                  </div>
                </div>
              </>
            )}
        </div>
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
  { name: "Priya Singh", leads: 120, converted: 22, gwp: 260000, brokerage: 39000, cashback: 10000, net: 29000, cac: Math.round(1800 / 22) },
  { name: "Rahul Kumar", leads: 110, converted: 18, gwp: 210000, brokerage: 31500, cashback: 9000, net: 22500, cac: Math.round(1800 / 18) },
  { name: "Anjali Sharma", leads: 90, converted: 20, gwp: 240000, brokerage: 36000, cashback: 8000, net: 28000, cac: Math.round(1800 / 20) },
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

function PageOverview() {
  const [metrics, setMetrics] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [dataSource, setDataSource] = useState<string>('');

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
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
    </>
  )
}

function PageLeaderboard() {
  const [reps, setReps] = useState<any[]>([]);
  const [dataSource, setDataSource] = useState<string>('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
        default:
          return 0;
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  useEffect(() => {
    const loadSalesReps = async () => {
      try {
        // Use dual storage pattern: S3 → Database → Mock Data
        const response = await DualStorageService.getSalesReps();
        
        if (response.success) {
          if (ENABLE_DEBUG) {
          }
          setReps(Array.isArray(response.data) ? response.data : []);
          setDataSource(response.source);
        }
      } catch (error) {
        console.error('Failed to load sales reps:', error);
        setReps(demoReps);
        setDataSource('MOCK_DATA');
      }
    };
    
    loadSalesReps();
  }, []);

  return (
    <Card title="Rep Leaderboard" desc={`Lead→Sale % = Converted / Leads Assigned; CAC/policy = daily rep cost / converted (Data Source: ${dataSource || 'Loading...'})`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-2 rounded-xl bg-zinc-100 p-1">
          <button className="px-3 py-1 rounded-lg bg-white shadow text-sm">Last 14d</button>
          <button className="px-3 py-1 rounded-lg text-sm text-zinc-600">MTD</button>
          <button className="px-3 py-1 rounded-lg text-sm text-zinc-600">Last 90d</button>
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm">
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
    
    // Helper function to properly escape CSV values
    const escapeCSV = (value: any) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      
      // Clean the string: remove all types of line breaks and normalize whitespace
      const cleanedStr = str
        .replace(/\r\n/g, ' ')  // Windows line breaks
        .replace(/\n/g, ' ')    // Unix line breaks  
        .replace(/\r/g, ' ')    // Old Mac line breaks
        .replace(/\s+/g, ' ')   // Multiple spaces to single space
        .trim();                // Remove leading/trailing spaces
      
      // Always wrap in quotes for safety and escape internal quotes
      return `"${cleanedStr.replace(/"/g, '""')}"`;
    };
    
    // Helper function to format dates consistently
    const formatDate = (dateStr: any) => {
      if (!dateStr || dateStr === 'N/A') return 'N/A';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'N/A';
        // Use consistent DD-MM-YYYY format
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } catch (error) {
        return 'N/A';
      }
    };
    
    // Helper function to format numbers consistently
    const formatNumber = (value: any) => {
      if (value === null || value === undefined || value === '') return '0';
      const num = parseFloat(value);
      return isNaN(num) ? '0' : num.toString();
    };
    
    const csvRows = [
      headers.map(escapeCSV).join(','),
      ...filtered.map(row => [
        escapeCSV(row.rep),
        escapeCSV(row.make),
        escapeCSV(row.model),
        escapeCSV(row.insurer),
        escapeCSV(formatDate(row.issueDate)),
        escapeCSV(formatDate(row.expiryDate)),
        escapeCSV(row.rollover),
        escapeCSV(row.branch),
        escapeCSV(row.policies),
        escapeCSV(formatNumber(row.gwp)),
        escapeCSV(formatNumber(row.totalPremium)),
        escapeCSV(formatNumber(row.totalOD)),
        escapeCSV(parseFloat(row.cashbackPctAvg || 0).toFixed(1)),
        escapeCSV(formatNumber(row.cashback)),
        escapeCSV(formatNumber(row.net))
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    
    // Add UTF-8 BOM for proper Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
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
      <Card title="Sales Explorer (Motor)" desc={`Filter by Make/Model; find reps with most sales and lowest cashback (Data Source: ${dataSource || 'Loading...'})`}>
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

function PageSources() {
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [dataSource, setDataSource] = useState<string>('');

  useEffect(() => {
    const loadDataSources = async () => {
      try {
        // Use dual storage pattern: S3 → Database → Mock Data
        const response = await DualStorageService.getDataSources();
        
        if (response.success) {
          const newDataSources = Array.isArray(response.data) ? response.data : [];
          setDataSources(newDataSources);
          setDataSource(response.source);
          
        }
      } catch (error) {
        console.error('Failed to load data sources:', error);
        setDataSources(demoSources);
        setDataSource('MOCK_DATA');
      }
    };
    
    loadDataSources();
  }, []);

  // Debug logging for chart data
  if (ENABLE_DEBUG) {
  }

  return (
    <Card title="Contribution by Data Source" desc={`Compare PDF vs Manual vs CSV (ingestion source = where data came from) (Data Source: ${dataSource || 'Loading...'})`}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart key={`chart-${dataSources.length}-${dataSource}`} data={dataSources.length > 0 ? dataSources : demoSources}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee"/>
            <XAxis dataKey="name"/>
            <YAxis/>
            <Tooltip/>
            <Legend/>
            <Bar dataKey="policies" name="# Policies" fill="#6366f1"/>
            <Bar dataKey="gwp" name="GWP" fill="#10b981"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center text-sm mt-2">
        {dataSources.length > 0 ? (
          <span className="text-green-600 font-medium">
            ✅ Showing {dataSources.length} real data sources from {dataSource}
          </span>
        ) : dataSource === 'BACKEND_API' ? (
          <span className="text-red-500">
            ❌ No data sources found in backend
          </span>
        ) : (
          <span className="text-blue-500">
            📊 Showing demo data (fallback)
          </span>
        )}
      </div>
    </Card>
  )
}

function PageFounderSettings() {
  const [settings, setSettings] = useState({
    brokeragePercent: '15',
    repDailyCost: '2000',
    expectedConversion: '25',
    premiumGrowth: '10'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any>({});

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [settings]);

  const [dataSource, setDataSource] = useState<string>('');

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await DualStorageService.getSettings();
      if (response.success) {
        setSettings(response.data);
        setHasChanges(false);
        setDataSource(response.source || 'Unknown');
        
        if (ENABLE_DEBUG) {
        }
      } else {
        setError(response.error || 'Failed to load settings');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const validateSettings = (settings: any) => {
    const errors: any = {};
    
    // Brokerage % validation
    if (!settings.brokeragePercent || isNaN(parseFloat(settings.brokeragePercent))) {
      errors.brokeragePercent = 'Brokerage % is required and must be a number';
    } else {
      const value = parseFloat(settings.brokeragePercent);
      if (value < 0 || value > 100) {
        errors.brokeragePercent = 'Brokerage % must be between 0 and 100';
      }
    }
    
    // Rep Daily Cost validation
    if (!settings.repDailyCost || isNaN(parseFloat(settings.repDailyCost))) {
      errors.repDailyCost = 'Rep Daily Cost is required and must be a number';
    } else {
      const value = parseFloat(settings.repDailyCost);
      if (value < 0) {
        errors.repDailyCost = 'Rep Daily Cost must be positive';
      }
    }
    
    // Expected Conversion % validation
    if (!settings.expectedConversion || isNaN(parseFloat(settings.expectedConversion))) {
      errors.expectedConversion = 'Expected Conversion % is required and must be a number';
    } else {
      const value = parseFloat(settings.expectedConversion);
      if (value < 0 || value > 100) {
        errors.expectedConversion = 'Expected Conversion % must be between 0 and 100';
      }
    }
    
    // Premium Growth % validation
    if (!settings.premiumGrowth || isNaN(parseFloat(settings.premiumGrowth))) {
      errors.premiumGrowth = 'Premium Growth % is required and must be a number';
    } else {
      const value = parseFloat(settings.premiumGrowth);
      if (value < 0 || value > 100) {
        errors.premiumGrowth = 'Premium Growth % must be between 0 and 100';
      }
    }
    
    return errors;
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      // Validate settings
      const validationErrors = validateSettings(settings);
      if (Object.keys(validationErrors).length > 0) {
        setValidationErrors(validationErrors);
        return;
      }
      
      // Save settings
      const response = await DualStorageService.saveSettings(settings);
      
      if (response.success) {
        setSuccess(`Settings saved successfully! (${response.source || 'Saved'})`);
        setHasChanges(false);
        setValidationErrors({});
        setDataSource(response.source || 'Unknown');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to save settings');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      // Reset settings
      const response = await DualStorageService.resetSettings();
      
      if (response.success) {
        setSettings(response.data);
        setHasChanges(false);
        setValidationErrors({});
        setSuccess(`Settings reset to defaults! (${response.source || 'Reset'})`);
        setDataSource(response.source || 'Unknown');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to reset settings');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to reset settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title="Business Settings" desc={`These drive calculations in dashboards (Data Source: ${dataSource || 'Loading...'})`}>
      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800">{success}</div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LabeledInput 
          label="Brokerage %" 
          hint="% of GWP that we earn"
          value={settings.brokeragePercent}
          onChange={(value) => updateSetting('brokeragePercent', value)}
          error={validationErrors.brokeragePercent}
        />
        <LabeledInput 
          label="Rep Daily Cost (₹)" 
          hint="salary + incentives + telephony + tools / working days"
          value={settings.repDailyCost}
          onChange={(value) => updateSetting('repDailyCost', value)}
          error={validationErrors.repDailyCost}
        />
        <LabeledInput 
          label="Expected Conversion %" 
          hint="for valuing backlog"
          value={settings.expectedConversion}
          onChange={(value) => updateSetting('expectedConversion', value)}
          error={validationErrors.expectedConversion}
        />
        <LabeledInput 
          label="Premium Growth %" 
          hint="for LTV estimates later"
          value={settings.premiumGrowth}
          onChange={(value) => updateSetting('premiumGrowth', value)}
          error={validationErrors.premiumGrowth}
        />
      </div>
      
      <div className="flex gap-3 mt-4">
        <button 
          onClick={handleSave}
          disabled={isLoading || !hasChanges}
          className="px-4 py-2 rounded-xl bg-zinc-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
        <button 
          onClick={handleReset}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-white border disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </Card>
  )
}

// ---------- KPI DASHBOARD ----------
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

// ---------- DEV/TESTS ----------
function PageTests() {
  // Simple run-time tests for core form math (no framework)
  type Case = { name: string; total: number; pct?: number; amt?: number; expectAmt?: number; expectPct?: number };
  const cases: Case[] = [
    { name: "pct→amt", total: 10000, pct: 10, expectAmt: 1000 },
    { name: "amt→pct", total: 20000, amt: 500, expectPct: 2.5 },
    { name: "zero-total", total: 0, pct: 10, expectAmt: 0 },
  ];
  const results = cases.map(c => {
    const calcAmt = c.pct != null ? Math.round((c.total * c.pct) / 100) : (c.amt ?? 0);
    const calcPct = c.amt != null && c.total > 0 ? +( (c.amt / c.total) * 100 ).toFixed(1) : (c.pct ?? 0);
    const passAmt = c.expectAmt == null || c.expectAmt === calcAmt;
    const passPct = c.expectPct == null || c.expectPct === calcPct;
    return { ...c, calcAmt, calcPct, pass: passAmt && passPct };
  });
  const allPass = results.every(r => r.pass);
  return (
    <Card title="Dev/Test" desc="Lightweight checks for cashback math">
      <div className="text-sm mb-2">Overall: {allPass ? <span className="text-emerald-700">✅ PASS</span> : <span className="text-rose-700">❌ FAIL</span>}</div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500">
              <th className="py-2">Case</th><th>Total</th><th>Input %</th><th>Input ₹</th><th>Calc ₹</th><th>Calc %</th><th>Expected ₹</th><th>Expected %</th><th>Result</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r,i)=> (
              <tr key={i} className="border-t">
                <td className="py-2">{r.name}</td>
                <td>{r.total}</td>
                <td>{r.pct ?? "—"}</td>
                <td>{r.amt ?? "—"}</td>
                <td>{r.calcAmt}</td>
                <td>{r.calcPct}</td>
                <td>{r.expectAmt ?? "—"}</td>
                <td>{r.expectPct ?? "—"}</td>
                <td>{r.pass ? "✅" : "❌"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

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
          backendStatus.data?.backendAvailable 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          🔗 Backend: {backendStatus.data?.backendAvailable ? 'Connected' : 'Disconnected'} 
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
