import React, { useState, useEffect } from 'react';
import { Utensils, Plus, Trash2, Save, RefreshCw, AlertCircle } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';

const CuisineManager = () => {
  const [cuisines, setCuisines] = useState([]);
  const [foods, setFoods] = useState([]);
  const [newCuisine, setNewCuisine] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [cuisinesRes, foodsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/cuisines`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/foods`, { credentials: 'include' }),
      ]);
      const cuisinesData = await cuisinesRes.json();
      const foodsData = await foodsRes.json();
      setCuisines(Array.isArray(cuisinesData) ? cuisinesData : []);
      setFoods(Array.isArray(foodsData) ? foodsData : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCuisine = async (e) => {
    e.preventDefault();
    if (!newCuisine.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/cuisines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newCuisine.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to add cuisine.');
        return;
      }
      setCuisines(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCuisine('');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCuisine = async (cuisine) => {
    if (!window.confirm(`Delete cuisine "${cuisine.name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/cuisines/${cuisine._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Failed to delete.');
        return;
      }
      setCuisines(prev => prev.filter(c => c._id !== cuisine._id));
    } catch (err) {
      alert('Network error. Please try again.');
    }
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
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                  <Utensils className="w-5 h-5 text-indigo-500" /> Cuisine Manager
                </h2>
                <p className="text-[10px] text-gray-400 font-medium">Configure culinary classifications. New cuisines instantly appear in Food Items.</p>
              </div>
              <button onClick={loadData} className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">Loading cuisines…</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[60vh] pr-2">
                {cuisines.map(cuisine => (
                  <div key={cuisine._id} className="p-3.5 border border-gray-200 rounded-xl bg-white flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        {cuisine.name}
                      </span>
                      <span className="text-[9px] text-gray-400 font-medium mt-1 block">{getCuisineCount(cuisine.name)} foods associated</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCuisine(cuisine)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {cuisines.length === 0 && (
                  <div className="col-span-3 text-center text-xs text-gray-400 py-8">No cuisines found. Add one to get started.</div>
                )}
              </div>
            )}
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
                disabled={saving}
                className="w-full mt-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saving ? 'Saving…' : 'Save Cuisine'}</span>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CuisineManager;
