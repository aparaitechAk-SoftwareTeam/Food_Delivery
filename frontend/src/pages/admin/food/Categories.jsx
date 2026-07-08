import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, FolderHeart, Save, X, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';

const DEFAULT_CATEGORIES = [
  { name: 'Breakfast', icon: '🍳', priority: 1, isVisible: true },
  { name: 'Bestsellers', icon: '🔥', priority: 2, isVisible: true },
  { name: 'Fresh Arrivals', icon: '🌟', priority: 3, isVisible: true },
  { name: 'Meal Bowls', icon: '🍛', priority: 4, isVisible: true },
  { name: 'Curated Combos', icon: '🍱', priority: 5, isVisible: true },
  { name: 'Guilt Free', icon: '🥗', priority: 6, isVisible: true },
  { name: 'Hot Beverages', icon: '☕', priority: 7, isVisible: true },
  { name: 'Cold Beverages', icon: '🥤', priority: 8, isVisible: true },
  { name: 'Sandwiches & Burgers', icon: '🍔', priority: 9, isVisible: true },
  { name: 'Maggi & Quick Bites', icon: '🍜', priority: 10, isVisible: true },
  { name: 'Pasta', icon: '🍝', priority: 11, isVisible: true },
  { name: 'Rolls & Wraps', icon: '🌯', priority: 12, isVisible: true },
  { name: 'Desserts', icon: '🍰', priority: 13, isVisible: true },
  { name: 'Chaats', icon: '🍢', priority: 14, isVisible: true },
  { name: 'Mexican Bowls', icon: '🌮', priority: 15, isVisible: true },
  { name: 'Snacks', icon: '🥨', priority: 16, isVisible: true },
  { name: 'Protein Rich', icon: '🍗', priority: 17, isVisible: true },
  { name: 'Under ₹99', icon: '🏷️', priority: 18, isVisible: true },
];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    icon: '🍽️',
    priority: 0,
    isVisible: true,
    image: '',
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories`);
      const data = await response.json();
      
      // If DB is empty, offer seed option or auto-populate DEFAULT_CATEGORIES
      if (data.length === 0) {
        setCategories(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, _id: `c-${i + 1}`, id: `c-${i + 1}` })));
      } else {
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setCategories(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, _id: `c-${i + 1}`, id: `c-${i + 1}` })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleEditClick = (cat) => {
    setEditingId(cat._id || cat.id);
    setFormData({
      name: cat.name,
      icon: cat.icon || '🍽️',
      priority: cat.priority || 0,
      isVisible: cat.isVisible !== false,
      image: cat.image || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', icon: '🍽️', priority: 0, isVisible: true, image: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      let url = `${API_BASE_URL}/admin/categories`;
      let method = 'POST';

      if (editingId) {
        url = `${url}/${editingId}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const saved = await response.json();
        // Update local state directly
        if (editingId) {
          setCategories(prev => prev.map(c => (c._id === editingId || c.id === editingId) ? saved : c));
        } else {
          setCategories(prev => [...prev, saved]);
        }
        handleCancelEdit();
      } else {
        // Fallback for mock environment
        const mockSaved = {
          _id: editingId || `c-${categories.length + 1}`,
          id: editingId || `c-${categories.length + 1}`,
          ...formData,
        };
        if (editingId) {
          setCategories(prev => prev.map(c => (c._id === editingId || c.id === editingId) ? mockSaved : c));
        } else {
          setCategories(prev => [...prev, mockSaved]);
        }
        handleCancelEdit();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setCategories(prev => prev.filter(c => c._id !== id && c.id !== id));
      } else {
        // Mock fallback
        setCategories(prev => prev.filter(c => c._id !== id && c.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (cat) => {
    const updatedVisible = !cat.isVisible;
    const catId = cat._id || cat.id;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${catId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: updatedVisible }),
      });
      if (response.ok) {
        setCategories(prev => prev.map(c => (c._id === catId || c.id === catId) ? { ...c, isVisible: updatedVisible } : c));
      } else {
        setCategories(prev => prev.map(c => (c._id === catId || c.id === catId) ? { ...c, isVisible: updatedVisible } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reordering controls
  const handleMove = (index, direction) => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= categories.length) return;
    
    const list = [...categories];
    // Swap priorities & positions
    const tempPriority = list[index].priority;
    list[index].priority = list[nextIndex].priority;
    list[nextIndex].priority = tempPriority;

    const [removed] = list.splice(index, 1);
    list.splice(nextIndex, 0, removed);
    setCategories(list);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />

        <main className="flex-1 p-8 flex gap-8">
          {/* Main Grid View */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5"><FolderHeart className="w-5 h-5 text-indigo-500" /> Category Manager</h2>
                <p className="text-[10px] text-gray-400 mt-1">Order and setup menu categories visible to customers.</p>
              </div>
              <button 
                onClick={loadCategories}
                className="p-2 border border-gray-200 rounded-xl bg-white hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Reload"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
              {categories.sort((a,b) => (a.priority || 0) - (b.priority || 0)).map((cat, idx) => (
                <div 
                  key={cat._id || cat.id} 
                  className={`flex items-center justify-between p-3.5 rounded-xl border border-gray-200/80 hover:border-indigo-100 bg-white transition-all ${!cat.isVisible ? 'opacity-60 bg-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-1 bg-slate-50 border border-slate-100 rounded-lg">{cat.icon || '🍽️'}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{cat.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Priority Order: {cat.priority}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Move controls */}
                    <button 
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-indigo-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === categories.length - 1}
                      className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-indigo-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Actions */}
                    <button 
                      onClick={() => handleToggleVisibility(cat)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title={cat.isVisible ? 'Hide Category' : 'Show Category'}
                    >
                      {cat.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleEditClick(cat)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat._id || cat.id)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form sidebar */}
          <div className="w-[340px] bg-white rounded-2xl border border-gray-200 shadow-sm p-6 self-start">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>{editingId ? 'Edit Category' : 'Create Category'}</span>
              {editingId && (
                <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Category Name</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Pizza, Salad, Desserts"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50/50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Icon / Emoji</label>
                  <input 
                    type="text"
                    required
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50/50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Priority Order</label>
                  <input 
                    type="number"
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Banner Image Link</label>
                <input 
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50/50 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="isVisible"
                  checked={formData.isVisible}
                  onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isVisible" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">Visible to Mobile App</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editingId ? 'Update Category' : 'Add Category'}</span>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Categories;
