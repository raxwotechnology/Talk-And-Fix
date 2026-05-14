import { useState, useEffect } from 'react';
import { 
  User, 
  Search, 
  History, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  ChevronRight,
  Phone,
  CreditCard,
  Calendar,
  ExternalLink,
  Users,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { getCustomerHistory, getAllCustomers } from '../../services/api';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/DashboardLayout';
import { adminNavGroups as navItems } from './adminNavItems';

const AdminCustomerHistory = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const q = searchTerm.toLowerCase();
      setFilteredCustomers(
        customers.filter(c => 
          c.name.toLowerCase().includes(q) || 
          c.phone.toLowerCase().includes(q)
        )
      );
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      setListLoading(true);
      const { data } = await getAllCustomers();
      setCustomers(data || []);
      setFilteredCustomers(data || []);
    } catch (err) {
      toast.error('Failed to load customer list');
    } finally {
      setListLoading(false);
    }
  };

  const handleSelectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setLoading(true);
    try {
      const searchPhone = customer.phone.replace(/[\s\-()+]/g, '');
      const { data } = await getCustomerHistory(searchPhone);
      setHistory(data);
    } catch (err) {
      toast.error('Failed to load history for this customer');
      setHistory(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Admin Panel">
      <div className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark-navy flex items-center gap-2">
            <Users className="text-primary-blue" />
            Customer Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">View and filter customer purchase history and credit status</p>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left Sidebar: Customer List */}
          <div className="w-full md:w-80 lg:w-96 bg-white rounded-2xl border border-card-border shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-50 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search name or phone..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {listLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-slate-300" size={32} />
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <p className="text-sm italic">No customers found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.phone}
                      onClick={() => handleSelectCustomer(customer)}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition-all flex items-center justify-between group ${
                        selectedCustomer?.phone === customer.phone ? 'bg-indigo-50/50 border-l-4 border-l-primary-blue' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <h4 className={`text-sm font-bold truncate ${
                          selectedCustomer?.phone === customer.phone ? 'text-primary-blue' : 'text-dark-navy'
                        }`}>
                          {customer.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-1">
                          <Phone size={10} />
                          {customer.phone}
                        </div>
                      </div>
                      <ChevronRight size={16} className={`text-slate-300 group-hover:text-primary-blue transition-all ${
                        selectedCustomer?.phone === customer.phone ? 'translate-x-1 text-primary-blue' : ''
                      }`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Details & History */}
          <div className="flex-1 bg-white rounded-2xl border border-card-border shadow-sm flex flex-col overflow-hidden">
            {!selectedCustomer ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                <div className="p-6 bg-slate-50 rounded-full">
                  <Users size={64} className="opacity-50" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-400">Select a Customer</h3>
                  <p className="text-sm">Choose a customer from the left to view their details</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Detail Header */}
                <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-blue text-white flex items-center justify-center shadow-lg shadow-primary-blue/20">
                      <User size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-dark-navy">{selectedCustomer.name}</h2>
                      <p className="text-sm text-slate-500 font-medium">{selectedCustomer.phone}</p>
                    </div>
                  </div>

                  {history && (
                    <div className="flex gap-4">
                      <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Orders</p>
                        <p className="text-lg font-bold text-dark-navy">{history.orders.length}</p>
                      </div>
                      <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">HP Plans</p>
                        <p className="text-lg font-bold text-indigo-600">{history.hpAgreements.length}</p>
                      </div>
                      <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Spent</p>
                        <p className="text-lg font-bold text-emerald-600">Rs. {history.orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Detail Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                      <Loader2 className="animate-spin" size={40} />
                      <p className="font-medium">Loading history...</p>
                    </div>
                  ) : history ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Orders Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white py-2 z-10">
                          <ShoppingBag className="text-primary-blue" size={20} />
                          <h2 className="text-lg font-bold text-dark-navy">Recent Purchases</h2>
                        </div>
                        
                        {history.orders.length === 0 ? (
                          <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 italic">No previous orders found</div>
                        ) : (
                          history.orders.map((order) => (
                            <div key={order._id} className="bg-white p-5 rounded-2xl border border-card-border hover:shadow-md transition-all group">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Invoice {order.invoiceNumber}</span>
                                  <h4 className="text-sm font-bold text-dark-navy mt-1">
                                    {order.items.map(i => i.name).join(', ')}
                                  </h4>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-primary-blue">Rs. {order.totalAmount.toLocaleString()}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  order.paymentStatus === 'Paid' || order.paymentStatus === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                  {order.paymentStatus}
                                </span>
                                <button className="text-[11px] font-bold text-slate-400 hover:text-primary-blue flex items-center gap-1">
                                  View Receipt <ExternalLink size={12} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* HP Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white py-2 z-10">
                          <Clock className="text-amber-600" size={20} />
                          <h2 className="text-lg font-bold text-dark-navy">Installment Plans (HP)</h2>
                        </div>

                        {history.hpAgreements.length === 0 ? (
                          <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 italic">No HP agreements found</div>
                        ) : (
                          history.hpAgreements.map((hp) => (
                            <div key={hp._id} className="bg-white p-5 rounded-2xl border border-card-border border-l-4 border-l-amber-400 hover:shadow-md transition-all">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">Agreement ID: {hp._id.slice(-8).toUpperCase()}</span>
                                  <h4 className="text-sm font-bold text-dark-navy mt-1">Plan from {new Date(hp.startDate).toLocaleDateString()}</h4>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  hp.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {hp.status}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Net Total</p>
                                  <p className="text-xs font-bold text-dark-navy">Rs. {hp.netTotal.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Paid So Far</p>
                                  <p className="text-xs font-bold text-emerald-600">Rs. {hp.totalPaid.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Balance</p>
                                  <p className="text-xs font-bold text-rose-600">Rs. {hp.balanceAmount.toLocaleString()}</p>
                                </div>
                              </div>

                              <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden mb-4">
                                <div 
                                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                  style={{ width: `${(hp.totalPaid/hp.netTotal)*100}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                  <Calendar size={12} /> Next Due: {new Date(hp.nextDueDate).toLocaleDateString()}
                                </div>
                                <button className="text-[11px] font-bold text-indigo-600 hover:underline">Manage Plan</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 italic">
                      Select a customer to view their detailed history
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminCustomerHistory;
