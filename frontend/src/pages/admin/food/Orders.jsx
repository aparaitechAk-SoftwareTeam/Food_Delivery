import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ClipboardList, Search, Eye, Check, X, CheckCircle2, AlertTriangle, RefreshCw, Printer, Filter, Star } from 'lucide-react';
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
  const [orderReviews, setOrderReviews] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const intervalRef = useRef(null);
  const AUTO_REFRESH_SECS = 60; // 60-second safety-net poll; socket handles real-time

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

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      const sortedData = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      setOrders(sortedData);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ─── Auto-refresh helpers ────────────────────────────────────────────────────
  // The socket handles real-time order updates. This 60-second poll is only a
  // safety-net fallback for any missed socket events. No 1-second countdown
  // interval — that caused a React re-render every second unnecessarily.
  const startAutoRefresh = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      loadOrders(true);
      setLastRefreshed(new Date());
    }, AUTO_REFRESH_SECS * 1000);
  }, [loadOrders]);

  useEffect(() => {
    if (autoRefresh) {
      startAutoRefresh();
    } else {
      clearInterval(intervalRef.current);
    }
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [autoRefresh, startAutoRefresh]);

  useEffect(() => {
    loadOrders();
    loadRiders();

    const socket = getSocket();
    socket.emit("join-role", "admin");

    socket.on("new-order", (newOrder) => {
      console.log("[Socket] Received new order in admin panel:", newOrder);
      setOrders((prev) => {
        if (prev.some((o) => o._id === newOrder._id)) return prev;
        const updated = [newOrder, ...prev];
        return updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

  useEffect(() => {
    if (selectedOrder) {
      const fetchOrderReviews = async () => {
        try {
          const token = localStorage.getItem('admin_token');
          const response = await fetch(`${API_BASE_URL}/reviews/order/${selectedOrder._id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          setOrderReviews(Array.isArray(data) ? data : []);
        } catch (e) {
          console.error(e);
          setOrderReviews([]);
        }
      };
      fetchOrderReviews();
    } else {
      setOrderReviews([]);
    }
  }, [selectedOrder]);

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

  const handleRefreshOrder = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedData);
        
        const freshOrder = sortedData.find(o => o._id === selectedOrder._id);
        if (freshOrder) {
          setSelectedOrder(freshOrder);
        }
      }
    } catch (err) {
      console.error("Error refreshing order details:", err);
    } finally {
      setLoading(false);
    }
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

              <div className="flex items-center gap-2">

                {/* Live auto-refresh indicator */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-semibold select-none transition-all ${
                  autoRefresh
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
                  }`} />
                  {autoRefresh
                    ? <span>Live · {lastRefreshed
                        ? lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Socket'
                      }</span>
                    : <span>Auto-off</span>
                  }
                </div>

                {/* Pause / Resume toggle */}
                <button
                  onClick={() => setAutoRefresh(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-semibold transition-all ${
                    autoRefresh
                      ? 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {autoRefresh ? 'Pause' : 'Resume'}
                </button>

                {/* Manual refresh */}
                <button
                  onClick={() => { loadOrders(); setLastRefreshed(new Date()); if (autoRefresh) startAutoRefresh(); }}
                  title="Refresh now"
                  className="p-2.5 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                </button>

              </div>
            </div>

            {/* Status Section Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200/50 pb-4">
              {[
                { id: 'All', label: 'All Statuses' },
                { id: 'Pending', label: 'Pending' },
                { id: 'Confirmed', label: 'Confirmed' },
                { id: 'Preparing', label: 'Preparing' },
                { id: 'Out For Delivery', label: 'Out For Delivery' },
                { id: 'Delivered', label: 'Delivered' },
                { id: 'Cancelled', label: 'Cancelled' },
              ].map(status => {
                const count = status.id === 'All' 
                  ? orders.length 
                  : orders.filter(o => o.status === status.id).length;
                const isActive = filterStatus === status.id;
                
                return (
                  <button
                    key={status.id}
                    onClick={() => setFilterStatus(status.id)}
                    className={`px-3 py-1.5 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                      isActive 
                        ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-100' 
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-gray-200/80'
                    }`}
                  >
                    <span>{status.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
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
                    onClick={handleRefreshOrder}
                    disabled={loading}
                    className="p-1.5 border border-gray-200 hover:bg-slate-50 text-gray-450 hover:text-gray-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button 
                    onClick={handlePrint}
                    className="p-1.5 border border-gray-200 hover:bg-slate-50 text-gray-450 hover:text-gray-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="p-1.5 border border-gray-200 hover:bg-slate-50 text-gray-450 hover:text-gray-700 rounded-lg transition-colors cursor-pointer"
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
                {selectedOrder.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-450 font-medium">Transaction ID:</span>
                    <span className="font-mono text-[10px] text-slate-700 font-semibold">{selectedOrder.transactionId}</span>
                  </div>
                )}
                {selectedOrder.razorpayOrderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-450 font-medium">Razorpay Order ID:</span>
                    <span className="font-mono text-[10px] text-slate-700 font-semibold">{selectedOrder.razorpayOrderId}</span>
                  </div>
                )}
                {selectedOrder.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-450 font-medium">Paid At:</span>
                    <span className="text-[10px] text-slate-700 font-semibold">{new Date(selectedOrder.paidAt).toLocaleString()}</span>
                  </div>
                )}
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

              {/* Customer Reviews for this Order */}
              {orderReviews.length > 0 && (
                <div className="text-xs border-b border-gray-100 pb-4 mb-4">
                  <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[9px] mb-2 text-slate-400">Customer Feedback</h4>
                  <div className="space-y-3">
                    {orderReviews.map((rev, idx) => (
                      <div key={idx} className="bg-amber-50/50 border border-amber-100 rounded-xl p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-800">{rev.food?.name || "Dish"}</span>
                          <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[10px]">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{rev.rating}</span>
                          </div>
                        </div>
                        {rev.title && <h5 className="font-bold text-slate-800 text-[11px] mb-0.5">{rev.title}</h5>}
                        <p className="text-slate-650 leading-relaxed text-[11px]">{rev.comment}</p>
                        
                        {rev.images && rev.images.length > 0 && (
                          <div className="flex gap-1 mt-1.5">
                            {rev.images.map((imgUrl, imgIdx) => (
                              <img 
                                key={imgIdx} 
                                src={imgUrl} 
                                className="w-8 h-8 rounded object-cover border border-amber-150" 
                                alt="" 
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rider Assignment (Only visible in Preparing and subsequent delivery stages) */}
              {selectedOrder.status !== 'Pending' && selectedOrder.status !== 'Confirmed' && selectedOrder.status !== 'Cancelled' && (
                <div className="text-xs border-b border-gray-100 pb-4 mb-4">
                  <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[9px] mb-2 text-slate-400">Assigned Delivery Rider</h4>
                  {selectedOrder.deliveryBoy ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between font-semibold text-slate-700">
                      <div>
                        <span className="block font-bold text-slate-800">
                          {typeof selectedOrder.deliveryBoy === 'object' ? selectedOrder.deliveryBoy.name : 'Assigned Rider'}
                        </span>
                        <span className="block text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">
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
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Assign Order
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Workflow Status Actions */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[9px] mb-1.5 text-slate-400">Order Status</h4>
                
                {/* 1. Pending -> Confirmed or Cancelled */}
                {selectedOrder.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder._id, 'Confirmed')}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Order</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder._id, 'Cancelled')}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel Order</span>
                    </button>
                  </div>
                )}

                {/* 2. Confirmed -> Preparing */}
                {selectedOrder.status === 'Confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'Preparing')}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Start Preparing
                  </button>
                )}

                {/* 3. Preparing, Out For Delivery, Delivered, Completed, Cancelled (Plain Text Status Display) */}
                {selectedOrder.status !== 'Pending' && selectedOrder.status !== 'Confirmed' && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between font-semibold text-slate-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Status</span>
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
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
