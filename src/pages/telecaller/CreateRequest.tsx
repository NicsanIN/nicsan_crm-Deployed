import React, { useState, useRef, useEffect } from 'react';
import { FileUp, Send, ChevronDown } from 'lucide-react';
import { taskApi } from '../../services/taskApi';

const ACTION_TYPES = ['QUOTE', 'ISSUE_POLICY'] as const;
const POLICY_TYPES = ['RENEWAL', 'ROLLOVER'] as const;
const PRODUCT_TYPES = ['PRIVATE_CAR', 'TWO_WHEELER', 'COMMERCIAL', 'OTHER'];

const INSURER_OPTIONS = [
  { value: 'Tata AIG', label: 'Tata AIG' },
  { value: 'Reliance General', label: 'Reliance General' },
  { value: 'ICICI Lombard', label: 'ICICI Lombard' },
  { value: 'Zurich Kotak General Insurance', label: 'Zurich Kotak General Insurance' },
  { value: 'Digit', label: 'Digit' },
  { value: 'Liberty General Insurance', label: 'Liberty General Insurance' },
  { value: 'Royal Sundaram General Insurance', label: 'Royal Sundaram General Insurance' },
  { value: 'HDFC ERGO General Insurance', label: 'HDFC ERGO General Insurance' },
];

