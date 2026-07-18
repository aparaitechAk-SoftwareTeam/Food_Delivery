import React, { useState, useEffect } from 'react';
import { Gift, Search, RefreshCw, Plus, Trash2, Calendar, Percent, ShieldAlert } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';

const CampaignsManager = ({ isEmbed = false }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('All');
  const [cashbackPercentage, setCashbackPercentage] = useState('');
  const [cashbackCap, setCashbackCap] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const [campRes, catRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/campaigns`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json()),
        fetch(`${API_BASE_URL}/admin/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json()),
      ]);

      setCampaigns(Array.isArray(campRes) ? campRes : []);
      setCategories(Array.isArray(catRes) ? catRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !cashbackPercentage || !cashbackCap || !expiryDate) {
      alert('Please fill in all campaign fields');
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          category,
          cashbackPercentage: Number(cashbackPercentage),
          cashbackCap: Number(cashbackCap),
          expiryDate,
        }),
      });

      if (response.ok) {
        const newCamp = await response.json();
        setCampaigns((prev) => [newCamp, ...prev]);
        // Reset form
        setTitle('');
        setCategory('All');
        setCashbackPercentage('');
        setCashbackCap('');
        setExpiryDate('');
        alert('Cashback campaign created successfully!');
      } else {
        const err = await response.json();
        alert(err.message || 'Failed to create campaign');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (campaignId) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setCampaigns((prev) => prev.filter((c) => c._id !== campaignId));
        alert('Campaign deleted successfully');
      } else {
        alert('Failed to delete campaign');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const mainContent = (
    <div className={`flex gap-8 ${isEmbed ? 'flex-1' : 'flex-1 p-8'}`}>
      {/* Campaigns Table List */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Gift className="w-5 h-5 text-indigo-600" />
              Active Cashback Campaigns
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage category-specific instant cashback promotions.
            </p>
          </div>

          <button
            onClick={loadData}
            className="p-2.5 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-grow">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                <th className="pb-3 text-left">Title</th>
                <th className="pb-3 text-center">Category</th>
                <th className="pb-3 text-center">Cashback %</th>
                <th className="pb-3 text-center">Max Cap</th>
                <th className="pb-3 text-center">Expiry Date</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4"><div className="w-32 h-3 bg-slate-200 rounded" /></td>
                    <td className="py-4"><div className="w-20 h-3 bg-slate-200 rounded mx-auto" /></td>
                    <td className="py-4"><div className="w-12 h-3 bg-slate-200 rounded mx-auto" /></td>
                    <td className="py-4"><div className="w-12 h-3 bg-slate-200 rounded mx-auto" /></td>
                    <td className="py-4"><div className="w-20 h-3 bg-slate-200 rounded mx-auto" /></td>
                    <td className="py-4"><div className="w-8 h-8 bg-slate-200 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-gray-400 py-10 font-semibold">
                    No cashback campaigns created. Use the form to add one!
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => (
                  <tr key={camp._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 font-bold text-slate-800">{camp.title}</td>
                    <td className="py-3.5 text-center">
                      <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] font-bold text-indigo-600">
                        {camp.category}
                      </span>
                    </td>
                    <td className="py-3.5 text-center text-slate-800 font-bold">{camp.cashbackPercentage}%</td>
                    <td className="py-3.5 text-center text-slate-800 font-bold">₹{camp.cashbackCap}</td>
                    <td className="py-3.5 text-center text-slate-500 font-medium">
                      {new Date(camp.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(camp._id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Campaign Form Sidebar */}
      <div className="w-[340px] bg-white rounded-2xl border border-gray-200 shadow-sm p-6 shrink-0 h-fit">
        <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-600" />
          New Campaign
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Campaign Title
            </label>
            <input
              type="text"
              placeholder="e.g. Weekend Delight"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Qualifying Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-slate-700 bg-white outline-none focus:border-indigo-500"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Cashback Percentage
            </label>
            <div className="relative">
              <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                placeholder="e.g. 10"
                value={cashbackPercentage}
                onChange={(e) => setCashbackPercentage(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Max Cashback Cap (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 50"
              value={cashbackCap}
              onChange={(e) => setCashbackCap(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Expiry Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all duration-150 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Campaign'}
          </button>
        </form>
      </div>
    </div>
  );

  if (isEmbed) {
    return mainContent;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />
        {mainContent}
      </div>
    </div>
  );
};

export default CampaignsManager;
