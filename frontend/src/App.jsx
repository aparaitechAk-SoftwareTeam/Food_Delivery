import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FoodDashboard from './pages/admin/food/FoodDashboard';
import Categories from './pages/admin/food/Categories';
import FoodItems from './pages/admin/food/FoodItems';
import ComboMeals from './pages/admin/food/ComboMeals';
import FeaturedSections from './pages/admin/food/FeaturedSections';
import OffersBanners from './pages/admin/food/OffersBanners';
import MenuOrdering from './pages/admin/food/MenuOrdering';
import Inventory from './pages/admin/food/Inventory';
import Tags from './pages/admin/food/Tags';
import CuisineManager from './pages/admin/food/CuisineManager';
import BulkImport from './pages/admin/food/BulkImport';
import Settings from './pages/admin/food/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect Root to Food Management CMS Dashboard */}
        <Route path="/" element={<Navigate to="/admin/food-management" replace />} />
        
        {/* Flat Food Management Routing Tree */}
        <Route path="/admin/food-management" element={<FoodDashboard />} />
        <Route path="/admin/food-management/categories" element={<Categories />} />
        <Route path="/admin/food-management/foods" element={<FoodItems />} />
        <Route path="/admin/food-management/featured" element={<FeaturedSections />} />
        <Route path="/admin/food-management/combos" element={<ComboMeals />} />
        <Route path="/admin/food-management/banners" element={<OffersBanners />} />
        <Route path="/admin/food-management/cuisines" element={<CuisineManager />} />
        <Route path="/admin/food-management/tags" element={<Tags />} />
        <Route path="/admin/food-management/inventory" element={<Inventory />} />
        <Route path="/admin/food-management/menu-order" element={<MenuOrdering />} />
        <Route path="/admin/food-management/import" element={<BulkImport />} />
        <Route path="/admin/food-management/settings" element={<Settings />} />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/admin/food-management" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
