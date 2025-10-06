import { useState, useEffect, useMemo } from 'react';
import { Card } from '../../../components/common/Card';
import { Search, RefreshCw, FileText, Calendar, DollarSign, User, Car, Building, Phone, Mail, MapPin, Clock, CheckCircle2, AlertTriangle, Eye, Download } from 'lucide-react';
import DualStorageService from '../../../services/dualStorageService';

// Environment variables
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

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
        let timeoutId: NodeJS.Timeout;
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
                  <span>Payment Method:</span>
                  <span className="font-medium">
                    {policy.payment_method || "INSURER"}
                    {policy.payment_method === 'NICSAN' && policy.payment_sub_method && (
                      <span className="text-blue-600 ml-2 font-semibold">({policy.payment_sub_method})</span>
                    )}
                  </span>
                </div>
                {policy.payment_method === 'NICSAN' && policy.payment_sub_method && (
                  <div className="flex justify-between">
                    <span>Payment Sub-Method:</span>
                    <span className="font-medium text-blue-600">{policy.payment_sub_method}</span>
                  </div>
                )}
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

export default PagePolicyDetail;
