import React, { useState, useEffect } from 'react';
import { 
  Home, Layout, List, Store, ShoppingBag, Settings, 
  RefreshCw, Save, Star, Eye, EyeOff, Calendar, Link, 
  Layers, Megaphone, Ticket, CheckCircle2, ChevronRight, Ban
} from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';

const HomeManagement = () => {
  const [activeTab, setActiveTab] = useState('layout'); // layout, restaurants, foods, banners
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // States
  const [homeSections, setHomeSections] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [foods, setFoods] = useState([]);
  const [banners, setBanners] = useState([]);

  // Banner Form states
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerDescription, setBannerDescription] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerRedirectType, setBannerRedirectType] = useState('None');
  const [bannerRedirectValue, setBannerRedirectValue] = useState('');
  const [bannerOrder, setBannerOrder] = useState(0);
  const [bannerIsActive, setBannerIsActive] = useState(true);
  const [bannerStartDate, setBannerStartDate] = useState('');
  const [bannerEndDate, setBannerEndDate] = useState('');

  const token = localStorage.getItem('admin_token');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sectionsRes, restaurantsRes, foodsRes, bannersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/home-sections`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE_URL}/admin/restaurants`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE_URL}/admin/foods`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE_URL}/admin/banners`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
      ]);

      setHomeSections(Array.isArray(sectionsRes) ? sectionsRes.sort((a,b) => a.displayOrder - b.displayOrder) : []);
      setRestaurants(Array.isArray(restaurantsRes) ? restaurantsRes : []);
      setFoods(Array.isArray(foodsRes) ? foodsRes : []);
      setBanners(Array.isArray(bannersRes) ? bannersRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Update Section Handler
  const handleSaveSection = async (sec) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/home-sections/${sec.key}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: sec.title,
          isVisible: sec.isVisible,
          displayOrder: sec.displayOrder
        })
      });
      if (res.ok) {
        // Success
      } else {
        alert('Failed to save layout section.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Toggle Restaurant Field Handler
  const handleToggleRestaurantField = async (restaurantId, field, currentValue) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/restaurants`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: restaurantId,
          [field]: !currentValue
        })
      });
      if (res.ok) {
        setRestaurants(prev => prev.map(r => r._id === restaurantId ? { ...r, [field]: !currentValue } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Restaurant Priority Handler
  const handleSaveRestaurantPriority = async (restaurantId, priorityValue) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/restaurants`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: restaurantId,
          priority: parseInt(priorityValue) || 0
        })
      });
      if (res.ok) {
        setRestaurants(prev => prev.map(r => r._id === restaurantId ? { ...r, priority: parseInt(priorityValue) || 0 } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Food Field Handler
  const handleToggleFoodField = async (foodId, field, currentValue) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/foods/${foodId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          [field]: !currentValue
        })
      });
      if (res.ok) {
        setFoods(prev => prev.map(f => f._id === foodId ? { ...f, [field]: !currentValue } : f));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Food SortOrder Handler
  const handleSaveFoodOrder = async (foodId, sortOrderValue) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/foods/${foodId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sortOrder: parseInt(sortOrderValue) || 0
        })
      });
      if (res.ok) {
        setFoods(prev => prev.map(f => f._id === foodId ? { ...f, sortOrder: parseInt(sortOrderValue) || 0 } : f));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Banner Handlers
  const handleSelectBanner = (banner) => {
    setSelectedBanner(banner);
    setBannerTitle(banner.title || '');
    setBannerSubtitle(banner.subtitle || '');
    setBannerDescription(banner.description || '');
    setBannerImage(banner.image || '');
    setBannerRedirectType(banner.redirectType || 'None');
    setBannerRedirectValue(banner.redirectValue || '');
    setBannerOrder(banner.order || 0);
    setBannerIsActive(banner.isActive !== false);
    setBannerStartDate(banner.startDate ? banner.startDate.slice(0, 10) : '');
    setBannerEndDate(banner.endDate ? banner.endDate.slice(0, 10) : '');
  };

  const handleResetBannerForm = () => {
    setSelectedBanner(null);
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerDescription('');
    setBannerImage('');
    setBannerRedirectType('None');
    setBannerRedirectValue('');
    setBannerOrder(0);
    setBannerIsActive(true);
    setBannerStartDate('');
    setBannerEndDate('');
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title: bannerTitle,
      subtitle: bannerSubtitle,
      description: bannerDescription,
      image: bannerImage,
      redirectType: bannerRedirectType,
      redirectValue: bannerRedirectValue,
      order: parseInt(bannerOrder) || 0,
      isActive: bannerIsActive,
      startDate: bannerStartDate || null,
      endDate: bannerEndDate || null,
    };

    const method = selectedBanner ? 'PUT' : 'POST';
    const url = selectedBanner 
      ? `${API_BASE_URL}/admin/banners/${selectedBanner._id}`
      : `${API_BASE_URL}/admin/banners`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await loadAllData();
        handleResetBannerForm();
      } else {
        alert('Failed to save banner.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm('Delete this banner slot?')) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/banners/${bannerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setBanners(prev => prev.filter(b => b._id !== bannerId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />

        <main className="flex-1 p-8 flex flex-col gap-6">
          
          {/* Header */}
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200/85 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5"><Home className="w-5 h-5 text-indigo-500" /> Mobile Home Configuration</h2>
              <p className="text-[10px] text-gray-450 font-medium">Control headers, banners, categories order, featured restaurants, and choices displayed on the FoodExpress app Home screen.</p>
            </div>
            <button 
              onClick={loadAllData} 
              disabled={loading}
              className="p-2.5 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Configuration Navigation Tab Bar */}
          <div className="flex gap-2 border-b border-gray-200/60 pb-3">
            {[
              { id: 'layout', label: '1. Dynamic Section Layout', icon: <Layout className="w-4 h-4" /> },
              { id: 'banners', label: '2. Banners & Offers Carousel', icon: <Layers className="w-4 h-4" /> },
              { id: 'restaurants', label: '3. Featured & Trending Restaurants', icon: <Store className="w-4 h-4" /> },
              { id: 'foods', label: '4. Popular & Recommended choices', icon: <ShoppingBag className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${activeTab === tab.id ? 'bg-indigo-650 text-white border-indigo-650 shadow-sm' : 'bg-white hover:bg-slate-50 text-gray-600 border-gray-200/80'}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Active Configuration Area */}
          <div className="flex-1 flex gap-8">
            
            {/* Tab 1: Section Layout Reorder & Toggle */}
            {activeTab === 'layout' && (
              <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-slate-800">Layout Section Sequence & Visibility</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Toggle visibility, rename labels, and set sorting display priority parameters below.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 text-left">Section Key</th>
                        <th className="pb-3 text-left">Visible Label (Title)</th>
                        <th className="pb-3 text-center">Display Order</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {homeSections.map((sec, idx) => (
                        <tr key={sec.key} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 font-bold text-slate-500 uppercase tracking-wide text-[9px]">{sec.key}</td>
                          <td className="py-3.5">
                            <input 
                              type="text" 
                              value={sec.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setHomeSections(prev => prev.map(s => s.key === sec.key ? { ...s, title: val } : s));
                              }}
                              className="px-2 py-1 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 font-semibold text-slate-800 w-[200px]"
                            />
                          </td>
                          <td className="py-3.5 text-center">
                            <input 
                              type="number" 
                              value={sec.displayOrder}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setHomeSections(prev => prev.map(s => s.key === sec.key ? { ...s, displayOrder: val } : s));
                              }}
                              className="px-2 py-1 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 font-bold text-slate-800 w-[60px] text-center"
                            />
                          </td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={() => {
                                setHomeSections(prev => prev.map(s => s.key === sec.key ? { ...s, isVisible: !s.isVisible } : s));
                              }}
                              className={`px-3 py-1 rounded-full text-[9px] font-bold border transition-colors ${sec.isVisible ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                            >
                              {sec.isVisible ? 'Visible' : 'Hidden'}
                            </button>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => handleSaveSection(sec)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[9px] cursor-pointer flex items-center gap-1.5 ml-auto shadow-sm active:scale-95"
                            >
                              <Save className="w-3 h-3" />
                              <span>Update</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Banners & Offers */}
            {activeTab === 'banners' && (
              <div className="flex-1 flex gap-8">
                {/* Banner list list */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-slate-800">Banner Carousel Slots</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Click any slot to modify parameters or create a new slot on the right panel.</p>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {banners.length === 0 ? (
                      <div className="p-10 text-center text-gray-400 font-semibold">No banners configured yet.</div>
                    ) : (
                      banners.map(b => (
                        <div 
                          key={b._id} 
                          onClick={() => handleSelectBanner(b)}
                          className={`p-4 border rounded-2xl cursor-pointer hover:border-indigo-150 transition-all flex flex-col md:flex-row gap-4 ${selectedBanner?._id === b._id ? 'border-indigo-650 bg-indigo-50/10' : 'border-gray-200 bg-white'} ${!b.isActive ? 'opacity-60 bg-gray-50' : ''}`}
                        >
                          <img src={b.image} className="w-24 h-16 rounded-xl object-cover bg-slate-100 border border-slate-100 shrink-0" alt="" />
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                              {b.title}
                              <span className={`w-1.5 h-1.5 rounded-full ${b.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            </h4>
                            {b.subtitle && <p className="text-[9px] text-slate-500 font-semibold">{b.subtitle}</p>}
                            <p className="text-[10px] text-gray-400 mt-1">{b.description || 'No description'}</p>
                            <div className="flex gap-3.5 mt-2 text-[9px] text-slate-500 font-semibold">
                              <span className="flex items-center gap-0.5"><Link className="w-3 h-3 text-slate-400" /> Redirect: {b.redirectType} ({b.redirectValue || 'None'})</span>
                              {b.startDate && <span>🕒 Scheduled</span>}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteBanner(b._id); }}
                            className="p-1.5 border border-gray-200 hover:border-rose-250 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg self-start cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Banner Builder Form */}
                <div className="w-[340px] bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col shrink-0 max-h-[calc(100vh-200px)] overflow-y-auto">
                  <h3 className="text-xs font-bold text-slate-800 border-b border-gray-100 pb-3 flex items-center justify-between">
                    <span>{selectedBanner ? 'Edit Banner Slot' : 'Create Banner Slot'}</span>
                    {selectedBanner && (
                      <button onClick={handleResetBannerForm} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </h3>

                  <form onSubmit={handleSaveBanner} className="space-y-4 mt-4 text-xs font-semibold text-slate-650">
                    <div>
                      <label className="text-[9px] font-bold text-gray-450 uppercase tracking-wider block mb-1">Banner Title</label>
                      <input 
                        type="text" required value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)}
                        placeholder="e.g. Weekend Biryani Feast"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-455 uppercase tracking-wider block mb-1">Subtitle</label>
                      <input 
                        type="text" value={bannerSubtitle} onChange={(e) => setBannerSubtitle(e.target.value)}
                        placeholder="e.g. Up to ₹120 Cashback on checkout"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-455 uppercase tracking-wider block mb-1">Short Description</label>
                      <input 
                        type="text" value={bannerDescription} onChange={(e) => setBannerDescription(e.target.value)}
                        placeholder="e.g. Valid only on family bucket orders"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-455 uppercase tracking-wider block mb-1">Image URL</label>
                      <input 
                        type="text" required value={bannerImage} onChange={(e) => setBannerImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-semibold text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-gray-455 uppercase tracking-wider block mb-1">Redirect Target</label>
                        <select 
                          value={bannerRedirectType} onChange={(e) => setBannerRedirectType(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none bg-white cursor-pointer"
                        >
                          <option>None</option>
                          <option>Restaurant</option>
                          <option>Category</option>
                          <option>Offer</option>
                          <option>External Link</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-455 uppercase tracking-wider block mb-1">Redirect Value</label>
                        <input 
                          type="text" value={bannerRedirectValue} onChange={(e) => setBannerRedirectValue(e.target.value)}
                          placeholder="ID, label or URL"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-gray-455 uppercase tracking-wider block mb-1">Display Priority</label>
                        <input 
                          type="number" value={bannerOrder} onChange={(e) => setBannerOrder(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none text-slate-800"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <input 
                          type="checkbox" id="bannerIsActive" checked={bannerIsActive} onChange={(e) => setBannerIsActive(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-650 focus:ring-indigo-500"
                        />
                        <label htmlFor="bannerIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">Is Active</label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <label className="text-[9px] font-bold text-gray-455 uppercase tracking-wider block mb-1">Start Date</label>
                        <input 
                          type="date" value={bannerStartDate} onChange={(e) => setBannerStartDate(e.target.value)}
                          className="w-full px-2 py-2 border border-gray-200 rounded-xl outline-none text-slate-800 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-455 uppercase tracking-wider block mb-1">End Date</label>
                        <input 
                          type="date" value={bannerEndDate} onChange={(e) => setBannerEndDate(e.target.value)}
                          className="w-full px-2 py-2 border border-gray-200 rounded-xl outline-none text-slate-800 font-medium"
                        />
                      </div>
                    </div>
                    <button
                      type="submit" disabled={saving}
                      className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : selectedBanner ? 'Update Banner Slot' : 'Add Banner Slot'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Tab 3: Featured Restaurants */}
            {activeTab === 'restaurants' && (
              <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col overflow-hidden">
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-slate-800">Configure Featured & Trending Restaurants</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Define tags and ordering priorities of the restaurants visible on home lists.</p>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 text-left">Restaurant</th>
                        <th className="pb-3 text-center">Featured</th>
                        <th className="pb-3 text-center">Trending</th>
                        <th className="pb-3 text-center">New Tag</th>
                        <th className="pb-3 text-center">Recommended</th>
                        <th className="pb-3 text-center">Priority</th>
                        <th className="pb-3 text-center">Visibility</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {restaurants.map(rest => (
                        <tr key={rest._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <img src={rest.image} className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-100" alt="" />
                              <div>
                                <span className="font-bold text-slate-800 block">{rest.name}</span>
                                <span className="text-[9px] text-slate-400">{Array.isArray(rest.cuisine) ? rest.cuisine.join(', ') : rest.cuisine || 'Cuisine'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleToggleRestaurantField(rest._id, 'isFeatured', rest.isFeatured)}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center mx-auto transition-colors ${rest.isFeatured ? 'bg-indigo-50 border-indigo-200 text-indigo-650' : 'border-gray-200 text-gray-300 hover:text-gray-400'}`}
                            >
                              <Star className={`w-3.5 h-3.5 ${rest.isFeatured ? 'fill-indigo-500' : ''}`} />
                            </button>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleToggleRestaurantField(rest._id, 'isTrending', rest.isTrending)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors mx-auto ${rest.isTrending ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                            >
                              {rest.isTrending ? 'Trending' : 'No'}
                            </button>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleToggleRestaurantField(rest._id, 'isNewRestaurant', rest.isNewRestaurant)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors mx-auto ${rest.isNewRestaurant ? 'bg-teal-50 border-teal-100 text-teal-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                            >
                              {rest.isNewRestaurant ? 'New' : 'No'}
                            </button>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleToggleRestaurantField(rest._id, 'isRecommended', rest.isRecommended)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors mx-auto ${rest.isRecommended ? 'bg-pink-50 border-pink-100 text-pink-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                            >
                              {rest.isRecommended ? 'Recommended' : 'No'}
                            </button>
                          </td>
                          <td className="py-3 text-center">
                            <input 
                              type="number"
                              value={rest.priority || 0}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRestaurants(prev => prev.map(r => r._id === rest._id ? { ...r, priority: parseInt(val) || 0 } : r));
                              }}
                              onBlur={(e) => handleSaveRestaurantPriority(rest._id, e.target.value)}
                              className="w-12 px-1 py-0.5 border border-gray-200 rounded-md text-center font-bold text-slate-800 outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleToggleRestaurantField(rest._id, 'isActive', rest.isActive)}
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border transition-colors mx-auto ${rest.isActive !== false ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}
                            >
                              {rest.isActive !== false ? 'Enabled' : 'Disabled'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 4: Popular Foods */}
            {activeTab === 'foods' && (
              <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col overflow-hidden">
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-slate-800">Configure Popular, Recommended & Best Seller Dishes</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Toggle display tags and set sorting priorities of your catalog menu items.</p>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 text-left">Dish Item</th>
                        <th className="pb-3 text-center">Popular Choice</th>
                        <th className="pb-3 text-center">Best Seller</th>
                        <th className="pb-3 text-center">Recommended</th>
                        <th className="pb-3 text-center">Featured</th>
                        <th className="pb-3 text-center">Priority</th>
                        <th className="pb-3 text-center">Available</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {foods.map(item => (
                        <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <img src={item.image} className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-100" alt="" />
                              <div>
                                <span className="font-bold text-slate-800 block">{item.name}</span>
                                <span className="text-[9px] text-slate-400">{item.restaurant?.name || 'Restaurant'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleToggleFoodField(item._id, 'isPopular', item.isPopular)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors mx-auto ${item.isPopular ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                            >
                              {item.isPopular ? 'Popular' : 'No'}
                            </button>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleToggleFoodField(item._id, 'isBestSeller', item.isBestSeller)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors mx-auto ${item.isBestSeller ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                            >
                              {item.isBestSeller ? 'BestSeller' : 'No'}
                            </button>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleToggleFoodField(item._id, 'isRecommended', item.isRecommended)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors mx-auto ${item.isRecommended ? 'bg-pink-50 border-pink-100 text-pink-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                            >
                              {item.isRecommended ? 'Recommended' : 'No'}
                            </button>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleToggleFoodField(item._id, 'isFeatured', item.isFeatured)}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center mx-auto transition-colors ${item.isFeatured ? 'bg-indigo-50 border-indigo-200 text-indigo-650' : 'border-gray-200 text-gray-300 hover:text-gray-400'}`}
                            >
                              <Star className={`w-3.5 h-3.5 ${item.isFeatured ? 'fill-indigo-500' : ''}`} />
                            </button>
                          </td>
                          <td className="py-3 text-center">
                            <input 
                              type="number"
                              value={item.sortOrder || 0}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFoods(prev => prev.map(f => f._id === item._id ? { ...f, sortOrder: parseInt(val) || 0 } : f));
                              }}
                              onBlur={(e) => handleSaveFoodOrder(item._id, e.target.value)}
                              className="w-12 px-1 py-0.5 border border-gray-200 rounded-md text-center font-bold text-slate-800 outline-none focus:border-indigo-500"
                            />
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleToggleFoodField(item._id, 'isAvailable', item.isAvailable)}
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border transition-colors mx-auto ${item.isAvailable !== false ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}
                            >
                              {item.isAvailable !== false ? 'Available' : 'No'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </main>
      </div>
    </div>
  );
};

export default HomeManagement;
