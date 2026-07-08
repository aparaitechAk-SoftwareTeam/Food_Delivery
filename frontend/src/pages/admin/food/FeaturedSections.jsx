import React, { useState, useEffect } from 'react';
import { ChefHat, Save, Edit2, Trash2, Plus, X, Check, RefreshCw } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';

const DEFAULT_SECTIONS = [
  { title: '🔥 Bestsellers', subtitle: 'Most loved dishes near you', maxItems: 10, isVisible: true, displayOrder: 1 },
  { title: '🌟 Fresh Arrivals', subtitle: 'Recently added delicacies on our catalog', maxItems: 10, isVisible: true, displayOrder: 2 },
  { title: '🏷️ Under ₹99', subtitle: 'Tasty budget bites under ninety-nine rupees', maxItems: 10, isVisible: true, displayOrder: 3 },
  { title: '🥗 Healthy Choices', subtitle: 'Calorie count balanced nutritious meals', maxItems: 8, isVisible: true, displayOrder: 4 },
];

const FeaturedSections = () => {
  const [sections, setSections] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [maxItems, setMaxItems] = useState(10);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [secRes, foodsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/sections`).then(res => res.json()).catch(() => []),
        fetch(`${API_BASE_URL}/admin/foods`).then(res => res.json()).catch(() => [])
      ]);
      
      if (secRes.length === 0) {
        setSections(DEFAULT_SECTIONS.map((s, idx) => ({ ...s, _id: `sec-${idx+1}`, id: `sec-${idx+1}`, items: [] })));
      } else {
        setSections(secRes);
      }
      setFoods(foodsRes);
    } catch (err) {
      console.error(err);
      setSections(DEFAULT_SECTIONS.map((s, idx) => ({ ...s, _id: `sec-${idx+1}`, id: `sec-${idx+1}`, items: [] })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleEdit = (sec) => {
    setEditingId(sec._id || sec.id);
    setTitle(sec.title);
    setSubtitle(sec.subtitle || '');
    setMaxItems(sec.maxItems || 10);
    setDisplayOrder(sec.displayOrder || 1);
    setSelectedItems((sec.items || []).map(item => item._id || item.id || item).filter(Boolean));
  };

  const handleReset = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setMaxItems(10);
    setDisplayOrder(1);
    setSelectedItems([]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const payload = { title, subtitle, maxItems, displayOrder, items: selectedItems, isVisible: true };

    try {
      let url = `${API_BASE_URL}/admin/sections`;
      let method = 'POST';

      if (editingId) {
        url = `${url}/${editingId}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await loadData();
        handleReset();
      } else {
        // Fallback mock
        const mockPopulatedItems = selectedItems.map(id => foods.find(f => f._id === id || f.id === id)).filter(Boolean);
        const mockSec = {
          _id: editingId || `sec-${sections.length + 1}`,
          id: editingId || `sec-${sections.length + 1}`,
          ...payload,
          items: mockPopulatedItems,
        };
        if (editingId) {
          setSections(prev => prev.map(s => (s._id === editingId || s.id === editingId) ? mockSec : s));
        } else {
          setSections(prev => [...prev, mockSec]);
        }
        handleReset();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this featured section?')) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/sections/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setSections(prev => prev.filter(s => s._id !== id && s.id !== id));
      } else {
        setSections(prev => prev.filter(s => s._id !== id && s.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />

        <main className="flex-1 p-8 flex gap-8">
          {/* Sections List */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5"><ChefHat className="w-5 h-5 text-indigo-500" /> Featured Homepage Rows</h2>
                <p className="text-[10px] text-gray-400 font-medium">Control featured rows visible on the mobile home screen.</p>
              </div>
              <button onClick={loadData} className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {sections.sort((a,b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map((sec) => (
                <div key={sec._id || sec.id} className="p-4 border border-gray-250/70 hover:border-indigo-150 rounded-2xl bg-white shadow-sm flex items-start justify-between gap-4 transition-all">
                  <div>
                    <h4 className="text-xs font-black text-slate-800">{sec.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">{sec.subtitle}</p>
                    <div className="flex items-center gap-4 mt-2.5 text-[10px] text-slate-500 font-semibold">
                      <span>Limit: {sec.maxItems} items</span>
                      <span>Order Rank: {sec.displayOrder}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {sec.items?.length === 0 ? (
                        <span className="text-[9px] text-gray-400 italic">No dishes assigned. Click edit to assign.</span>
                      ) : (
                        sec.items?.map(item => (
                          <span key={item._id || item.id || item} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-500">
                            {item.name || 'Catalog Item'}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(sec)} className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(sec._id || sec.id)} className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editor Form sidebar */}
          <div className="w-[360px] bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col shrink-0 max-h-[85vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>{editingId ? 'Edit Homepage Row' : 'Add Homepage Row'}</span>
              {editingId && (
                <button onClick={handleReset} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </h3>

            <form onSubmit={handleSave} className="space-y-4.5 mt-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Row Title</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ⭐ Chef Recommendations"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Row Subtitle</label>
                <input 
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Curated by our top culinary masters"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50 focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Display Rank</label>
                  <input 
                    type="number"
                    required
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none text-center bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Items Limit</label>
                  <input 
                    type="number"
                    required
                    value={maxItems}
                    onChange={(e) => setMaxItems(parseInt(e.target.value) || 10)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none text-center bg-gray-50/50"
                  />
                </div>
              </div>

              {/* Items checklist */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Assign Dishes ({selectedItems.length})</label>
                <div className="border border-gray-200 rounded-xl max-h-[220px] overflow-y-auto p-2 space-y-1 bg-gray-50/50">
                  {foods.map(food => {
                    const isSelected = selectedItems.includes(food._id || food.id);
                    return (
                      <div 
                        key={food._id || food.id}
                        onClick={() => handleSelectItem(food._id || food.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                          isSelected ? 'bg-indigo-65/10 border-indigo-150 text-indigo-700' : 'bg-white border-gray-150 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-semibold truncate max-w-[200px]">{food.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Homepage Row</span>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FeaturedSections;
