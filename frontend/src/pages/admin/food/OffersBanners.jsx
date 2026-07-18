import React, { useState, useEffect } from 'react';
import { ImageIcon, Plus, Edit2, Trash2, Save, X, RefreshCw, Eye, EyeOff, Check } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';

const DEFAULT_BANNERS = [
  { title: 'Super Saver Mornings', description: 'Get flat 20% off on all breakfast combos', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop&q=60', cta: '/breakfast', isActive: true },
  { title: 'Craving Italian?', description: 'Freshly baked artisanal sourdough pizzas', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=60', cta: '/italian', isActive: true },
];

const OffersBanners = ({ isEmbed = false }) => {
  const [banners, setBanners] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [cta, setCta] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // New Banner promo fields
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [redirectType, setRedirectType] = useState('None');

  const loadBanners = async () => {
    setLoading(true);
    try {
      const [bannersRes, foodsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/banners`).then(res => res.json()).catch(() => []),
        fetch(`${API_BASE_URL}/admin/foods`).then(res => res.json()).catch(() => [])
      ]);

      if (bannersRes.length === 0) {
        setBanners(DEFAULT_BANNERS.map((b, idx) => ({ ...b, _id: `b-${idx+1}`, id: `b-${idx+1}` })));
      } else {
        setBanners(bannersRes);
      }
      setFoods(foodsRes);
    } catch (err) {
      console.error(err);
      setBanners(DEFAULT_BANNERS.map((b, idx) => ({ ...b, _id: `b-${idx+1}`, id: `b-${idx+1}` })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleSelectItem = (itemId) => {
    if (selectedFoods.includes(itemId)) {
      setSelectedFoods(selectedFoods.filter(id => id !== itemId));
    } else {
      setSelectedFoods([...selectedFoods, itemId]);
    }
  };

  const handleEdit = (banner) => {
    setEditingId(banner._id || banner.id);
    setTitle(banner.title);
    setDescription(banner.description || '');
    setImage(banner.image || '');
    setCta(banner.cta || '');
    setIsActive(banner.isActive !== false);

    // Populate food select and discount
    const foodIds = (banner.foods || []).map(item => {
      if (!item) return '';
      return item._id || item.id || item;
    }).filter(Boolean);
    setSelectedFoods(foodIds);
    setDiscountPercentage(banner.discountPercentage || 0);
    setRedirectType(banner.redirectType || (banner.foods && banner.foods.length > 0 ? 'Foods' : (banner.cta ? 'Link' : 'None')));
  };

  const handleReset = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setImage('');
    setCta('');
    setIsActive(true);
    setSelectedFoods([]);
    setDiscountPercentage(0);
    setRedirectType('None');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !image.trim()) return;

    setLoading(true);
    const finalRedirectType = redirectType === 'Foods' && selectedFoods.length > 0 ? 'Foods' : (redirectType === 'Link' ? 'Link' : 'None');
    const payload = {
      title,
      description,
      image,
      cta: finalRedirectType === 'Link' ? cta : '',
      isActive,
      foods: finalRedirectType === 'Foods' ? selectedFoods : [],
      discountPercentage: finalRedirectType === 'Foods' ? Number(discountPercentage) : 0,
      redirectType: finalRedirectType
    };
    let url = `${API_BASE_URL}/admin/banners`;
    let method = 'POST';

    if (editingId) {
      url = `${url}/${editingId}`;
      method = 'PUT';
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let responseData = {};
      try {
        responseData = JSON.parse(responseText);
      } catch (parseErr) {}

      if (response.ok) {
        await loadBanners();
        handleReset();
      } else {
        const errorMsg = responseData.message || responseText || "Unknown backend error";
        console.error("Save banner API failed:", {
          requestUrl: url,
          method,
          payload,
          statusCode: response.status,
          response: responseText,
          error: errorMsg
        });
        alert(`Failed to save banner:\nStatus: ${response.status}\nError: ${errorMsg}`);
      }
    } catch (err) {
      console.error("Save banner network exception:", {
        requestUrl: url,
        method,
        payload,
        error: err.message
      });
      alert(`Network error saving banner:\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/banners/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setBanners(prev => prev.filter(b => b._id !== id && b.id !== id));
      } else {
        setBanners(prev => prev.filter(b => b._id !== id && b.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (banner) => {
    const updatedState = !banner.isActive;
    const bannerId = banner._id || banner.id;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/banners/${bannerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: updatedState })
      });
      if (response.ok) {
        setBanners(prev => prev.map(b => (b._id === bannerId || b.id === bannerId) ? { ...b, isActive: updatedState } : b));
      } else {
        setBanners(prev => prev.map(b => (b._id === bannerId || b.id === bannerId) ? { ...b, isActive: updatedState } : b));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const mainContent = (
    <div className={`flex gap-8 ${isEmbed ? 'flex-1' : 'flex-1 p-8 h-[calc(100vh-140px)]'}`}>
      {/* Banner list */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5"><ImageIcon className="w-5 h-5 text-indigo-500" /> Banner Manager</h2>
            <p className="text-[10px] text-gray-400 font-medium">Configure top slides, middle offers and promo banners visible on the platform.</p>
          </div>
          <button onClick={loadBanners} className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 pr-2">
          {banners.map((b) => (
            <div key={b._id || b.id} className={`p-4 border border-gray-250/70 hover:border-indigo-150 rounded-2xl bg-white shadow-sm flex flex-col md:flex-row gap-4 transition-all ${!b.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
              {b.image ? (
                <img src={b.image} className="w-24 h-16 rounded-xl object-cover border border-slate-100 shadow-sm shrink-0" alt="" />
              ) : (
                <div className="w-24 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">🖼️</div>
              )}

              <div className="flex-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  {b.title}
                  <span className={`w-2 h-2 rounded-full ${b.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">{b.description}</p>
                <p className="text-[9px] text-indigo-500 font-bold mt-2">
                  {b.redirectType === 'Foods' || (b.foods && b.foods.length > 0) ? (
                    `Promo Foods: ${b.foods?.length || 0} items (${b.discountPercentage || 0}% Off)`
                  ) : (
                    `Redirect Link: ${b.cta || 'N/A'}`
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleToggleActive(b)} className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors">
                  {b.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => handleEdit(b)} className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(b._id || b.id)} className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-rose-600 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Builder Form */}
      <div className={`w-[340px] bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col shrink-0 overflow-y-auto ${isEmbed ? 'max-h-[calc(100vh-255px)]' : 'max-h-[85vh]'}`}>
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
          <span>{editingId ? 'Edit Banner Slot' : 'Create Banner Slot'}</span>
          {editingId && (
            <button onClick={handleReset} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </h3>

        <form onSubmit={handleSave} className="space-y-4.5 mt-4 text-xs">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Banner Title</label>
            <input 
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekend Pizza Feast"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs font-semibold"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Short Subtext Description</label>
            <input 
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Get 2 free drinks with large pizza purchase"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50 focus:bg-white text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Image Link</label>
            <input 
              type="text"
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50 focus:bg-white text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-450 uppercase tracking-wider block mb-1">Click Action / Target Type</label>
            <select
              value={redirectType}
              onChange={(e) => {
                const type = e.target.value;
                setRedirectType(type);
                if (type !== 'Foods') {
                  setSelectedFoods([]);
                  setDiscountPercentage(0);
                }
              }}
              className="w-full px-3.5 py-2 border border-gray-250 rounded-xl focus:outline-none bg-gray-50/50 focus:bg-white text-xs font-semibold"
            >
              <option value="None">None (Just Display)</option>
              <option value="Link">Open Redirect Link / Category</option>
              <option value="Foods">Show Selected Foods with Discount</option>
            </select>
          </div>

          {redirectType === 'Link' && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Target Click Redirect Link</label>
              <input 
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="e.g. /offers/pizza-feast"
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50 focus:bg-white text-xs font-semibold"
              />
            </div>
          )}

          {redirectType === 'Foods' && (
            <>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Banner Discount (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 20"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50 focus:bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Select Foods ({selectedFoods.length})</label>
                <div className="border border-gray-200 rounded-xl max-h-[160px] overflow-y-auto p-2 space-y-1 bg-gray-50/50">
                  {foods.map(food => {
                    const foodId = food._id || food.id;
                    const isSelected = selectedFoods.includes(foodId);
                    return (
                      <div 
                        key={foodId}
                        onClick={() => handleSelectItem(foodId)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border text-[10px] ${
                          isSelected ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'bg-white border-gray-150 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate max-w-[200px]">{food.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">Active Visibility</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Banner Profile</span>
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

export default OffersBanners;
