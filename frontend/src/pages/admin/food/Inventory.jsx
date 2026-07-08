import React, { useState, useEffect } from 'react';
import { Database, Save, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';

const Inventory = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const loadFoods = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/foods`);
      const data = await response.json();
      setFoods(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFoods();
  }, []);

  const handleStockChange = (id, newStock) => {
    setFoods(prev => prev.map(f => (f._id === id || f.id === id) ? { ...f, stock: parseInt(newStock) || 0 } : f));
  };

  const handleToggleAvailable = async (food) => {
    const updatedState = !food.isAvailable;
    const foodId = food._id || food.id;
    
    // Optimistic local update
    setFoods(prev => prev.map(f => (f._id === foodId || f.id === foodId) ? { ...f, isAvailable: updatedState } : f));

    try {
      await fetch(`${API_BASE_URL}/admin/foods/${foodId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: updatedState })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveStock = async (food) => {
    const foodId = food._id || food.id;
    setSavingId(foodId);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/foods/${foodId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: food.stock, isAvailable: food.stock > 0 ? food.isAvailable : false })
      });
      if (response.ok) {
        // If stock is 0, auto disable availability
        if (food.stock === 0) {
          setFoods(prev => prev.map(f => (f._id === foodId || f.id === foodId) ? { ...f, isAvailable: false } : f));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setSavingId(null), 600);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />

        <main className="flex-1 p-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5"><Database className="w-5 h-5 text-indigo-500" /> Stock Inventory Manager</h2>
                <p className="text-[10px] text-gray-400 font-medium">Instantly edit stock items and platform visibility indicators.</p>
              </div>
              <button onClick={loadFoods} className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Dish Name</th>
                    <th className="p-4 text-center">Current Stock</th>
                    <th className="p-4 text-center">Availability status</th>
                    <th className="p-4 text-center">System Alerts</th>
                    <th className="p-4 text-right">Instant Save</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {foods.map((food) => (
                    <tr key={food._id || food.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{food.name}</td>
                      <td className="p-4 text-center">
                        <input 
                          type="number"
                          value={food.stock !== undefined ? food.stock : 99}
                          onChange={(e) => handleStockChange(food._id || food.id, e.target.value)}
                          className="w-20 px-2.5 py-1 border border-gray-250 rounded-lg text-center font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleAvailable(food)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                            food.isAvailable 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-rose-50 text-rose-500 border border-rose-100'
                          }`}
                        >
                          {food.isAvailable ? 'In Stock / Active' : 'Suspended / Hidden'}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        {(food.stock || 0) === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                            <AlertTriangle className="w-3 h-3" /> Out of stock
                          </span>
                        ) : (food.stock || 0) < 10 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleSaveStock(food)}
                          disabled={savingId === (food._id || food.id)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all active:scale-95 disabled:bg-emerald-500 disabled:text-white"
                        >
                          {savingId === (food._id || food.id) ? (
                            <Check className="w-3.5 h-3.5 inline" />
                          ) : (
                            <Save className="w-3.5 h-3.5 inline" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Inventory;
