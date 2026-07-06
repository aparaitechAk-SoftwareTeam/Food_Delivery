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

// New Integrations & Pages
import Login from './pages/admin/Login';
import ProtectedRoute from './pages/admin/ProtectedRoute';
import Orders from './pages/admin/food/Orders';
import Customers from './pages/admin/food/Customers';
import DeliveryBoys from './pages/admin/food/DeliveryBoys';
import Payments from './pages/admin/food/Payments';
import Reviews from './pages/admin/food/Reviews';
import Reports from './pages/admin/food/Reports';
import Notifications from './pages/admin/food/Notifications';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/admin/login" element={<Login />} />

        {/* Redirect Root to Food Management CMS Dashboard */}
        <Route path="/" element={<Navigate to="/admin/food-management" replace />} />
        
        {/* Protected Food Management Routing Tree */}
        <Route path="/admin/food-management" element={<ProtectedRoute><FoodDashboard /></ProtectedRoute>} />
        <Route path="/admin/food-management/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/admin/food-management/foods" element={<ProtectedRoute><FoodItems /></ProtectedRoute>} />
        <Route path="/admin/food-management/featured" element={<ProtectedRoute><FeaturedSections /></ProtectedRoute>} />
        <Route path="/admin/food-management/combos" element={<ProtectedRoute><ComboMeals /></ProtectedRoute>} />
        <Route path="/admin/food-management/banners" element={<ProtectedRoute><OffersBanners /></ProtectedRoute>} />
        <Route path="/admin/food-management/cuisines" element={<ProtectedRoute><CuisineManager /></ProtectedRoute>} />
        <Route path="/admin/food-management/tags" element={<ProtectedRoute><Tags /></ProtectedRoute>} />
        <Route path="/admin/food-management/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/admin/food-management/menu-order" element={<ProtectedRoute><MenuOrdering /></ProtectedRoute>} />
        <Route path="/admin/food-management/import" element={<ProtectedRoute><BulkImport /></ProtectedRoute>} />
        <Route path="/admin/food-management/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        
        {/* New Pages */}
        <Route path="/admin/food-management/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/admin/food-management/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/admin/food-management/delivery-boys" element={<ProtectedRoute><DeliveryBoys /></ProtectedRoute>} />
        <Route path="/admin/food-management/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
        <Route path="/admin/food-management/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
        <Route path="/admin/food-management/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/admin/food-management/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/admin/food-management" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
