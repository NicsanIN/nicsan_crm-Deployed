
import { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
// import { Download, Filter, CheckCircle2, Clock, AlertTriangle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import DualStorageService from '../../../services/dualStorageService';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserChange } from '../../../hooks/useUserChange';

// Tile component for displaying metrics
function Tile({ label, value, sub, info, onClick }: { label: string; value: string; sub?: string; info?: string; onClick?: () => void }) {
  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm border border-zinc-100 p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="text-sm text-zinc-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-zinc-900">{value}</div>
      {sub && <div className="text-sm text-green-600 mt-1">{sub}</div>}
      {info && <div className="text-xs text-zinc-400 mt-1">{info}</div>}
    </div>
  );
}

// Mock data for demo purposes
// const demoPayments = [
//   {
//     id: '1',
//     executive: 'John Doe',
//     month: '01',
//     year: '2024',
//     totalAmount: 150000,
//     received: false,
//     receivedDate: null,
//     notes: 'Monthly commission payment'
//   },
//   {
//     id: '2', 
//     executive: 'Jane Smith',
//     month: '01',
//     year: '2024',
//     totalAmount: 120000,
//     received: true,
//     receivedDate: '2024-01-15',
//     notes: 'Monthly commission payment'
//   }
// ];

function PagePayments() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { userChanged } = useUserChange();
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'summary' | 'detail'>('summary');
    const [selectedExecutive, setSelectedExecutive] = useState<string>('');
    const [receivedPayments, setReceivedPayments] = useState<Set<string>>(new Set());
    const [isUpdating, setIsUpdating] = useState<{[key: string]: boolean}>({});
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>('');
  
    const loadExecutivePayments = async () => {
      try {
        setIsLoading(true);
        // Use dual storage pattern: S3 → Database → Mock Data
        const response = await DualStorageService.getExecutivePayments();
        
        if (response.success) {
          setPayments(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('Failed to load executive payments:', error);
        setPayments([]);
      } finally {
        setIsLoading(false);
      }
    };
  
    // Handle user changes - reset payments data when user changes
    useEffect(() => {
      if (userChanged && user) {
        setPayments([]);
        setSelectedExecutive('');
        setViewMode('summary');
        setReceivedPayments(new Set());
        setIsUpdating({});
      }
    }, [userChanged, user]);

    useEffect(() => {
      loadExecutivePayments();
    }, []);
  
    // Set default to current month
    useEffect(() => {
      const now = new Date();
      const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
      const currentYear = now.getFullYear().toString();
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
    }, []);
  
    const formatCurrency = (amount: number) => {
      if (amount === null || amount === undefined || isNaN(amount)) {
        return "₹0";
      }
      return `₹${amount.toLocaleString('en-IN')}`;
    };
  
    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleDateString('en-GB');
      } catch {
        return dateString;
      }
    };
  
    const formatReceivedDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return dateString;
      }
    };
  
    // Filter payments by month and year
    const filteredPayments = payments.filter(payment => {
      if (!selectedMonth && !selectedYear) return true; // Show all if no filter
      
      const paymentDate = new Date(payment.issue_date);
      const month = (paymentDate.getMonth() + 1).toString().padStart(2, '0');
      const year = paymentDate.getFullYear().toString();
      
      const monthMatch = !selectedMonth || month === selectedMonth;
      const yearMatch = !selectedYear || year === selectedYear;
      
      return monthMatch && yearMatch;
    });
  
    // Calculate summary metrics using filtered data
    const totalAmount = filteredPayments.reduce((sum, payment) => sum + (parseFloat(payment.customer_paid) || 0), 0);
    // const executiveCount = new Set(filteredPayments.map(p => p.executive)).size;
    const receivedAmount = filteredPayments
      .filter(p => receivedPayments.has(`${p.policy_number}_${p.customer_name}`) || p.payment_received === true)
      .reduce((sum, payment) => sum + (parseFloat(payment.customer_paid) || 0), 0);
    const pendingAmount = totalAmount - receivedAmount;
  
    // Calculate executive summary using filtered data
    const calculateExecutiveSummary = (payments: any[]): any[] => {
      const summary = payments.reduce((acc, payment) => {
        const exec = payment.executive;
        if (!acc[exec]) {
          acc[exec] = {
            executive: exec,
            totalPaid: 0,
            receivedAmount: 0,
            pendingAmount: 0,
            recordCount: 0,
            receivedCount: 0
          };
        }
        
        const amount = parseFloat(payment.customer_paid) || 0;
        acc[exec].totalPaid += amount;
        acc[exec].recordCount += 1;
        
        // Check if received using payment_received field or local state
        const isReceived = receivedPayments.has(`${payment.policy_number}_${payment.customer_name}`) || payment.payment_received === true;
        if (isReceived) {
          acc[exec].receivedAmount += amount;
          acc[exec].receivedCount += 1;
        } else {
          acc[exec].pendingAmount += amount;
        }
        
        return acc;
      }, {});
      
      return Object.values(summary);
    };
  
    // Get payments for selected executive
    const getPaymentsForExecutive = (executive: string) => {
      return payments.filter(p => p.executive === executive);
    };
  
    // Navigation functions
    const viewExecutiveDetails = (executive: string) => {
      setSelectedExecutive(executive);
      setViewMode('detail');
    };
  
    const backToSummary = () => {
      setSelectedExecutive('');
      setViewMode('summary');
    };
  
    // Function to mark payment as received
    const markAsReceived = async (paymentId: string, payment: any) => {
      setIsUpdating(prev => ({ ...prev, [paymentId]: true }));
      
      try {
        // Call backend API to mark payment as received
        const response = await DualStorageService.markPaymentAsReceived(
          payment.policy_number, 
          'current_user' // In real implementation, get from auth context
        );
        
        if (response.success) {
          // Update local state
          setReceivedPayments(prev => new Set([...prev, paymentId]));
          
          // Refresh data to get updated payment status
          await loadExecutivePayments();
          
          console.log(`Payment marked as received: ${paymentId}`, response.data);
        } else {
          console.error('Failed to mark payment as received:', response);
        }
      } catch (error) {
        console.error('Failed to mark as received:', error);
      } finally {
        setIsUpdating(prev => ({ ...prev, [paymentId]: false }));
      }
    };
  
    const executiveSummary = calculateExecutiveSummary(filteredPayments);
    const executiveDetailPayments = getPaymentsForExecutive(selectedExecutive);
  
    return (
      <>
        {/* Summary Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <Tile 
            label="Total Payments" 
            info="(All executive payments)"
            value={formatCurrency(totalAmount)} 
            sub={`${filteredPayments.length} transactions`}
          />
          <Tile 
            label="Received Amount" 
            info="(Processed payments)"
            value={formatCurrency(receivedAmount)} 
            sub={`${filteredPayments.filter(p => receivedPayments.has(`${p.policy_number}_${p.customer_name}`) || p.payment_received === true).length} received`}
          />
          <Tile 
            label="Pending Amount" 
            info="(Awaiting processing)"
            value={formatCurrency(pendingAmount)} 
            sub={`${filteredPayments.length - filteredPayments.filter(p => receivedPayments.has(`${p.policy_number}_${p.customer_name}`) || p.payment_received === true).length} pending`}
          />
        </div>
  
        {/* Month/Year Filter */}
        <div className="mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Month</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Months</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Year</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Years</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setSelectedMonth('');
                  setSelectedYear('');
                }}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
              <button 
                onClick={() => {
                  const now = new Date();
                  setSelectedMonth((now.getMonth() + 1).toString().padStart(2, '0'));
                  setSelectedYear(now.getFullYear().toString());
                }}
                className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
              >
                Current Month
              </button>
            </div>
          </div>
        </div>
  
        {/* Conditional Content */}
        {viewMode === 'summary' ? (
          <Card title="Executive Summary">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-sm text-zinc-600">Loading executive payments...</div>
              </div>
            ) : executiveSummary.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm text-zinc-600">No executive payments found</div>
                <div className="text-xs text-zinc-500 mt-1">Payments will appear here when executives process NICSAN payments</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-500 border-b bg-gray-50">
                      <th className="py-2 px-2 font-medium">Executive Name</th>
                      <th className="py-2 px-2 font-medium">Total Amount</th>
                      <th className="py-2 px-2 font-medium">Received</th>
                      <th className="py-2 px-2 font-medium">Pending</th>
                      <th className="py-2 px-2 font-medium">Records</th>
                      <th className="py-2 px-2 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executiveSummary.map((exec: any, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-2 font-medium text-gray-900">{exec.executive || 'N/A'}</td>
                        <td className="py-2 px-2 font-semibold text-gray-900">{formatCurrency(exec.totalPaid)}</td>
                        <td className="py-2 px-2 font-medium text-green-600">{formatCurrency(exec.receivedAmount)}</td>
                        <td className="py-2 px-2 font-medium text-orange-600">{formatCurrency(exec.pendingAmount)}</td>
                        <td className="py-2 px-2 text-gray-600">{exec.recordCount}</td>
                        <td className="py-2 px-2 text-center">
                          <button 
                            onClick={() => viewExecutiveDetails(exec.executive)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
          </Card>
        ) : (
          <Card title={`${selectedExecutive} - Payment Details`} desc="Individual payment records for selected executive">
            <div className="mb-4">
              <button 
                onClick={backToSummary}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to Executive Summary
              </button>
            </div>
            
            {filteredPayments.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm text-zinc-600">No payment records found for {selectedExecutive}</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-500 border-b bg-gray-50">
                      <th className="py-2 px-2 font-medium">Customer Name</th>
                      <th className="py-2 px-2 font-medium">Amount</th>
                      <th className="py-2 px-2 font-medium">Customer Cheque</th>
                      <th className="py-2 px-2 font-medium">Our Cheque</th>
                      <th className="py-2 px-2 font-medium">Issue Date</th>
                      <th className="py-2 px-2 font-medium">Policy No</th>
                      <th className="py-2 px-2 font-medium text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executiveDetailPayments.map((payment, index) => {
                      const paymentId = `${payment.policy_number}_${payment.customer_name}`;
                      const isReceived = receivedPayments.has(paymentId) || payment.payment_received === true;
                      const isUpdatingPayment = isUpdating[paymentId];
                      
                      return (
                        <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-2 font-medium text-gray-900">{payment.customer_name || 'N/A'}</td>
                          <td className="py-2 px-2 font-semibold text-green-700">{formatCurrency(parseFloat(payment.customer_paid) || 0)}</td>
                          <td className="py-2 px-2 text-gray-600">{payment.customer_cheque_no || 'N/A'}</td>
                          <td className="py-2 px-2 text-gray-600">{payment.our_cheque_no || 'N/A'}</td>
                          <td className="py-2 px-2 text-gray-600">{formatDate(payment.issue_date)}</td>
                          <td className="py-2 px-2 font-mono text-xs text-gray-600">{payment.policy_number || 'N/A'}</td>
                          <td className="py-2 px-2 text-center">
                            {isReceived ? (
                              <div className="inline-flex flex-col items-center space-y-1">
                                <div className="flex items-center space-x-1 text-green-600">
                                  <span className="text-sm">✅</span>
                                  <span className="text-xs font-medium">Received</span>
                                </div>
                                {payment.received_date && (
                                  <div className="text-xs text-gray-500">
                                    {formatReceivedDate(payment.received_date)}
                                  </div>
                                )}
                                {payment.received_by && (
                                  <div className="text-xs text-gray-500">
                                    By: {payment.received_by}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button 
                                onClick={() => markAsReceived(paymentId, payment)}
                                disabled={isUpdatingPayment}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded disabled:opacity-50 transition-colors"
                              >
                                {isUpdatingPayment ? 'Processing...' : 'Mark Received'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
          </Card>
        )}
      </>
    )
  }

export default PagePayments;