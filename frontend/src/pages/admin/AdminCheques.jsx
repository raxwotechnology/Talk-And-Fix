import React, { useEffect, useState } from 'react';
import { Landmark, Search, Calendar, Filter, CheckCircle2, XCircle, Clock, AlertCircle, FileText, Building } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getCheques, updateChequeStatus, getStores } from '../../services/api';
import { toast } from 'react-toastify';
import { adminNavGroups as navItems } from './adminNavItems';
import useAdminStoreStore from '../../store/adminStoreStore';

const AdminCheques = () => {
  const { selectedStoreId } = useAdminStoreStore();
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', search: '' });

  const fetchCheques = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStoreId !== 'all') params.storeId = selectedStoreId;
      if (filter.status) params.status = filter.status;
      
      const { data } = await getCheques(params);
      setCheques(data || []);
    } catch (err) {
      toast.error('Failed to load cheques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheques();
  }, [selectedStoreId, filter.status]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateChequeStatus(id, { status: newStatus });
      toast.success(`Cheque marked as ${newStatus}`);
      fetchCheques();
    } catch (err) {
      toast.error('Failed to update cheque status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Cleared': return 'bg-green-100 text-green-700 border-green-200';
      case 'Bounced': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const filteredCheques = cheques.filter(c => 
    c.chequeDetails.number?.toLowerCase().includes(filter.search.toLowerCase()) ||
    c.chequeDetails.bank?.toLowerCase().includes(filter.search.toLowerCase()) ||
    c.description?.toLowerCase().includes(filter.search.toLowerCase())
  );

  return (
    <DashboardLayout navItems={navItems} title="Cheque Management">
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark-navy flex items-center gap-2">
              <Landmark className="text-primary-blue" /> Cheque Registry
            </h1>
            <p className="text-muted-text text-sm mt-1">Monitor and manage all customer and supplier cheques</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl border border-gray-100 p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by cheque number, bank, or note..."
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-blue transition-all"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              className="bg-gray-50 border border-gray-100 rounded-xl py-2 px-4 text-sm focus:bg-white focus:ring-2 focus:ring-primary-blue transition-all"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Cleared">Cleared</option>
              <option value="Bounced">Bounced</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">Cheque Details</th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">Due Date</th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase">Store</th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase text-right">Amount</th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase text-center">Status</th>
                    <th className="p-5 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCheques.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-10 text-center text-gray-400 italic">No cheques found matching your criteria.</td>
                    </tr>
                  ) : (
                    filteredCheques.map((c) => (
                      <tr key={c._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-primary-blue">
                              <FileText size={20} />
                            </div>
                            <div>
                              <div className="font-bold text-dark-navy">#{c.chequeDetails.number || 'N/A'}</div>
                              <div className="text-xs text-muted-text flex items-center gap-1">
                                <Building size={12} /> {c.chequeDetails.bank || 'Unknown Bank'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-sm text-dark-navy">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            {c.chequeDetails.dueDate ? new Date(c.chequeDetails.dueDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="p-5 text-sm text-muted-text">
                          {c.storeId?.name || 'All Stores'}
                        </td>
                        <td className="p-5 text-right font-bold text-dark-navy">
                          Rs. {c.amount.toLocaleString()}
                        </td>
                        <td className="p-5 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(c.chequeDetails.status)}`}>
                            {c.chequeDetails.status || 'Pending'}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.chequeDetails.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(c._id, 'Cleared')}
                                  className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-all"
                                  title="Mark as Cleared"
                                >
                                  <CheckCircle2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(c._id, 'Bounced')}
                                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                                  title="Mark as Bounced"
                                >
                                  <AlertCircle size={18} />
                                </button>
                              </>
                            )}
                            {c.chequeDetails.status !== 'Pending' && (
                              <button
                                onClick={() => handleStatusUpdate(c._id, 'Pending')}
                                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-all"
                                title="Reset to Pending"
                              >
                                <Clock size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCheques;
