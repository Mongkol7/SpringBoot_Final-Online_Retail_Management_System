import React from 'react';
import { Outlet } from 'react-router-dom';
import { DynamicIsland } from '../../components/layout/DynamicIsland';
import { CustomerNavbar } from './CustomerNavbar';
import { useCustomerCartStore } from '../../store/customerCartStore';

export const CustomerLayout: React.FC = () => {
  const notification = useCustomerCartStore((s) => s.notification);
  const effectiveTier = useCustomerCartStore((s) => s.getEffectiveTier());
  const isAuthenticated = useCustomerCartStore((s) => s.isAuthenticated);
  const checkWholesaleStatus = useCustomerCartStore((s) => s.checkWholesaleStatus);

  React.useEffect(() => {
    if (isAuthenticated) {
      checkWholesaleStatus();
    }
  }, [isAuthenticated, checkWholesaleStatus]);

  return (
    <div style={{ minHeight: '100vh', padding: '16px 24px 80px', maxWidth: '1240px', margin: '0 auto' }}>
      <DynamicIsland
        statusText={notification?.message || 'AURA Retail Active'}
        badge={notification?.badge || effectiveTier}
      />

      {/* Customer Header Navigation */}
      <CustomerNavbar />

      {/* Routed Customer Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};
