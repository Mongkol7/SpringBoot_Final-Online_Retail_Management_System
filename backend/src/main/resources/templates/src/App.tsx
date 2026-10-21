import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { DynamicIsland } from './components/layout/DynamicIsland';
import { CashierPosTerminal } from './components/pos/CashierPosTerminal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StockWorkspace } from './features/inventory/StockWorkspace';
import { CustomerApp } from './features/customer/CustomerApp';

export const AppContent: React.FC = () => {
  const getInitialRole = (): 'USER' | 'CASHIER' | 'STOCK_CONTROLLER' | 'ADMIN' => {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/pos')) return 'CASHIER';
    if (path.startsWith('/stock') || path.startsWith('/inventory')) return 'STOCK_CONTROLLER';
    if (path.startsWith('/admin')) return 'ADMIN';
    return 'USER';
  };

  const [activeRole, setActiveRole] = useState<'USER' | 'CASHIER' | 'STOCK_CONTROLLER' | 'ADMIN'>(getInitialRole);
  const isCashier = activeRole === 'CASHIER';
  const isAdmin = activeRole === 'ADMIN';
  const isStock = activeRole === 'STOCK_CONTROLLER';
  const isUser = activeRole === 'USER';
  const isWide = isCashier || isAdmin || isStock || isUser;

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: isWide ? '76px 20px 36px' : '90px 24px 60px',
        maxWidth: isWide ? '100%' : '1200px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
        transition: 'all 0.25s ease'
      }}
    >
      <DynamicIsland statusText={`Active Mode: ${activeRole}`} badge="AURA OS" />

      {/* Role Navigation Bar */}
      <div
        className="ios-glass-capsule"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          padding: '6px',
          maxWidth: '680px',
          margin: isWide ? '0 auto 24px auto' : '0 auto 40px auto'
        }}
      >
        {(['USER', 'CASHIER', 'STOCK_CONTROLLER', 'ADMIN'] as const).map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              transition: 'all 0.25s ease',
              backgroundColor: activeRole === role ? '#FFFFFF' : 'transparent',
              color: activeRole === role ? '#000000' : 'rgba(255, 255, 255, 0.65)'
            }}
          >
            {role.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Active Role Views */}
      {activeRole === 'USER' && (
        <CustomerApp />
      )}

      {activeRole === 'CASHIER' && (
        <CashierPosTerminal />
      )}

      {activeRole === 'STOCK_CONTROLLER' && (
        <StockWorkspace />
      )}

      {activeRole === 'ADMIN' && (
        <AdminDashboard />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
