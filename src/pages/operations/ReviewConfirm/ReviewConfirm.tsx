import { useState, useEffect, useRef } from 'react';
import { Card } from '../../../components/common/Card';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import DualStorageService from '../../../services/dualStorageService';
import { AutocompleteInput } from '../../../NicsanCRMMock';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserChange } from '../../../hooks/useUserChange';

// Environment variables
// const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

// LabeledInput component
function LabeledInput({ label, value, onChange, type = "text", placeholder, hint, required = false, disabled = false }: {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-zinc-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

// LabeledDateInput component - Custom date picker with calendar
function LabeledDateInput({
  label,
  value,
  onChange,
  placeholder = "dd-mm-yyyy",
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const parseDateFromString = (dateString: string): Date | null => {
    try {
      // Handle dd-mm-yyyy format
      const parts = dateString.split('-');
      if (parts.length === 3) {
        // Check if it's dd-mm-yyyy format (day is 1-31, month is 1-12)
        const firstPart = parseInt(parts[0], 10);
        const secondPart = parseInt(parts[1], 10);
        const thirdPart = parseInt(parts[2], 10);

        if (firstPart >= 1 && firstPart <= 31 && secondPart >= 1 && secondPart <= 12) {
          // dd-mm-yyyy format
          const day = firstPart;
          const month = secondPart - 1; // JavaScript months are 0-indexed
          const year = thirdPart;
          return new Date(year, month, day);
        } else if (thirdPart >= 1 && thirdPart <= 31 && secondPart >= 1 && secondPart <= 12) {
          // yyyy-mm-dd format
          const year = firstPart;
          const month = secondPart - 1; // JavaScript months are 0-indexed
          const day = thirdPart;
          return new Date(year, month, day);
        }
      }
      // Fallback to standard Date parsing
      return new Date(dateString);
    } catch (error) {
      return null;
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? parseDateFromString(value) : null
  );
  const calendarRef = useRef<HTMLDivElement>(null);

  // Update selectedDate when value prop changes
  useEffect(() => {
    if (value) {
      const parsedDate = parseDateFromString(value);
      setSelectedDate(parsedDate);
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // Handle click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onChange(formatDate(date));
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange('');
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    onChange(formatDate(today));
    setIsOpen(false);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDaysArray = (date: Date) => {
    const daysInMonth = getDaysInMonth(date);
    const firstDay = getFirstDayOfMonth(date);
    const days = [];

    // Previous month's trailing days
    const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(date.getFullYear(), date.getMonth() - 1, prevMonthDays - i)
      });
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(date.getFullYear(), date.getMonth(), i)
      });
    }

    // Next month's leading days
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(date.getFullYear(), date.getMonth() + 1, i)
      });
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setFullYear(prev.getFullYear() - 1);
      } else {
        newDate.setFullYear(prev.getFullYear() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="space-y-1 relative" ref={calendarRef}>
      <label className="text-sm font-medium text-zinc-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {/* Calendar Icon */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Calendar Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg p-4 w-80">
            {/* Calendar Header */}
            <div className="mb-4">
              {/* Year Navigation */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => navigateYear('prev')}
                  className="p-1 hover:bg-zinc-100 rounded text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="font-semibold text-zinc-900 text-lg">
                  {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateYear('next')}
                  className="p-1 hover:bg-zinc-100 rounded text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1 hover:bg-zinc-100 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="font-medium text-zinc-900">
                  {currentDate.toLocaleDateString('en-US', { month: 'long' })}
                </h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1 hover:bg-zinc-100 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs font-medium text-zinc-500 text-center py-1">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {getDaysArray(currentDate).map((dayObj, index) => (
                <button
                  key={index}
                  onClick={() => dayObj.isCurrentMonth && handleDateSelect(dayObj.date)}
                  className={`
                    text-sm py-1 px-1 rounded hover:bg-blue-50 transition-colors
                    ${!dayObj.isCurrentMonth ? 'text-zinc-300' : 'text-zinc-700'}
                    ${isToday(dayObj.date) ? 'bg-blue-100 font-medium' : ''}
                    ${isSelected(dayObj.date) ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                    ${!dayObj.isCurrentMonth ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  disabled={!dayObj.isCurrentMonth}
                >
                  {dayObj.day}
                </button>
              ))}
            </div>

            {/* Calendar Footer */}
            <div className="flex justify-between mt-4 pt-3 border-t border-zinc-200">
              <button
                onClick={handleToday}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Today
              </button>
              <button
                onClick={handleClear}
                className="text-sm text-zinc-500 hover:text-zinc-700"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// LabeledAutocompleteInput component for Review Confirm with consistent styling
function LabeledAutocompleteInput({ 
  label, 
  value, 
  onChange, 
  getSuggestions, 
  onAddNew, 
  showAddNew = false, 
  placeholder, 
  hint,
  required = false 
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  getSuggestions: (input: string) => Promise<string[]>;
  onAddNew?: (value: string) => void;
  showAddNew?: boolean;
  placeholder?: string;
  hint?: string;
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
      <label className="text-sm font-medium text-zinc-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
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
                setIsOpen(newSuggestions.length > 0 || (showAddNew && value.trim().length > 0 && newSuggestions.length === 0));
              } catch (error) {
                // Silent error handling
              }
            }
          }}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 150);
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {/* Dropdown Arrow */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-zinc-500 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-zinc-300 border-t-blue-600 rounded-full animate-spin"></div>
                Loading suggestions...
              </div>
            ) : (
              <>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-blue-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {suggestion}
                  </button>
                ))}
                {showAddNew && value.trim() && !suggestions.includes(value.trim()) && (
                  <button
                    onClick={handleAddNew}
                    className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors border-t border-zinc-200 rounded-b-lg"
                  >
                    + Add "{value.trim()}" as new telecaller
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}


function PageReview() {
    const { user } = useAuth();
    const { userChanged } = useUserChange();
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
    const [_callerNames, setCallerNames] = useState<string[]>([]);
    
    // Reset editableData when user changes - Unified user change detection
    useEffect(() => {
      if (userChanged && user) {
        setEditableData((prevData: any) => ({
          ...prevData,
          manualExtras: {
            ...prevData.manualExtras,
            executive: user.name || "",
            opsExecutive: "",
          }
        }));
        // Clear save messages and verification state
        setSaveMessage(null);
        setSubmitMessage(null);
        setShowVerificationModal(false);
        setPendingSaveData(null);
      }
    }, [userChanged, user]);
    
    // Verification popup state
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [pendingSaveData, setPendingSaveData] = useState<any>(null);
  
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
        // Auto-select the new telecaller
        updateManualExtras('callerName', telecallerName);
        
        const result = await DualStorageService.addTelecaller({
          name: telecallerName,
          email: '',
          phone: '',
          branch: editableData.manualExtras.branch || manualExtras.branch || 'Default'
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
          
          // Initialize editable data with current values and auto-fill executive
          setEditableData({
            pdfData: { ...upload.extracted_data.extracted_data },
            manualExtras: { 
              ...upload.extracted_data.manual_extras,
              executive: upload.extracted_data.manual_extras.executive || user?.name || ''
            }
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
              manualExtras: { 
                ...upload.extracted_data.manual_extras,
                executive: upload.extracted_data.manual_extras.executive || user?.name || ''
              }
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
          errors.push('Invalid vehicle number format (e.g., KA01AB1234, KA 51 MM 1214, or 23 BH 7699 J)');
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
        
        // Show verification popup before saving
        
        setPendingSaveData({
          pdfData: editableData.pdfData,
          manualExtras: editableData.manualExtras
        });
        setShowVerificationModal(true);
        
      } catch (error) {
        console.error('❌ Confirm & Save error:', error);
        setSubmitMessage({ 
          type: 'error', 
          message: 'Failed to prepare for save. Please try again.' 
        });
      } finally {
        setIsLoading(false);
      }
    };
  
    // Handle verification confirmation
    const handleVerificationConfirm = async () => {
      setShowVerificationModal(false);
      setIsLoading(true);
      
      try {
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
        const result = await DualStorageService.confirmUploadAsPolicy(reviewData.id, pendingSaveData);
        
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
          console.error('❌ Policy confirmation failed:', result.error);
          setSubmitMessage({ 
            type: 'error', 
            message: `Policy confirmation failed: ${result.error || 'Unknown error'}` 
          });
        }
        
      } catch (error) {
        console.error('❌ Confirm & Save error:', error);
        let errorMessage = 'Failed to save policy. Please try again.';
        
        // Provide more specific error messages
        if ((error as Error).message) {
          if ((error as Error).message.includes('Telecaller')) {
            errorMessage = 'Error: Please select a valid telecaller from the list or add a new one.';
          } else if ((error as Error).message.includes('already exists')) {
            errorMessage = 'Error: This policy number already exists. Please use a different policy number.';
          } else if ((error as Error).message.includes('required')) {
            errorMessage = 'Error: Please fill in all required fields (Policy Number, Vehicle Number, Executive, Mobile).';
          } else if ((error as Error).message.includes('Invalid vehicle number')) {
            errorMessage = 'Error: Please enter a valid vehicle number format (e.g., KA01AB1234).';
          } else {
            errorMessage = `Error: ${(error as Error).message}`;
          }
        }
        
        setSubmitMessage({ 
          type: 'error', 
          message: errorMessage
        });
      } finally {
        setIsLoading(false);
      }
    };
  
    // Handle verification cancellation
    const handleVerificationCancel = () => {
      setShowVerificationModal(false);
      setPendingSaveData(null);
    };
  
    const handleRejectToManual = () => {
      // In real app, this would redirect to manual form with some pre-filled data
      setReviewData(null);
      // You could navigate to manual form here
    };
  
    // Verification modal component
    const VerificationModal = ({ isOpen, onConfirm, onCancel, email, phone }: { isOpen: boolean; onConfirm: () => void; onCancel: () => void; email: string; phone: string }) => {
      if (!isOpen) return null;
      
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">📋 Verify Contact Details</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">📧 Email:</span>
                <span className={`px-2 py-1 rounded text-sm ${email ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {email || 'Not provided'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">📱 Phone:</span>
                <span className={`px-2 py-1 rounded text-sm ${phone ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {phone || 'Not provided'}
                </span>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              Please verify these contact details are correct before saving the policy.
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={onConfirm} 
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                ✅ Correct - Save Policy
              </button>
              <button 
                onClick={onCancel} 
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      );
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
              <LabeledDateInput 
                label="Issue Date" 
                value={editableData.pdfData.issue_date || pdfData.issue_date}
                onChange={(value) => updatePdfData('issue_date', value)}
                required={true}
              />
              <LabeledDateInput 
                label="Expiry Date" 
                value={editableData.pdfData.expiry_date || pdfData.expiry_date}
                onChange={(value) => updatePdfData('expiry_date', value)}
                required={true}
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
              <LabeledInput 
                label="Customer Name" 
                value={editableData.pdfData.customer_name || pdfData.customer_name}
                onChange={(value) => updatePdfData('customer_name', value)}
                hint="extracted from PDF"
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
                disabled={true}
                hint="Auto-filled from current user"
              />
              <LabeledInput 
                label="Ops Executive" 
                value={editableData.manualExtras.opsExecutive || manualExtras.opsExecutive}
                onChange={(value) => updateManualExtras('opsExecutive', value)}
                hint="ops executive name"
              />
              <LabeledAutocompleteInput 
                label="Caller Name" 
                value={editableData.manualExtras.callerName || manualExtras.callerName}
                onChange={(value) => updateManualExtras('callerName', value)}
                placeholder="Telecaller name"
                hint="telecaller name"
                getSuggestions={getFilteredCallerSuggestions}
                onAddNew={handleAddNewTelecaller}
                showAddNew={true}
                required={true}
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
              <LabeledInput 
                label="Product Type" 
                value={editableData.manualExtras.product_type || manualExtras.product_type}
                onChange={(value) => updateManualExtras('product_type', value)}
                hint="from manual entry"
              />
              <LabeledInput 
                label="Vehicle Type" 
                value={editableData.manualExtras.vehicle_type || manualExtras.vehicle_type}
                onChange={(value) => updateManualExtras('vehicle_type', value)}
                hint="from manual entry"
              />
              <LabeledInput 
                label="Rollover/Renewal" 
                value={editableData.manualExtras.rollover || manualExtras.rollover}
                onChange={(value) => updateManualExtras('rollover', value)}
                hint="internal code"
              />
              <LabeledInput 
                label="Branch" 
                value={editableData.manualExtras.branch || manualExtras.branch}
                onChange={(value) => updateManualExtras('branch', value)}
                required
              />
              <div>
                <label className="block text-xs text-gray-600 mb-1">Payment Method</label>
                <select 
                  value={editableData.manualExtras.paymentMethod || manualExtras.paymentMethod || 'INSURER'}
                  onChange={(e) => {
                    updateManualExtras('paymentMethod', e.target.value);
                    if (e.target.value !== 'NICSAN') {
                      updateManualExtras('paymentSubMethod', '');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="INSURER">INSURER</option>
                  <option value="NICSAN">NICSAN</option>
                </select>
              </div>
              {(editableData.manualExtras.paymentMethod || manualExtras.paymentMethod) === 'NICSAN' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Payment Sub-Method</label>
                  <select 
                    value={editableData.manualExtras.paymentSubMethod || manualExtras.paymentSubMethod || ''}
                    onChange={(e) => updateManualExtras('paymentSubMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select Sub-Method</option>
                    <option value="DIRECT">DIRECT</option>
                    <option value="EXECUTIVE">EXECUTIVE</option>
                  </select>
                </div>
              )}
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
  
        {/* Verification Modal */}
        <VerificationModal 
          isOpen={showVerificationModal}
          onConfirm={handleVerificationConfirm}
          onCancel={handleVerificationCancel}
          email={editableData.manualExtras.customerEmail || manualExtras.customerEmail}
          phone={editableData.manualExtras.mobile || manualExtras.mobile}
        />
      </>
    )
  }

export default PageReview;
