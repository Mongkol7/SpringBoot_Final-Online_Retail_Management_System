import React, { useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { EnterpriseAuthPortal } from './components/auth/EnterpriseAuthPortal';
import { CustomerApp } from './features/customer/CustomerApp';
import { CashierPosTerminal } from './components/pos/CashierPosTerminal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StockWorkspace } from './features/inventory/StockWorkspace';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const { logoutRole, hasAccess } = useAuth();
  const path = location.pathname.toLowerCase();

  useLayoutEffect(() => {
    // BrowserRouter keeps the current document scroll position across client-side
    // route changes. Product details should always open at their top, not at the
    // storefront card's previous position near the bottom of the page.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  const isPos = path.startsWith('/pos') || path.startsWith('/cashier');
  const isAdmin = path.startsWith('/admin');
  const isStock = path.startsWith('/stock') || path.startsWith('/inventory');
  const isExplicitAuthPath = path === '/login' || path === '/signup' || path.endsWith('/login');
  const isProtectedLoginScreen =
    (isAdmin && !hasAccess('ADMIN')) ||
    (isPos && !hasAccess('CASHIER')) ||
    (isStock && !hasAccess('STOCK_CONTROLLER'));
  const isAuthShell = isExplicitAuthPath || isProtectedLoginScreen;
  const isWide = !isAuthShell && (isPos || isAdmin || isStock);

  return (
    <div
      className={isWide ? 'role-app-shell' : isAuthShell ? 'auth-app-shell' : undefined}
      style={{
        minHeight: '100vh',
        padding: isWide ? '24px 20px 36px' : isAuthShell ? 0 : '32px 24px 60px',
        maxWidth: isWide || isAuthShell ? '100%' : '1240px',
        width: '100%',
        margin: '0 auto',
        background: isAuthShell ? '#F5F5F7' : undefined,
        boxSizing: 'border-box',
        transition: 'all 0.25s ease'
      }}
    >
      <Routes>
        {/* Customer Storefront Routes (Public Catalog, Cart, Product Details) */}
        <Route path="/" element={<CustomerApp initialRoute="shop" />} />
        <Route path="/shop" element={<CustomerApp initialRoute="shop" />} />
        <Route path="/product/:id" element={<CustomerApp initialRoute="product-detail" />} />
        <Route path="/shop/product/:id" element={<CustomerApp initialRoute="product-detail" />} />
        <Route path="/cart" element={<CustomerApp initialRoute="cart" />} />

        {/* Customer Protected Routes (Orders, Checkout, Wholesale Registration) */}
        <Route
          path="/wholesale"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <CustomerApp initialRoute="wholesale" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wholesale-register"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <CustomerApp initialRoute="wholesale" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <CustomerApp initialRoute="checkout" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <CustomerApp initialRoute="orders" />
            </ProtectedRoute>
          }
        />

        {/* Cashier POS Terminal (Protected: CASHIER or ADMIN) */}
        <Route
          path="/pos"
          element={
            <ProtectedRoute allowedRoles={['CASHIER', 'ADMIN']}>
              <CashierPosTerminal />
            </ProtectedRoute>
          }
        />
        <Route path="/cashier" element={<Navigate to="/pos" replace />} />

        {/* Stock / Warehouse Workspace (Protected: STOCK_CONTROLLER or ADMIN) */}
        <Route
          path="/stock"
          element={
            <ProtectedRoute allowedRoles={['STOCK_CONTROLLER', 'ADMIN']}>
              <StockWorkspace />
            </ProtectedRoute>
          }
        />
        <Route path="/inventory" element={<Navigate to="/stock" replace />} />

        {/* Executive Admin HUD (Protected: ADMIN only) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard onLogout={() => logoutRole('ADMIN')} />
            </ProtectedRoute>
          }
        />

        {/* Universal Multi-Role Authentication Portals - Same UI for all users */}
        <Route path="/login" element={<EnterpriseAuthPortal />} />
        <Route path="/signup" element={<EnterpriseAuthPortal />} />
        <Route path="/admin/login" element={<EnterpriseAuthPortal />} />
        <Route path="/pos/login" element={<EnterpriseAuthPortal />} />
        <Route path="/cashier/login" element={<EnterpriseAuthPortal />} />
        <Route path="/stock/login" element={<EnterpriseAuthPortal />} />

        {/* Catch-All Fallback */}
        <Route path="*" element={<Navigate to="/shop" replace />} />
      </Routes>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
