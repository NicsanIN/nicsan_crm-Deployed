import React, { useMemo, useState, useEffect } from "react";
import { Upload, FileText, CheckCircle2, Table2, Settings, LayoutDashboard, Users, BarChart3, Lock, LogOut, SlidersHorizontal, TrendingUp, RefreshCw, CreditCard } from "lucide-react";
import { authUtils } from './services/api';
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
import PageManualForm from './pages/operations/ManualForm/ManualForm';
import PageUpload from './pages/operations/PDFUpload/PDFUpload';
import PageOperationsSettings from './pages/operations/Settings/Settings';
import { SettingsProvider } from './contexts/SettingsContext';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Environment variables
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';
const ENABLE_MOCK_DATA = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';
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
          console.error('≡ƒöì authUtils.setToken failed:', error);
        }
        
        try {
          // Also store directly to verify
          localStorage.setItem('authToken', token);
        } catch (error) {
          console.error('≡ƒöì Direct localStorage storage failed:', error);
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
            placeholder="ΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇó"
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
        <div className="ml-auto flex items-center gap-3">
          <div className="rounded-xl bg-zinc-100 p-1 flex gap-2">
            <button onClick={() => setTab("ops")} className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === "ops" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-600 hover:text-zinc-900"}`}>Operations</button>
            <button onClick={() => !founderDisabled && setTab("founder")} className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === "founder" ? "bg-white shadow-sm text-zinc-900" : founderDisabled?"text-zinc-300 cursor-not-allowed":"text-zinc-600 hover:text-zinc-900"}`}>Founder</button>
          </div>
          <button onClick={onLogout} className="px-3 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors flex items-center gap-2 text-zinc-700">
            <LogOut className="w-4 h-4"/> Logout
          </button>
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
        Tip: <kbd>Tab</kbd>/<kbd>Shift+Tab</kbd> move ┬╖ <kbd>Ctrl+S</kbd> save ┬╖ <kbd>Ctrl+Enter</kbd> save & next
      </div>
    </div>
  )
}




export function AutocompleteInput({ 
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
              Γ₧ò Add '{value}' as new Telecaller
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// Optimized manual form with QuickFill and two-way cashback cal
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
          ≡ƒöù Backend: {backendStatus.backendAvailable ? 'Connected' : 'Disconnected'} 
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
          {opsPage === "settings" && <PageOperationsSettings/>}
          {opsPage === "sync-demo" && <CrossDeviceSyncDemo/>}
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
