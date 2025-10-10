import { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { Plus, Save, Trash2, RefreshCw, CheckCircle2, AlertTriangle, Clock, Eye, Edit3 } from 'lucide-react';
import DualStorageService from '../../../services/dualStorageService';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserChange } from '../../../hooks/useUserChange';

// Environment variables
const ENABLE_DEBUG = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

function PageManualGrid() {
    const { user } = useAuth();
    const { userChanged } = useUserChange();
    const [rows, setRows] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
    const [rowStatuses, setRowStatuses] = useState<{[key: number]: 'pending' | 'saving' | 'saved' | 'error'}>({});
    const [isLoading, setIsLoading] = useState(true);
    const [savedPolicies, setSavedPolicies] = useState<any[]>([]);
    
    // Reset rows when user changes - Unified user change detection
    useEffect(() => {
      if (userChanged && user) {
        setRows(prevRows => 
          prevRows.map(row => ({
            ...row,
            executive: user.name || "",
            opsExecutive: "",
          }))
        );
        // Clear row statuses and save messages
        setRowStatuses({});
        setSaveMessage(null);
      }
    }, [userChanged, user]);
  
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
        executive: user?.name || "",
        opsExecutive: "",
        callerName: "",
        mobile: "",
        
        // Additional
        rollover: "",
        remark: "",
        cashback: "", 
        customerName: "",
        branch: "",
        paymentMethod: "",
        paymentSubMethod: "",
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
          errors.push('Vehicle Number must be in format: KA01AB1234, KA 51 MM 1214, or 23 BH 7699 J');
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
      
      // Total Premium validation
      if (row.totalPremium && (isNaN(parseFloat(row.totalPremium)) || parseFloat(row.totalPremium) <= 0)) {
        errors.push('Total Premium must be a valid positive number');
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
        // Let the browser handle the paste naturally
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
              paymentMethod: cells[30] || "",
              remark: cells[31] || "",
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
          const response = await DualStorageService.getAllPolicies();
          const existingPolicies = response.success ? response.data : [];
          const isDuplicate = existingPolicies.some((policy: any) => policy.policyNumber === row.policy);
          return {
            index,
            isDuplicate,
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
          payment_method: row.paymentMethod || 'INSURER',
          payment_sub_method: row.paymentSubMethod || '',
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
                  <th className="py-2 px-1">Payment Method</th>
                  <th className="py-2 px-1">Payment Sub-Method</th>
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
                        disabled={true}
                        className="w-full border-none outline-none bg-transparent text-sm bg-gray-100 cursor-not-allowed"
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
                        value={r.paymentMethod || ''} 
                        onChange={(e) => {
                          updateRow(i, 'paymentMethod', e.target.value);
                          if (e.target.value !== 'NICSAN') {
                            updateRow(i, 'paymentSubMethod', '');
                          }
                        }}
                        className="w-full border-none outline-none bg-transparent text-sm"
                        placeholder="INSURER or NICSAN"
                      />
                    </td>
                    <td className="px-1">
                      <input 
                        value={r.paymentSubMethod || ''} 
                        onChange={(e) => updateRow(i, 'paymentSubMethod', e.target.value)}
                        className="w-full border-none outline-none bg-transparent text-sm"
                        placeholder={r.paymentMethod === 'NICSAN' ? "DIRECT or EXECUTIVE" : ""}
                        disabled={r.paymentMethod !== 'NICSAN'}
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

export default PageManualGrid;
