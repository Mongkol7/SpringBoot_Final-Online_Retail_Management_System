import React from 'react';
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
  const { logoutRole } = useAuth();
  const path = location.pathname.toLowerCase();

  const isPos = path.startsWith('/pos') || path.startsWith('/cashier');
  const isAdmin = path.startsWith('/admin');
  const isStock = path.startsWith('/stock') || path.startsWith('/inventory');
  const isWide = isPos || isAdmin || isStock;

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: isWide ? '24px 20px 36px' : '32px 24px 60px',
        maxWidth: isWide ? '100%' : '1240px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
        transition: 'all 0.25s ease'
      }}
    >
      <Routes>
        {/* Customer Storefront Routes (Public Catalog, Cart) */}
        <Route path="/" element={<CustomerApp initialRoute="shop" />} />
        <Route path="/shop" element={<CustomerApp initialRoute="shop" />} />
        <Route path="/cart" element={<CustomerApp initialRoute="cart" />} />
        <Route path="/wholesale" element={<CustomerApp initialRoute="wholesale" />} />
        <Route path="/wholesale-register" element={<CustomerApp initialRoute="wholesale" />} />

        {/* Customer Protected Routes (Orders, Checkout) */}
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

        {/* Universal Multi-Role Authentication Portals */}
        <Route path="/login" element={<EnterpriseAuthPortal />} />
        <Route path="/admin/login" element={<EnterpriseAuthPortal defaultRole="ADMIN" />} />
        <Route path="/pos/login" element={<EnterpriseAuthPortal defaultRole="CASHIER" />} />
        <Route path="/cashier/login" element={<EnterpriseAuthPortal defaultRole="CASHIER" />} />
        <Route path="/stock/login" element={<EnterpriseAuthPortal defaultRole="STOCK_CONTROLLER" />} />

        {/* Catch-All Fallback */}
        <Route path="*" element={<Navigate to="/shop" replace />} />
      </Routes>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
