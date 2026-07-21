import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Search, Eye, Check, X, CheckCircle2, AlertTriangle, RefreshCw, Printer, Filter, Star, Download, Calendar, TrendingUp, Clock, ShoppingBag, Radio } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';
import { getSocket } from '../../../utils/socket';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateRange, setDateRange] = useState('all'); // 'today' | 'yesterday' | '7days' | '30days' | 'all'
  const [updatingId, setUpdatingId] = useState(null);
  const [orderReviews, setOrderReviews] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const intervalRef = useRef(null);
  const AUTO_REFRESH_SECS = 60; // 60-second safety-net poll; socket handles real-time

  // Server stats fallback / sync
  const [serverStats, setServerStats] = useState(null);

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
      const queryParams = new URLSearchParams();
      if (dateRange !== 'all') queryParams.append('range', dateRange);
      if (filterStatus !== 'All') queryParams.append('status', filterStatus);
      queryParams.append('includeStats', 'true');

      const response = await fetch(`${API_BASE_URL}/admin/orders?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      let orderList = [];
      if (Array.isArray(data)) {
        orderList = data;
      } else if (data && Array.isArray(data.orders)) {
        orderList = data.orders;
        if (data.stats) setServerStats(data.stats);
      }

      const sortedData = orderList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedData);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [dateRange, filterStatus]);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, filterStatus, searchTerm]);

  // ─── Auto-refresh helpers ────────────────────────────────────────────────────
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
      // Increment server stats if present
      setServerStats((prev) => prev ? {
        ...prev,
        todayCount: prev.todayCount + 1,
        sevenDaysCount: prev.sevenDaysCount + 1,
        thirtyDaysCount: prev.thirtyDaysCount + 1,
        totalCount: prev.totalCount + 1,
      } : null);
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
  }, [loadOrders]);

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
        const newStatus = ['Pending', 'Confirmed', 'Preparing'].includes(selectedOrder.status) ? 'Out For Delivery' : selectedOrder.status;
        setOrders(prev => prev.map(o => o._id === selectedOrder._id ? { ...o, status: newStatus, deliveryBoy: assignedRider, deliveryStatus: 'Assigned' } : o));
        setSelectedOrder(prev => ({ ...prev, status: newStatus, deliveryBoy: assignedRider, deliveryStatus: 'Assigned' }));
        setSelectedRiderId('');
      } else {
        alert('Failed to assign rider');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Date Filtering & Calculation Helpers
  const dateCalculatedStats = useMemo(() => {
    if (serverStats) return serverStats;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setMilliseconds(-1);

    const sevenDaysStart = new Date(todayStart);
    sevenDaysStart.setDate(sevenDaysStart.getDate() - 6);

    const thirtyDaysStart = new Date(todayStart);
    thirtyDaysStart.setDate(thirtyDaysStart.getDate() - 29);

    let todayCount = 0;
    let yesterdayCount = 0;
    let sevenDaysCount = 0;
    let thirtyDaysCount = 0;

    orders.forEach(o => {
      const d = new Date(o.createdAt);
      if (d >= todayStart && d <= todayEnd) todayCount++;
      if (d >= yesterdayStart && d <= yesterdayEnd) yesterdayCount++;
      if (d >= sevenDaysStart) sevenDaysCount++;
      if (d >= thirtyDaysStart) thirtyDaysCount++;
    });

    return {
      todayCount,
      yesterdayCount,
      sevenDaysCount,
      thirtyDaysCount,
      totalCount: orders.length,
    };
  }, [orders, serverStats]);

  // Combined Filtering
  const getFilteredOrders = useCallback(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setMilliseconds(-1);

    const sevenDaysStart = new Date(todayStart);
    sevenDaysStart.setDate(sevenDaysStart.getDate() - 6);

    const thirtyDaysStart = new Date(todayStart);
    thirtyDaysStart.setDate(thirtyDaysStart.getDate() - 29);

    return orders.filter(order => {
      // 1. Date Range Filter
      const orderDate = new Date(order.createdAt);
      let matchesDate = true;
      if (dateRange === 'today') {
        matchesDate = orderDate >= todayStart && orderDate <= todayEnd;
      } else if (dateRange === 'yesterday') {
        matchesDate = orderDate >= yesterdayStart && orderDate <= yesterdayEnd;
      } else if (dateRange === '7days') {
        matchesDate = orderDate >= sevenDaysStart;
      } else if (dateRange === '30days') {
        matchesDate = orderDate >= thirtyDaysStart;
      }

      // 2. Status Filter
      const matchesStatus = filterStatus === 'All' || order.status === filterStatus;

      // 3. Search Term Filter
      const customerName = order.customerName || order.user?.name || '';
      const customerPhone = order.customerPhone || order.user?.phone || '';
      const matchesSearch = 
        (order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerPhone.includes(searchTerm);

      return matchesDate && matchesStatus && matchesSearch;
    });
  }, [orders, dateRange, filterStatus, searchTerm]);

  const filteredOrders = getFilteredOrders();

  // Pagination Calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

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
      const orderList = Array.isArray(data) ? data : (data?.orders || []);
      if (Array.isArray(orderList)) {
        const sortedData = orderList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!filteredOrders.length) {
      alert("No orders available to export for current filters.");
      return;
    }

    const headers = [
      "Order ID",
      "Created Date",
      "Created Time",
      "Customer Name",
      "Customer Phone",
      "Total Amount (INR)",
      "Payment Method",
      "Payment Status",
      "Order Status",
      "Delivery Executive"
    ];

    const csvRows = [headers.join(",")];

    filteredOrders.forEach(o => {
      const dateObj = new Date(o.createdAt);
      const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const custName = `"${(o.customerName || o.user?.name || 'Guest').replace(/"/g, '""')}"`;
      const custPhone = `"${(o.customerPhone || o.user?.phone || 'N/A').replace(/"/g, '""')}"`;
      const riderName = `"${(o.deliveryBoy?.name || 'Unassigned').replace(/"/g, '""')}"`;

      const row = [
        `"#${o.orderNumber || o._id.slice(-6).toUpperCase()}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        custName,
        custPhone,
        o.totalAmount || 0,
        `"${o.paymentMethod || 'N/A'}"`,
        `"${o.paymentStatus || 'Pending'}"`,
        `"${o.status || 'Pending'}"`,
        riderName
      ];

      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const rangeLabel = dateRange === 'all' ? 'All_Orders' : dateRange.toUpperCase();
    link.setAttribute("href", url);
    link.setAttribute("download", `FoodExpress_Orders_Report_${rangeLabel}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatOrderDate = (dateString) => {
    if (!dateString) return { date: 'N/A', time: '', tooltip: '' };
    const dateObj = new Date(dateString);
    const date = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const tooltip = dateObj.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return { date, time, tooltip };
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

  // Helper values for selected order breakdown
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Embedded Print CSS to force thermal receipt format only */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
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
          @page {
            margin: 5mm;
            size: auto;
          }
        }
      `}</style>

      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />
        
        <main className="flex-1 p-8 flex flex-col gap-6 min-w-0">
          
          {/* Order Statistics KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div 
              onClick={() => setDateRange('today')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                dateRange === 'today' ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200' : 'bg-white hover:bg-slate-50 border-gray-200/80 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${dateRange === 'today' ? 'text-indigo-100' : 'text-slate-500'}`}>Today's Orders</span>
                <Clock className={`w-4 h-4 ${dateRange === 'today' ? 'text-white' : 'text-indigo-500'}`} />
              </div>
              <div className="text-2xl font-black">{dateCalculatedStats.todayCount.toLocaleString()}</div>
            </div>

            <div 
              onClick={() => setDateRange('yesterday')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                dateRange === 'yesterday' ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200' : 'bg-white hover:bg-slate-50 border-gray-200/80 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${dateRange === 'yesterday' ? 'text-indigo-100' : 'text-slate-500'}`}>Yesterday</span>
                <Calendar className={`w-4 h-4 ${dateRange === 'yesterday' ? 'text-white' : 'text-amber-500'}`} />
              </div>
              <div className="text-2xl font-black">{dateCalculatedStats.yesterdayCount.toLocaleString()}</div>
            </div>

            <div 
              onClick={() => setDateRange('7days')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                dateRange === '7days' ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200' : 'bg-white hover:bg-slate-50 border-gray-200/80 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${dateRange === '7days' ? 'text-indigo-100' : 'text-slate-500'}`}>Last 7 Days</span>
                <TrendingUp className={`w-4 h-4 ${dateRange === '7days' ? 'text-white' : 'text-emerald-500'}`} />
              </div>
              <div className="text-2xl font-black">{dateCalculatedStats.sevenDaysCount.toLocaleString()}</div>
            </div>

            <div 
              onClick={() => setDateRange('30days')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                dateRange === '30days' ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200' : 'bg-white hover:bg-slate-50 border-gray-200/80 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${dateRange === '30days' ? 'text-indigo-100' : 'text-slate-500'}`}>Last 30 Days</span>
                <Calendar className={`w-4 h-4 ${dateRange === '30days' ? 'text-white' : 'text-blue-500'}`} />
              </div>
              <div className="text-2xl font-black">{dateCalculatedStats.thirtyDaysCount.toLocaleString()}</div>
            </div>

            <div 
              onClick={() => setDateRange('all')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                dateRange === 'all' ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200' : 'bg-white hover:bg-slate-50 border-gray-200/80 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${dateRange === 'all' ? 'text-indigo-100' : 'text-slate-500'}`}>Total Orders</span>
                <ShoppingBag className={`w-4 h-4 ${dateRange === 'all' ? 'text-white' : 'text-purple-500'}`} />
              </div>
              <div className="text-2xl font-black">{dateCalculatedStats.totalCount.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex gap-8 min-w-0">
            {/* Orders List Section */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col min-w-0">
              
              {/* Toolbar Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
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

                {/* Date Filter Tabs Bar */}
                <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: '7days', label: 'Last 7 Days' },
                    { id: '30days', label: 'Last 30 Days' },
                    { id: 'all', label: 'All Orders' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDateRange(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        dateRange === tab.id
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {/* Today's Live Kanban Redirect Button */}
                  <button
                    onClick={() => navigate('/admin/food-management/todays-orders')}
                    title="Open Today's Live Order Kanban Tracker"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                    <span>Today's Live Kanban</span>
                  </button>

                  {/* Export Button */}
                  <button
                    onClick={handleExportCSV}
                    title="Export currently filtered orders as CSV"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>

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
                    ? filteredOrders.length 
                    : filteredOrders.filter(o => o.status === status.id).length;
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
                      <th className="pb-3 text-left">Order Date</th>
                      <th className="pb-3 text-left">Customer</th>
                      <th className="pb-3 text-center">Amount</th>
                      <th className="pb-3 text-center">Payment</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4"><div className="w-16 h-3 bg-slate-200 rounded" /></td>
                          <td className="py-4"><div className="w-20 h-3 bg-slate-200 rounded" /></td>
                          <td className="py-4"><div className="w-24 h-3 bg-slate-200 rounded" /></td>
                          <td className="py-4"><div className="w-10 h-3 bg-slate-200 rounded mx-auto" /></td>
                          <td className="py-4"><div className="w-16 h-3 bg-slate-200 rounded mx-auto" /></td>
                          <td className="py-4"><div className="w-14 h-5 bg-slate-200 rounded-full mx-auto" /></td>
                          <td className="py-4"><div className="w-8 h-8 bg-slate-200 rounded-full ml-auto" /></td>
                        </tr>
                      ))
                    ) : paginatedOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-gray-400 py-10 font-semibold">No orders found matching filters.</td>
                      </tr>
                    ) : (
                      paginatedOrders.map(order => {
                        const dateFormatted = formatOrderDate(order.createdAt);
                        return (
                          <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 font-bold text-slate-800">#{order.orderNumber || order._id.slice(-6).toUpperCase()}</td>
                            <td className="py-3.5" title={dateFormatted.tooltip}>
                              <span className="font-semibold text-slate-700 block">{dateFormatted.date}</span>
                              <span className="text-[10px] text-slate-400">{dateFormatted.time}</span>
                            </td>
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredOrders.length > 0 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 text-xs">
                  <span className="text-slate-500 font-medium">
                    Showing <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of{' '}
                    <span className="font-bold text-slate-800">{filteredOrders.length}</span> orders
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-all"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-100">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Details & Invoice Sidebar */}
            {selectedOrder && orderBill && (
              <div className="w-[380px] bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col shrink-0 self-start max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                  <h3 className="text-sm font-bold text-gray-900">Order Info</h3>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={handleRefreshOrder}
                      disabled={loading}
                      title="Refresh Order Details"
                      className="p-1 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                      onClick={handlePrint}
                      title="Print Invoice"
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Order Status</span>
                    {["Delivered", "Completed"].includes(selectedOrder.status) ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg border bg-emerald-50 border-emerald-100 text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {selectedOrder.status} (Updated by Rider)
                      </span>
                    ) : (
                      <select
                        value={selectedOrder.status}
                        disabled={updatingId === selectedOrder._id}
                        onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value)}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${getStatusColor(selectedOrder.status)}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed (Accept)</option>
                        <option value="Preparing">Preparing (Kitchen)</option>
                        <option value="Out For Delivery">Out For Delivery (Dispatch)</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    )}
                  </div>

                  {/* Rider Assignment Banner */}
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                    <span className="text-xs font-bold text-indigo-900 block mb-1">Assigned Rider</span>
                    {selectedOrder.deliveryBoy ? (
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-gray-800 block">{selectedOrder.deliveryBoy.name}</span>
                          <span className="text-[10px] text-gray-500">{selectedOrder.deliveryBoy.phone} ({selectedOrder.deliveryBoy.vehicleType})</span>
                        </div>
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          {selectedOrder.deliveryStatus || 'Assigned'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center mt-1">
                        <select
                          value={selectedRiderId}
                          onChange={(e) => setSelectedRiderId(e.target.value)}
                          className="flex-1 text-xs border border-gray-200 rounded-lg p-1.5 outline-none bg-white font-medium"
                        >
                          <option value="">Select Available Rider...</option>
                          {riders.map(r => (
                            <option key={r._id} value={r._id}>{r.name} ({r.vehicleType || 'Bike'})</option>
                          ))}
                        </select>
                        <button
                          onClick={handleAssignRider}
                          disabled={!selectedRiderId}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          Assign
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="border-b border-gray-100 pb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Customer Info</span>
                    <p className="text-xs font-bold text-gray-800">{selectedOrder.customerName || selectedOrder.user?.name || 'Guest'}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.customerPhone || selectedOrder.user?.phone || 'No Phone'}</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedOrder.address?.line1}, {selectedOrder.address?.city}</p>
                  </div>

                  {/* Restaurant Info */}
                  <div className="border-b border-gray-100 pb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Restaurant Info</span>
                    <p className="text-xs font-bold text-gray-800">{selectedOrder.restaurant?.name || 'Partner Kitchen'}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.restaurant?.address}</p>
                  </div>

                  {/* Items Summary */}
                  <div className="border-b border-gray-100 pb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Order Items</span>
                    <div className="space-y-1.5">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-gray-700 font-medium">{item.quantity}x {item.name || item.foodItem?.name}</span>
                          <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Billing Details Breakdown */}
                  <div className="bg-gray-50/80 p-4 rounded-2xl space-y-2 border border-gray-200/70">
                    <h4 className="text-xs font-bold text-gray-900 border-b border-gray-200/60 pb-1.5">Billing details</h4>
                    
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-800">₹{orderBill.itemsSubtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Delivery</span>
                      <span className="font-bold text-emerald-600">{orderBill.deliveryFee === 0 ? 'FREE' : `₹${orderBill.deliveryFee.toFixed(2)}`}</span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Packaging Fee</span>
                      <span className="font-bold text-emerald-600">{orderBill.packagingFee > 0 ? `₹${orderBill.packagingFee.toFixed(2)}` : 'FREE'}</span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Taxes & Charges (GST)</span>
                      <span className="font-semibold text-slate-800">₹{orderBill.tax.toFixed(2)}</span>
                    </div>

                    {orderBill.discount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-600 font-bold">
                        <span>Discount Savings</span>
                        <span>- ₹{orderBill.discount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total ({selectedOrder.paymentMethod || 'COD'})</span>
                      <span className="text-emerald-600 text-sm font-black">₹{orderBill.grandTotal.toFixed(2)}</span>
                    </div>

                    {orderBill.discount > 0 && (
                      <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-700">
                        Total saved on this order ₹{orderBill.discount.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Customer Rating & Reviews */}
                  {orderReviews.length > 0 && (
                    <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1 mb-2">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        Customer Feedback
                      </span>
                      {orderReviews.map((rev, i) => (
                        <div key={i} className="text-xs space-y-1">
                          <div className="flex items-center gap-1 font-bold text-amber-950">
                            <span>Rating: {rev.rating} / 5</span>
                          </div>
                          {rev.comment && <p className="text-amber-800 italic">"{rev.comment}"</p>}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Printable Thermal Receipt Card (Only visible when printing) */}
      {selectedOrder && orderBill && (
        <div id="printable-receipt" className="hidden print:block font-mono text-black p-4 max-w-[340px] mx-auto border border-black bg-white rounded-lg">
          {/* Header */}
          <div className="text-center border-b border-dashed border-black pb-3 mb-3">
            <h2 className="text-base font-black uppercase tracking-wider">FoodExpress</h2>
            <p className="text-[10px] uppercase font-bold text-gray-700">Official Order Receipt</p>
            <p className="text-[10px] text-gray-700 mt-1">
              Date: {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} {' '}
              {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-[12px] font-black mt-1">ORDER #{selectedOrder.orderNumber || selectedOrder._id.slice(-6).toUpperCase()}</p>
          </div>

          {/* Customer Details */}
          <div className="border-b border-dashed border-black pb-3 mb-3 text-[11px] space-y-0.5">
            <p className="font-bold uppercase text-[9px] text-gray-600">Customer Details:</p>
            <p className="font-black text-[12px]">{selectedOrder.customerName || selectedOrder.user?.name || 'Guest User'}</p>
            <p>Phone: {selectedOrder.customerPhone || selectedOrder.user?.phone || 'N/A'}</p>
            <p>Address: {selectedOrder.address?.line1 ? `${selectedOrder.address.line1}, ${selectedOrder.address.city || ''}` : 'Store Pickup'}</p>
          </div>

          {/* Restaurant Info */}
          <div className="border-b border-dashed border-black pb-3 mb-3 text-[11px] space-y-0.5">
            <p className="font-bold uppercase text-[9px] text-gray-600">Restaurant:</p>
            <p className="font-bold">{selectedOrder.restaurant?.name || 'FoodExpress Premium Kitchen'}</p>
            <p className="text-[10px]">{selectedOrder.restaurant?.address || 'Baramati'}</p>
          </div>

          {/* Order Items */}
          <div className="border-b border-dashed border-black pb-3 mb-3 text-[11px]">
            <p className="font-bold uppercase text-[9px] text-gray-600 mb-1">Order Items:</p>
            <div className="space-y-1">
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <span className="font-bold">{item.quantity}x {item.name || item.foodItem?.name || 'Item'}</span>
                  <span className="font-black">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Billing Details Breakdown for Print */}
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

            {orderBill.discount > 0 && (
              <div className="mt-2 p-1.5 border border-dashed border-black bg-gray-50 text-center text-[10px] font-bold">
                Total saved on this order ₹{orderBill.discount.toFixed(2)}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] space-y-0.5 pt-1">
            <p className="font-bold">Thank you for ordering with FoodExpress!</p>
            <p>Enjoy your meal 🍔</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
