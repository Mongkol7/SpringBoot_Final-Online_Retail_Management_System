import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from './features/customer/CustomerLayout';
import { ShopPage } from './features/customer/ShopPage';
import { CartPage } from './features/customer/CartPage';
import { CheckoutPage } from './features/customer/CheckoutPage';
import { OrdersPage } from './features/customer/OrdersPage';
import { CustomerLoginPage } from './features/customer/CustomerLoginPage';
import { CustomerRegisterPage } from './features/customer/CustomerRegisterPage';
import { WholesaleRegisterPage } from './features/customer/WholesaleRegisterPage';
import { CashierPosTerminal } from './components/pos/CashierPosTerminal';
import { IosCardGlass } from './components/ui/IosCardGlass';
import { IosButton } from './components/ui/IosButton';
import { IosBadge } from './components/ui/IosBadge';

// Stock Controller Role View Placeholder (/stock) - Person 3
const StockControllerWorkspace: React.FC = () => (
  <div style={{ maxWidth: '1000px', margin: '60px auto', padding: '0 20px' }}>
    <IosCardGlass glow style={{ padding: '36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
          📦 Person 3: Stock Controller Inventory Suite (`/stock`)
        </h2>
        <IosBadge variant="wholesale" glow>FIFO & FEFO ALLOCATION</IosBadge>
      </div>
      <p style={{ color: 'var(--ios-text-muted, #A1A1AA)', lineHeight: 1.6, marginBottom: '24px', fontSize: '14px' }}>
        Product cataloging with 3 price tiers (cost, retail, wholesale), batch-based stock-in replenishment, supplier management, and visual FIFO/FEFO expiry radar.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <IosButton variant="primary">New Stock-In Batch</IosButton>
        <IosButton variant="glass">Expiry Radar</IosButton>
      </div>
    </IosCardGlass>
  </div>
);

// Admin Role View Placeholder (/admin) - Person 4
const AdminWorkspace: React.FC = () => (
  <div style={{ maxWidth: '1000px', margin: '60px auto', padding: '0 20px' }}>
    <IosCardGlass glow style={{ padding: '36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
          📊 Person 4: Administrator Executive HUD (`/admin`)
        </h2>
        <IosBadge variant="wholesale" glow>GOVERNANCE & ANALYTICS</IosBadge>
      </div>
      <p style={{ color: 'var(--ios-text-muted, #A1A1AA)', lineHeight: 1.6, marginBottom: '24px', fontSize: '14px' }}>
        Executive revenue HUD, wholesale customer application verification queue with one-click approve/reject, user directory access controls, and system audit log.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <IosButton variant="primary">Review Wholesale Queue</IosButton>
        <IosButton variant="glass">User Governance</IosButton>
      </div>
    </IosCardGlass>
  </div>
);

// Cashier POS Container Wrapper (/pos) - Person 2
const CashierPosWorkspace: React.FC = () => (
  <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
    <CashierPosTerminal />
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Portal Routed Content with Header (Catalog, Cart, Orders) */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Navigate to="/shop" replace />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
        </Route>

        {/* Standalone Authentication & Wholesale Registration Pages (NO Catalog / Cart navbar) */}
        <Route path="/wholesale-apply" element={<WholesaleRegisterPage />} />
        <Route path="/wholesale-register" element={<WholesaleRegisterPage />} />
        <Route path="/login" element={<CustomerLoginPage />} />
        <Route path="/signin" element={<CustomerLoginPage />} />
        <Route path="/register" element={<CustomerRegisterPage />} />
        <Route path="/signup" element={<CustomerRegisterPage />} />

        {/* Cashier POS Route (Person 2) */}
        <Route path="/pos" element={<CashierPosWorkspace />} />
        <Route path="/pos/*" element={<CashierPosWorkspace />} />

        {/* Stock Controller Route (Person 3) */}
        <Route path="/stock" element={<StockControllerWorkspace />} />
        <Route path="/stock/*" element={<StockControllerWorkspace />} />

        {/* Admin Route (Person 4) */}
        <Route path="/admin" element={<AdminWorkspace />} />
        <Route path="/admin/*" element={<AdminWorkspace />} />

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/shop" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
