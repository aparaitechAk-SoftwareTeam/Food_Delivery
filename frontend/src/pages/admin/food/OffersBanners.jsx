import React, { useState, useEffect } from 'react';
import { ImageIcon, Plus, Edit2, Trash2, Save, X, RefreshCw, Eye, EyeOff } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';

const DEFAULT_BANNERS = [
  { title: 'Super Saver Mornings', description: 'Get flat 20% off on all breakfast combos', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop&q=60', cta: '/breakfast', isActive: true },
  { title: 'Craving Italian?', description: 'Freshly baked artisanal sourdough pizzas', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=60', cta: '/italian', isActive: true },
];

const OffersBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [cta, setCta] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/banners`);
      const data = await response.json();
      if (data.length === 0) {
        setBanners(DEFAULT_BANNERS.map((b, idx) => ({ ...b, _id: `b-${idx+1}`, id: `b-${idx+1}` })));
      } else {
        setBanners(data);
      }
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

  const handleEdit = (banner) => {
    setEditingId(banner._id || banner.id);
    setTitle(banner.title);
    setDescription(banner.description || '');
    setImage(banner.image || '');
    setCta(banner.cta || '');
    setIsActive(banner.isActive !== false);
  };

  const handleReset = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setImage('');
    setCta('');
    setIsActive(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !image.trim()) return;

    setLoading(true);
    const payload = { title, description, image, cta, isActive };
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />

        <main className="flex-1 p-8 flex gap-8">
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
                    <p className="text-[9px] text-indigo-500 font-bold mt-2">Redirect Link: {b.cta || 'N/A'}</p>
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
          <div className="w-[340px] bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col shrink-0 max-h-[85vh] overflow-y-auto">
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
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Target Click Redirect Link</label>
                <input 
                  type="text"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="e.g. /offers/pizza-feast"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50 focus:bg-white text-xs font-semibold"
                />
              </div>

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
        </main>
      </div>
    </div>
  );
};

export default OffersBanners;
