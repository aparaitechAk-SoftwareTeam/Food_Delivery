import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  ClipboardList, 
  Search, 
  Eye, 
  Check, 
  X, 
  CheckCircle2, 
  RefreshCw, 
  Printer, 
  Star, 
  Clock, 
  ShoppingBag, 
  ChefHat, 
  Bike, 
  Flame, 
  ArrowRight,
  UserCheck,
  AlertCircle,
  Radio,
  Sparkles,
  User,
  Phone,
  MapPin,
  Utensils,
  ExternalLink
} from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';
import { getSocket } from '../../../utils/socket';

const TodaysOrders = () => {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [assigningOrderId, setAssigningOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [showAllDelivered, setShowAllDelivered] = useState(false);

  // 1. Fetch Today's Orders from Backend API
  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/orders?range=today&includeStats=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      const orderList = Array.isArray(data) ? data : (data?.orders || []);
      // Sort oldest first so sequential numbers #1, #2, #3 make chronological sense,
      // but we display most recent on top within columns if desired
      const sorted = orderList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setOrders(sorted);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Error loading today's orders:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // 2. Fetch Available Delivery Boys
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

  // 3. Socket Live Sync
  useEffect(() => {
    loadOrders();
    loadRiders();

    const socket = getSocket();
    socket.emit("join-role", "admin");

    socket.on("new-order", (newOrder) => {
      console.log("[Kanban Socket] New incoming order:", newOrder);
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.play().catch(() => {});
      } catch (aErr) {}

      setOrders((prev) => {
        if (prev.some((o) => o._id === newOrder._id)) return prev;
        return [...prev, newOrder];
      });
    });

    socket.on("order-status-updated", (updatedOrder) => {
      console.log("[Kanban Socket] Order status updated:", updatedOrder);
      setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o)));
      if (selectedOrder && selectedOrder._id === updatedOrder._id) {
        setSelectedOrder((prev) => ({ ...prev, ...updatedOrder }));
      }
    });

    return () => {
      socket.off("new-order");
      socket.off("order-status-updated");
    };
  }, [loadOrders, selectedOrder]);

  // Status Change API Trigger
  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        const updated = await response.json();
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Assign Delivery Partner API Trigger
  const handleAssignRider = async (orderId) => {
    if (!selectedRiderId) {
      alert("Please select an available delivery partner first.");
      return;
    }
    setUpdatingId(orderId);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/assign`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ riderId: selectedRiderId })
      });
      if (response.ok) {
        const assignedRider = riders.find(r => r._id === selectedRiderId);
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'Out For Delivery', deliveryBoy: assignedRider, deliveryStatus: 'Assigned' } : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: 'Out For Delivery', deliveryBoy: assignedRider, deliveryStatus: 'Assigned' }));
        }
        setAssigningOrderId(null);
        setSelectedRiderId('');
      } else {
        alert('Failed to assign delivery partner.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper: Sequential Order Numbering (e.g. Order #1, Order #2, Order #27)
  const getOrderDisplayTitle = (order) => {
    if (!order) return 'Order #1';
    const index = orders.findIndex(o => o._id === order._id);
    if (index !== -1) {
      return `Order #${index + 1}`;
    }
    return `Order #${order._id.slice(-4)}`;
  };

  // Helper: Format Exact Date & Time as 03/07/2026, 14:27:15
  const formatOrderDateTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  };

  // Search Filter
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const customerName = o.customerName || o.user?.name || '';
      const customerPhone = o.customerPhone || o.user?.phone || '';
      return (
        (o.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerPhone.includes(searchTerm)
      );
    });
  }, [orders, searchTerm]);

  // Grouping by 4 Columns to match target design
  const pendingOrders = useMemo(() => filteredOrders.filter(o => o.status === 'Pending'), [filteredOrders]);
  const preparingOrders = useMemo(() => filteredOrders.filter(o => ['Confirmed', 'Preparing'].includes(o.status)), [filteredOrders]);
  const deliveryOrders = useMemo(() => filteredOrders.filter(o => o.status === 'Out For Delivery'), [filteredOrders]);
  const deliveredOrders = useMemo(() => filteredOrders.filter(o => ['Delivered', 'Completed', 'Cancelled'].includes(o.status)), [filteredOrders]);

  const getBillingBreakdown = (order) => {
    if (!order) return { itemsSubtotal: 0, deliveryFee: 0, packagingFee: 0, tax: 0, discount: 0, grandTotal: 0 };
    const itemsSubtotal = order.items?.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0) || order.itemsPrice || (order.totalAmount - (order.deliveryCharge || 40));
    const deliveryFee = order.deliveryCharge !== undefined ? order.deliveryCharge : 40;
    const packagingFee = order.packagingFee || 0;
    const tax = order.tax || Math.round(itemsSubtotal * 0.05);
    const discount = order.discount || 0;
    const grandTotal = order.totalAmount || (itemsSubtotal + deliveryFee + packagingFee + tax - discount);
    return { itemsSubtotal, deliveryFee, packagingFee, tax, discount, grandTotal };
  };

  const orderBill = selectedOrder ? getBillingBreakdown(selectedOrder) : null;

  // Render Single Order Card (Target Image 1 Style)
  const renderOrderCard = (order) => {
    const isPending = order.status === 'Pending';
    const isPreparing = ['Confirmed', 'Preparing'].includes(order.status);
    const isDelivery = order.status === 'Out For Delivery';
    const isDelivered = ['Delivered', 'Completed'].includes(order.status);
    const isCancelled = order.status === 'Cancelled';

    const formattedDate = formatOrderDateTime(order.createdAt);
    const displayTitle = getOrderDisplayTitle(order);

    return (
      <div key={order._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all space-y-3">
        {/* Header: Order # & Status Badge */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">{displayTitle}</h3>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
            isCancelled ? 'bg-rose-100 text-rose-700' :
            isDelivered ? 'bg-slate-100 text-slate-700' :
            isPending ? 'bg-gray-100 text-slate-700' :
            isPreparing ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {order.status}
          </span>
        </div>

        {/* Date & Time */}
        <p className="text-[11px] text-slate-400 font-semibold">{formattedDate}</p>

        {/* Customer Information List */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-800 font-bold">
            <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{order.customerName || order.user?.name || 'Guest User'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{order.customerPhone || order.user?.phone || '9657825369'}</span>
          </div>

          <div className="flex items-start gap-1.5 text-slate-600 font-medium">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{order.address?.line1 ? `${order.address.line1}, ${order.address.city || ''}` : 'Baramati, Pune District, Maharashtra, 413133, India'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
            <Utensils className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="uppercase">NOW</span>
          </div>
        </div>

        {/* Items List Box */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 my-2">
          {order.items && order.items.length > 0 ? (
            order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-800">
                <span className="truncate pr-2">{item.name || item.food?.name || item.foodItem?.name || 'Food Item'} × {item.quantity}</span>
                <span className="font-extrabold text-slate-900 shrink-0">₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 font-medium italic">Items not available</p>
          )}
        </div>

        {/* Total Price */}
        <div className="text-sm font-black text-slate-900 pt-0.5">
          Total: ₹{order.totalAmount ? Number(order.totalAmount).toFixed(2) : '0.00'}
        </div>

        {/* Action Buttons */}
        <div className="pt-2">
          {isPending && (
            <div className="space-y-2">
              <button
                onClick={() => handleUpdateStatus(order._id, 'Confirmed')}
                disabled={updatingId === order._id}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Accept</span>
              </button>
              <button
                onClick={() => handleUpdateStatus(order._id, 'Cancelled')}
                disabled={updatingId === order._id}
                className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}

          {isPreparing && (
            <div>
              {assigningOrderId === order._id ? (
                <div className="space-y-2 bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                  <select
                    value={selectedRiderId}
                    onChange={(e) => setSelectedRiderId(e.target.value)}
                    className="w-full text-xs p-2 border border-blue-200 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="">-- Select Rider --</option>
                    {riders.map(r => (
                      <option key={r._id} value={r._id}>{r.name} ({r.phone})</option>
                    ))}
                  </select>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleAssignRider(order._id)}
                      className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => setAssigningOrderId(null)}
                      className="py-1.5 px-3 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAssigningOrderId(order._id)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Bike className="w-4 h-4" />
                  <span>Assign & Dispatch</span>
                </button>
              )}
            </div>
          )}

          {isDelivery && (
            <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-purple-900">{order.deliveryBoy?.name || 'Rider Assigned'}</p>
                <p className="text-[10px] text-purple-600 font-semibold">{order.deliveryStatus || 'In Transit'}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(order)}
                className="px-2.5 py-1 bg-white border border-purple-200 text-purple-700 rounded-lg text-[11px] font-bold cursor-pointer"
              >
                Details
              </button>
            </div>
          )}

          {(isDelivered || isCancelled) && (
            <button
              onClick={() => setSelectedOrder(order)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>View Invoice</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-receipt, #printable-receipt * { visibility: visible !important; }
          #printable-receipt {
            position: absolute !important;
            left: 50% !important;
            top: 20px !important;
            transform: translateX(-50%) !important;
            display: block !important;
            width: 100% !important;
            max-width: 360px !important;
            margin: 0 auto !important;
            padding: 16px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: 1px dashed black !important;
            border-radius: 8px !important;
          }
          @page { margin: 5mm; size: auto; }
        }
      `}</style>

      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />

        <main className="flex-1 p-6 flex flex-col gap-6 min-w-0">
          
          {/* Header Card (Matching Image 1) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Live Orders Control Center
              </h1>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                Manage all restaurant orders in real time
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadOrders()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => window.open('/', '_blank')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <span>Customer View</span>
              </button>
            </div>
          </div>

          {/* Top 4 Stat Counter Cards (Matching Image 1) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Stat 1: Total */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-28">
              <span className="text-3xl font-black text-slate-900">{orders.length}</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</span>
            </div>

            {/* Stat 2: Pending (Amber top bar) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 border-t-4 border-t-amber-500 shadow-sm flex flex-col justify-between h-28">
              <span className="text-3xl font-black text-slate-900">{pendingOrders.length}</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending</span>
            </div>

            {/* Stat 3: Preparing (Blue top bar) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 border-t-4 border-t-blue-500 shadow-sm flex flex-col justify-between h-28">
              <span className="text-3xl font-black text-slate-900">{preparingOrders.length}</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preparing</span>
            </div>

            {/* Stat 4: Delivered (Emerald top bar) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 border-t-4 border-t-emerald-500 shadow-sm flex flex-col justify-between h-28">
              <span className="text-3xl font-black text-slate-900">{deliveredOrders.length}</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivered</span>
            </div>
          </div>

          {/* 4 Column Layout (Matching Image 1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 items-start min-w-0">
            
            {/* Column 1: PENDING */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span>Pending</span>
              </div>

              <div className="space-y-4">
                {pendingOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-xs font-bold text-slate-400">
                    No pending orders
                  </div>
                ) : (
                  pendingOrders.map(renderOrderCard)
                )}
              </div>
            </div>

            {/* Column 2: PREPARING */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                <span>Preparing</span>
              </div>

              <div className="space-y-4">
                {preparingOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-xs font-bold text-slate-400">
                    No preparing orders
                  </div>
                ) : (
                  preparingOrders.map(renderOrderCard)
                )}
              </div>
            </div>

            {/* Column 3: DELIVERY */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
                <span>Delivery</span>
              </div>

              <div className="space-y-4">
                {deliveryOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-xs font-bold text-slate-400">
                    No delivery orders
                  </div>
                ) : (
                  deliveryOrders.map(renderOrderCard)
                )}
              </div>
            </div>

            {/* Column 4: DELIVERED */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span>Delivered</span>
              </div>

              <div className="space-y-4">
                {deliveredOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-xs font-bold text-slate-400">
                    No delivered orders
                  </div>
                ) : (
                  <>
                    {(showAllDelivered ? deliveredOrders : deliveredOrders.slice(0, 3)).map(renderOrderCard)}
                    
                    {deliveredOrders.length > 3 && (
                      <button
                        onClick={() => setShowAllDelivered(!showAllDelivered)}
                        className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                      >
                        {showAllDelivered ? "Show Less" : `View More (+${deliveredOrders.length - 3} orders)`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Details & Invoice Sidebar Drawer */}
          {selectedOrder && orderBill && (
            <div className="fixed inset-y-0 right-0 z-50 w-[400px] bg-white border-l border-gray-200 shadow-2xl p-6 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-gray-900">Order Information</h3>
                <div className="flex gap-1.5">
                  <button 
                    onClick={handlePrint}
                    title="Print Thermal Receipt"
                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Current Status</span>
                  <span className="font-black px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {selectedOrder.status}
                  </span>
                </div>

                <div className="border-b border-gray-100 pb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Customer Info</span>
                  <p className="font-bold text-gray-800">{selectedOrder.customerName || selectedOrder.user?.name || 'Guest'}</p>
                  <p className="text-gray-500">{selectedOrder.customerPhone || selectedOrder.user?.phone || 'No Phone'}</p>
                  <p className="text-gray-500 mt-1">{selectedOrder.address?.line1}, {selectedOrder.address?.city}</p>
                </div>

                <div className="border-b border-gray-100 pb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Order Items</span>
                  <div className="space-y-1.5">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">{item.quantity}x {item.name || item.food?.name || item.foodItem?.name || 'Food Item'}</span>
                        <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl space-y-1.5 border border-gray-200">
                  <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-1">Billing details</h4>
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-800">₹{orderBill.itemsSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="font-bold text-emerald-600">{orderBill.deliveryFee === 0 ? 'FREE' : `₹${orderBill.deliveryFee.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Packaging Fee</span>
                    <span className="font-bold text-emerald-600">{orderBill.packagingFee > 0 ? `₹${orderBill.packagingFee.toFixed(2)}` : 'FREE'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Taxes & Charges (GST)</span>
                    <span className="font-semibold text-gray-800">₹{orderBill.tax.toFixed(2)}</span>
                  </div>
                  {orderBill.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount Savings</span>
                      <span>- ₹{orderBill.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total ({selectedOrder.paymentMethod || 'COD'})</span>
                    <span className="text-emerald-600 font-black">₹{orderBill.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Printable Thermal Receipt */}
          {selectedOrder && orderBill && (
            <div id="printable-receipt" className="hidden print:block font-mono text-black p-4 max-w-[340px] mx-auto border border-black bg-white rounded-lg">
              <div className="text-center border-b border-dashed border-black pb-3 mb-3">
                <h2 className="text-base font-black uppercase tracking-wider">FoodExpress</h2>
                <p className="text-[10px] uppercase font-bold text-gray-700">Official Order Receipt</p>
                <p className="text-[10px] text-gray-700 mt-1">
                  Date: {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} {' '}
                  {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[12px] font-black mt-1">{getOrderDisplayTitle(selectedOrder)}</p>
              </div>

              <div className="border-b border-dashed border-black pb-3 mb-3 text-[11px] space-y-0.5">
                <p className="font-bold uppercase text-[9px] text-gray-600">Customer Details:</p>
                <p className="font-black text-[12px]">{selectedOrder.customerName || selectedOrder.user?.name || 'Guest User'}</p>
                <p>Phone: {selectedOrder.customerPhone || selectedOrder.user?.phone || 'N/A'}</p>
                <p>Address: {selectedOrder.address?.line1 ? `${selectedOrder.address.line1}, ${selectedOrder.address.city || ''}` : 'Store Pickup'}</p>
              </div>

              <div className="border-b border-dashed border-black pb-3 mb-3 text-[11px]">
                <p className="font-bold uppercase text-[9px] text-gray-600 mb-1">Order Items:</p>
                <div className="space-y-1">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <span className="font-bold">{item.quantity}x {item.name || item.food?.name || item.foodItem?.name || 'Food Item'}</span>
                      <span className="font-black">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] space-y-1 border-b border-dashed border-black pb-3 mb-3">
                <p className="font-bold uppercase text-[9px] text-gray-600 mb-1">Billing details</p>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{orderBill.itemsSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>{orderBill.deliveryFee === 0 ? 'FREE' : `₹${orderBill.deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Packaging Fee:</span>
                  <span>{orderBill.packagingFee > 0 ? `₹${orderBill.packagingFee.toFixed(2)}` : 'FREE'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Charges (GST):</span>
                  <span>₹{orderBill.tax.toFixed(2)}</span>
                </div>
                {orderBill.discount > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-700">
                    <span>Discount Savings:</span>
                    <span>- ₹{orderBill.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black pt-1.5 border-t border-black mt-1">
                  <span>TOTAL ({selectedOrder.paymentMethod || 'COD'}):</span>
                  <span>₹{orderBill.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] space-y-0.5 pt-1">
                <p className="font-bold">Thank you for ordering with FoodExpress!</p>
                <p>Enjoy your meal 🍔</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TodaysOrders;
