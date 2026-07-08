import React, { useState, useEffect } from 'react';
import { Users, Search, Ban, CheckCircle, RefreshCw, Eye, X, Mail, Phone, MapPin, ShoppingBag } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const [usersRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).catch(() => []),
        fetch(`${API_BASE_URL}/admin/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).catch(() => [])
      ]);
      setCustomers(Array.isArray(usersRes) ? usersRes.filter(u => u.role === 'customer') : []);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleBlock = async (userId) => {
    setUpdatingId(userId);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/block`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setCustomers(prev => prev.map(c => c._id === userId ? { ...c, isBlocked: !c.isBlocked } : c));
        if (selectedCustomer && selectedCustomer._id === userId) {
          setSelectedCustomer(prev => ({ ...prev, isBlocked: !prev.isBlocked }));
        }
      } else {
        alert('Failed to update blocked status.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getCustomerStats = (userId) => {
    const userOrders = orders.filter(o => o.user?._id === userId || o.user === userId);
    const completedOrders = userOrders.filter(o => o.status === 'Delivered');
    const spending = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      orderCount: userOrders.length,
      completedCount: completedOrders.length,
      spending
    };
  };

  const getFilteredCustomers = () => {
    return customers.filter(c => 
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').includes(searchTerm)
    );
  };

  const filteredCustomers = getFilteredCustomers();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />
        
        <main className="flex-1 p-8 flex gap-8">
          {/* Customers Directory List */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-full max-w-[320px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button 
                onClick={loadData}
                className="p-2.5 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Customers Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 text-left">Name</th>
                    <th className="pb-3 text-left">Contact</th>
                    <th className="pb-3 text-center">Orders</th>
                    <th className="pb-3 text-center">Total Spending</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4"><div className="w-24 h-3 bg-slate-200 rounded" /></td>
                        <td className="py-4"><div className="w-28 h-3 bg-slate-200 rounded" /></td>
                        <td className="py-4"><div className="w-8 h-3 bg-slate-200 rounded mx-auto" /></td>
                        <td className="py-4"><div className="w-12 h-3 bg-slate-200 rounded mx-auto" /></td>
                        <td className="py-4"><div className="w-12 h-5 bg-slate-200 rounded-full mx-auto" /></td>
                        <td className="py-4"><div className="w-12 h-8 bg-slate-200 rounded-lg ml-auto" /></td>
                      </tr>
                    ))
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-gray-400 py-10 font-semibold">No customers registered on the platform.</td>
                    </tr>
                  ) : (
                    filteredCustomers.map(customer => {
                      const stats = getCustomerStats(customer._id);
                      return (
                        <tr key={customer._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 font-bold text-slate-800">{customer.name}</td>
                          <td className="py-3.5">
                            <span className="text-slate-600 block">{customer.email}</span>
                            <span className="text-[10px] text-slate-450">{customer.phone || 'No phone'}</span>
                          </td>
                          <td className="py-3.5 text-center font-bold text-slate-700">{stats.orderCount}</td>
                          <td className="py-3.5 text-center font-black text-indigo-650">₹{stats.spending.toLocaleString()}</td>
                          <td className="py-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${customer.isBlocked ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                              {customer.isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td className="py-3.5 text-right flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedCustomer(customer)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleBlock(customer._id)}
                              disabled={updatingId === customer._id}
                              className={`p-1.5 rounded-lg transition-colors ${customer.isBlocked ? 'text-emerald-500 hover:bg-emerald-50' : 'text-rose-500 hover:bg-rose-50'}`}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Sidebar */}
          {selectedCustomer && (
            <div className="w-[320px] bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col shrink-0 self-start">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-gray-900">Customer Profile</h3>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 border border-gray-200 hover:bg-slate-50 text-gray-450 hover:text-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Basic Details */}
              <div className="space-y-3.5 text-xs pb-4 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-650 text-sm">
                    {selectedCustomer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">{selectedCustomer.name}</span>
                    <span className={`text-[8px] font-bold uppercase ${selectedCustomer.isBlocked ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {selectedCustomer.isBlocked ? 'Blocked' : 'Active Account'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedCustomer.phone || 'No phone recorded'}</span>
                </div>
              </div>

              {/* Addresses */}
              <div className="text-xs pb-4 border-b border-gray-100 mb-4 flex-1">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[9px] mb-2 text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-500" /> Saved Addresses</h4>
                {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                    {selectedCustomer.addresses.map((addr, idx) => (
                      <div key={idx} className="p-2 border border-gray-150 rounded-xl bg-slate-50 text-[10px] text-slate-600 font-semibold">
                        <span className="font-bold text-slate-800 block mb-0.5">{addr.label} {addr.isDefault && <span className="text-[8px] bg-indigo-50 border border-indigo-105 text-indigo-600 px-1 py-0.2 rounded ml-1 uppercase font-black">Default</span>}</span>
                        <span>{addr.line1}, {addr.city}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-450 italic">No addresses saved.</span>
                )}
              </div>

              {/* Billing analytics */}
              <div className="text-xs space-y-3.5">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[9px] mb-2 text-slate-400 flex items-center gap-1"><ShoppingBag className="w-3 h-3 text-slate-500" /> Shopping Analytics</h4>
                {(() => {
                  const stats = getCustomerStats(selectedCustomer._id);
                  return (
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="p-3 border border-gray-100 rounded-2xl bg-indigo-50/20 text-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Orders</span>
                        <span className="text-lg font-black text-indigo-750">{stats.orderCount}</span>
                      </div>
                      <div className="p-3 border border-gray-100 rounded-2xl bg-indigo-50/20 text-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Spent</span>
                        <span className="text-lg font-black text-indigo-750">₹{stats.spending}</span>
                      </div>
                    </div>
                  );
                })()}

                <button
                  onClick={() => handleToggleBlock(selectedCustomer._id)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${selectedCustomer.isBlocked ? 'bg-emerald-650 hover:bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-555 text-white'}`}
                >
                  {selectedCustomer.isBlocked ? 'Activate Account' : 'Block Customer Access'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Customers;
