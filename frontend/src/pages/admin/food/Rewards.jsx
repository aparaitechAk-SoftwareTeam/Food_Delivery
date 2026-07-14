import React, { useState, useEffect } from 'react';
import { Gift, Search, RefreshCw, Download, Calendar, CheckCircle2, Clock, Ban, Award, ToggleLeft, ToggleRight, XCircle } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';

const Rewards = () => {
  const [activeTab, setActiveTab] = useState('rewards'); // rewards, coupons
  
  // Cashback Rewards States
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Customer Coupons States
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponSearch, setCouponSearch] = useState('');
  const [couponFilterStatus, setCouponFilterStatus] = useState('All');

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

  const loadCoupons = async () => {
    setCouponsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `${API_BASE_URL}/admin/coupons?status=${couponFilterStatus}&search=${couponSearch}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setCouponsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'rewards') {
      loadRewards();
    } else {
      loadCoupons();
    }
  }, [activeTab, filterStatus, couponFilterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'rewards') {
      loadRewards();
    } else {
      loadCoupons();
    }
  };

  const handleUpdateCouponStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `${API_BASE_URL}/admin/coupons/${id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );
      if (response.ok) {
        loadCoupons();
      }
    } catch (err) {
      console.error(err);
    }
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

  const getCouponStatusBadge = (coupon) => {
    if (!coupon.active) {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-600">
          <XCircle className="w-3.5 h-3.5" />
          Disabled
        </span>
      );
    }
    switch (coupon.status) {
      case 'Active':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active
          </span>
        );
      case 'Used':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Used
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
            {coupon.status}
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
            {activeTab === 'rewards' && (
              <button
                onClick={exportToCSV}
                disabled={rewards.length === 0}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-gray-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 text-gray-500" />
                Export CSV
              </button>
            )}
          </div>

          {/* Tabs Switcher */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('rewards')}
              className={`pb-3 px-6 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'rewards'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-slate-600'
              }`}
            >
              Cashback Milestones Progress
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`pb-3 px-6 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'coupons'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-400 hover:text-slate-600'
              }`}
            >
              Redeemed Customer Coupons Wallet
            </button>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4 md:flex-row md:items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-[320px] flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                {activeTab === 'rewards' ? (
                  <input
                    type="text"
                    placeholder="Search customer name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors font-semibold"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Search coupon code or user..."
                    value={couponSearch}
                    onChange={(e) => setCouponSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors font-semibold"
                  />
                )}
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
                {activeTab === 'rewards' ? (
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 bg-white outline-none focus:border-indigo-500"
                  >
                    <option value="All">All Rewards</option>
                    <option value="Pending">Pending</option>
                    <option value="Eligible">Eligible</option>
                    <option value="Claimed">Claimed</option>
                    <option value="Expired">Expired</option>
                  </select>
                ) : (
                  <select
                    value={couponFilterStatus}
                    onChange={(e) => setCouponFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 bg-white outline-none focus:border-indigo-500"
                  >
                    <option value="All">All Coupons</option>
                    <option value="Active">Active</option>
                    <option value="Used">Used</option>
                    <option value="Expired">Expired</option>
                  </select>
                )}
              </div>

              <button
                onClick={activeTab === 'rewards' ? loadRewards : loadCoupons}
                className="p-2.5 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${(loading || couponsLoading) ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tab 1: Rewards Table */}
          {activeTab === 'rewards' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex-1 flex flex-col">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 text-left">Customer</th>
                      <th className="pb-3 text-center">Registration Date</th>
                      <th className="pb-3 text-center">Expiry Date</th>
                      <th className="pb-3 text-center">Completed Orders</th>
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
                          <td className="py-4"><div className="w-20 h-5 bg-slate-200 rounded-full mx-auto" /></td>
                        </tr>
                      ))
                    ) : rewards.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center text-gray-400 py-12 font-semibold">
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
                            <div className="flex justify-center">{getStatusBadge(reward.status)}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Coupons Table */}
          {activeTab === 'coupons' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex-1 flex flex-col">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 text-left">Coupon Code</th>
                      <th className="pb-3 text-left">Customer</th>
                      <th className="pb-3 text-center">Discount Value</th>
                      <th className="pb-3 text-center">Expiry Date</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-left">Redemption Info</th>
                      <th className="pb-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {couponsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4"><div className="w-24 h-3 bg-slate-200 rounded" /></td>
                          <td className="py-4">
                            <div className="w-32 h-3 bg-slate-200 rounded mb-1" />
                            <div className="w-24 h-2 bg-slate-100 rounded" />
                          </td>
                          <td className="py-4"><div className="w-12 h-3 bg-slate-200 rounded mx-auto" /></td>
                          <td className="py-4"><div className="w-24 h-3 bg-slate-200 rounded mx-auto" /></td>
                          <td className="py-4"><div className="w-20 h-5 bg-slate-200 rounded-full mx-auto" /></td>
                          <td className="py-4"><div className="w-32 h-3 bg-slate-200 rounded" /></td>
                          <td className="py-4"><div className="w-24 h-6 bg-slate-200 rounded mx-auto" /></td>
                        </tr>
                      ))
                    ) : coupons.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-gray-400 py-12 font-semibold">
                          No customer coupons found.
                        </td>
                      </tr>
                    ) : (
                      coupons.map((coupon) => (
                        <tr key={coupon._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 font-extrabold text-indigo-600 tracking-wide">
                            {coupon.code}
                          </td>
                          <td className="py-3.5">
                            <span className="font-bold text-slate-800 block">
                              {coupon.userId?.name || 'Global Coupon'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{coupon.userId?.email || '-'}</span>
                          </td>
                          <td className="py-3.5 text-center font-bold text-slate-800">
                            ₹{coupon.value} OFF ({coupon.discountType})
                          </td>
                          <td className="py-3.5 text-center text-slate-600 font-medium">
                            {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="py-3.5 text-center">
                            <div className="flex justify-center">{getCouponStatusBadge(coupon)}</div>
                          </td>
                          <td className="py-3.5 text-slate-600 font-medium">
                            {coupon.status === 'Used' && coupon.orderId ? (
                              <div>
                                <span className="font-bold text-slate-800 block text-[10px]">
                                  Order: #{coupon.orderId.orderNumber || 'View'}
                                </span>
                                <span className="text-[9px] text-slate-400 block">
                                  Amount Paid: ₹{coupon.orderId.totalAmount || '0'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {coupon.active ? (
                                <button
                                  onClick={() => handleUpdateCouponStatus(coupon._id, 'Disabled')}
                                  title="Deactivate / Disable Coupon"
                                  className="flex items-center gap-1 px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 transition-colors rounded-xl font-semibold"
                                >
                                  <ToggleLeft className="w-3.5 h-3.5" />
                                  Disable
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateCouponStatus(coupon._id, 'Active')}
                                  title="Activate Coupon"
                                  className="flex items-center gap-1 px-2.5 py-1.5 border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors rounded-xl font-semibold"
                                >
                                  <ToggleRight className="w-3.5 h-3.5" />
                                  Enable
                                </button>
                              )}
                              {coupon.status === 'Active' && (
                                <button
                                  onClick={() => handleUpdateCouponStatus(coupon._id, 'Expired')}
                                  title="Force Expire Coupon"
                                  className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors rounded-xl font-semibold"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  Expire
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
        </main>
      </div>
    </div>
  );
};

export default Rewards;
