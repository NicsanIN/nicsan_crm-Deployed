import React, { useMemo, useState } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, Table2, Settings, LayoutDashboard, Users, BarChart3, BadgeInfo, Filter, Search, Lock, LogOut, Car, SlidersHorizontal, LineChart, TrendingUp } from "lucide-react";
import { ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend, Area, AreaChart, XAxis, YAxis, Tooltip } from "recharts";

// --- Nicsan CRM v1 UI/UX Mock (updated) ---
// Adds: Password-protected login, optimized Manual Form, Founder filters, KPI dashboard (your new metrics)
// Now: Manual Form includes ALL requested columns; PDF flow includes a small manual entry panel.
// Tailwind CSS assumed. Static demo state only.

// ---------- AUTH ----------
function LoginPage({ onLogin }: { onLogin: (user: { name: string; email: string; role: "ops" | "founder" }) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ops"|"founder">("ops");
  return (
    <div className="min-h-screen grid place-items-center bg-zinc-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
        <div className="flex items-center gap-2 text-lg font-semibold mb-1"><Lock className="w-5 h-5"/> Nicsan CRM v1</div>
        <div className="text-sm text-zinc-500 mb-6">Password-protected access. Choose your role for this demo.</div>
        <label className="block mb-3">
          <div className="text-xs text-zinc-600 mb-1">Email</div>
          <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="you@nicsan.in"/>
        </label>
        <label className="block mb-4">
          <div className="text-xs text-zinc-600 mb-1">Password</div>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="••••••••"/>
        </label>
        <div className="flex items-center gap-2 mb-6">
          <label className={`px-3 py-2 rounded-lg border ${role==='ops'?'border-zinc-900':'border-zinc-200'} cursor-pointer`}>
            <input type="radio" name="role" className="mr-2" checked={role==='ops'} onChange={()=>setRole('ops')}/> Operations
          </label>
          <label className={`px-3 py-2 rounded-lg border ${role==='founder'?'border-zinc-900':'border-zinc-200'} cursor-pointer`}>
            <input type="radio" name="role" className="mr-2" checked={role==='founder'} onChange={()=>setRole('founder')}/> Founder
          </label>
        </div>
        <button onClick={()=>onLogin({ name: email.split('@')[0]||'User', email, role })} className="w-full px-4 py-2 rounded-xl bg-zinc-900 text-white">Sign in</button>
        <div className="text-xs text-zinc-500 mt-3">Forgot password? <span className="text-indigo-600">Reset via email</span></div>
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
  return (
    <>
      <Card title="Drag & Drop PDF" desc="(S3 = cloud folder; Textract = PDF reader bot). Tata AIG & Digit only in v1.">
        <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-10 text-center bg-zinc-50">
          <Upload className="w-8 h-8 mx-auto text-zinc-500"/>
          <div className="mt-2 text-sm text-zinc-700">Drop PDF here or <span className="text-indigo-600">browse</span></div>
          <div className="text-xs text-zinc-500 mt-1">We delete the PDF immediately after reading.</div>
        </div>
      </Card>
      <Card title="Manual extras (from Sales Rep)" desc="Some fields don’t exist in the PDF and must be filled by OPS.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LabeledInput label="Caller Name" placeholder="Telecaller name"/>
          <LabeledInput label="Executive" placeholder="Ops owner"/>
          <LabeledInput label="Cashback %"/>
          <LabeledInput label="Cashback Amount (₹)"/>
          <LabeledInput label="Customer Paid (₹)"/>
          <LabeledInput label="Customer Cheque No"/>
          <LabeledInput label="Our Cheque No"/>
          <LabeledInput label="Rollover / Renewal" hint="internal code"/>
          <LabeledInput label="Remark" placeholder="Any note"/>
        </div>
        <div className="flex gap-3 mt-4">
          <button className="px-4 py-2 rounded-xl bg-white border">Save Draft</button>
          <button className="px-4 py-2 rounded-xl bg-zinc-900 text-white">Attach to Parsed Policy</button>
        </div>
      </Card>
      <Card title="Recent Uploads" desc="Status = Parsing → Needs Review → Saved">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-2">Time</th><th>Insurer</th><th>Vehicle No</th><th>Policy No</th><th>Status</th><th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {[{t:"16:02", ins:"Tata AIG", v:"KA01AB1234", p:"TA-9921", s:"Needs Review", c: "92%"}, {t:"15:54", ins:"Digit", v:"KA05CJ7777", p:"DG-4410", s:"Saved", c:"98%"}].map((r,i)=> (
                <tr key={i} className="border-t">
                  <td className="py-2">{r.t}</td><td>{r.ins}</td><td>{r.v}</td><td>{r.p}</td>
                  <td><span className={`px-2 py-1 rounded-full text-xs ${r.s==="Saved"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{r.s}</span></td>
                  <td>{r.c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

function LabeledInput({ label, placeholder, hint, required, value, onChange }: { label: string; placeholder?: string; hint?: string; required?: boolean; value?: any; onChange?: (v:any)=>void }) {
  return (
    <label className="block">
      <div className="text-xs text-zinc-600 mb-1">{label} {required && <span className="text-rose-600">*</span>} {hint && <span className="text-[10px] text-zinc-400">({hint})</span>}</div>
      <input value={value} onChange={e=>onChange && onChange(e.target.value)} className="w-full rounded-xl border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder={placeholder} />
    </label>
  )
}

function LabeledSelect({ label, value, onChange, options }: { label: string; value?: any; onChange?: (v:any)=>void; options: string[] }) {
  return (
    <label className="block text-sm">
      <div className="text-xs text-zinc-600 mb-1">{label}</div>
      <select value={value} onChange={e=>onChange && onChange(e.target.value)} className="w-full rounded-xl border border-zinc-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200">
        {options.map(o=> <option key={o} value={o}>{o}</option>)}
      </select>
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
  });
  const set = (k:string,v:any)=> setForm((f:any)=>({ ...f, [k]: v }));
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

  const quickFill = ()=> {
    // Demo: pretend we fetched last year policy by vehicle no
    setForm((f:any)=> ({ ...f,
      insurer: f.insurer || "Tata AIG",
      productType: f.productType || "Comprehensive",
      vehicleType: f.vehicleType || "Private Car",
      make: f.make || "Maruti",
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
    }))
  }

  const errors = useMemo(()=> {
    const e:string[] = [];
    if (!form.policyNumber) e.push("Policy Number is required");
    if (!form.vehicleNumber) e.push("Vehicle Number is required");
    if (!form.insurer) e.push("Company (Insurer) is required");
    if (!form.totalPremium) e.push("Total Premium is required");
    return e;
  }, [form])

  return (
    <>
      <Card title="Manual Entry — Speed Mode" desc="All required columns. QuickFill; Required-first; two-way cashback; sticky save bar">
        {/* Top row: Vehicle + QuickFill */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <LabeledInput label="Vehicle Number" required placeholder="KA01AB1234" value={form.vehicleNumber} onChange={v=>set('vehicleNumber', v)}/>
          <button onClick={quickFill} className="px-4 py-2 rounded-xl bg-indigo-600 text-white h-[42px] mt-6">Prefill from last policy</button>
          <div className="ml-auto flex items-center gap-2 text-xs text-zinc-600"><Car className="w-4 h-4"/> Make/Model autofill in v1.1</div>
        </div>

        {/* Policy & Vehicle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabeledInput label="Policy Number" required value={form.policyNumber} onChange={v=>set('policyNumber', v)}/>
          <LabeledInput label="Insurer (Company)" required placeholder="e.g., Tata AIG" value={form.insurer} onChange={v=>set('insurer', v)}/>
          <LabeledSelect label="Vehicle Type" value={form.vehicleType} onChange={v=>set('vehicleType', v)} options={["Private Car","GCV"]}/>
          <LabeledInput label="Make" placeholder="Maruti / Hyundai / …" value={form.make} onChange={v=>set('make', v)}/>
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
          <LabeledInput label="REF" hint="reference" value={form.ref} onChange={v=>set('ref', v)}/>
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

        {/* People & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <LabeledInput label="Executive" value={form.executive} onChange={v=>set('executive', v)}/>
          <LabeledInput label="Caller Name" value={form.callerName} onChange={v=>set('callerName', v)}/>
          <LabeledInput label="Mobile Number" required placeholder="9xxxxxxxxx" value={form.mobile} onChange={v=>set('mobile', v)}/>
          <LabeledInput label="Rollover/Renewal" hint="internal code" value={form.rollover} onChange={v=>set('rollover', v)}/>
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
          <button className="px-4 py-2 rounded-xl bg-zinc-900 text-white">Save</button>
          <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white">Save & New</button>
        </div>
      </Card>
    </>
  )
}

function PageManualGrid() {
  const rows = useMemo(() => [
    { src: "MANUAL_GRID", policy: "TA-9921", vehicle: "KA01AB1234", make: "Maruti", model: "Swift", insurer: "Tata AIG", total: 12150, cashback: 600, status: "OK" },
    { src: "MANUAL_GRID", policy: "DG-4410", vehicle: "KA05CJ7777", make: "Hyundai", model: "i20", insurer: "Digit", total: 11500, cashback: 500, status: "Error: Missing Issue Date" },
  ], [])
  return (
    <>
      <Card title="Grid Entry (Excel-like)" desc="Paste multiple rows; fix inline errors. Dedupe on Policy No. + Vehicle No.">
        <div className="mb-3 text-xs text-zinc-600">Tip: Copy from Excel and <b>Ctrl+V</b> directly here. Use <b>Ctrl+S</b> to save all.</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-2">Source</th><th>Policy No.</th><th>Vehicle No.</th><th>Make</th><th>Model</th><th>Insurer</th><th>Total Premium</th><th>Cashback</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=> (
                <tr key={i} className="border-t">
                  <td className="py-2 text-xs text-zinc-500">{r.src}</td>
                  <td contentEditable className="outline-none px-1">{r.policy}</td>
                  <td contentEditable className="outline-none px-1">{r.vehicle}</td>
                  <td contentEditable className="outline-none px-1">{r.make}</td>
                  <td contentEditable className="outline-none px-1">{r.model}</td>
                  <td contentEditable className="outline-none px-1">{r.insurer}</td>
                  <td contentEditable className="outline-none px-1">{r.total}</td>
                  <td contentEditable className="outline-none px-1">{r.cashback}</td>
                  <td>{r.status.includes("Error") ? <span className="text-amber-700 bg-amber-100 px-2 py-1 rounded-full text-xs">{r.status}</span> : <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full text-xs">OK</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3 mt-4">
          <button className="px-4 py-2 rounded-xl bg-zinc-900 text-white">Save All</button>
          <button className="px-4 py-2 rounded-xl bg-white border">Validate</button>
        </div>
      </Card>
    </>
  )
}

function PageReview() {
  const issues = [
    { field: "Expiry Date", msg: "Low confidence. Please confirm.", conf: 0.61 },
    { field: "Vehicle Number", msg: "Format check failed. Expected KAxxYYzzzz.", conf: 0.74 },
  ]
  return (
    <>
      <Card title="Review & Confirm" desc="(Confidence = how sure the bot is). Low values are highlighted.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabeledInput label="Policy Number" hint="auto-read from PDF"/>
          <LabeledInput label="Vehicle Number" hint="check format"/>
          <LabeledInput label="Issue Date"/>
          <LabeledInput label="Expiry Date"/>
          <LabeledInput label="IDV (₹)"/>
          <LabeledInput label="Total Premium (₹)"/>
        </div>
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Issues</div>
          <ul className="space-y-2">
            {issues.map((i, idx)=> (
              <li key={idx} className="flex items-center gap-2 text-sm"><AlertTriangle className="w-4 h-4 text-amber-600"/> <span className="font-medium">{i.field}:</span> {i.msg} <span className="text-xs text-zinc-500">(conf {Math.round(i.conf*100)}%)</span></li>
            ))}
          </ul>
        </div>
        <div className="flex gap-3 mt-4">
          <button className="px-4 py-2 rounded-xl bg-zinc-900 text-white">Confirm & Save</button>
          <button className="px-4 py-2 rounded-xl bg-white border">Reject to Manual</button>
        </div>
      </Card>
    </>
  )
}

function PagePolicyDetail() {
  return (
    <Card title="Policy Detail — KA01AB1234" desc="(Audit trail = log of changes; RBAC = who can see/do what)">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2 bg-zinc-50 rounded-xl p-4">
          <div className="text-sm font-medium mb-2">Core Fields</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Policy No.: <b>TA-9921</b></div>
            <div>Insurer: <b>Tata AIG</b></div>
            <div>Issue: <b>2025-08-10</b></div>
            <div>Expiry: <b>2026-08-09</b></div>
            <div>Total Premium: <b>₹12,150</b></div>
            <div>NCB: <b>20%</b></div>
          </div>
        </div>
        <div className="bg-zinc-50 rounded-xl p-4">
          <div className="text-sm font-medium mb-2">Activity Timeline</div>
          <ol className="text-sm space-y-2">
            <li>2025-08-12 15:54 — Parsed PDF (98%)</li>
            <li>2025-08-12 15:56 — Confirmed by Ops (user: Priya)</li>
            <li>2025-08-12 15:57 — Audit log saved</li>
          </ol>
        </div>
      </div>
    </Card>
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
  { name: "Asha", leads: 120, converted: 22, gwp: 260000, brokerage: 39000, cashback: 10000, net: 29000, cac: 1800/ (22||1) },
  { name: "Vikram", leads: 110, converted: 18, gwp: 210000, brokerage: 31500, cashback: 9000, net: 22500, cac: 1800/ (18||1) },
  { name: "Meera", leads: 90, converted: 20, gwp: 240000, brokerage: 36000, cashback: 8000, net: 28000, cac: 1800/ (20||1) },
]
const demoPolicies = [
  { rep: 'Asha', make: 'Maruti', model: 'Swift', policies: 12, gwp: 130000, cashbackPctAvg: 2.4, cashback: 3100, net: 16900 },
  { rep: 'Asha', make: 'Hyundai', model: 'i20', policies: 10, gwp: 130000, cashbackPctAvg: 1.9, cashback: 2500, net: 17500 },
  { rep: 'Vikram', make: 'Hyundai', model: 'i20', policies: 9, gwp: 115000, cashbackPctAvg: 1.1, cashback: 1200, net: 17100 },
  { rep: 'Meera', make: 'Maruti', model: 'Baleno', policies: 11, gwp: 125000, cashbackPctAvg: 0.9, cashback: 1100, net: 17800 },
]

// ---- KPI helpers ----
const fmtINR = (n:number)=> `₹${Math.round(n).toLocaleString('en-IN')}`;
const pct = (n:number)=> `${(n).toFixed(1)}%`;

function PageOverview() {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="GWP" info="(Gross Written Premium)" value="₹10.7L" sub="▲ 8% vs last 14d"/>
        <Tile label="Brokerage" info="(% of GWP)" value="₹1.60L"/>
        <Tile label="Cashback" info="(Cash we give back)" value="₹0.34L"/>
        <Tile label="Net" info="(Brokerage − Cashback)" value="₹1.26L"/>
      </div>
      <Card title="14-day Trend" desc="GWP & Net (pre-calculated = materialized view)">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={demoTrend}>
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
  return (
    <Card title="Rep Leaderboard" desc="Lead→Sale % = Converted / Leads Assigned; CAC/policy = daily rep cost / converted">
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
              <th className="py-2">Telecaller</th><th>Leads Assigned</th><th>Converted</th><th>GWP</th><th>Brokerage</th><th>Cashback</th><th>Net</th><th>Lead→Sale %</th><th>CAC/Policy</th>
            </tr>
          </thead>
          <tbody>
            {demoReps.map((r,i)=> (
              <tr key={i} className="border-t">
                <td className="py-2 font-medium">{r.name}</td>
                <td>{r.leads}</td>
                <td>{r.converted}</td>
                <td>₹{(r.gwp/1000).toFixed(1)}k</td>
                <td>₹{(r.brokerage/1000).toFixed(1)}k</td>
                <td>₹{(r.cashback/1000).toFixed(1)}k</td>
                <td>₹{(r.net/1000).toFixed(1)}k</td>
                <td>{((r.converted/(r.leads||1))*100).toFixed(1)}%</td>
                <td>₹{(r.cac).toFixed(0)}</td>
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
  const [cashbackMax, setCashbackMax] = useState(5);
  const makes = ["All","Maruti","Hyundai","Tata","Toyota"];
  const models = ["All","Swift","Baleno","i20","Altroz"];
  const insurers = ["All","Tata AIG","Digit","ICICI"];

  const filtered = demoPolicies.filter(p => (make==='All'||p.make===make) && (model==='All'||p.model===model) && (insurer==='All'/* demo */) && (p.cashbackPctAvg <= cashbackMax));
  return (
    <>
      <Card title="Sales Explorer (Motor)" desc="Filter by Make/Model; find reps with most sales and lowest cashback">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
          <label className="text-sm">Make<select value={make} onChange={e=>setMake(e.target.value)} className="w-full border rounded-xl px-2 py-2 mt-1">{makes.map(m=><option key={m}>{m}</option>)}</select></label>
          <label className="text-sm">Model<select value={model} onChange={e=>setModel(e.target.value)} className="w-full border rounded-xl px-2 py-2 mt-1">{models.map(m=><option key={m}>{m}</option>)}</select></label>
          <label className="text-sm">Insurer<select value={insurer} onChange={e=>setInsurer(e.target.value)} className="w-full border rounded-xl px-2 py-2 mt-1">{insurers.map(m=><option key={m}>{m}</option>)}</select></label>
          <label className="text-sm col-span-2">Max Cashback %
            <input type="range" min={0} max={10} value={cashbackMax} onChange={e=>setCashbackMax(parseInt(e.target.value))} className="w-full"/>
            <div className="text-xs text-zinc-600 mt-1">{cashbackMax}%</div>
          </label>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-2">Rep</th><th>Make</th><th>Model</th><th># Policies</th><th>GWP</th><th>Avg Cashback %</th><th>Cashback (₹)</th><th>Net (₹)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r,i)=> (
                <tr key={i} className="border-t">
                  <td className="py-2 font-medium">{r.rep}</td>
                  <td>{r.make}</td>
                  <td>{r.model}</td>
                  <td>{r.policies}</td>
                  <td>₹{(r.gwp/1000).toFixed(1)}k</td>
                  <td>{r.cashbackPctAvg}%</td>
                  <td>₹{r.cashback}</td>
                  <td>₹{r.net}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-zinc-600 mt-2">Tip: Sort by <b>Net per ₹ Cashback</b> to find “most sales with least cashback”.</div>
      </Card>
    </>
  )
}

function PageSources() {
  return (
    <Card title="Contribution by Data Source" desc="Compare PDF vs Manual vs CSV (ingestion source = where data came from)">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={demoSources}>
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
    </Card>
  )
}

function PageFounderSettings() {
  return (
    <Card title="Business Settings" desc="These drive calculations in dashboards.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LabeledInput label="Brokerage %" hint="% of GWP that we earn"/>
        <LabeledInput label="Rep Daily Cost (₹)" hint="salary + incentives + telephony + tools / working days"/>
        <LabeledInput label="Expected Conversion %" hint="for valuing backlog"/>
        <LabeledInput label="Premium Growth %" hint="for LTV estimates later"/>
      </div>
      <div className="flex gap-3 mt-4">
        <button className="px-4 py-2 rounded-xl bg-zinc-900 text-white">Save Settings</button>
        <button className="px-4 py-2 rounded-xl bg-white border">Reset</button>
      </div>
    </Card>
  )
}

// ---------- KPI DASHBOARD ----------
function PageKPIs() {
  // Aggregate demo numbers
  const totalLeads = demoReps.reduce((a,b)=>a+b.leads,0);
  const totalConverted = demoReps.reduce((a,b)=>a+b.converted,0);
  const sumGWP = demoReps.reduce((a,b)=>a+b.gwp,0);
  const sumNet = demoReps.reduce((a,b)=>a+b.net,0);

  // Assumptions for demo period (14 days)
  const days = 14;
  const reps = demoReps.length;
  const repDailyCost = 1800; // ₹ per rep per day
  const repCost = repDailyCost * reps * days; // total sales payroll this period
  const marketingSpend = 80000; // ₹ for this period
  const underwritingExpenses = 55000; // other ops/overheads for this period
  const claimsIncurred = 0.58 * sumGWP; // demo loss ratio ~58%

  // Calculations
  const conversionRate = (totalConverted/(totalLeads||1))*100;
  const costPerLead = marketingSpend/(totalLeads||1);
  const CAC = (marketingSpend + repCost)/(totalConverted||1);
  const ARPA = sumNet/(totalConverted||1); // using Net as revenue per account
  const retentionRate = 78; // % demo
  const churnRate = 100 - retentionRate;
  const lifetimeMonths = 24; // demo assumption
  const CLV = ARPA * lifetimeMonths; // rough
  const LTVtoCAC = CLV/(CAC||1);
  const lossRatio = (claimsIncurred/(sumGWP||1))*100;
  const expenseRatio = ((underwritingExpenses + marketingSpend + repCost)/(sumGWP||1))*100;
  const combinedRatio = lossRatio + expenseRatio;
  const upsellRate = 8.0; // % demo
  const NPS = 62; // demo
  const marketingAttributedRevenue = sumNet * 0.7; // attribute 70% of net to mktg for demo
  const marketingROI = ((marketingAttributedRevenue - marketingSpend)/(marketingSpend||1))*100;
  const revenueGrowthRate = ((demoTrend[demoTrend.length-1].gwp - demoTrend[0].gwp)/(demoTrend[0].gwp||1))*100;

  return (
    <>
      <div className="grid grid-cols-1 gap-6">
        {/* Acquisition */}
        <Card title="Acquisition" desc="Conversion, lead cost, CAC, growth">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Tile label="Conversion Rate" info="(% leads → sales)" value={pct(conversionRate)} sub={`${totalConverted}/${totalLeads} deals`}/>
            <Tile label="Cost per Lead" info="(₹ spend ÷ leads)" value={fmtINR(costPerLead)} sub={`Mktg ₹${marketingSpend.toLocaleString('en-IN')}`}/>
            <Tile label="CAC" info="(Cost to acquire 1 sale)" value={fmtINR(CAC)} sub={`Rep ₹${repCost.toLocaleString('en-IN')} + Mktg`}/>
            <Tile label="Revenue Growth" info="(% vs start of period)" value={pct(revenueGrowthRate)} />
          </div>
        </Card>

        {/* Value & Retention */}
        <Card title="Value & Retention" desc="ARPA, retention/churn, LTV, LTV/CAC">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Tile label="ARPA" info="(avg revenue per account)" value={fmtINR(ARPA)} />
            <Tile label="Retention" info="(% customers kept)" value={pct(retentionRate)} />
            <Tile label="Churn" info="(100 − retention)" value={pct(churnRate)} />
            <Tile label="CLV (approx)" info="(ARPA × lifetime months)" value={fmtINR(CLV)} sub={`${lifetimeMonths} mo`} />
            <Tile label="LTV/CAC" info= "(value per customer ÷ cost)" value={`${LTVtoCAC.toFixed(2)}×`} />
          </div>
        </Card>

        {/* Insurance Health */}
        <Card title="Insurance Health" desc="Loss, Expense, Combined ratio">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Tile label="Loss Ratio" info="(claims ÷ premium)" value={pct(lossRatio)} sub={`Claims ${fmtINR(claimsIncurred)}`}/>
            <Tile label="Expense Ratio" info="(expenses ÷ premium)" value={pct(expenseRatio)} sub={`Ops+Mktg+Rep`}/>
            <Tile label="Combined Ratio" info="(loss + expense)" value={pct(combinedRatio)} />
          </div>
        </Card>

        {/* Sales Quality */}
        <Card title="Sales Quality" desc="Upsell/Cross-sell, NPS, Marketing ROI">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Tile label="Upsell/Cross-sell" info="(% with extra cover)" value={pct(upsellRate)} />
            <Tile label="NPS" info="(promoters − detractors)" value={`${NPS}`} sub="survey"/>
            <Tile label="Marketing ROI" info="((Rev−Spend) ÷ Spend)" value={pct(marketingROI)} />
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

export default function NicsanCRMMock() {
  const [user, setUser] = useState<{name:string; email?:string; role:"ops"|"founder"}|null>(null);
  const [tab, setTab] = useState<"ops"|"founder">("ops");
  const [opsPage, setOpsPage] = useState("upload");
  const [founderPage, setFounderPage] = useState("overview");

  if (!user) return <LoginPage onLogin={(u)=>{ setUser(u); setTab(u.role==='founder'?'founder':'ops')}}/>

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopTabs tab={tab} setTab={setTab} user={user} onLogout={()=>setUser(null)} />
      {tab === "ops" ? (
        <Shell sidebar={<OpsSidebar page={opsPage} setPage={setOpsPage} />}>
          {opsPage === "upload" && <PageUpload/>}
          {opsPage === "review" && <PageReview/>}
          {opsPage === "manual-form" && <PageManualForm/>}
          {opsPage === "manual-grid" && <PageManualGrid/>}
          {opsPage === "policy-detail" && <PagePolicyDetail/>}
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
