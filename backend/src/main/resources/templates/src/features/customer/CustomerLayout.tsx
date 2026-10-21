import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DynamicIsland } from '../../components/layout/DynamicIsland';
import { CustomerNavbar } from './CustomerNavbar';
import { CustomerFooter } from './CustomerFooter';
import { useCustomerCartStore } from '../../store/customerCartStore';

export const CustomerLayout: React.FC = () => {
  const { pathname } = useLocation();
  const notification = useCustomerCartStore((s) => s.notification);
  const effectiveTier = useCustomerCartStore((s) => s.getEffectiveTier());
  const isAuthenticated = useCustomerCartStore((s) => s.isAuthenticated);
  const checkWholesaleStatus = useCustomerCartStore((s) => s.checkWholesaleStatus);

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  React.useEffect(() => {
    if (isAuthenticated) {
      checkWholesaleStatus();
    }
  }, [isAuthenticated, checkWholesaleStatus]);

  React.useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevColor = document.body.style.color;
    document.body.style.backgroundColor = '#F5F5F7';
    document.body.style.color = '#111827';
    return () => {
      document.body.style.backgroundColor = prevBg;
      document.body.style.color = prevColor;
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F7',
        color: '#111827',
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px 40px', width: '100%', flex: '1 0 auto' }}>
        {notification?.message && (
          <DynamicIsland
            statusText={notification.message}
            badge={notification.badge || effectiveTier}
          />
        )}

        {/* Customer Header Navigation */}
        <CustomerNavbar />

        {/* Routed Customer Content */}
        <main>
          <Outlet />
        </main>
      </div>

      {/* Customer Footer */}
      <CustomerFooter />
    </div>
  );
};
