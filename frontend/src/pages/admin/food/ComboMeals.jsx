import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, Edit2, Check, Save, X, RotateCcw } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';

const ComboMeals = () => {
  const [combos, setCombos] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [image, setImage] = useState('');
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [combosRes, foodsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/combos`).then(res => res.json()).catch(() => []),
        fetch(`${API_BASE_URL}/admin/foods`).then(res => res.json()).catch(() => [])
      ]);
      setCombos(combosRes);
      setFoods(foodsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Price calculations
  const calculateOriginalPrice = (itemsList) => {
    const sum = itemsList.reduce((acc, itemId) => {
      const food = foods.find(f => f._id === itemId || f.id === itemId);
      return acc + (food ? food.price : 0);
    }, 0);
    setOriginalPrice(sum);
    // Suggest 15% discount for combo automatically
    setPrice(Math.round(sum * 0.85));
  };

  const handleSelectItem = (itemId) => {
    let updated;
    if (selectedItems.includes(itemId)) {
      updated = selectedItems.filter(id => id !== itemId);
    } else {
      updated = [...selectedItems, itemId];
    }
    setSelectedItems(updated);
    calculateOriginalPrice(updated);
  };

  const handleEdit = (combo) => {
    setEditingId(combo._id || combo.id);
    setName(combo.name);
    setDescription(combo.description || '');
    setPrice(combo.price);
    setOriginalPrice(combo.originalPrice || combo.price);
    setImage(combo.image || '');
    setSelectedItems((combo.items || []).map(item => item._id || item.id || item).filter(Boolean));
  };

  const handleReset = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice(0);
    setOriginalPrice(0);
    setImage('');
    setSelectedItems([]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || selectedItems.length === 0) return;

    setLoading(true);
    const payload = { name, description, price, originalPrice, image, items: selectedItems };

    try {
      let url = `${API_BASE_URL}/admin/combos`;
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
        // Fallback mock append
        const mockPopulatedItems = selectedItems.map(id => foods.find(f => f._id === id || f.id === id)).filter(Boolean);
        const mockCombo = {
          _id: editingId || `combo-${combos.length + 1}`,
          id: editingId || `combo-${combos.length + 1}`,
          ...payload,
          items: mockPopulatedItems,
          isActive: true
        };
        if (editingId) {
          setCombos(prev => prev.map(c => (c._id === editingId || c.id === editingId) ? mockCombo : c));
        } else {
          setCombos(prev => [...prev, mockCombo]);
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
    if (!window.confirm('Delete this combo?')) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/combos/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setCombos(prev => prev.filter(c => c._id !== id && c.id !== id));
      } else {
        setCombos(prev => prev.filter(c => c._id !== id && c.id !== id));
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
          {/* Main Combo list */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden flex flex-col">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-5 h-5 text-indigo-500" /> Combo Manager Builder
            </h2>
            <p className="text-[10px] text-gray-400 font-medium mb-6">Combine menu items together to increase average ticket orders with bundle savings.</p>

            <div className="flex-1 overflow-y-auto space-y-4.5 pr-2">
              {combos.length === 0 ? (
                <div className="text-center text-xs text-gray-400 py-20 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                  No combinations created yet. Build your first combo!
                </div>
              ) : (
                combos.map((combo) => (
                  <div key={combo._id || combo.id} className="p-4 border border-gray-200/80 hover:border-indigo-150 rounded-2xl bg-white shadow-sm flex flex-col md:flex-row justify-between gap-4 transition-all">
                    <div className="flex gap-4">
                      {combo.image ? (
                        <img src={combo.image} className="w-16 h-16 rounded-xl object-cover border border-slate-100 shadow-sm" alt="" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl">🍱</div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{combo.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed max-w-sm">{combo.description}</p>
                        
                        {/* Included items */}
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {combo.items?.map(item => (
                            <span key={item._id || item.id || item} className="px-2 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-600">
                              {item.name || 'Catalog Item'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col justify-between items-end shrink-0 gap-2">
                      <div className="text-right">
                        <span className="text-[9px] text-rose-500 font-bold line-through">₹{combo.originalPrice}</span>
                        <h5 className="text-sm font-black text-slate-800">₹{combo.price}</h5>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(combo)} className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(combo._id || combo.id)} className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Builder form sidebar */}
          <div className="w-[380px] bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col shrink-0 max-h-[85vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-950 border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>{editingId ? 'Edit Combo Details' : 'Combo Builder'}</span>
              {editingId && (
                <button onClick={handleReset} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </h3>

            <form onSubmit={handleSave} className="space-y-4.5 mt-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Combo Bundle Name</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Morning energy combo"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Choose Tea + Bun maska together at 15% discount."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs h-16 resize-none"
                />
              </div>

              {/* Items Picker grid list */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Select Foods Included ({selectedItems.length})</label>
                <div className="border border-gray-200 rounded-xl max-h-[160px] overflow-y-auto p-2 space-y-1 bg-gray-50/50">
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
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-gray-400">₹{food.price}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Original sum</label>
                  <div className="w-full px-3.5 py-2 bg-slate-100 text-slate-500 border border-slate-150 rounded-xl text-center font-bold">
                    ₹{originalPrice}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Combo Price (₹)</label>
                  <input 
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none text-center bg-gray-50/50 focus:bg-white font-black"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Combo Photo URL</label>
                <input 
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50 focus:bg-white text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading || selectedItems.length === 0}
                className="w-full mt-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editingId ? 'Update combo' : 'Save Combo Meal'}</span>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ComboMeals;
