import React, { useState } from 'react';
import { DynamicIsland } from './components/layout/DynamicIsland';
import { IosCardGlass } from './components/ui/IosCardGlass';
import { IosButton } from './components/ui/IosButton';
import { CashierPosTerminal } from './components/pos/CashierPosTerminal';

export const App: React.FC = () => {
  const [activeRole, setActiveRole] = useState<'USER' | 'CASHIER' | 'STOCK_CONTROLLER' | 'ADMIN'>('USER');

  return (
    <div style={{ minHeight: '100vh', padding: '90px 24px 60px', maxWidth: '1200px', margin: '0 auto' }}>
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
          margin: '0 auto 40px auto'
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

      {/* Active Role Preview Panel */}
      {activeRole === 'USER' && (
        <IosCardGlass glow>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700 }}>🛒 Person 1: Online Customer Storefront (`/shop`)</h2>
            <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)' }}>
              RETAIL & WHOLESALE
            </span>
          </div>
          <p style={{ color: 'var(--ios-text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
            Online retail product discovery, dual-tier pricing (retail vs. bulk wholesale), frosted slide-over cart drawer, and 3-step checkout with live order tracking timeline.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <IosButton variant="primary">Browse Catalog</IosButton>
            <IosButton variant="glass">Apply for Wholesale</IosButton>
          </div>
        </IosCardGlass>
      )}

      {activeRole === 'CASHIER' && (
        <CashierPosTerminal />
      )}

      {activeRole === 'STOCK_CONTROLLER' && (
        <IosCardGlass glow>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700 }}>📦 Person 3: Stock Controller Inventory Suite (`/stock`)</h2>
            <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)' }}>
              FIFO & FEFO ALLOCATION
            </span>
          </div>
          <p style={{ color: 'var(--ios-text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
            Product cataloging with 3 price tiers (cost, retail, wholesale), batch-based stock-in replenishment, supplier management, and visual FIFO/FEFO expiry radar.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <IosButton variant="primary">New Stock-In Batch</IosButton>
            <IosButton variant="glass">Expiry Radar</IosButton>
          </div>
        </IosCardGlass>
      )}

      {activeRole === 'ADMIN' && (
        <IosCardGlass glow>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700 }}>📊 Person 4: Administrator Executive HUD (`/admin`)</h2>
            <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)' }}>
              GOVERNANCE & ANALYTICS
            </span>
          </div>
          <p style={{ color: 'var(--ios-text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
            Executive revenue HUD, wholesale customer application verification queue with one-click approve/reject, user directory access controls, and system audit log.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <IosButton variant="primary">Review Wholesale Queue</IosButton>
            <IosButton variant="glass">User Governance</IosButton>
          </div>
        </IosCardGlass>
      )}
    </div>
  );
};
export default App;
