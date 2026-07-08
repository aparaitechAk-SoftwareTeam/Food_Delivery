import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit2, Ban, CheckCircle, RefreshCw, Phone, ShieldCheck, Truck, ShieldAlert, X, Eye } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';

const DeliveryBoys = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRider, setEditingRider] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('Bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadRiders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/delivery-boys`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setRiders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiders();
  }, []);

  const openAddModal = () => {
    setEditingRider(null);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setVehicleType('Bike');
    setVehicleNumber('');
    setLicenseNumber('');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (rider) => {
    setEditingRider(rider);
    setName(rider.name || '');
    setEmail(rider.email || '');
    setPassword(''); // Leave empty, only update if requested (not updating password here)
    setPhone(rider.phone || '');
    setVehicleType(rider.vehicleType || 'Bike');
    setVehicleNumber(rider.vehicleNumber || '');
    setLicenseNumber(rider.licenseNumber || '');
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name,
      email,
      phone,
      vehicleType,
      vehicleNumber,
      licenseNumber,
    };

    if (!editingRider) {
      payload.password = password || 'Rider@123'; // Default fallback
    }

    try {
      const method = editingRider ? 'PUT' : 'POST';
      const url = editingRider 
        ? `${API_BASE_URL}/admin/delivery-boys/${editingRider._id}`
        : `${API_BASE_URL}/admin/delivery-boys`;

      const token = localStorage.getItem('admin_token');
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Operation failed.');
      }

      setModalOpen(false);
      loadRiders();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this delivery rider permanently?')) return;
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/delivery-boys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setRiders(prev => prev.filter(r => r._id !== id));
      } else {
        alert('Failed to delete delivery boy.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBlock = async (rider) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/delivery-boys/${rider._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isBlocked: !rider.isBlocked }),
      });
      if (response.ok) {
        setRiders(prev => prev.map(r => r._id === rider._id ? { ...r, isBlocked: !r.isBlocked } : r));
      } else {
        alert('Failed to toggle block status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />
        
        <main className="flex-1 p-8 flex flex-col gap-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
            <span className="text-xs font-bold text-gray-500">Manage Delivery Personnel</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={openAddModal}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Delivery Boy</span>
              </button>
              <button 
                onClick={loadRiders}
                className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 bg-slate-200 rounded w-24" />
                      <div className="h-2 bg-slate-200 rounded w-16" />
                    </div>
                  </div>
                  <div className="h-2 bg-slate-200 rounded w-full" />
                  <div className="h-2 bg-slate-200 rounded w-3/4" />
                  <div className="h-8 bg-slate-200 rounded-xl w-full mt-4" />
                </div>
              ))
            ) : riders.length === 0 ? (
              <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-400 font-semibold shadow-sm">
                No delivery riders registered on the system.
              </div>
            ) : (
              riders.map(rider => (
                <div key={rider._id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200 relative overflow-hidden">
                  
                  {/* Status Indicator Badge */}
                  <span className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase border ${rider.isBlocked ? 'bg-rose-50 border-rose-100 text-rose-600' : rider.isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    {rider.isBlocked ? 'Blocked' : rider.isOnline ? 'Online' : 'Offline'}
                  </span>

                  <div className="flex items-start gap-3.5 mb-4">
                    <img 
                      src={rider.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"} 
                      alt={rider.name}
                      className="w-12 h-12 rounded-2xl bg-slate-100 object-cover"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">{rider.name}</h3>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{rider.email}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{rider.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Details */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] space-y-1 text-slate-600 font-semibold mb-4">
                    <div className="flex items-center gap-1 text-slate-700">
                      <Truck className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-bold text-slate-800">Vehicle: {rider.vehicleType}</span>
                    </div>
                    <div>Number: <span className="text-slate-800">{rider.vehicleNumber || 'N/A'}</span></div>
                    <div>License: <span className="text-slate-800">{rider.licenseNumber || 'N/A'}</span></div>
                    {rider.isOnline && rider.location?.latitude && (
                      <div className="text-emerald-600 text-[9px] font-bold block pt-1 border-t border-slate-200 mt-1">
                        GPS Active: {rider.location.latitude.toFixed(4)}, {rider.location.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(rider)}
                      className="flex-1 py-2 border border-gray-200 hover:bg-slate-50 text-[10px] font-bold text-gray-650 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleToggleBlock(rider)}
                      className={`px-3 py-2 border rounded-xl flex items-center justify-center transition-colors cursor-pointer ${rider.isBlocked ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100'}`}
                    >
                      <Ban className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(rider._id)}
                      className="px-3 py-2 border border-gray-200 hover:border-rose-250 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 w-full max-w-[480px] shadow-2xl relative animate-scaleUp">
            
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 border border-gray-200 rounded-xl hover:bg-slate-50 text-gray-405"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-5">
              {editingRider ? 'Edit Rider Information' : 'Add New Delivery Rider'}
            </h3>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-650">
              
              <div>
                <label className="text-[9px] font-bold text-gray-450 uppercase tracking-wider block mb-1">Rider Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-gray-455 uppercase tracking-wider block mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="rider@foodexpress.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-455 uppercase tracking-wider block mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="9876543203"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              {!editingRider && (
                <div>
                  <label className="text-[9px] font-bold text-gray-455 uppercase tracking-wider block mb-1">Account Password</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="•••••••• (Default: Rider@123)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-slate-800"
                  />
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <span className="text-[10px] font-bold text-indigo-600 block mb-3 uppercase tracking-wider">Vehicle Details</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Type</label>
                    <select 
                      value={vehicleType} 
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full px-2 py-2 border border-gray-200 rounded-xl bg-white outline-none cursor-pointer"
                    >
                      <option>Bike</option>
                      <option>Scooter</option>
                      <option>Bicycle</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">License Plate Number</label>
                    <input 
                      type="text" 
                      value={vehicleNumber} 
                      onChange={(e) => setVehicleNumber(e.target.value)} 
                      placeholder="MH 12 AB 1234"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">License Number</label>
                  <input 
                    type="text" 
                    value={licenseNumber} 
                    onChange={(e) => setLicenseNumber(e.target.value)} 
                    placeholder="DL-1234567890"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full py-3 mt-4 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{saving ? 'Saving Profile...' : editingRider ? 'Update Rider Profile' : 'Register Rider Profile'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryBoys;
