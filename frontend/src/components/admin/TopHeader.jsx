import React from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const TopHeader = () => {
  const location = useLocation();
  const path = location.pathname;

  let title = 'Food Catalog Management';
  let subtitle = 'Control categories, catalog items, menus, combos, offers, inventory, and homepage sections.';

  if (path === '/admin/food-management') {
    title = 'CMS Dashboard';
    subtitle = 'Overview of menu items, combos, availability, and platform performance.';
  } else if (path.includes('/categories')) {
    title = 'Category Manager';
    subtitle = 'Order and setup menu categories visible to customers.';
  } else if (path.includes('/foods')) {
    title = 'Food Directory Catalog';
    subtitle = 'Manage food details, inventory, tags, and discounts.';
  } else if (path.includes('/featured')) {
    title = 'Featured Homepage Rows';
    subtitle = 'Control featured rows visible on the mobile home screen.';
  } else if (path.includes('/combos')) {
    title = 'Combo Manager Builder';
    subtitle = 'Combine menu items together to increase average ticket orders with bundle savings.';
  } else if (path.includes('/banners')) {
    title = 'Banner Manager';
    subtitle = 'Configure top slides, middle offers, and promo banners visible on the platform.';
  } else if (path.includes('/cuisines')) {
    title = 'Cuisine Manager';
    subtitle = 'Configure culinary classifications that group recipes on the search dashboard.';
  } else if (path.includes('/tags')) {
    title = 'Catalog Tags';
    subtitle = 'Global tags for categorization, filtering, and mobile app search indexes.';
  } else if (path.includes('/inventory')) {
    title = 'Stock Inventory Manager';
    subtitle = 'Instantly edit stock items and platform visibility indicators.';
  } else if (path.includes('/menu-order')) {
    title = 'Menu Ordering';
    subtitle = 'Order the display order of categories and featured rows on the mobile homepage.';
  } else if (path.includes('/import')) {
    title = 'Bulk Catalog Importer';
    subtitle = 'Batch insert, update, or remove food items using CSV, Excel, or JSON files.';
  } else if (path.includes('/settings')) {
    title = 'Catalog Settings';
    subtitle = 'Manage global menu variables, default taxes, currency symbols, and default times.';
  }

  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between px-8 py-6 bg-white border-b border-gray-100 shrink-0">
      <div className="flex flex-col">
        {/* Live Admin Indicator */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">
            Live Catalog CMS Mode
          </span>
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-2xl font-black text-gray-900 leading-tight">
          {title}
        </h2>
        <p className="text-xs text-gray-400 font-medium mt-1">
          {subtitle}
        </p>
      </div>

      {/* Right - Operations Badge */}
      <div className="mt-4 md:mt-0 shrink-0">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-600 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>CMS Mode Enabled</span>
          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
