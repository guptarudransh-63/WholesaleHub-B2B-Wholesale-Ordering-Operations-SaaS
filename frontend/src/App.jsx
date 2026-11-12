import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages - Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Pages - Retailer
import CataloguePage from './pages/retailer/CataloguePage';
import QuickOrderPage from './pages/retailer/QuickOrderPage';
import CartPage from './pages/retailer/CartPage';
import OrdersPage from './pages/retailer/OrdersPage';
import OrderDetailPage from './pages/retailer/OrderDetailPage';
import InvoicesPage from './pages/retailer/InvoicesPage';
import CreditDashboardPage from './pages/retailer/CreditDashboardPage';
import ContractPricingPage from './pages/retailer/ContractPricingPage';

// Pages - Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminRetailersPage from './pages/admin/AdminRetailersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminPricingPage from './pages/admin/AdminPricingPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminInvoicesPage from './pages/admin/AdminInvoicesPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/catalogue" replace />;
  }

  return children;
}

export default function App() {
  const { fetchCurrentUser, isAuthenticated } = useAuthStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    fetchCurrentUser();
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
        <Navbar />

        <main className="flex-1">
          <Routes>
            {/* Public / Retailer Browsing Routes */}
            <Route path="/" element={<Navigate to="/catalogue" replace />} />
            <Route path="/catalogue" element={<CataloguePage />} />
            <Route path="/quick-order" element={<QuickOrderPage />} />
            <Route path="/cart" element={<CartPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Retailer Routes */}
            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={['retailer', 'admin']}>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute allowedRoles={['retailer', 'admin']}>
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute allowedRoles={['retailer', 'admin']}>
                  <InvoicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/credit"
              element={
                <ProtectedRoute allowedRoles={['retailer', 'admin']}>
                  <CreditDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contract-pricing"
              element={
                <ProtectedRoute allowedRoles={['retailer', 'admin']}>
                  <ContractPricingPage />
                </ProtectedRoute>
              }
            />

            {/* Administrator Operations Portal */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'sales_manager', 'finance_manager']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/retailers"
              element={
                <ProtectedRoute allowedRoles={['admin', 'sales_manager']}>
                  <AdminRetailersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={['admin', 'inventory_manager']}>
                  <AdminProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pricing"
              element={
                <ProtectedRoute allowedRoles={['admin', 'sales_manager']}>
                  <AdminPricingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute allowedRoles={['admin', 'sales_manager', 'inventory_manager']}>
                  <AdminOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/invoices"
              element={
                <ProtectedRoute allowedRoles={['admin', 'finance_manager']}>
                  <AdminInvoicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute allowedRoles={['admin', 'finance_manager']}>
                  <AdminPaymentsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/catalogue" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
