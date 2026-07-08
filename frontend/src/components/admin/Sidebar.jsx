import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, path: '/admin/food-management' },
    { name: 'Orders', icon: <ClipboardList className="w-4 h-4" />, path: '/admin/food-management/orders' },
    { name: 'Categories', icon: <FolderHeart className="w-4 h-4" />, path: '/admin/food-management/categories' },
    { name: 'Food Items', icon: <ListCollapse className="w-4 h-4" />, path: '/admin/food-management/foods' },
    { name: 'Featured Sections', icon: <ChefHat className="w-4 h-4" />, path: '/admin/food-management/featured' },
    { name: 'Combo Meals', icon: <Sparkles className="w-4 h-4" />, path: '/admin/food-management/combos' },
    { name: 'Offers & Banners', icon: <ImageIcon className="w-4 h-4" />, path: '/admin/food-management/banners' },
    { name: 'Cuisine Manager', icon: <Utensils className="w-4 h-4" />, path: '/admin/food-management/cuisines' },
    { name: 'Tags', icon: <Tag className="w-4 h-4" />, path: '/admin/food-management/tags' },
    { name: 'Inventory', icon: <Database className="w-4 h-4" />, path: '/admin/food-management/inventory' },
    { name: 'Customers', icon: <Users className="w-4 h-4" />, path: '/admin/food-management/customers' },
    { name: 'Delivery Boys', icon: <Users className="w-4 h-4" />, path: '/admin/food-management/delivery-boys' },
    { name: 'Payments & QR', icon: <CreditCard className="w-4 h-4" />, path: '/admin/food-management/payments' },
    { name: 'Reviews Manager', icon: <Star className="w-4 h-4" />, path: '/admin/food-management/reviews' },
    { name: 'Push Notifications', icon: <Bell className="w-4 h-4" />, path: '/admin/food-management/notifications' },
    { name: 'Platform Reports', icon: <BarChart3 className="w-4 h-4" />, path: '/admin/food-management/reports' },
    { name: 'Menu Ordering', icon: <ArrowUpDown className="w-4 h-4" />, path: '/admin/food-management/menu-order' },
    { name: 'Bulk Import', icon: <Upload className="w-4 h-4" />, path: '/admin/food-management/import' },
    { name: 'Settings', icon: <SettingsIcon className="w-4 h-4" />, path: '/admin/food-management/settings' },
  ];

  const handleSignOut = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex flex-col w-[240px] bg-slate-950 text-slate-400 border-r border-slate-800 shrink-0 select-none">
      {/* Logo Header */}
      <div className="p-5 border-b border-slate-900 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm">
            FE
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white leading-tight">FoodExpress</h1>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Enterprise Admin</span>
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
        <div className="px-3 mb-2">
          <span className="text-[9px] font-bold text-slate-650 uppercase tracking-widest">Food Management</span>
        </div>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
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
            <span>{item.name}</span>
          </NavLink>
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
  );
};

export default Sidebar;
