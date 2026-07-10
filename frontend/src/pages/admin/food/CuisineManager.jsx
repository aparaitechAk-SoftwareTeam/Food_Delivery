import React, { useState, useEffect } from 'react';
import { Utensils, Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';

const DEFAULT_CUISINES = ['Italian', 'North Indian', 'South Indian', 'Chinese', 'Continental', 'Mexican', 'Fast Food', 'Desserts'];

const CuisineManager = () => {
  const [cuisines, setCuisines] = useState([]);
  const [foods, setFoods] = useState([]);
  const [newCuisine, setNewCuisine] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/foods`);
      const data = await response.json();
      setFoods(data);

      const extracted = new Set();
      data.forEach(f => {
        if (f.cuisine) extracted.add(f.cuisine);
      });
      DEFAULT_CUISINES.forEach(c => extracted.add(c));
      setCuisines(Array.from(extracted));
    } catch (err) {
      console.error(err);
      setCuisines(DEFAULT_CUISINES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCuisine = (e) => {
    e.preventDefault();
    if (!newCuisine.trim() || cuisines.includes(newCuisine.trim())) return;
    setCuisines(prev => [...prev, newCuisine.trim()]);
    setNewCuisine('');
  };

  const handleDeleteCuisine = (cuisineName) => {
    if (!window.confirm(`Delete cuisine "${cuisineName}"?`)) return;
    setCuisines(prev => prev.filter(c => c !== cuisineName));
  };

  const getCuisineCount = (cuisineName) => {
    return foods.filter(f => f.cuisine === cuisineName).length;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />

        <main className="flex-1 p-8 flex gap-8">
          {/* Cuisines Grid */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5"><Utensils className="w-5 h-5 text-indigo-500" /> Cuisine Manager</h2>
                <p className="text-[10px] text-gray-400 font-medium">Configure culinary classifications that group recipes on the search dashboard.</p>
              </div>
              <button onClick={loadData} className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[60vh] pr-2">
              {cuisines.map(cuisineName => (
                <div key={cuisineName} className="p-3.5 border border-gray-200 rounded-xl bg-white flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {cuisineName}
                    </span>
                    <span className="text-[9px] text-gray-400 font-medium mt-1 block">{getCuisineCount(cuisineName)} foods associated</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteCuisine(cuisineName)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Create cuisine sidebar */}
          <div className="w-[300px] bg-white rounded-2xl border border-gray-200 shadow-sm p-6 self-start shrink-0">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Add New Cuisine</h3>
            <form onSubmit={handleAddCuisine} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Cuisine Name</label>
                <input 
                  type="text"
                  required
                  value={newCuisine}
                  onChange={(e) => setNewCuisine(e.target.value)}
                  placeholder="e.g. Thai, Lebanese"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Cuisine</span>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CuisineManager;
