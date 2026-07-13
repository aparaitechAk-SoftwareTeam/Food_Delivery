import React, { useState, useEffect } from 'react';
import { Gift, Search, RefreshCw, Download, Calendar, CheckCircle2, Clock, Ban, Award } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';

const Rewards = () => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const loadRewards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `${API_BASE_URL}/admin/rewards?status=${filterStatus}&search=${searchTerm}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setRewards(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewards();
  }, [filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRewards();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-600">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case 'Eligible':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-600">
            <Award className="w-3.5 h-3.5" />
            Eligible
          </span>
        );
      case 'Claimed':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Claimed
          </span>
        );
      case 'Expired':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-500">
            <Ban className="w-3.5 h-3.5" />
            Expired
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 border border-slate-150 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Customer Name',
      'Customer Email',
      'Registration Date',
      'Expiry Date',
      'Completed Orders',
      'Total Required',
      'Wallet Balance',
      'Wallet Credited',
      'Status',
    ];

    const rows = rewards.map((r) => [
      r.userId?.name || 'Unknown User',
      r.userId?.email || '',
      r.userId?.createdAt ? new Date(r.userId.createdAt).toLocaleString() : '',
      r.expiryDate ? new Date(r.expiryDate).toLocaleString() : '',
      r.completedOrders || 0,
      r.totalRequiredOrders || 4,
      r.userId?.walletBalance || 0,
      r.status === 'Claimed' ? '₹150' : 'No',
      r.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cashback_rewards_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />

        <main className="flex-1 p-8 flex flex-col gap-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Gift className="w-6 h-6 text-indigo-600" />
                Cashback Reward Manager
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Monitor and manage New User Cashback Reward progress, eligibility, claims, and expiry.
              </p>
            </div>
            <button
              onClick={exportToCSV}
              disabled={rewards.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-gray-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 text-gray-500" />
              Export CSV
            </button>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4 md:flex-row md:items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-[320px] flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customer name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-slate-700 bg-white outline-none focus:border-indigo-500"
                >
                  <option value="All">All Rewards</option>
                  <option value="Pending">Pending</option>
                  <option value="Eligible">Eligible</option>
                  <option value="Claimed">Claimed</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <button
                onClick={loadRewards}
                className="p-2.5 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Rewards List Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 text-left">Customer</th>
                    <th className="pb-3 text-center">Registration Date</th>
                    <th className="pb-3 text-center">Expiry Date</th>
                    <th className="pb-3 text-center">Completed Orders</th>
                    <th className="pb-3 text-center">Wallet Credited</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4">
                          <div className="w-32 h-3 bg-slate-200 rounded mb-1" />
                          <div className="w-24 h-2 bg-slate-100 rounded" />
                        </td>
                        <td className="py-4"><div className="w-24 h-3 bg-slate-200 rounded mx-auto" /></td>
                        <td className="py-4"><div className="w-24 h-3 bg-slate-200 rounded mx-auto" /></td>
                        <td className="py-4"><div className="w-12 h-3 bg-slate-200 rounded mx-auto" /></td>
                        <td className="py-4"><div className="w-16 h-3 bg-slate-200 rounded mx-auto" /></td>
                        <td className="py-4"><div className="w-20 h-5 bg-slate-200 rounded-full mx-auto" /></td>
                      </tr>
                    ))
                  ) : rewards.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-gray-400 py-12 font-semibold">
                        No cashback rewards found.
                      </td>
                    </tr>
                  ) : (
                    rewards.map((reward) => (
                      <tr key={reward._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5">
                          <span className="font-bold text-slate-800 block">
                            {reward.userId?.name || 'Unknown User'}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{reward.userId?.email || '-'}</span>
                        </td>
                        <td className="py-3.5 text-center text-slate-600 font-medium">
                          {reward.userId?.createdAt ? new Date(reward.userId.createdAt).toLocaleString() : '-'}
                        </td>
                        <td className="py-3.5 text-center text-slate-600 font-medium">
                          {reward.expiryDate ? new Date(reward.expiryDate).toLocaleString() : '-'}
                        </td>
                        <td className="py-3.5 text-center font-bold text-slate-800">
                          {reward.completedOrders} / {reward.totalRequiredOrders}
                        </td>
                        <td className="py-3.5 text-center">
                          {reward.status === 'Claimed' ? (
                            <span className="text-emerald-600 font-extrabold">₹{reward.cashbackAmount} Credited</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          <div className="flex justify-center">{getStatusBadge(reward.status)}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Rewards;
