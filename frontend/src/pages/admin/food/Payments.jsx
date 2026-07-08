import React, { useState, useEffect } from 'react';
import { CreditCard, Shield, Settings, Activity, CheckCircle, RefreshCw, Trash2, ArrowUpRight, Search, Ban } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';

const Payments = () => {
  const [methods, setMethods] = useState([
    { id: 'cod', name: 'Cash on Delivery', enabled: true, mode: 'Offline', description: 'Collect physical cash upon doorstep package handover.' },
    { id: 'upi', name: 'Direct UPI Intent', enabled: true, mode: 'Sandbox Integration', description: 'Deep-link directly to customer UPI banking apps.' },
    { id: 'card', name: 'Credit/Debit Card', enabled: false, mode: 'Stripe API Gateway', description: 'Accept global Visa, Mastercard, and RuPay card checkouts.' },
    { id: 'qr', name: 'Razorpay Dynamic QR Scan', enabled: true, mode: 'Razorpay API Gateway', description: 'Generate live QR codes for verified instant payments.' },
  ]);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGateway, setSelectedGateway] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders`);
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleMethod = (methodId) => {
    setMethods(prev => prev.map(m => m.id === methodId ? { ...m, enabled: !m.enabled } : m));
  };

  const handleProcessRefund = async (orderId) => {
    if (!window.confirm('Process refund for this transaction?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'Refunded' }),
      });
      if (response.ok) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, paymentStatus: 'Refunded' } : o));
        alert('Refund processed successfully!');
      } else {
        alert('Failed to process refund.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getFilteredTransactions = () => {
    return orders.filter(o => 
      o.paymentMethod !== 'Cash on Delivery' && (
        (o.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />
        
        <main className="flex-1 p-8 flex gap-8">
          {/* Gateways and Settings */}
          <div className="flex-1 space-y-8">
            {/* Gateways Grid */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5"><Shield className="w-4 h-4 text-indigo-500" /> Active Gateways</h2>
              <p className="text-[10px] text-gray-450 font-medium mb-6">Enable, disable, or modify authentication keys for customer checkout channels.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {methods.map(method => (
                  <div key={method.id} className="p-4 border border-gray-150 rounded-2xl bg-white shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-800">{method.name}</span>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={method.enabled} 
                            onChange={() => handleToggleMethod(method.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-650"></div>
                        </label>
                      </div>
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mt-2 inline-block">
                        {method.mode}
                      </span>
                      <p className="text-[10px] text-gray-400 font-medium mt-3 leading-relaxed">{method.description}</p>
                    </div>

                    <button 
                      onClick={() => setSelectedGateway(method)}
                      className="mt-4 w-full py-2 border border-gray-150 rounded-xl bg-slate-50 hover:bg-slate-100 text-[10px] font-bold text-gray-600 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Configure API Parameters</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions Log */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Activity className="w-4 h-4 text-emerald-500" /> Digital Transactions</h2>
                  <p className="text-[10px] text-gray-450 font-medium mt-1">Audit trail of cards, UPI checkouts, and dynamic QR validations.</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search order number or client..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <button onClick={loadData} className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors">
                    <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 text-left">Order ID</th>
                      <th className="pb-3 text-left">Customer</th>
                      <th className="pb-3 text-center">Amount</th>
                      <th className="pb-3 text-center">Gateway</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4"><div className="w-16 h-3 bg-slate-200 rounded" /></td>
                          <td className="py-4"><div className="w-24 h-3 bg-slate-200 rounded" /></td>
                          <td className="py-4"><div className="w-10 h-3 bg-slate-200 rounded mx-auto" /></td>
                          <td className="py-4"><div className="w-16 h-3 bg-slate-200 rounded mx-auto" /></td>
                          <td className="py-4"><div className="w-12 h-5 bg-slate-200 rounded-full mx-auto" /></td>
                          <td className="py-4"><div className="w-12 h-6 bg-slate-200 rounded-lg ml-auto" /></td>
                        </tr>
                      ))
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-gray-400 py-8 font-semibold">No digital transactions recorded.</td>
                      </tr>
                    ) : (
                      filteredTransactions.map(txn => (
                        <tr key={txn._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 font-bold text-slate-800">#{txn.orderNumber || txn._id.slice(-6).toUpperCase()}</td>
                          <td className="py-3">
                            <span className="font-bold text-slate-700 block">{txn.user?.name || 'Guest User'}</span>
                            <span className="text-[9px] text-slate-400">{txn.transactionId || 'TXN-GENERIC'}</span>
                          </td>
                          <td className="py-3 text-center font-bold text-slate-800">₹{txn.totalAmount}</td>
                          <td className="py-3 text-center font-semibold text-slate-550">{txn.paymentMethod}</td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${txn.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : txn.paymentStatus === 'Refunded' ? 'bg-indigo-50 text-indigo-650 border border-indigo-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                              {txn.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {txn.paymentStatus === 'Paid' && (
                              <button
                                onClick={() => handleProcessRefund(txn._id)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg font-bold text-[9px] cursor-pointer"
                              >
                                Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Gateway Settings Side panel */}
          {selectedGateway && (
            <div className="w-[300px] bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col shrink-0 self-start">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-gray-900">API Setup</h3>
                <button onClick={() => setSelectedGateway(null)} className="p-1 border border-gray-200 hover:bg-slate-50 text-gray-400 rounded-lg">
                  <Ban className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); alert('Saved parameters successfully!'); setSelectedGateway(null); }} className="space-y-4 text-xs font-semibold text-slate-600">
                <span className="font-bold text-slate-800 block text-xs mb-3">{selectedGateway.name} Settings</span>
                
                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Gateway Mode</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white outline-none">
                    <option>Sandbox / Test Environment</option>
                    <option>Production / Live Payments</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Merchant ID</label>
                  <input type="text" placeholder="mid_ex_12345" className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-indigo-500" />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Secret Access Key</label>
                  <input type="password" placeholder="••••••••••••••••" className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-indigo-500" />
                </div>

                <button type="submit" className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-bold cursor-pointer transition-colors">
                  Save Gateway
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Payments;
