import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';

const DEFAULT_TAGS = ['New', 'Trending', 'Bestseller', 'Healthy', 'High Protein', 'Low Calorie', 'Sugar Free', 'Combo', 'Recommended', 'Chef Choice', 'Hot', 'Cold', 'Seasonal'];

const Tags = () => {
  const [tags, setTags] = useState([]);
  const [foods, setFoods] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/foods`);
      const data = await response.json();
      setFoods(data);

      // Collect all tags from foods & append default list
      const extracted = new Set();
      data.forEach(f => (f.tags || []).forEach(t => extracted.add(t)));
      DEFAULT_TAGS.forEach(t => extracted.add(t));
      setTags(Array.from(extracted));
    } catch (err) {
      console.error(err);
      setTags(DEFAULT_TAGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTag = (e) => {
    e.preventDefault();
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setTags(prev => [...prev, newTag.trim()]);
    setNewTag('');
  };

  const handleDeleteTag = (tagName) => {
    if (!window.confirm(`Delete tag "${tagName}"?`)) return;
    setTags(prev => prev.filter(t => t !== tagName));
  };

  const getTagCount = (tagName) => {
    return foods.filter(f => (f.tags || []).includes(tagName)).length;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />

        <main className="flex-1 p-8 flex gap-8">
          {/* Main tags grid */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5"><Tag className="w-5 h-5 text-indigo-500" /> Catalog Tags</h2>
                <p className="text-[10px] text-gray-400 font-medium">Global tags for categorization, filtering, and mobile app search indexes.</p>
              </div>
              <button onClick={loadData} className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[60vh] pr-2">
              {tags.map(tagName => (
                <div key={tagName} className="p-3.5 border border-gray-200 rounded-xl bg-white flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {tagName}
                    </span>
                    <span className="text-[9px] text-gray-400 font-medium mt-1 block">{getTagCount(tagName)} foods associated</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteTag(tagName)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Create tag sidebar */}
          <div className="w-[300px] bg-white rounded-2xl border border-gray-200 shadow-sm p-6 self-start shrink-0">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Create New Tag</h3>
            <form onSubmit={handleAddTag} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Tag Label Name</label>
                <input 
                  type="text"
                  required
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="e.g. Sugar Free, Gluten Free"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save New Tag</span>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Tags;
