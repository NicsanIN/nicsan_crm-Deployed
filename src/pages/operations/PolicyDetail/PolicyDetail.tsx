import { useState, useEffect, useMemo } from 'react';
import { Card } from '../../../components/common/Card';
import { User } from 'lucide-react';
import DualStorageService from '../../../services/dualStorageService';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserChange } from '../../../hooks/useUserChange';


function PagePolicyDetail() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { userChanged } = useUserChange();
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
    const [searchType, setSearchType] = useState<'vehicle' | 'policy' | 'health' | 'both'>('both');
    const [showResults, setShowResults] = useState(false);
    
    // Document functionality state
    const [documents, setDocuments] = useState<any>(null);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  
    const loadAvailablePolicies = async () => {
      try {
        setIsLoadingPolicies(true);
        // Load both motor and health insurance policies
        const [motorResponse, healthResponse] = await Promise.all([
          DualStorageService.getAllPolicies(),
          DualStorageService.getAllHealthInsurance()
        ]);
        
        const allPolicies = [
          ...(motorResponse.success ? (motorResponse.data || []).map((p: any) => ({ ...p, type: 'MOTOR' })) : []),
          ...(healthResponse.success ? (healthResponse.data || []).map((p: any) => ({ ...p, type: 'HEALTH' })) : [])
        ];
        
        setAvailablePolicies(allPolicies);
        
      } catch (error) {
        console.error('Failed to load available policies:', error);
        // Set mock policies as fallback
        setAvailablePolicies([
          { id: '1', policy_number: 'TA-9921', vehicle_number: 'KA 51 MM 1214', insurer: 'Tata AIG', type: 'MOTOR' },
          { id: '2', policy_number: 'TA-9922', vehicle_number: 'KA01AB5678', insurer: 'Tata AIG', type: 'MOTOR' },
          { id: '3', policy_number: 'TA-9923', vehicle_number: 'KA01AB9012', insurer: 'Tata AIG', type: 'MOTOR' },
          { id: 'health-1', policy_number: 'HI-2024-001', insurer: 'HDFC ERGO', customer_name: 'Rajesh Kumar', type: 'HEALTH' },
          { id: 'health-2', policy_number: 'STAR-2024-002', insurer: 'Star Health', customer_name: 'Priya Sharma', type: 'HEALTH' }
        ]);
      } finally {
        setIsLoadingPolicies(false);
      }
    };
  
    const loadPolicyDetail = async (id: string | number) => {
      try {
        setIsLoading(true);
        
        // Convert id to string and determine if this is a health insurance policy
        const idString = String(id);
        
        // Enhanced health policy detection - check if it's a health policy by looking at available policies
        const isHealthPolicy = idString.startsWith('health-') || 
                              idString.includes('health') || 
                              idString.startsWith('HI-') || 
                              idString.startsWith('STAR-') || 
                              idString.startsWith('BAJAJ-') ||
                              // Check if this ID corresponds to a health policy in availablePolicies
                              (availablePolicies.length > 0 && availablePolicies.some(policy => 
                                policy.type === 'HEALTH' && 
                                (policy.id === idString || policy.policy_number === idString)
                              )) ||
                              // Fallback: if availablePolicies is not loaded yet, try to detect by common patterns
                              (availablePolicies.length === 0 && (
                                idString.startsWith('health-') || 
                                idString.includes('health') || 
                                idString.startsWith('HI-') || 
                                idString.startsWith('STAR-') || 
                                idString.startsWith('BAJAJ-')
                              ));
        
        
        let response;
        if (isHealthPolicy) {
          // Load health insurance policy using policy number
          response = await DualStorageService.getHealthInsuranceDetail(idString);
        } else {
          // Load motor insurance policy using id
          response = await DualStorageService.getPolicyDetail(idString);
        }
        
        if (response.success) {
          setPolicyData(response.data);
          setDataSource(response.source);
          
          // Load documents for this policy
          const policyNumber = response.data.policy_number;
          if (policyNumber) {
            loadDocuments(policyNumber);
          }
        }
      } catch (error) {
        console.error('Failed to load policy detail:', error);
        setDataSource('MOCK_DATA');
      } finally {
        setIsLoading(false);
      }
    };

    // Load documents for the current policy
    const loadDocuments = async (policyNumber: string) => {
      try {
        setIsLoadingDocuments(true);
        const response = await DualStorageService.getPolicyDocuments(policyNumber);
        
        if (response.success) {
          setDocuments(response.data);
        } else {
          setDocuments(null);
        }
      } catch (error) {
        console.error('Failed to load documents:', error);
        setDocuments(null);
      } finally {
        setIsLoadingDocuments(false);
      }
    };

    // Download document function
    const downloadDocument = async (s3Key: string, filename: string) => {
      try {
        const response = await fetch(`http://localhost:3001/api/upload/s3-url/${encodeURIComponent(s3Key)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.url) {
            window.open(data.url, '_blank');
          } else {
            alert('Failed to get document URL');
          }
        } else {
          alert('Failed to download document');
        }
      } catch (error) {
        console.error('Download error:', error);
        alert('Failed to download document');
      }
    };
  
    // Handle user changes - reset policy data when user changes
    useEffect(() => {
      if (userChanged && user) {
        setPolicyData(null);
        setAvailablePolicies([]);
        setPolicyId('1');
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
        loadAvailablePolicies();
        loadPolicyDetail('1');
      }
    }, [userChanged, user]);

    useEffect(() => {
      loadAvailablePolicies();
      loadPolicyDetail(policyId);
    }, []);
  
    useEffect(() => {
      if (policyId && policyId !== '') {
        // Wait for availablePolicies to be loaded before loading policy detail
        if (availablePolicies.length > 0) {
          loadPolicyDetail(policyId);
        }
      }
    }, [policyId, availablePolicies]);
  
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
          // Search by vehicle number (motor insurance only)
          const vehicleResults = availablePolicies.filter(policy => 
            policy.type === 'MOTOR' && 
            policy.vehicle_number && 
            policy.vehicle_number.toLowerCase().includes(query.toLowerCase())
          );
          searchResults = [...searchResults, ...vehicleResults];
        }
        
        if (searchType === 'policy' || searchType === 'both') {
          // Search by policy number (both motor and health)
          const policyResults = availablePolicies.filter(policy => 
            policy.policy_number && 
            policy.policy_number.toLowerCase().includes(query.toLowerCase())
          );
          searchResults = [...searchResults, ...policyResults];
        }
        
        // Search by customer name (health insurance)
        if (searchType === 'health' || searchType === 'both') {
          const customerResults = availablePolicies.filter(policy => 
            policy.type === 'HEALTH' && 
            policy.customer_name && 
            policy.customer_name.toLowerCase().includes(query.toLowerCase())
          );
          searchResults = [...searchResults, ...customerResults];
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
      // For health insurance, use policy_number; for motor insurance, use id
      const selectedId = policy.type === 'HEALTH' ? policy.policy_number : policy.id;
      setPolicyId(String(selectedId));
      const displayText = policy.type === 'HEALTH' 
        ? `${policy.policy_number} - ${policy.customer_name || 'Health Insurance'}`
        : `${policy.policy_number} - ${policy.vehicle_number || 'Motor Insurance'}`;
      setSearchQuery(displayText);
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
  
    // Determine if this is a health insurance policy
    const isHealthInsurance = policyData?.source === 'HEALTH_INSURANCE' || 
                             policyData?.product_type === 'Health Insurance' ||
                             policyData?.insuredPersons?.length > 0 ||
                             policyData?.sum_insured !== undefined ||
                             policyData?.premium_amount !== undefined;

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
                          onChange={(e) => setSearchType(e.target.value as 'vehicle' | 'policy' | 'health' | 'both')}
                          className="mr-2"
                        />
                        <span className="text-sm">Both</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="vehicle"
                          checked={searchType === 'vehicle'}
                          onChange={(e) => setSearchType(e.target.value as 'vehicle' | 'policy' | 'health' | 'both')}
                          className="mr-2"
                        />
                        <span className="text-sm">Vehicle</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="policy"
                          checked={searchType === 'policy'}
                          onChange={(e) => setSearchType(e.target.value as 'vehicle' | 'policy' | 'health' | 'both')}
                          className="mr-2"
                        />
                        <span className="text-sm">Policy</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="health"
                          checked={searchType === 'health'}
                          onChange={(e) => setSearchType(e.target.value as 'vehicle' | 'policy' | 'health' | 'both')}
                          className="mr-2"
                        />
                        <span className="text-sm">Health</span>
                      </label>
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowResults(true)}
                        placeholder={`Search by ${searchType === 'both' ? 'vehicle number, policy number, or customer name' : searchType === 'vehicle' ? 'vehicle number' : searchType === 'health' ? 'customer name' : 'policy number'}...`}
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
                                  {policy.type === 'HEALTH' 
                                    ? `${policy.customer_name || 'Health Insurance'} - ${policy.insurer}`
                                    : `${policy.vehicle_number || 'Motor Insurance'} - ${policy.insurer}`
                                  }
                                </p>
                                <p className="text-xs text-zinc-400">
                                  {policy.type === 'HEALTH' ? 'Health Insurance' : 'Motor Insurance'}
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
        <Card title={`Policy: ${policy.policy_number || 'TA-9921'} — ${isHealthInsurance ? (policy.customer_name || 'Health Insurance') : (policy.vehicle_number || 'KA 51 MM 1214')}`} desc="Comprehensive policy details">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
          <div className="bg-zinc-50 rounded-xl p-4">
              <div className="text-sm font-medium mb-3 text-zinc-700">Basic Information</div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Policy Number:</span>
                  <span className="font-medium">{policy.policy_number || 'TA-9921'}</span>
                </div>
                {!isHealthInsurance && (
                  <div className="flex justify-between">
                    <span>Vehicle Number:</span>
                    <span className="font-medium">{policy.vehicle_number || 'KA 51 MM 1214'}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Insurer:</span>
                  <span className="font-medium">{policy.insurer || 'Tata AIG'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Product Type:</span>
                  <span className="font-medium">{isHealthInsurance ? 'Health Insurance' : (policy.product_type || 'Private Car')}</span>
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
  
            {/* Vehicle Information (Motor) or Health Insurance Information */}
            {isHealthInsurance ? (
              <div className="bg-zinc-50 rounded-xl p-4">
                <div className="text-sm font-medium mb-3 text-zinc-700">Health Insurance Information</div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Sum Insured:</span>
                    <span className="font-medium">₹{(policy.sum_insured || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Premium Amount:</span>
                    <span className="font-medium">₹{(policy.premium_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer Email:</span>
                    <span className="font-medium">{policy.customer_email || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
  
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

            {/* Insured Persons Section (Health Insurance only) */}
            {isHealthInsurance && policy.insuredPersons && policy.insuredPersons.length > 0 && (
              <div className="bg-zinc-50 rounded-xl p-4">
                <div className="text-sm font-medium mb-3 text-zinc-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Insured Persons
                </div>
                <div className="space-y-4">
                  {policy.insuredPersons.map((person: any, index: number) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-zinc-200">
                      <div className="text-sm font-medium text-zinc-800 mb-3">Person {index + 1}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span>Name:</span>
                          <span className="font-medium">{person.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>PAN Card:</span>
                          <span className="font-medium">{person.panCard || person.pan_card || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Aadhaar Card:</span>
                          <span className="font-medium">{person.aadhaarCard || person.aadhaar_card || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date of Birth:</span>
                          <span className="font-medium">{person.dateOfBirth || person.date_of_birth || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weight:</span>
                          <span className="font-medium">{person.weight ? `${person.weight} kg` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Height:</span>
                          <span className="font-medium">{person.height ? `${person.height} cm` : 'N/A'}</span>
                        </div>
                        {(person.preExistingDisease || person.pre_existing_disease) && (
                          <div className="flex justify-between">
                            <span>Pre-existing Disease:</span>
                            <span className="font-medium text-red-600">
                              {person.diseaseName || person.disease_name || 'N/A'} 
                              ({(person.diseaseYears || person.disease_years || 0)} years)
                            </span>
                          </div>
                        )}
                        {person.surgery && (
                          <div className="flex justify-between">
                            <span>Surgery:</span>
                            <span className="font-medium text-orange-600">
                              {person.surgeryName || person.surgery_name || 'N/A'}
                            </span>
                          </div>
                        )}
                        {(person.tabletDetails || person.tablet_details) && (
                          <div className="flex justify-between">
                            <span>Tablet Details:</span>
                            <span className="font-medium text-blue-600">
                              {person.tabletDetails || person.tablet_details || 'N/A'}
                            </span>
                          </div>
                        )}
                        {(person.surgeryDetails || person.surgery_details) && (
                          <div className="flex justify-between">
                            <span>Surgery Details:</span>
                            <span className="font-medium text-purple-600">
                              {person.surgeryDetails || person.surgery_details || 'N/A'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
  
            {/* Financial Information - Motor Insurance only */}
            {!isHealthInsurance && (
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
            )}
  
            {/* Discounts & Benefits (Motor Insurance only) */}
            {!isHealthInsurance && (
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
            )}
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

          {/* Policy Documents Section */}
          <div className="mt-6 bg-zinc-50 rounded-xl p-4">
            <div className="text-sm font-medium mb-3 text-zinc-700">📄 Policy Documents</div>
            {isLoadingDocuments ? (
              <div className="text-sm text-zinc-500">Loading documents...</div>
            ) : documents ? (
              <div className="space-y-4">
                {/* Policy PDF */}
                {documents.policyPDF && (
                  <div className="bg-white p-4 rounded-lg border border-zinc-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📄</span>
                        <div>
                          <div className="text-sm font-medium text-zinc-900">Policy PDF</div>
                          <div className="text-xs text-zinc-500">{documents.policyPDF.filename}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadDocument(documents.policyPDF.s3Key, documents.policyPDF.filename)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Aadhaar Card */}
                {documents.aadhaar && (
                  <div className="bg-white p-4 rounded-lg border border-zinc-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🆔</span>
                        <div>
                          <div className="text-sm font-medium text-zinc-900">Aadhaar Card</div>
                          <div className="text-xs text-zinc-500">{documents.aadhaar.filename}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadDocument(documents.aadhaar.s3Key, documents.aadhaar.filename)}
                        className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                )}
                
                {/* PAN Card */}
                {documents.pancard && (
                  <div className="bg-white p-4 rounded-lg border border-zinc-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📋</span>
                        <div>
                          <div className="text-sm font-medium text-zinc-900">PAN Card</div>
                          <div className="text-xs text-zinc-500">{documents.pancard.filename}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadDocument(documents.pancard.s3Key, documents.pancard.filename)}
                        className="px-3 py-1 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                )}
                
                {/* RC Document */}
                {documents.rc && (
                  <div className="bg-white p-4 rounded-lg border border-zinc-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🚗</span>
                        <div>
                          <div className="text-sm font-medium text-zinc-900">RC Document</div>
                          <div className="text-xs text-zinc-500">{documents.rc.filename}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadDocument(documents.rc.s3Key, documents.rc.filename)}
                        className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                )}
                
                {/* No documents message */}
                {!documents.policyPDF && !documents.aadhaar && !documents.pancard && !documents.rc && (
                  <div className="text-sm text-zinc-500 text-center py-4">
                    No documents found for this policy.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-zinc-500">No documents available</div>
            )}
          </div>
        </div>
      </Card>
      </>
    )
  }

export default PagePolicyDetail;
