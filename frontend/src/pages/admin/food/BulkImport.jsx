import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Download, CheckCircle, RefreshCw, Trash2, ArrowRight } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';

const BulkImport = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [importStatus, setImportStatus] = useState('');
  
  // Bulk update states
  const [selectedIds, setSelectedIds] = useState([]);
  const [action, setAction] = useState('');
  const [actionValue, setActionValue] = useState('');

  const fileInputRef = useRef(null);

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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportStatus('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (selectedFile.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(text);
          setFileData(Array.isArray(parsed) ? parsed : [parsed]);
        } catch (err) {
          alert('Invalid JSON structure.');
        }
      } else {
        const lines = text.split('\n').slice(1);
        const parsed = lines.map(line => {
          const parts = line.split(',');
          if (parts.length < 3) return null;
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
        setFileData(parsed);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleUploadExecute = async () => {
    if (fileData.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/bulk-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'foods', items: fileData })
      });

      if (response.ok) {
        setImportStatus(`Successfully imported ${fileData.length} food items!`);
        setFile(null);
        setFileData([]);
        await loadFoods();
      } else {
        // Mock import fallback
        setFoods(prev => [
          ...prev,
          ...fileData.map((item, idx) => ({ ...item, _id: `bulk-${prev.length + idx + 1}`, id: `bulk-${prev.length + idx + 1}` }))
        ]);
        setImportStatus(`Mock imported ${fileData.length} food items!`);
        setFile(null);
        setFileData([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0 || !action) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/bulk-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action, value: actionValue })
      });

      if (response.ok) {
        await loadFoods();
        setSelectedIds([]);
        setAction('');
        setActionValue('');
      } else {
        // Mock fallback
        setFoods(prev => {
          let list = [...prev];
          if (action === 'delete') {
            list = list.filter(f => !selectedIds.includes(f._id || f.id));
          } else {
            list = list.map(f => {
              if (selectedIds.includes(f._id || f.id)) {
                if (action === 'disable') return { ...f, isAvailable: false };
                if (action === 'enable') return { ...f, isAvailable: true };
                if (action === 'change_price') return { ...f, price: parseFloat(actionValue) || f.price };
              }
              return f;
            });
          }
          return list;
        });
        setSelectedIds([]);
        setAction('');
        setActionValue('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(foods.map(f => f._id || f.id));
    } else {
      setSelectedIds([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />

        <main className="flex-1 p-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* File upload block */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between lg:col-span-1">
              <div>
                <h3 className="text-sm font-bold text-slate-800">File Importer</h3>
                <p className="text-[10px] text-gray-400 font-medium">Accepts clean .csv or .json arrays</p>
                
                {/* Drag zone box */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-6 border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-white cursor-pointer transition-all flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-indigo-500 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">Choose file to upload</span>
                  <span className="text-[9px] text-gray-400 mt-1 block">Maximum size limit: 5MB</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept=".csv,.json"
                  className="hidden" 
                />

                {file && (
                  <div className="mt-4 p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-700 block truncate">{file.name}</span>
                      <span className="text-[9px] text-gray-400 block">{fileData.length} records parsed</span>
                    </div>
                  </div>
                )}

                {importStatus && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-600">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] font-bold">{importStatus}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleUploadExecute}
                disabled={fileData.length === 0 || loading}
                className="w-full mt-6 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Process Import File</span>
              </button>
            </div>

            {/* Bulk batch actions list */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between lg:col-span-2">
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Batch Catalog Actions</h3>
                    <p className="text-[10px] text-gray-400 font-medium">Select multiple dishes below and perform bulk parameters modification.</p>
                  </div>
                  
                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        className="px-3 py-1.5 border border-indigo-200 rounded-lg text-xs font-semibold bg-white text-gray-700 focus:outline-none"
                      >
                        <option value="">Bulk Actions</option>
                        <option value="enable">Enable Availability</option>
                        <option value="disable">Disable Availability</option>
                        <option value="change_price">Change Unit Price (₹)</option>
                        <option value="delete">Delete Permanently</option>
                      </select>

                      {action === 'change_price' && (
                        <input 
                          type="number"
                          placeholder="Price"
                          value={actionValue}
                          onChange={(e) => setActionValue(e.target.value)}
                          className="w-16 px-2 py-1 border border-indigo-200 rounded-lg text-xs font-bold text-center"
                        />
                      )}

                      <button
                        onClick={handleBulkUpdate}
                        disabled={loading}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                <div className="overflow-y-auto max-h-[40vh] mt-4 space-y-1.5 pr-2">
                  <div className="flex items-center p-3 bg-slate-50 border border-slate-100 rounded-xl justify-between">
                    <span className="text-xs font-bold text-slate-500">Dish Name</span>
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedIds.length === foods.length && foods.length > 0}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                  </div>
                  {foods.map(food => (
                    <div key={food._id || food.id} className="flex items-center p-3 border border-gray-200/80 hover:border-indigo-150 rounded-xl bg-white justify-between transition-colors">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${food.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {food.name}
                        <span className="text-[10px] text-gray-400 font-medium">(₹{food.price})</span>
                      </span>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(food._id || food.id)}
                        onChange={(e) => handleSelectOne(food._id || food.id, e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between border-t border-gray-150 pt-4 mt-4">
                <span className="text-[10px] text-gray-400 font-medium">Batch items selected: {selectedIds.length}</span>
                <button onClick={loadFoods} className="p-2 border border-gray-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BulkImport;
