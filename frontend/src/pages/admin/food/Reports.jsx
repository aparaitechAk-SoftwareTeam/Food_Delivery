import React, { useState, useEffect } from 'react';
import { BarChart3, Download, RefreshCw, Calendar, TrendingUp, DollarSign, ShoppingBag, Award, Users, Wallet, Truck } from 'lucide-react';
import Sidebar from '../../../components/admin/Sidebar';
import TopHeader from '../../../components/admin/TopHeader';
import { API_BASE_URL } from '../../../config';

const Reports = () => {
  const [orders, setOrders] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('Month');

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [ordersRes, deliveryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/orders`, { headers }).then(res => res.json()).catch(() => []),
        fetch(`${API_BASE_URL}/admin/delivery-boys`, { headers }).then(res => res.json()).catch(() => [])
      ]);

      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setDeliveryBoys(Array.isArray(deliveryRes) ? deliveryRes : []);
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
    // Valid non-cancelled orders
    const validOrders = orders.filter(o => o.status !== 'Cancelled');
    
    // Fulfilled orders
    const fulfilledOrders = validOrders.filter(o => 
      ['Delivered', 'Completed'].includes(o.status) || 
      ['Delivered', 'Completed'].includes(o.deliveryStatus) ||
      ['Delivered', 'Completed'].includes(o.riderStatus)
    );

    // Financial Metrics
    const totalSalesVolume = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const fulfilledRevenue = fulfilledOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    // Total Driver Cut / Fee payouts across fulfilled orders
    const totalDriverCut = fulfilledOrders.reduce((sum, o) => sum + (o.deliveryCharge || 40), 0);
    
    // Platform Net Revenue after driver payouts
    const netPlatformRevenue = Math.max(0, fulfilledRevenue - totalDriverCut);

    // Today & Month revenue
    const todayStr = new Date().toDateString();
    const todayOrders = fulfilledOrders.filter(o => new Date(o.createdAt).toDateString() === todayStr);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const todayDriverCut = todayOrders.reduce((sum, o) => sum + (o.deliveryCharge || 40), 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthOrders = fulfilledOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Top Food Items leaderboard
    const foodSalesMap = {};
    validOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const foodId = item.food?._id || item.food;
        const foodName = item.food?.name || 'Dish Item';
        if (!foodSalesMap[foodId]) {
          foodSalesMap[foodId] = { name: foodName, quantity: 0, revenue: 0 };
        }
        foodSalesMap[foodId].quantity += (item.quantity || 1);
        foodSalesMap[foodId].revenue += (item.quantity || 1) * (item.price || 0);
      });
    });

    const topFoods = Object.values(foodSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalSalesVolume,
      fulfilledRevenue,
      totalDriverCut,
      netPlatformRevenue,
      todayRevenue,
      todayDriverCut,
      monthRevenue,
      totalOrderCount: orders.length,
      fulfilledCount: fulfilledOrders.length,
      inFlightCount: orders.length - fulfilledOrders.length,
      topFoods,
    };
  };

  const downloadCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Order Number', 'Customer', 'Restaurant', 'Grand Total (INR)', 'Driver Cut Fee (INR)', 'Payment Method', 'Order Status', 'Delivery Status', 'Delivery Driver', 'Date'];
    
    const rows = orders.map(o => {
      const driverName = o.deliveryBoy?.name || o.deliveryBoy || 'Unassigned';
      const isFulfilled = ['Delivered', 'Completed'].includes(o.status) || ['Delivered', 'Completed'].includes(o.deliveryStatus);
      const driverFee = isFulfilled ? (o.deliveryCharge || 40) : 0;
      
      return [
        `#${o.orderNumber || o._id.slice(-6).toUpperCase()}`,
        `"${o.user?.name || o.customerName || 'Guest'}"`,
        `"${o.restaurant?.name || 'Partner Kitchen'}"`,
        o.totalAmount || 0,
        driverFee,
        `"${o.paymentMethod || 'COD'}"`,
        o.status,
        o.deliveryStatus || 'None',
        `"${driverName}"`,
        new Date(o.createdAt).toLocaleDateString()
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FoodExpress_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`);
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
          <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-850">Financial & Driver Cut Reports</h2>
              <p className="text-xs text-gray-400 font-medium">Real-time breakdown of sales, rider payouts, COD cash, and platform commission.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <select 
                  value={timeframe} 
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="bg-transparent outline-none font-bold text-slate-800 cursor-pointer text-xs"
                >
                  <option>Today</option>
                  <option>Month</option>
                  <option>Year</option>
                </select>
              </div>

              <button 
                onClick={downloadCSV}
                className="px-4 py-2 border border-gray-200 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Financial CSV</span>
              </button>
              
              <button 
                onClick={loadData}
                className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-slate-50 transition-colors"
                title="Refresh Report Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Card 1: Gross Sales */}
            <div className="p-5 rounded-2xl border border-gray-200/85 bg-white shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gross Order Volume</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><DollarSign className="w-4 h-4" /></div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-slate-800">₹{stats.totalSalesVolume.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-indigo-500 block mt-1">Total revenue across all orders</span>
              </div>
            </div>

            {/* Card 2: Driver Cut Payouts */}
            <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Total Driver Cut</span>
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700"><Truck className="w-4 h-4" /></div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-amber-700">₹{stats.totalDriverCut.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-amber-600 block mt-1">Delivery fee payouts to riders</span>
              </div>
            </div>

            {/* Card 3: Net Platform Profit */}
            <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Net Platform Earnings</span>
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700"><Wallet className="w-4 h-4" /></div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-emerald-700">₹{stats.netPlatformRevenue.toLocaleString()}</span>
                <span className="text-[9px] font-bold text-emerald-600 block mt-1">Revenue after driver fee deduction</span>
              </div>
            </div>

            {/* Card 4: Dispatch Volume */}
            <div className="p-5 rounded-2xl border border-gray-200/85 bg-white shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fulfilled Deliveries</span>
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700"><ShoppingBag className="w-4 h-4" /></div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-slate-800">{stats.fulfilledCount} / {stats.totalOrderCount}</span>
                <span className="text-[9px] font-bold text-slate-500 block mt-1">{stats.inFlightCount} orders pending / in-flight</span>
              </div>
            </div>
          </div>

          {/* Driver Cut & Settlement Report Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-850 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>Delivery Boy Earnings & Settlement Report</span>
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Summary of driver cuts earned, COD cash collected, and order counts per rider.</p>
              </div>

              <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">
                {deliveryBoys.length} Registered Riders
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[9px]">
                    <th className="pb-3 text-left">Rider Name</th>
                    <th className="pb-3 text-left">Phone & Vehicle</th>
                    <th className="pb-3 text-center">Deliveries</th>
                    <th className="pb-3 text-right">Driver Cut (Payout)</th>
                    <th className="pb-3 text-right">COD Cash Collected</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {deliveryBoys.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-gray-400 py-8 font-semibold">No delivery riders found.</td>
                    </tr>
                  ) : (
                    deliveryBoys.map((rider) => (
                      <tr key={rider._id} className="hover:bg-slate-50/50 transition-colors text-[11px]">
                        <td className="py-3 font-bold text-slate-800 flex items-center gap-2">
                          <img 
                            src={rider.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"} 
                            alt={rider.name} 
                            className="w-7 h-7 rounded-full bg-slate-100 object-cover border border-slate-200"
                          />
                          <div>
                            <span>{rider.name}</span>
                            <span className="text-[9px] text-gray-400 font-medium block">{rider.email}</span>
                          </div>
                        </td>
                        <td className="py-3 text-slate-600 font-semibold">
                          <div>{rider.phone || 'N/A'}</div>
                          <span className="text-[9px] text-slate-400 font-normal">{rider.vehicleType} ({rider.vehicleNumber || 'N/A'})</span>
                        </td>
                        <td className="py-3 text-center font-bold text-slate-700">
                          {rider.completedCount || 0} Delivered
                        </td>
                        <td className="py-3 text-right font-black text-emerald-600">
                          ₹{(rider.totalEarnings || 0).toLocaleString()}
                        </td>
                        <td className="py-3 text-right font-black text-amber-600">
                          ₹{(rider.cashCollected || 0).toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${rider.isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                            {rider.isOnline ? 'Active' : 'Offline'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Food Item Sales Leaderboard */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Top Food Items Sales Leaderboard</h3>
                <p className="text-[10px] text-gray-400 font-medium">Dishes generating highest sales volume and gross revenue</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[9px]">
                    <th className="pb-3 text-left">Dish Name</th>
                    <th className="pb-3 text-center">Quantity Sold</th>
                    <th className="pb-3 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.topFoods.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center text-gray-400 py-8 font-semibold">No food sales recorded yet.</td>
                    </tr>
                  ) : (
                    stats.topFoods.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors text-[11px]">
                        <td className="py-3 font-bold text-slate-800 flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>{item.name}</span>
                        </td>
                        <td className="py-3 text-center font-bold text-slate-700">{item.quantity} Servings</td>
                        <td className="py-3 text-right font-black text-slate-900">₹{item.revenue.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
