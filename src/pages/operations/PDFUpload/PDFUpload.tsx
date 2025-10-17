import { useState, useEffect, useRef } from 'react';
import { Card } from '../../../components/common/Card';
// import { Upload, FileText, CheckCircle2, AlertTriangle, RefreshCw, Download, Eye, Trash2, User, Phone, Mail, Building, DollarSign, Calendar, Clock, Shield, Car, MapPin } from 'lucide-react';
import DualStorageService from '../../../services/dualStorageService';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserChange } from '../../../hooks/useUserChange';

// Custom AutocompleteInput for PDF Upload with blue styling
function LabeledAutocompleteInput({ 
  label, 
  value, 
  onChange, 
  getSuggestions, 
  onAddNew, 
  showAddNew = false, 
  placeholder, 
  required = false 
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  getSuggestions: (input: string) => Promise<string[]>;
  onAddNew?: (value: string) => void;
  showAddNew?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = async (inputValue: string) => {
    onChange(inputValue);
    
    if (inputValue.length >= 2) {
      setIsLoading(true);
      try {
        const newSuggestions = await getSuggestions(inputValue);
        setSuggestions(newSuggestions);
        // Open dropdown only if we have suggestions OR if we want to show "Add new" option (but not both empty)
        setIsOpen(newSuggestions.length > 0 || (showAddNew && inputValue.trim().length > 0 && newSuggestions.length === 0));
      } catch (error) {
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
  };

  const handleAddNew = () => {
    if (onAddNew && value.trim()) {
      onAddNew(value.trim());
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-1 relative">
      <label className="block text-xs text-blue-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={async () => {
            if (value.length >= 2) {
              try {
                const newSuggestions = await getSuggestions(value);
                setSuggestions(newSuggestions);
                // Open dropdown only if we have suggestions OR if we want to show "Add new" option (but not both empty)
                setIsOpen(newSuggestions.length > 0 || (showAddNew && value.trim().length > 0 && newSuggestions.length === 0));
              } catch (error) {
                // Silent error handling
              }
            }
          }}
          onBlur={() => {
            // Delay to allow clicking on suggestions
            setTimeout(() => setIsOpen(false), 150);
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        
        {/* Dropdown Arrow */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-blue-500 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                Loading suggestions...
              </div>
            ) : (
              <>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {suggestion}
                  </button>
                ))}
                {showAddNew && value.trim() && !suggestions.includes(value.trim()) && (
                  <button
                    onClick={handleAddNew}
                    className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors border-t border-blue-200 rounded-b-lg"
                  >
                    + Add "{value.trim()}" as new telecaller
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Environment variables
// const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';


// LabeledSelect component
function LabeledSelect({ label, value, onChange, options, placeholder, hint, required = false }: {
  label: string;
  value: any;
  onChange: (value: any) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-blue-700 mb-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        <option value="">{placeholder || 'Select...'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-blue-500">{hint}</p>}
    </div>
  );
}


function PageUpload() {
    const { user } = useAuth();
    const { userChanged } = useUserChange();
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
    const [selectedInsurer, setSelectedInsurer] = useState<string>('TATA_AIG');
    
    // Enhanced state for additional documents
    interface UploadedDocument {
        id: string;
        filename: string;
        size: string;
        uploadTime: string;
    }
    
    const [uploadedDocuments, setUploadedDocuments] = useState<{
        aadhaar: UploadedDocument | null;
        pancard: UploadedDocument | null;
        rc: UploadedDocument | null;
    }>({
        aadhaar: null,
        pancard: null,
        rc: null
    });
    
    const [documentUploadStatus, setDocumentUploadStatus] = useState({
        aadhaar: '',
        pancard: '',
        rc: ''
    });
    
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
    
    // Dropdown options
    const productTypeOptions = [
      { value: "Life Insurance", label: "Life Insurance" },
      { value: "Motor Insurance", label: "Motor Insurance" },
      { value: "Health Insurance", label: "Health Insurance" },
      { value: "Travel Insurance", label: "Travel Insurance" },
      { value: "Home Insurance", label: "Home Insurance" },
      { value: "Cyber Insurance", label: "Cyber Insurance" }
    ];

    const vehicleTypeOptions = [
      { value: "Private Car", label: "Private Car" },
      { value: "GCV", label: "GCV" },
      { value: "LCV", label: "LCV" },
      { value: "MCV", label: "MCV" },
      { value: "HCV", label: "HCV" }
    ];
    
    const [manualExtras, setManualExtras] = useState({
      executive: user?.name || '',
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
      paymentSubMethod: '',
      product_type: 'Private Car',
      vehicle_type: 'Private Car'
    });
    const [manualExtrasSaved, setManualExtrasSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // File input refs for additional documents
    const aadhaarInputRef = useRef<HTMLInputElement>(null);
    const panInputRef = useRef<HTMLInputElement>(null);
    const rcInputRef = useRef<HTMLInputElement>(null);
    
    // Reset manualExtras when user changes - Unified user change detection
    useEffect(() => {
      if (userChanged && user) {
        setManualExtras(prevExtras => ({
          ...prevExtras,
          executive: user.name || "",
          opsExecutive: "",
        }));
        // Clear upload state and messages
        setUploadStatus('');
        setUploadedFiles([]);
        setManualExtrasSaved(false);
        setUploadedDocuments({ aadhaar: null, pancard: null, rc: null });
        setDocumentUploadStatus({ aadhaar: '', pancard: '', rc: '' });
      }
    }, [userChanged, user]);
    
    const [callerNames, setCallerNames] = useState<string[]>([]);

    // Load telecallers on component mount
    useEffect(() => {
      const loadTelecallers = async () => {
        try {
          const response = await DualStorageService.getTelecallers();
          
          if (response.success && Array.isArray(response.data)) {
            const names = response.data
              .map((telecaller: any) => telecaller.name)
              .filter((name: string) => name && name !== 'Unknown');
            setCallerNames(names);
          }
        } catch (error) {
          console.error('Failed to load telecallers:', error);
        }
      };
      loadTelecallers();
    }, []);
  
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
            paymentSubMethod: '',
            product_type: 'Private Car',
            vehicle_type: 'Private Car'
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
      
      // Use the callerNames state that was loaded on component mount
      const filteredNames = callerNames.filter(name => 
        name.toLowerCase().includes(input.toLowerCase())
      );
      
      // If no suggestions from state, use mock data as fallback
      if (filteredNames.length === 0) {
        const mockCallers = ['Priya Singh', 'Rahul Kumar', 'Anjali Sharma'];
        const filtered = mockCallers.filter(name => 
          name.toLowerCase().includes(input.toLowerCase())
        );
        return filtered.slice(0, 5);
      }

      return filteredNames.slice(0, 5); // Limit to 5 suggestions
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

    // Enhanced document upload handler
    const handleDocumentUpload = async (documentType: string, files: FileList | null) => {
      if (!files || files.length === 0) return;
      
      const file = files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setDocumentUploadStatus(prev => ({
          ...prev,
          [documentType]: '❌ Only JPG, PNG, and PDF files are allowed'
        }));
        return;
      }
      
      // Validate file size (5MB max for images)
      if (file.size > 5 * 1024 * 1024) {
        setDocumentUploadStatus(prev => ({
          ...prev,
          [documentType]: '❌ File size must be less than 5MB'
        }));
        return;
      }
      
      setDocumentUploadStatus(prev => ({
        ...prev,
        [documentType]: 'Uploading...'
      }));
      
      try {
        // Create FormData for individual document upload
        const formData = new FormData();
        formData.append('document', file);
        formData.append('documentType', documentType);
        formData.append('insurer', selectedInsurer);
        formData.append('policyNumber', 'pending'); // Will be updated after policy creation
        
        // Add PDF upload ID for direct connection
        const currentPdfUpload = uploadedFiles.find(f => f.status === 'UPLOADED' || f.status === 'REVIEW' || f.status === 'COMPLETED');
        if (currentPdfUpload?.id) {
          formData.append('pdf_upload_id', currentPdfUpload.id);
        }
        
        // Upload individual document
        const result = await DualStorageService.uploadDocument(formData);
        
        if (result.success) {
          // Update local state
          setUploadedDocuments(prev => ({
            ...prev,
            [documentType]: {
              id: result.data.documentId,
              filename: file.name,
              size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
              s3Key: result.data.s3Key,
              uploadTime: new Date().toLocaleTimeString()
            }
          }));
          
          setDocumentUploadStatus(prev => ({
            ...prev,
            [documentType]: '✅ Uploaded successfully'
          }));
          
          // Show success message
          setUploadStatus(`${documentType.toUpperCase()} uploaded successfully!`);
          
        } else {
          setDocumentUploadStatus(prev => ({
            ...prev,
            [documentType]: `❌ Upload failed: ${result.error}`
          }));
        }
      } catch (error) {
        setDocumentUploadStatus(prev => ({
          ...prev,
          [documentType]: `❌ Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
      }
    };

    // View document handler
    const viewDocument = (documentType: string) => {
      const document = uploadedDocuments[documentType as keyof typeof uploadedDocuments];
      if (!document) return;
      
      // For demo purposes, show document info
      alert(`Document: ${document.filename}\nSize: ${document.size}\nUploaded: ${document.uploadTime}`);
    };
  
    return (
      <>
        <Card title="Drag & Drop PDF">
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
              <div className="space-y-1">
                <label className="block text-xs text-blue-700 mb-1">
                  Executive
                </label>
                <input
                  type="text"
                  value={manualExtras.executive || ''}
                  onChange={(e) => handleManualExtrasChange('executive', e.target.value)}
                  disabled={true}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-zinc-500">Auto-filled from current user</p>
              </div>
              <div>
                <label className="block text-xs text-blue-700 mb-1">Ops Executive</label>
                <select 
                  value={manualExtras.opsExecutive}
                  onChange={(e) => handleManualExtrasChange('opsExecutive', e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select Ops Executive</option>
                  <option value="NA">NA</option>
                  <option value="Ravi">Ravi</option>
                  <option value="Pavan">Pavan</option>
                  <option value="Manjunath">Manjunath</option>
                </select>
              </div>
              <div>
                <LabeledAutocompleteInput 
                  label="Caller Name" 
                  placeholder="Telecaller name"
                  value={manualExtras.callerName}
                  onChange={(value: string) => handleManualExtrasChange('callerName', value)}
                  getSuggestions={getFilteredCallerSuggestions}
                  onAddNew={handleAddNewTelecaller}
                  showAddNew={true}
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
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select Rollover/Renewal</option>
                  <option value="ROLLOVER">ROLLOVER</option>
                  <option value="RENEWAL">RENEWAL</option>
                </select>
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
                <LabeledSelect 
                  label="Product Type" 
                  value={manualExtras.product_type}
                  onChange={(value) => handleManualExtrasChange('product_type', value)}
                  options={productTypeOptions}
                  placeholder="Select product type"
                />
              </div>
              <div>
                <LabeledSelect 
                  label="Vehicle Type" 
                  value={manualExtras.vehicle_type}
                  onChange={(value) => handleManualExtrasChange('vehicle_type', value)}
                  options={vehicleTypeOptions}
                  placeholder="Select vehicle type"
                />
              </div>
              <div>
                <label className="block text-xs text-blue-700 mb-1">Branch <span className="text-red-500">*</span></label>
                <select 
                  value={manualExtras.branch}
                  onChange={(e) => handleManualExtrasChange('branch', e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                >
                  <option value="">Select Branch</option>
                  <option value="MYSORE">MYSORE</option>
                  <option value="BANASHANKARI">BANASHANKARI</option>
                  <option value="ADUGODI">ADUGODI</option>
                </select>
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

          {/* Additional Documents Upload Section */}
          <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
            <div className="text-sm font-medium mb-3 text-gray-800">📋 Additional Documents (Optional)</div>
            
            {/* Aadhaar Upload */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🆔</span>
                <span className="font-medium">Aadhaar Card</span>
                {uploadedDocuments.aadhaar && (
                  <span className="text-blue-600 text-sm">✓ Uploaded</span>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  ref={aadhaarInputRef}
                  type="file" 
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleDocumentUpload('aadhaar', e.target.files)}
                  className="hidden"
                />
                <button 
                  onClick={() => aadhaarInputRef.current?.click()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm w-32"
                >
                  Upload Aadhaar
                </button>
                {uploadedDocuments.aadhaar && (
                  <button 
                    onClick={() => viewDocument('aadhaar')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm w-16"
                  >
                    View
                  </button>
                )}
              </div>
              {documentUploadStatus.aadhaar && (
                <div className="text-xs mt-1 text-gray-600">
                  {documentUploadStatus.aadhaar}
                </div>
              )}
            </div>
            
            {/* PAN Card Upload */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📋</span>
                <span className="font-medium">PAN Card</span>
                {uploadedDocuments.pancard && (
                  <span className="text-blue-600 text-sm">✓ Uploaded</span>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  ref={panInputRef}
                  type="file" 
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleDocumentUpload('pancard', e.target.files)}
                  className="hidden"
                />
                <button 
                  onClick={() => panInputRef.current?.click()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm w-28"
                >
                  Upload PAN
                </button>
                {uploadedDocuments.pancard && (
                  <button 
                    onClick={() => viewDocument('pancard')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm w-16"
                  >
                    View
                  </button>
                )}
              </div>
              {documentUploadStatus.pancard && (
                <div className="text-xs mt-1 text-gray-600">
                  {documentUploadStatus.pancard}
                </div>
              )}
            </div>
            
            {/* RC Document Upload */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🚗</span>
                <span className="font-medium">RC Document</span>
                {uploadedDocuments.rc && (
                  <span className="text-blue-600 text-sm">✓ Uploaded</span>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  ref={rcInputRef}
                  type="file" 
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleDocumentUpload('rc', e.target.files)}
                  className="hidden"
                />
                <button 
                  onClick={() => rcInputRef.current?.click()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm w-24"
                >
                  Upload RC
                </button>
                {uploadedDocuments.rc && (
                  <button 
                    onClick={() => viewDocument('rc')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm w-16"
                  >
                    View
                  </button>
                )}
              </div>
              {documentUploadStatus.rc && (
                <div className="text-xs mt-1 text-gray-600">
                  {documentUploadStatus.rc}
                </div>
              )}
            </div>
            
            <div className="text-xs text-green-600 mt-2">
              💡 These documents are optional but recommended for complete policy processing.
            </div>
          </div>
  
          <div className="mt-6">
            <div className="text-sm font-medium mb-3">Upload History</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="py-2">Time</th><th>Document Type</th><th>Filename</th><th>Insurer</th><th>Size</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Policy PDF files */}
                  {uploadedFiles.map((file) => (
                    <tr key={file.id} className="border-t">
                      <td className="py-2">{file.time}</td>
                      <td className="py-2">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                          Policy PDF
                        </span>
                      </td>
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
                  ))}
                  
                  {/* Additional documents */}
                  {Object.entries(uploadedDocuments).map(([type, document]) => {
                    if (!document) return null;
                    
                    return (
                      <tr key={document.id} className="border-t">
                        <td className="py-2">{document.uploadTime}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            type === 'aadhaar' ? 'bg-green-100 text-green-700' :
                            type === 'pancard' ? 'bg-yellow-100 text-yellow-700' :
                            type === 'rc' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 font-medium">{document.filename}</td>
                        <td className="py-2">
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                            {availableInsurers.find(ins => ins.value === selectedInsurer)?.label || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-2">{document.size}</td>
                        <td>
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            UPLOADED
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* No uploads message */}
                  {uploadedFiles.length === 0 && Object.values(uploadedDocuments).every(doc => !doc) && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-zinc-500">
                        No uploads yet. Drag and drop a PDF to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </>
    )
  }

export default PageUpload;
