import React, { useState, useEffect } from 'react';
import { BarChart3, Download, RefreshCw, Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingBag, ArrowUpRight, Award, AlertCircle } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';

const Reports = () => {
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('Month');

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const [ordersRes, foodsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).catch(() => []),
        fetch(`${API_BASE_URL}/admin/foods`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).catch(() => [])
      ]);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setFoods(Array.isArray(foodsRes) ? foodsRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getAnalytics = () => {
    const deliveredOrders = orders.filter(o => o.status === 'Delivered');
    
    // Revenue calculations
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    const today = new Date().toDateString();
    const todayOrders = deliveredOrders.filter(o => new Date(o.createdAt).toDateString() === today);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthOrders = deliveredOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthRevenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Food performance calculation
    const foodSalesMap = {};
    orders.forEach(order => {
      if (order.status !== 'Cancelled') {
        (order.items || []).forEach(item => {
          const foodId = item.food?._id || item.food;
          const foodName = item.food?.name || 'Unknown Dish';
          if (!foodSalesMap[foodId]) {
            foodSalesMap[foodId] = { name: foodName, quantity: 0, revenue: 0 };
          }
          foodSalesMap[foodId].quantity += item.quantity;
          foodSalesMap[foodId].revenue += item.quantity * item.price;
        });
      }
    });

    const topFoods = Object.values(foodSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Category performance
    const catSalesMap = {};
    orders.forEach(order => {
      if (order.status !== 'Cancelled') {
        (order.items || []).forEach(item => {
          const catName = item.food?.category?.name || 'Other';
          if (!catSalesMap[catName]) {
            catSalesMap[catName] = { name: catName, quantity: 0, revenue: 0 };
          }
          catSalesMap[catName].quantity += item.quantity;
          catSalesMap[catName].revenue += item.quantity * item.price;
        });
      }
    });

    const topCategories = Object.values(catSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);

    return {
      totalRevenue,
      todayRevenue,
      monthRevenue,
      orderCount: orders.length,
      deliveredCount: deliveredOrders.length,
      todayCount: todayOrders.length,
      monthCount: monthOrders.length,
      topFoods,
      topCategories
    };
  };

  const downloadCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Order Number', 'Customer', 'Amount', 'Payment Method', 'Status', 'Date'];
    const rows = orders.map(o => [
      `#${o.orderNumber || o._id.slice(-6).toUpperCase()}`,
      o.user?.name || 'Guest User',
      o.totalAmount,
      o.paymentMethod,
      o.status,
      new Date(o.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'foodexpress_sales_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = getAnalytics();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 pl-[240px] flex flex-col min-w-0">
        <TopHeader />
        
        <main className="flex-1 p-8 space-y-8">
          {/* Action Row */}
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Report Timeframe:</span>
              <select 
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 outline-none font-bold text-slate-800 cursor-pointer"
              >
                <option>Today</option>
                <option>Month</option>
                <option>Year</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={downloadCSV}
                className="px-4 py-2 border border-gray-200 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV Report</span>
              </button>
              <button 
                onClick={loadData}
                className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl border border-gray-200/85 bg-white shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today's Revenue</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><DollarSign className="w-4 h-4" /></div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-slate-800">₹{stats.todayRevenue.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-0.5 mt-1"><TrendingUp className="w-3 h-3" /> +12% since yesterday</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-gray-200/85 bg-white shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">This Month</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><DollarSign className="w-4 h-4" /></div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-slate-800">₹{stats.monthRevenue.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-indigo-500 flex items-center gap-0.5 mt-1"><TrendingUp className="w-3 h-3" /> +18% since last month</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-gray-200/85 bg-white shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Sales (Overall)</span>
                <div className="p-2 rounded-xl bg-slate-50 text-slate-600"><DollarSign className="w-4 h-4" /></div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-slate-800">₹{stats.totalRevenue.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-slate-400 block mt-1">Combined delivery earnings</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-gray-200/85 bg-white shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Dispatch Orders</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><ShoppingBag className="w-4 h-4" /></div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-slate-800">{stats.deliveredCount} / {stats.orderCount}</span>
                <span className="text-[9px] font-bold text-amber-500 block mt-1">{stats.orderCount - stats.deliveredCount} orders currently in-flight</span>
              </div>
            </div>
          </div>

          {/* Graphical breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Category breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between col-span-1">
              <div>
                <h3 className="text-sm font-bold text-slate-805">Category Performance</h3>
                <p className="text-[10px] text-gray-400 font-medium">Revenue contribution by menu categories</p>
              </div>

              <div className="space-y-4.5 mt-6 flex-1 justify-center flex flex-col">
                {stats.topCategories.length === 0 ? (
                  <div className="text-center text-xs text-gray-400 py-10">No categories statistics calculated.</div>
                ) : (
                  stats.topCategories.map((cat, idx) => {
                    const pct = Math.round((cat.revenue / (stats.totalRevenue || 1)) * 100);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{cat.name}</span>
                          <span>₹{cat.revenue.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Food items sales */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between col-span-2">
              <div>
                <h3 className="text-sm font-bold text-slate-805">Food Item Leaderboard</h3>
                <p className="text-[10px] text-gray-400 font-medium">Dishes scoring highest in checkout volumes and total earnings</p>
              </div>

              <div className="overflow-x-auto mt-6">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 text-left">Dish Name</th>
                      <th className="pb-3 text-center">Quantity Sold</th>
                      <th className="pb-3 text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.topFoods.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="text-center text-gray-400 py-10 font-semibold">No food sales recorded.</td>
                      </tr>
                    ) : (
                      stats.topFoods.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 font-bold text-slate-800 flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>{item.name}</span>
                          </td>
                          <td className="py-3.5 text-center font-bold text-slate-700">{item.quantity} Servings</td>
                          <td className="py-3.5 text-right font-black text-slate-900">₹{item.revenue.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
