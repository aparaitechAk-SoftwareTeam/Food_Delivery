import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { 
  LayoutDashboard, 
  FolderHeart, 
  ListCollapse, 
  ChefHat, 
  Sparkles, 
  Image as ImageIcon, 
  Utensils, 
  Tag, 
  Database, 
  ArrowUpDown, 
  Upload, 
  Settings as SettingsIcon,
  ClipboardList,
  Users,
  CreditCard,
  Star,
  BarChart3,
  Bell,
  LogOut,
  Gift,
  Home,
  Radio,
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const [isPinned, setIsPinned] = useState(() => {
    return localStorage.getItem('admin_sidebar_pinned') !== 'false';
  });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isPinned) {
      document.body.classList.add('sidebar-auto-hide');
    } else {
      document.body.classList.remove('sidebar-auto-hide');
    }
    return () => {
      document.body.classList.remove('sidebar-auto-hide');
    };
  }, [isPinned]);

  const togglePin = () => {
    setIsPinned(prev => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_pinned', String(next));
      return next;
    });
  };

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, path: '/admin/food-management' },
    { name: 'Home Layout', icon: <Home className="w-4 h-4" />, path: '/admin/food-management/home' },
    { 
      name: 'Orders History', 
      icon: <ClipboardList className="w-4 h-4" />, 
      path: '/admin/food-management/orders',
      subItems: [
        { name: "Today's Live Kanban", path: '/admin/food-management/todays-orders', icon: <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> }
      ]
    },
    { name: 'Menu', icon: <FolderHeart className="w-4 h-4" />, path: '/admin/food-management/categories' },
    { name: 'Food Items', icon: <ListCollapse className="w-4 h-4" />, path: '/admin/food-management/foods' },
    { name: 'Featured Sections', icon: <ChefHat className="w-4 h-4" />, path: '/admin/food-management/featured' },
    { name: 'Combo Meals', icon: <Sparkles className="w-4 h-4" />, path: '/admin/food-management/combos' },
    { name: 'Cuisine Manager', icon: <Utensils className="w-4 h-4" />, path: '/admin/food-management/cuisines' },
    { name: 'Tags', icon: <Tag className="w-4 h-4" />, path: '/admin/food-management/tags' },
    { name: 'Inventory', icon: <Database className="w-4 h-4" />, path: '/admin/food-management/inventory' },
    { name: 'Customers', icon: <Users className="w-4 h-4" />, path: '/admin/food-management/customers' },
    { name: 'Delivery Boys', icon: <Users className="w-4 h-4" />, path: '/admin/food-management/delivery-boys' },
    { name: 'Reward Manager', icon: <Gift className="w-4 h-4" />, path: '/admin/food-management/rewards' },
    { name: 'Payments & QR', icon: <CreditCard className="w-4 h-4" />, path: '/admin/food-management/payments' },
    { name: 'Reviews Manager', icon: <Star className="w-4 h-4" />, path: '/admin/food-management/reviews' },
    { name: 'Push Notifications', icon: <Bell className="w-4 h-4" />, path: '/admin/food-management/notifications' },
    { name: 'Platform Reports', icon: <BarChart3 className="w-4 h-4" />, path: '/admin/food-management/reports' },
    { name: 'Menu Ordering', icon: <ArrowUpDown className="w-4 h-4" />, path: '/admin/food-management/menu-order' },
    { name: 'Bulk Import', icon: <Upload className="w-4 h-4" />, path: '/admin/food-management/import' },
    { name: 'Settings', icon: <SettingsIcon className="w-4 h-4" />, path: '/admin/food-management/settings' },
  ];

  const handleSignOut = async () => {
    try {
      await fetch(`${API_BASE_URL}/admin/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.warn("Backend logout failed:", err.message);
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      navigate('/admin/login');
    }
  };

  const isVisible = isPinned || isHovered;

  return (
    <>
      {/* Global CSS Rule to remove left padding on all admin pages when sidebar is in Auto-Hide mode */}
      <style>{`
        body.sidebar-auto-hide [class*="pl-[240px]"] {
          padding-left: 0px !important;
          transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
      `}</style>

      {/* Active Left Hover Detector Strip (Triggers slide-out drawer when mouse reaches left screen edge) */}
      {!isPinned && (
        <div 
          onMouseEnter={() => setIsHovered(true)}
          aria-hidden="true"
          className="fixed inset-y-0 left-0 w-4 z-40 cursor-pointer bg-gradient-to-r from-indigo-600/30 via-indigo-500/10 to-transparent hover:from-indigo-600/50 transition-all group flex items-center justify-start pl-0.5"
          title="Move mouse here to open menu drawer"
        >
          <div className="w-1 h-12 bg-indigo-500/60 rounded-r-full group-hover:bg-indigo-400 group-hover:h-20 transition-all shadow-sm" />
        </div>
      )}

      {/* Backdrop overlay when drawer is open in Auto-Hide mode */}
      {!isPinned && isHovered && (
        <div 
          onClick={() => setIsHovered(false)}
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[1px] transition-opacity"
        />
      )}

      {/* Main Sidebar Drawer Container */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[240px] bg-slate-950 text-slate-400 border-r border-slate-800 shrink-0 select-none transition-transform duration-300 ease-in-out shadow-2xl ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Header & Pin Toggle */}
        <div className="p-4 border-b border-slate-900 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm shadow-md shadow-indigo-600/30">
              FE
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white leading-tight">FoodExpress</h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Enterprise Admin</span>
            </div>
          </div>

          {/* Toggle Auto-Hide / Pin Mode */}
          <button
            onClick={togglePin}
            title={isPinned ? "Click to enable Auto-Hide mode (Expands screen BIG)" : "Click to Pin sidebar open"}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isPinned 
                ? 'bg-slate-900 border-slate-700 text-indigo-400 hover:text-white' 
                : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-500 shadow-sm'
            }`}
          >
            {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-650 uppercase tracking-widest">Food Management</span>
            {!isPinned && (
              <span className="text-[8px] font-bold bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-800/60">
                Drawer Mode
              </span>
            )}
          </div>
          {menuItems.map((item) => (
            <React.Fragment key={item.name}>
              <NavLink
                to={item.path}
                end={item.path === '/admin/food-management'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                      : 'hover:bg-slate-900 hover:text-white'
                  }`
                }
              >
                {item.icon}
                <span className="flex-1">{item.name}</span>
              </NavLink>
              {item.subItems && (
                <div className="pl-6 space-y-1 my-1">
                  {item.subItems.map((sub) => (
                    <NavLink
                      key={sub.name}
                      to={sub.path}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                        }`
                      }
                    >
                      {sub.icon}
                      <span>{sub.name}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-900 shrink-0">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
