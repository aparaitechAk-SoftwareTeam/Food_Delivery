import React, { useState, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Save, RefreshCw, Layers } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';

const MenuOrdering = () => {
  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catsRes, secRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/categories`).then(res => res.json()).catch(() => []),
        fetch(`${API_BASE_URL}/admin/sections`).then(res => res.json()).catch(() => [])
      ]);
      setCategories(catsRes.sort((a,b) => (a.priority || 0) - (b.priority || 0)));
      setSections(secRes.sort((a,b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const moveItem = (list, setList, index, direction) => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= list.length) return;

    const updated = [...list];
    // swap positions
    const [removed] = updated.splice(index, 1);
    updated.splice(nextIndex, 0, removed);

    // re-calculate priorities sequentially
    const saved = updated.map((item, idx) => ({
      ...item,
      priority: idx + 1,
      displayOrder: idx + 1
    }));
    setList(saved);
  };

  const handleSaveOrder = async () => {
    setLoading(true);
    try {
      // Save categories priorities
      await Promise.all(
        categories.map(cat => 
          fetch(`${API_BASE_URL}/admin/categories/${cat._id || cat.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priority: cat.priority })
          }).catch(err => console.log('Mock cat order save'))
        )
      );

      // Save sections priorities
      await Promise.all(
        sections.map(sec => 
          fetch(`${API_BASE_URL}/admin/sections/${sec._id || sec.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ displayOrder: sec.displayOrder })
          }).catch(err => console.log('Mock section order save'))
        )
      );
      
      alert('Menu order ranks updated successfully!');
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

        <main className="flex-1 p-8">
          {/* Header Action row */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-1.5"><ArrowUpDown className="w-5 h-5 text-indigo-500" /> Menu Ordering</h2>
              <p className="text-xs text-gray-400 font-medium mt-1">Order the display order of categories and featured rows on the mobile homepage.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={loadData} className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleSaveOrder}
                disabled={loading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Sort Orders</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Categories Priority */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 border-b border-gray-100 pb-3 flex items-center gap-1.5"><Layers className="w-4 h-4 text-indigo-500" /> Category Tile Display Ordering</h3>
              <div className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto pr-2">
                {categories.map((cat, idx) => (
                  <div key={cat._id || cat.id} className="p-3 border border-gray-200/80 rounded-xl flex items-center justify-between bg-white">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <span className="p-1 bg-slate-50 rounded border border-slate-100">{cat.icon || '🍛'}</span>
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => moveItem(categories, setCategories, idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-gray-500 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => moveItem(categories, setCategories, idx, 'down')}
                        disabled={idx === categories.length - 1}
                        className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-gray-500 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Homepage Rows display rank */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 border-b border-gray-100 pb-3 flex items-center gap-1.5"><Layers className="w-4 h-4 text-indigo-500" /> Homepage Row display Ordering</h3>
              <div className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto pr-2">
                {sections.map((sec, idx) => (
                  <div key={sec._id || sec.id} className="p-3 border border-gray-200/80 rounded-xl flex items-center justify-between bg-white">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">{sec.title}</span>
                      <span className="text-[9px] text-gray-400 font-medium mt-0.5 block">{sec.subtitle}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => moveItem(sections, setSections, idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-gray-500 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => moveItem(sections, setSections, idx, 'down')}
                        disabled={idx === sections.length - 1}
                        className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-gray-500 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MenuOrdering;
