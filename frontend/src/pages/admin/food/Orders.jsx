import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Eye, Check, X, CheckCircle2, AlertTriangle, RefreshCw, Printer, Filter } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';
import { getSocket } from '../../../utils/socket';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);

  const loadRiders = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/delivery-boys`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setRiders(Array.isArray(data) ? data.filter(r => r.isOnline && !r.isBlocked) : []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    loadRiders();

    const socket = getSocket();
    socket.emit("join-role", "admin");

    socket.on("new-order", (newOrder) => {
      console.log("[Socket] Received new order in admin panel:", newOrder);
      setOrders((prev) => {
        if (prev.some((o) => o._id === newOrder._id)) return prev;
        return [newOrder, ...prev];
      });
    });

    socket.on("order-status-updated", (updatedOrder) => {
      console.log("[Socket] Received order update in admin panel:", updatedOrder);
      setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
      setSelectedOrder((prev) => (prev && prev._id === updatedOrder._id ? updatedOrder : prev));
    });

    socket.on("delivery-assigned", (updatedOrder) => {
      console.log("[Socket] Received delivery-assigned event in admin panel:", updatedOrder);
      setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
      setSelectedOrder((prev) => (prev && prev._id === updatedOrder._id ? updatedOrder : prev));
    });

    return () => {
      socket.off("new-order");
      socket.off("order-status-updated");
      socket.off("delivery-assigned");
    };
  }, []);

  const handleUpdateStatus = async (orderId, newStatus, newPaymentStatus) => {
    setUpdatingId(orderId);
    try {
      const bodyObj = {};
      if (newStatus !== undefined && newStatus !== null) bodyObj.status = newStatus;
      if (newPaymentStatus !== undefined && newPaymentStatus !== null) bodyObj.paymentStatus = newPaymentStatus;

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyObj),
      });
      if (response.ok) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...bodyObj } : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, ...bodyObj }));
        }
      } else {
        const errData = await response.json();
        alert(errData.message || 'Failed to update status.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignRider = async () => {
    if (!selectedRiderId || !selectedOrder) return;
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/orders/${selectedOrder._id}/assign`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ riderId: selectedRiderId })
      });
      if (response.ok) {
        const assignedRider = riders.find(r => r._id === selectedRiderId);
        setOrders(prev => prev.map(o => o._id === selectedOrder._id ? { ...o, deliveryBoy: assignedRider, deliveryStatus: 'Assigned' } : o));
        setSelectedOrder(prev => ({ ...prev, deliveryBoy: assignedRider, deliveryStatus: 'Assigned' }));
        setSelectedRiderId('');
      } else {
        alert('Failed to assign rider');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getFilteredOrders = () => {
    return orders.filter(order => {
      const customerName = order.customerName || order.user?.name || '';
      const customerPhone = order.customerPhone || order.user?.phone || '';
      const matchesSearch = 
        (order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerPhone.includes(searchTerm);
      
      const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 border-amber-100 text-amber-600';
      case 'Confirmed': return 'bg-blue-50 border-blue-100 text-blue-600';
      case 'Preparing': return 'bg-purple-50 border-purple-100 text-purple-600';
      case 'Out For Delivery': return 'bg-indigo-50 border-indigo-100 text-indigo-600';
      case 'Delivered': return 'bg-emerald-50 border-emerald-100 text-emerald-600';
      case 'Completed': return 'bg-teal-50 border-teal-100 text-teal-600';
      case 'Cancelled': return 'bg-rose-50 border-rose-100 text-rose-600';
      default: return 'bg-slate-50 border-slate-150 text-slate-600';
    }
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />
        
        <main className="flex-1 p-8 flex gap-8">
          {/* Orders List Section */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 flex-1 max-w-[320px]">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search order number or client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 border border-gray-250 rounded-xl px-3 py-2 bg-slate-50 text-xs text-gray-600">
                  <Filter className="w-3.5 h-3.5" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent outline-none cursor-pointer font-semibold"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Out For Delivery">Out For Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <button 
                  onClick={loadOrders}
                  className="p-2.5 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 text-left">Order ID</th>
                    <th className="pb-3 text-left">Customer</th>
                    <th className="pb-3 text-center">Amount</th>
                    <th className="pb-3 text-center">Payment</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4"><div className="w-16 h-3 bg-slate-200 rounded" /></td>
                        <td className="py-4"><div className="w-24 h-3 bg-slate-200 rounded" /></td>
                        <td className="py-4"><div className="w-10 h-3 bg-slate-200 rounded mx-auto" /></td>
                        <td className="py-4"><div className="w-16 h-3 bg-slate-200 rounded mx-auto" /></td>
                        <td className="py-4"><div className="w-14 h-5 bg-slate-200 rounded-full mx-auto" /></td>
                        <td className="py-4"><div className="w-8 h-8 bg-slate-200 rounded-full ml-auto" /></td>
                      </tr>
                    ))
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-gray-400 py-10 font-semibold">No orders found matching filters.</td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 font-bold text-slate-800">#{order.orderNumber || order._id.slice(-6).toUpperCase()}</td>
                        <td className="py-3.5">
                          <span className="font-bold text-slate-700 block">{order.customerName || order.user?.name || 'Guest User'}</span>
                          <span className="text-[10px] text-slate-450">{order.customerPhone || order.user?.phone || 'No phone'}</span>
                        </td>
                        <td className="py-3.5 text-center font-bold text-slate-800">₹{order.totalAmount}</td>
                        <td className="py-3.5 text-center">
                          <span className="text-[10px] font-semibold text-slate-550 block">{order.paymentMethod}</span>
                          <span className={`text-[8px] font-bold uppercase ${order.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full border text-[9px] font-bold ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {order.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(order._id, 'Confirmed')}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(order._id, 'Cancelled')}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details & Invoice Sidebar */}
          {selectedOrder && (
            <div className="w-[380px] bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col shrink-0 self-start max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-gray-900">Order Info</h3>
                <div className="flex gap-1.5">
                  <button 
                    onClick={handlePrint}
                    className="p-1.5 border border-gray-200 hover:bg-slate-50 text-gray-450 hover:text-gray-700 rounded-lg transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="p-1.5 border border-gray-200 hover:bg-slate-50 text-gray-450 hover:text-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Order Metadata */}
              <div className="space-y-4 text-xs border-b border-gray-100 pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-450 font-medium">Order Number:</span>
                  <span className="font-bold text-slate-800">#{selectedOrder.orderNumber || selectedOrder._id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-450 font-medium">Date & Time:</span>
                  <span className="font-semibold text-slate-700">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-450 font-medium">Order Status:</span>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-450 font-medium">Payment Option:</span>
                  <span className="font-semibold text-slate-700">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-450 font-medium">Payment Status:</span>
                  <span className={`font-bold ${selectedOrder.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="text-xs border-b border-gray-100 pb-4 mb-4">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[9px] mb-2 text-slate-400">Delivery Address</h4>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 font-semibold text-slate-700 space-y-1">
                  <span className="block font-bold text-slate-800">{selectedOrder.customerName || selectedOrder.user?.name || 'Guest User'}</span>
                  {(selectedOrder.customerPhone || selectedOrder.user?.phone) && (
                    <span className="block text-[11px] text-slate-500 font-bold">Phone: {selectedOrder.customerPhone || selectedOrder.user.phone}</span>
                  )}
                  <span className="block">{selectedOrder.address?.line1}</span>
                  {selectedOrder.address?.line2 && <span className="block">{selectedOrder.address?.line2}</span>}
                  <span className="block text-[11px] text-slate-500">
                    {selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.postalCode}
                  </span>
                </div>
              </div>

              {/* Cart Items */}
              <div className="text-xs border-b border-gray-100 pb-4 mb-4 flex-1">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[9px] mb-2 text-slate-400">Items Ordered</h4>
                <div className="space-y-3">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start font-medium text-slate-750">
                      <div>
                        <span className="font-bold text-slate-900">{item.food?.name || 'Delicious Dish'}</span>
                        <span className="text-[10px] text-slate-400 block">Qty: {item.quantity} x ₹{item.price}</span>
                      </div>
                      <span className="font-bold text-slate-900">₹{item.quantity * item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Details */}
              <div className="text-xs space-y-2 border-b border-gray-100 pb-4 mb-4">
                <div className="flex justify-between font-medium text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{selectedOrder.totalAmount - (selectedOrder.deliveryCharge || 40) - (selectedOrder.tax || 0)}</span>
                </div>
                <div className="flex justify-between font-medium text-slate-600">
                  <span>Delivery Charge:</span>
                  <span>₹{selectedOrder.deliveryCharge || 40}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
                  <span>Total Bill:</span>
                  <span>₹{selectedOrder.totalAmount}</span>
                </div>
              </div>

              {/* Rider Assignment */}
              <div className="text-xs border-b border-gray-100 pb-4 mb-4">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[9px] mb-2 text-slate-400">Assigned Delivery Rider</h4>
                {selectedOrder.deliveryBoy ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between font-semibold text-slate-700">
                    <div>
                      <span className="block font-bold text-slate-800">
                        {typeof selectedOrder.deliveryBoy === 'object' ? selectedOrder.deliveryBoy.name : 'Assigned Rider'}
                      </span>
                      <span className="block text-[10px] text-indigo-650 font-bold uppercase tracking-wider mt-0.5">
                        Rider Status: {selectedOrder.deliveryStatus || 'Assigned'}
                      </span>
                    </div>
                    {typeof selectedOrder.deliveryBoy === 'object' && selectedOrder.deliveryBoy.phone && (
                      <span className="text-[10px] text-slate-450 font-bold">{selectedOrder.deliveryBoy.phone}</span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={selectedRiderId}
                      onChange={(e) => setSelectedRiderId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-205 rounded-xl bg-white outline-none cursor-pointer text-slate-700 font-semibold"
                    >
                      <option value="">Select Online Rider...</option>
                      {riders.map(r => (
                        <option key={r._id} value={r._id}>{r.name} ({r.vehicleType || 'Bike'})</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignRider}
                      disabled={!selectedRiderId}
                      className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Assign Order
                    </button>
                  </div>
                )}
              </div>

              {/* Workflow Status Actions */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[9px] mb-1.5 text-slate-400">Update Status</h4>
                {selectedOrder.status === 'Confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Preparing')}
                    className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Set Preparing
                  </button>
                )}
                {selectedOrder.status === 'Preparing' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Out For Delivery')}
                    className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Dispatch / Out for Delivery
                  </button>
                )}
                {selectedOrder.status === 'Out For Delivery' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Delivered')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Mark as Delivered
                  </button>
                )}
                {selectedOrder.status === 'Delivered' && (
                  <div className="space-y-2">
                    {selectedOrder.paymentStatus !== 'Paid' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder._id, null, 'Paid')}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Confirm Payment Received
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder._id, 'Completed')}
                      disabled={selectedOrder.paymentStatus !== 'Paid'}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Complete Order
                    </button>
                  </div>
                )}
                {['Completed', 'Cancelled'].includes(selectedOrder.status) && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-center text-slate-450 font-bold uppercase">
                    Order is Finished ({selectedOrder.status})
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Orders;
