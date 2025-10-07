import { useState, useEffect, useMemo } from 'react';
import { Card } from '../../../components/common/Card';
import { Car } from 'lucide-react';
import DualStorageService from '../../../services/dualStorageService';
import { AutocompleteInput } from '../../../NicsanCRMMock';

// Environment variables
// const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

// LabeledInput component - Enhanced with production styling
function LabeledInput({ label, value, onChange, type = "text", placeholder, hint, required = false }: {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
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
        className="w-full px-3 py-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-colors"
      />
      {hint && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
    </div>
  );
}

// LabeledSelect component - Enhanced with production styling
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
    <div className="space-y-1">
      <label className="text-sm font-medium text-zinc-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-colors"
      >
        <option value="">{placeholder || 'Select...'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
    </div>
  );
}


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
        const response = await DualStorageService.getAllPolicies();
        const existingPolicies = response.success ? response.data : [];
        const isDuplicate = existingPolicies.some((policy: any) => policy.policyNumber === value);
        if (isDuplicate) {
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
        <Card title="Manual Entry - Enterprise validation mode" desc="Comprehensive validation with business rules, progressive feedback, and data quality assurance">
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
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <span>ℹ️</span>
                Validation Mode: {validationMode === 'progressive' ? 'Progressive (Validates as you type)' : 'Strict (Validates all fields)'}
              </div>
              <button 
                onClick={() => setValidationMode(prev => prev === 'progressive' ? 'strict' : 'progressive')}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Switch to {validationMode === 'progressive' ? 'Strict' : 'Progressive'}
              </button>
            </div>
          </div>
          
          {/* Top row: Vehicle + QuickFill */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1">
              <LabeledInput 
                label="Vehicle Number*" 
                required 
                placeholder="KA01AB1234 or KA 51 MM" 
                value={form.vehicleNumber} 
                onChange={handleVehicleNumberChange}
              />
            </div>
            <button onClick={quickFill} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors h-[42px] mt-6">
              Prefill from last policy
            </button>
            <div className="ml-auto flex items-center gap-2 text-xs text-zinc-600 mt-6">
              <Car className="w-4 h-4"/> Make/Model autofill in v1.1
            </div>
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
            <LabeledSelect label="Product Type" value={form.productType} onChange={v=>set('productType', v)} options={[
              { value: "Life Insurance", label: "Life Insurance" },
              { value: "Motor Insurance", label: "Motor Insurance" },
              { value: "Health Insurance", label: "Health Insurance" },
              { value: "Travel Insurance", label: "Travel Insurance" },
              { value: "Home Insurance", label: "Home Insurance" },
              { value: "Cyber Insurance", label: "Cyber Insurance" }
            ]}/>
            <LabeledSelect label="Vehicle Type" value={form.vehicleType} onChange={v=>set('vehicleType', v)} options={[
              { value: "Private Car", label: "Private Car" },
              { value: "GCV", label: "GCV" },
              { value: "LCV", label: "LCV" },
              { value: "MCV", label: "MCV" },
              { value: "HCV", label: "HCV" }
            ]}/>
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
            <AutocompleteInput label="Caller Name" value={form.callerName} onChange={(v: string)=>set('callerName', v)} getSuggestions={getFilteredCallerSuggestions} onAddNew={handleAddNewTelecaller} showAddNew={true}/>
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

export default PageManualForm;
