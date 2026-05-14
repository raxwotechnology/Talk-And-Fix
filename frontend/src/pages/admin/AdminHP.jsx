import { useState, useEffect } from 'react';
import { 
  Clock, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight,
  Printer,
  Download,
  Plus
} from 'lucide-react';
import { getHPRecords, recordHPPayment, getAccounts } from '../../services/api';

import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { adminNavGroups as navItems } from './adminNavItems';

const AdminHP = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedHP, setSelectedHP] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', paymentMethod: 'Cash', accountId: '', referenceNo: '', notes: '' });
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    fetchData();
    fetchAccounts();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await getHPRecords({ 
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined
      });
      setRecords(data);
    } catch (err) {
      toast.error('Failed to load installment records');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data } = await getAccounts();
      setAccounts(data || []);
    } catch (err) { console.error(err); }
  };


  const handlePay = async (e) => {
    e.preventDefault();
    try {
      await recordHPPayment(selectedHP._id, payForm);
      toast.success('Payment recorded successfully!');
      setShowPayModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Overdue': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Defaulted': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Hire Purchase">
      <div className="p-6 max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-navy flex items-center gap-2">
            <Clock className="text-primary-blue" />
            Hire Purchase & Installments
          </h1>
          <p className="text-slate-500 text-sm">Manage customer installment plans and payment history</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-card-border rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Plans', value: records.filter(r => r.status === 'Active').length, icon: Clock, color: 'text-primary-blue', bg: 'bg-indigo-50' },
          { label: 'Total Outstanding', value: `Rs. ${records.reduce((s, r) => s + (r.balanceAmount), 0).toLocaleString()}`, icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Completed', value: records.filter(r => r.status === 'Completed').length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Overdue', value: records.filter(r => r.status === 'Overdue').length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-card-border shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-xl font-bold text-dark-navy mt-0.5">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-3xl border border-card-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-card-border flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-4 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by customer name, phone or NIC..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-card-border rounded-xl text-sm font-medium focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Payments</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {loading ? (
                <tr><td colSpan="6" className="py-20 text-center"><span className="pos-spinner-sm" /></td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan="6" className="py-20 text-center text-slate-400 font-medium">No installment plans found</td></tr>
              ) : records.map((record) => (
                <tr key={record._id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-primary-blue font-bold">
                        {record.customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-dark-navy">{record.customer.name}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{record.customer.phone} | {record.customer.nic}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      <p className="text-slate-500"><span className="font-bold text-dark-navy">Total:</span> Rs. {record.netTotal.toLocaleString()}</p>
                      <p className="text-slate-500"><span className="font-bold text-dark-navy">Installment:</span> Rs. {record.installmentAmount.toLocaleString()} ({record.installmentType})</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full max-w-[120px]">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>Paid {record.installmentsPaid}/{record.numberOfInstallments}</span>
                        <span>{Math.round((record.totalPaid/record.netTotal)*100)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${(record.totalPaid/record.netTotal)*100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-rose-600">Rs. {record.balanceAmount.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar size={10} /> Next: {new Date(record.nextDueDate).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(record.status)}`}>
                      {record.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => { setSelectedHP(record); setPayForm({ ...payForm, amount: record.installmentAmount }); setShowPayModal(true); }}
                      className="px-3 py-1.5 bg-primary-blue text-white rounded-lg text-xs font-bold hover:bg-blue-600 shadow-sm transition-all"
                    >
                      Collect Payment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Modal */}
      {showPayModal && selectedHP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-navy/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-card-border flex justify-between items-center bg-indigo-50/50">
              <h3 className="text-lg font-bold text-dark-navy">Record Payment</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-rose-500"><AlertCircle size={24} /></button>
            </div>
            <form onSubmit={handlePay} className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Customer</p>
                <p className="text-sm font-bold text-dark-navy">{selectedHP.customer.name}</p>
                <p className="text-xs text-slate-400">{selectedHP.customer.phone}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Amount (Rs.) *</label>
                <input required type="number" value={payForm.amount} onChange={(e) => setPayForm({...payForm, amount: e.target.value})}
                  className="w-full border border-card-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue font-bold text-primary-blue" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Method</label>
                  <select value={payForm.paymentMethod} onChange={(e) => setPayForm({...payForm, paymentMethod: e.target.value})}
                    className="w-full border border-card-border rounded-xl py-3 px-4 text-sm focus:outline-none">
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Account</label>
                  <select required value={payForm.accountId} onChange={(e) => setPayForm({...payForm, accountId: e.target.value})}
                    className="w-full border border-card-border rounded-xl py-3 px-4 text-sm focus:outline-none">
                    <option value="">Select Account</option>
                    {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Reference / Notes</label>
                <input value={payForm.notes} onChange={(e) => setPayForm({...payForm, notes: e.target.value})}
                  placeholder="Additional notes..." className="w-full border border-card-border rounded-xl py-3 px-4 text-sm focus:outline-none" />
              </div>

              <button type="submit" className="w-full bg-primary-blue text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all">
                Record Payment
              </button>
            </form>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};

export default AdminHP;