export default function CreateRequest() {
  const [customer_name, setCustomer_name] = useState('');
  const [vehicle_no, setVehicle_no] = useState('');
  const [company, setCompany] = useState('');
  const [action_type, setAction_type] = useState<'QUOTE' | 'ISSUE_POLICY'>('QUOTE');
  const [policy_type, setPolicy_type] = useState<'RENEWAL' | 'ROLLOVER'>('RENEWAL');
  const [product_type, setProduct_type] = useState(PRODUCT_TYPES[0]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cashback, setCashback] = useState('');
  const [previous_policy, setPrevious_policy] = useState<File | null>(null);
  const [rc, setRc] = useState<File | null>(null);
  const [kyc, setKyc] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [insurerOpen, setInsurerOpen] = useState(false);
  const [actionTypeOpen, setActionTypeOpen] = useState(false);
  const [policyTypeOpen, setPolicyTypeOpen] = useState(false);
  const [productTypeOpen, setProductTypeOpen] = useState(false);
  const insurerRef = useRef<HTMLDivElement>(null);
  const actionTypeRef = useRef<HTMLDivElement>(null);
  const policyTypeRef = useRef<HTMLDivElement>(null);
  const productTypeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (insurerRef.current && !insurerRef.current.contains(target)) setInsurerOpen(false);
      if (actionTypeRef.current && !actionTypeRef.current.contains(target)) setActionTypeOpen(false);
      if (policyTypeRef.current && !policyTypeRef.current.contains(target)) setPolicyTypeOpen(false);
      if (productTypeRef.current && !productTypeRef.current.contains(target)) setProductTypeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    if (!company.trim()) {
      setError('Insurance company is required.');
      return;
    }
    if (!previous_policy && !rc) {
      setError('Upload at least one: Previous Policy PDF or RC PDF.');
      return;
    }
    if (action_type === 'ISSUE_POLICY') {
      if (!phone?.trim() || !email?.trim()) {
        setError('Phone and email are required for Issue Policy.');
        return;
      }
      if (cashback === '' || isNaN(parseFloat(cashback))) {
        setError('Cashback amount is required for Issue Policy.');
        return;
      }
      if (!kyc) {
        setError('KYC document is required for Issue Policy.');
        return;
      }
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('customer_name', customer_name.trim());
      form.append('vehicle_no', vehicle_no.trim());
      form.append('company', company.trim());
      form.append('action_type', action_type);
      form.append('policy_type', policy_type);
      form.append('product_type', product_type);
      if (phone) form.append('phone', phone.trim());
      if (email) form.append('email', email.trim());
      if (cashback !== '') form.append('cashback', cashback);
      if (previous_policy) form.append('previous_policy', previous_policy);
      if (rc) form.append('rc', rc);
      if (kyc) form.append('kyc', kyc);
      const result = await taskApi.createTask(form);
      if (result.success && result.data) {
        setSuccess(
          result.data.assigned_to_name
            ? `Request created. Assigned to ${result.data.assigned_to_name}.`
            : 'Request created. An executive will be assigned when available.'
        );
        setCustomer_name('');
        setVehicle_no('');
        setCompany('');
        setPhone('');
        setEmail('');
        setCashback('');
        setPrevious_policy(null);
        setRc(null);
        setKyc(null);
      } else {
        setError(result.error || 'Failed to create request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl w-full min-w-0 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileUp className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Create New Request</h1>
          <p className="text-sm text-zinc-600">Submit a quote or issue policy request with documents.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 space-y-4 min-w-0 w-full">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Customer Name *</label>
          <input
            value={customer_name}
            onChange={(e) => setCustomer_name(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Vehicle Number *</label>
          <input
            value={vehicle_no}
            onChange={(e) => setVehicle_no(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            placeholder="e.g. KA01AB1234"
            required
          />
        </div>
        <div className="min-w-0 w-full relative" ref={insurerRef}>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Insurance Company *</label>
          <button
            type="button"
            onClick={() => setInsurerOpen(!insurerOpen)}
            className="w-full flex items-center justify-between gap-2 rounded-xl border border-zinc-300 px-3 py-2 text-sm text-left bg-white min-w-0"
          >
            <span className="truncate">{company || '— Select insurer —'}</span>
            <ChevronDown className={`w-4 h-4 flex-shrink-0 text-zinc-500 transition-transform ${insurerOpen ? 'rotate-180' : ''}`} />
          </button>
          {insurerOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-48 overflow-y-auto min-w-0">
              {INSURER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setCompany(opt.value);
                    setInsurerOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-zinc-50 first:rounded-t-xl last:rounded-b-xl break-words ${company === opt.value ? 'bg-blue-50 text-blue-800' : 'text-zinc-800'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="min-w-0 w-full relative" ref={actionTypeRef}>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Action Type *</label>
          <button
            type="button"
            onClick={() => setActionTypeOpen(!actionTypeOpen)}
            className="w-full flex items-center justify-between gap-2 rounded-xl border border-zinc-300 px-3 py-2 text-sm text-left bg-white min-w-0"
          >
            <span className="truncate">{action_type}</span>
            <ChevronDown className={`w-4 h-4 flex-shrink-0 text-zinc-500 transition-transform ${actionTypeOpen ? 'rotate-180' : ''}`} />
          </button>
          {actionTypeOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-48 overflow-y-auto min-w-0">
              {ACTION_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setAction_type(t);
                    setActionTypeOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-zinc-50 first:rounded-t-xl last:rounded-b-xl break-words ${action_type === t ? 'bg-blue-50 text-blue-800' : 'text-zinc-800'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="min-w-0 w-full relative" ref={policyTypeRef}>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Policy Type *</label>
          <button
            type="button"
            onClick={() => setPolicyTypeOpen(!policyTypeOpen)}
            className="w-full flex items-center justify-between gap-2 rounded-xl border border-zinc-300 px-3 py-2 text-sm text-left bg-white min-w-0"
          >
            <span className="truncate">{policy_type}</span>
            <ChevronDown className={`w-4 h-4 flex-shrink-0 text-zinc-500 transition-transform ${policyTypeOpen ? 'rotate-180' : ''}`} />
          </button>
          {policyTypeOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-48 overflow-y-auto min-w-0">
              {POLICY_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setPolicy_type(t);
                    setPolicyTypeOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-zinc-50 first:rounded-t-xl last:rounded-b-xl break-words ${policy_type === t ? 'bg-blue-50 text-blue-800' : 'text-zinc-800'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="min-w-0 w-full relative" ref={productTypeRef}>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Product Type *</label>
          <button
            type="button"
            onClick={() => setProductTypeOpen(!productTypeOpen)}
            className="w-full flex items-center justify-between gap-2 rounded-xl border border-zinc-300 px-3 py-2 text-sm text-left bg-white min-w-0"
          >
            <span className="truncate">{product_type}</span>
            <ChevronDown className={`w-4 h-4 flex-shrink-0 text-zinc-500 transition-transform ${productTypeOpen ? 'rotate-180' : ''}`} />
          </button>
          {productTypeOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-48 overflow-y-auto min-w-0">
              {PRODUCT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setProduct_type(t);
                    setProductTypeOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-zinc-50 first:rounded-t-xl last:rounded-b-xl break-words ${product_type === t ? 'bg-blue-50 text-blue-800' : 'text-zinc-800'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {action_type === 'ISSUE_POLICY' && (
          <>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Customer Phone *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                required={action_type === 'ISSUE_POLICY'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Customer Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                required={action_type === 'ISSUE_POLICY'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Cashback Amount *</label>
              <input
                type="number"
                step="0.01"
                value={cashback}
                onChange={(e) => setCashback(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Previous Policy PDF (or RC) *</label>
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setPrevious_policy(e.target.files?.[0] || null)}
            className="w-full text-sm text-zinc-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">RC PDF (or Previous Policy) *</label>
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setRc(e.target.files?.[0] || null)}
            className="w-full text-sm text-zinc-600"
          />
        </div>
        {action_type === 'ISSUE_POLICY' && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">KYC Document *</label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setKyc(e.target.files?.[0] || null)}
              className="w-full text-sm text-zinc-600"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 text-white text-sm font-medium disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
