import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, RefreshCw, Upload, Download, Eye, Check, X, ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';

const CUISINES = ['Italian', 'North Indian', 'South Indian', 'Chinese', 'Continental', 'Mexican', 'Fast Food', 'Desserts'];
const SPICE_LEVELS = ['None', 'Mild', 'Medium', 'Spicy', 'Extra Hot'];
const DIETARY_LABELS = ['Veg', 'Egg', 'Non Veg'];

const FoodItems = () => {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedDiet, setSelectedDiet] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [sortOption, setSortOption] = useState('name');
  
  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkValue, setBulkValue] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add/Edit Form Sidebar toggle
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: 0,
    discountPercentage: 0,
    originalPrice: 0,
    category: '',
    cuisine: 'North Indian',
    subcategory: '',
    preparationTime: 20,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    servingSize: '1 Person',
    isVeg: true,
    dietType: 'Veg', // Veg, Egg, Non Veg
    spiceLevel: 'Medium',
    isAvailable: true,
    stock: 99,
    isFeatured: false,
    isPopular: false,
    isBestSeller: false,
    isFreshArrival: false,
    isChefSpecial: false,
    isRecommended: false,
    isCustomizable: false,
    tags: '',
    image: '',
    sortOrder: 0,
  });

  // Ref for canvas image resize/compress
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);

  // Load backend collections
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [foodsRes, catsRes] = await Promise.all([
        fetch('http://192.168.137.149:5000/api/admin/foods').then(res => res.json()).catch(() => []),
        fetch('http://192.168.137.149:5000/api/admin/categories').then(res => res.json()).catch(() => [])
      ]);
      setFoods(foodsRes);
      setCategories(catsRes);
    } catch (err) {
      console.error(err);
      setError('Unable to reach backend Catalog APIs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Client-side canvas compression/resizing
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Output as compressed base64 JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality compression
        setFormData(prev => ({ ...prev, image: compressedBase64 }));
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  // Form edit selectors
  const handleEditClick = (item) => {
    setEditingId(item._id || item.id);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      shortDescription: item.shortDescription || '',
      price: item.price || 0,
      discountPercentage: item.discountPercentage || 0,
      originalPrice: item.originalPrice || item.price || 0,
      category: item.category?._id || item.category || '',
      cuisine: item.cuisine || 'North Indian',
      subcategory: item.subcategory || '',
      preparationTime: item.preparationTime || 20,
      calories: item.calories || 0,
      protein: item.protein || 0,
      carbs: item.carbs || 0,
      fat: item.fat || 0,
      servingSize: item.servingSize || '1 Person',
      isVeg: item.isVeg !== false,
      dietType: item.isVeg ? 'Veg' : 'Non Veg',
      spiceLevel: item.spiceLevel || 'Medium',
      isAvailable: item.isAvailable !== false,
      stock: item.stock !== undefined ? item.stock : 99,
      isFeatured: item.isFeatured || false,
      isPopular: item.isPopular || false,
      isBestSeller: item.isBestSeller || false,
      isFreshArrival: item.isFreshArrival || false,
      isChefSpecial: item.isChefSpecial || false,
      isRecommended: item.isRecommended || false,
      isCustomizable: item.isCustomizable || false,
      tags: (item.tags || []).join(', '),
      image: item.image || '',
      sortOrder: item.sortOrder || 0,
    });
    setFormOpen(true);
  };

  const handleCreateClick = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      price: 0,
      discountPercentage: 0,
      originalPrice: 0,
      category: categories[0]?._id || '',
      cuisine: 'North Indian',
      subcategory: '',
      preparationTime: 20,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      servingSize: '1 Person',
      isVeg: true,
      dietType: 'Veg',
      spiceLevel: 'Medium',
      isAvailable: true,
      stock: 99,
      isFeatured: false,
      isPopular: false,
      isBestSeller: false,
      isFreshArrival: false,
      isChefSpecial: false,
      isRecommended: false,
      isCustomizable: false,
      tags: '',
      image: '',
      sortOrder: 0,
    });
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Format tags array
    const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
    const payload = {
      ...formData,
      tags: tagsArray,
      isVeg: formData.dietType === 'Veg',
    };

    try {
      let url = 'http://192.168.137.149:5000/api/admin/foods';
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
        const saved = await response.json();
        if (editingId) {
          setFoods(prev => prev.map(f => (f._id === editingId || f.id === editingId) ? saved : f));
        } else {
          setFoods(prev => [...prev, saved]);
        }
        setFormOpen(false);
      } else {
        // Mock fallback update
        const mockSaved = {
          _id: editingId || `f-${foods.length + 1}`,
          id: editingId || `f-${foods.length + 1}`,
          ...payload,
          category: categories.find(c => c._id === formData.category || c.id === formData.category) || { name: 'Catalog' }
        };
        if (editingId) {
          setFoods(prev => prev.map(f => (f._id === editingId || f.id === editingId) ? mockSaved : f));
        } else {
          setFoods(prev => [...prev, mockSaved]);
        }
        setFormOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this food item?')) return;
    setLoading(true);
    try {
      const response = await fetch(`http://192.168.137.149:5000/api/admin/foods/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setFoods(prev => prev.filter(f => f._id !== id && f.id !== id));
      } else {
        setFoods(prev => prev.filter(f => f._id !== id && f.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Bulk Operations triggers
  const handleBulkExecute = async () => {
    if (selectedIds.length === 0 || !bulkAction) return;

    setLoading(true);
    try {
      const response = await fetch('http://192.168.137.149:5000/api/admin/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          action: bulkAction,
          value: bulkValue
        })
      });

      if (response.ok) {
        // Reload fresh listings
        await loadData();
        setSelectedIds([]);
        setBulkAction('');
        setBulkValue('');
      } else {
        // Mock execution fallback
        setFoods(prev => {
          let list = [...prev];
          if (bulkAction === 'delete') {
            list = list.filter(f => !selectedIds.includes(f._id || f.id));
          } else {
            list = list.map(f => {
              if (selectedIds.includes(f._id || f.id)) {
                if (bulkAction === 'disable') return { ...f, isAvailable: false };
                if (bulkAction === 'enable') return { ...f, isAvailable: true };
                if (bulkAction === 'change_price') return { ...f, price: Number(bulkValue) };
              }
              return f;
            });
          }
          return list;
        });
        setSelectedIds([]);
        setBulkAction('');
        setBulkValue('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Selection toggles
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredFoods.map(f => f._id || f.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (foods.length === 0) return;
    const headers = ['Name', 'Description', 'Price', 'Cuisine', 'Veg', 'Stock', 'Available'];
    const rows = foods.map(f => [
      `"${f.name}"`,
      `"${f.description || ''}"`,
      f.price,
      f.cuisine,
      f.isVeg ? 'Yes' : 'No',
      f.stock !== undefined ? f.stock : 99,
      f.isAvailable ? 'Yes' : 'No'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'foodexpress_menu.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
  const handleImportCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result;
      const lines = text.split('\n').slice(1); // skip headers
      const parsedItems = lines.map(line => {
        const parts = line.split(',');
        if (parts.length < 5) return null;
        return {
          name: parts[0]?.replace(/"/g, '').trim(),
          description: parts[1]?.replace(/"/g, '').trim(),
          price: parseFloat(parts[2]) || 0,
          cuisine: parts[3]?.trim() || 'Indian',
          isVeg: parts[4]?.trim().toLowerCase() === 'yes',
          isAvailable: true,
          stock: 99
        };
      }).filter(Boolean);

      if (parsedItems.length === 0) return;

      setLoading(true);
      try {
        const response = await fetch('http://192.168.137.149:5000/api/admin/bulk-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'foods', items: parsedItems })
        });
        if (response.ok) {
          await loadData();
        } else {
          // Mock append
          setFoods(prev => [
            ...prev,
            ...parsedItems.map((pi, idx) => ({ ...pi, _id: `f-csv-${prev.length + idx + 1}`, id: `f-csv-${prev.length + idx + 1}` }))
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Derived Filtered List
  const filteredFoods = useMemo(() => {
    let list = [...foods];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(q) || (f.tags || []).some(t => t.toLowerCase().includes(q)));
    }

    if (selectedCategory) {
      list = list.filter(f => f.category?._id === selectedCategory || f.category === selectedCategory);
    }

    if (selectedCuisine) {
      list = list.filter(f => f.cuisine === selectedCuisine);
    }

    if (selectedDiet) {
      const isVeg = selectedDiet === 'Veg';
      list = list.filter(f => f.isVeg === isVeg);
    }

    if (selectedAvailability) {
      const isAvail = selectedAvailability === 'Available';
      list = list.filter(f => f.isAvailable === isAvail);
    }

    list.sort((a, b) => {
      if (sortOption === 'name') return a.name.localeCompare(b.name);
      if (sortOption === 'price_asc') return a.price - b.price;
      if (sortOption === 'price_desc') return b.price - a.price;
      return 0;
    });

    return list;
  }, [foods, searchTerm, selectedCategory, selectedCuisine, selectedDiet, selectedAvailability, sortOption]);

  const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);
  const paginatedFoods = useMemo(() => {
    const idx = (currentPage - 1) * itemsPerPage;
    return filteredFoods.slice(idx, idx + itemsPerPage);
  }, [filteredFoods, currentPage]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />

        <main className="flex-1 p-8 flex gap-6 items-start">
          {/* Main List */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden flex flex-col">
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-5 bg-white">
              <div>
                <h3 className="text-base font-bold text-gray-900">Food Directory Catalog</h3>
                <p className="text-[10px] text-gray-400 font-medium mt-1">Manage food details, inventory, tags and discounts.</p>
              </div>

              {/* Actions bar */}
              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  ref={csvInputRef} 
                  onChange={handleImportCSV} 
                  accept=".csv" 
                  className="hidden" 
                />
                <button 
                  onClick={() => csvInputRef.current?.click()}
                  className="px-3.5 py-2 border border-gray-200 rounded-xl bg-white text-xs font-bold text-gray-600 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import CSV</span>
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 border border-gray-200 rounded-xl bg-white text-xs font-bold text-gray-600 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button 
                  onClick={handleCreateClick}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-600/10"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Item</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-50/50 p-4 rounded-2xl border border-gray-100 mb-5">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search item, tags..."
                  className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />
              </div>

              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
              </select>

              <select 
                value={selectedCuisine} 
                onChange={(e) => setSelectedCuisine(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none bg-white"
              >
                <option value="">All Cuisines</option>
                {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                value={selectedDiet} 
                onChange={(e) => setSelectedDiet(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none bg-white"
              >
                <option value="">All Diets</option>
                <option value="Veg">Vegetarian</option>
                <option value="NonVeg">Non-Vegetarian</option>
              </select>

              <select 
                value={sortOption} 
                onChange={(e) => setSortOption(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none bg-white"
              >
                <option value="name">Sort Alphabetically</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            {/* Bulk actions bar */}
            {selectedIds.length > 0 && (
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-700">{selectedIds.length} items selected</span>
                <div className="flex items-center gap-2">
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="px-3 py-1.5 border border-indigo-200 rounded-lg text-xs font-semibold bg-white text-gray-700 focus:outline-none"
                  >
                    <option value="">Bulk Actions</option>
                    <option value="enable">Enable Availability</option>
                    <option value="disable">Disable Availability</option>
                    <option value="delete">Delete Permanently</option>
                  </select>
                  <button 
                    onClick={handleBulkExecute}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="p-4 w-10">
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll} 
                        checked={selectedIds.length === filteredFoods.length && filteredFoods.length > 0} 
                        className="rounded border-gray-300 text-indigo-600"
                      />
                    </th>
                    <th className="p-4">Dish</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Cuisine</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFoods.map((item) => (
                    <tr key={item._id || item.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(item._id || item.id)}
                          onChange={(e) => handleSelectOne(item._id || item.id, e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img src={item.image} className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm" alt="" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sm font-bold">🍔</div>
                          )}
                          <div>
                            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                              {item.name}
                              <span className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} title={item.isVeg ? 'Veg' : 'Non Veg'} />
                            </h4>
                            <p className="text-[10px] text-gray-400 mt-0.5 max-w-[200px] truncate">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500 font-semibold">{item.category?.name || item.category || 'N/A'}</td>
                      <td className="p-4 font-black text-slate-800">₹{item.price}</td>
                      <td className="p-4 text-slate-500 font-medium">{item.cuisine}</td>
                      <td className="p-4 font-bold text-slate-600">{item.stock !== undefined ? item.stock : 99} units</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {item.isAvailable ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button 
                            onClick={() => handleEditClick(item)} 
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item._id || item.id)} 
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 pt-5 mt-5">
                <span className="text-xs text-gray-500 font-medium">Page {currentPage} of {totalPages}</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Drawer (Absolute Sidebar) */}
          {formOpen && (
            <div className="w-[420px] bg-white border border-gray-200 rounded-2xl p-6 shadow-sm self-start flex flex-col max-h-[85vh] overflow-y-auto shrink-0">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-gray-950">{editingId ? 'Edit Dish Profile' : 'New Dish Profile'}</h3>
                <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                {/* Image resize/crop upload preview */}
                <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-dashed border-gray-200/80">
                  {formData.image ? (
                    <div className="relative">
                      <img src={formData.image} className="w-24 h-24 rounded-2xl object-cover border border-white shadow-md" alt="" />
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-2xl bg-white border border-gray-150 flex flex-col items-center justify-center text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors shadow-sm"
                    >
                      <Plus className="w-6 h-6" />
                      <span className="text-[10px] font-bold mt-1">Upload Photo</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden" 
                  />
                  <span className="text-[9px] text-gray-400 text-center font-medium">Automatic 400x400 client canvas crop & JPEG compression applied</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Dish Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Schezwan Fried Rice"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Short Description</label>
                  <input 
                    type="text" 
                    value={formData.shortDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                    placeholder="Brief description for mobile slides"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Price (₹)</label>
                    <input 
                      type="number" 
                      required
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none text-center bg-gray-50/50 focus:bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Discount %</label>
                    <input 
                      type="number" 
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none text-center bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50 font-bold"
                    >
                      {categories.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Cuisine</label>
                    <select 
                      value={formData.cuisine}
                      onChange={(e) => setFormData(prev => ({ ...prev, cuisine: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50"
                    >
                      {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Diet</label>
                    <select 
                      value={formData.dietType}
                      onChange={(e) => setFormData(prev => ({ ...prev, dietType: e.target.value }))}
                      className="w-full px-2.5 py-2 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50"
                    >
                      {DIETARY_LABELS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Spice</label>
                    <select 
                      value={formData.spiceLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, spiceLevel: e.target.value }))}
                      className="w-full px-2.5 py-2 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50"
                    >
                      {SPICE_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Prep (Mins)</label>
                    <input 
                      type="number" 
                      value={formData.preparationTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, preparationTime: parseInt(e.target.value) || 20 }))}
                      className="w-full px-2.5 py-2 border border-gray-200 rounded-xl focus:outline-none text-center bg-gray-50/50"
                    />
                  </div>
                </div>

                {/* Nutrition info */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-gray-150 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nutritional Profile</h4>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <span className="text-[9px] text-gray-400 block mb-0.5">Cals</span>
                      <input 
                        type="number" 
                        value={formData.calories}
                        onChange={(e) => setFormData(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                        className="w-full py-1 border border-gray-250 rounded-lg text-center focus:outline-none bg-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 block mb-0.5">Protein</span>
                      <input 
                        type="number" 
                        value={formData.protein}
                        onChange={(e) => setFormData(prev => ({ ...prev, protein: parseInt(e.target.value) || 0 }))}
                        className="w-full py-1 border border-gray-250 rounded-lg text-center focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 block mb-0.5">Carbs</span>
                      <input 
                        type="number" 
                        value={formData.carbs}
                        onChange={(e) => setFormData(prev => ({ ...prev, carbs: parseInt(e.target.value) || 0 }))}
                        className="w-full py-1 border border-gray-250 rounded-lg text-center focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 block mb-0.5">Fats</span>
                      <input 
                        type="number" 
                        value={formData.fat}
                        onChange={(e) => setFormData(prev => ({ ...prev, fat: parseInt(e.target.value) || 0 }))}
                        className="w-full py-1 border border-gray-250 rounded-lg text-center focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Serving Size</label>
                    <input 
                      type="text" 
                      value={formData.servingSize}
                      onChange={(e) => setFormData(prev => ({ ...prev, servingSize: e.target.value }))}
                      placeholder="e.g. 500ml, 1 Bowl"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Stock Units</label>
                    <input 
                      type="number" 
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none text-center bg-gray-50/50"
                    />
                  </div>
                </div>

                {/* Tags input */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Meta Tags (comma separated)</label>
                  <input 
                    type="text" 
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="Bestseller, High Protein, Sugar Free"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none bg-gray-50/50 text-xs"
                  />
                </div>

                {/* Flags grid */}
                <div className="p-3 bg-slate-50 border border-gray-150 rounded-2xl grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="checkbox" 
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    />
                    <label htmlFor="isFeatured" className="font-semibold text-slate-700 cursor-pointer select-none">Featured</label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="checkbox" 
                      id="isBestSeller"
                      checked={formData.isBestSeller}
                      onChange={(e) => setFormData(prev => ({ ...prev, isBestSeller: e.target.checked }))}
                    />
                    <label htmlFor="isBestSeller" className="font-semibold text-slate-700 cursor-pointer select-none">Bestseller</label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="checkbox" 
                      id="isFreshArrival"
                      checked={formData.isFreshArrival}
                      onChange={(e) => setFormData(prev => ({ ...prev, isFreshArrival: e.target.checked }))}
                    />
                    <label htmlFor="isFreshArrival" className="font-semibold text-slate-700 cursor-pointer select-none">Fresh Arrival</label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="checkbox" 
                      id="isCustomizable"
                      checked={formData.isCustomizable}
                      onChange={(e) => setFormData(prev => ({ ...prev, isCustomizable: e.target.checked }))}
                    />
                    <label htmlFor="isCustomizable" className="font-semibold text-slate-700 cursor-pointer select-none">Customizable</label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Dish Profile</span>
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FoodItems;
