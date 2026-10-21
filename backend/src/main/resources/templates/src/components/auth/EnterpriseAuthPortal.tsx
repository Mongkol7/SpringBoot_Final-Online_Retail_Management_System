import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShoppingBag, Barcode, Warehouse, Shield, ArrowLeft } from 'lucide-react';
import { AdminLoginGuard } from './AdminLoginGuard';
import { CashierLoginGuard } from './CashierLoginGuard';
import { StockLoginGuard } from './StockLoginGuard';
import { CustomerLoginPage } from '../../features/customer/CustomerLoginPage';

interface EnterpriseAuthPortalProps {
  defaultRole?: 'USER' | 'CASHIER' | 'STOCK_CONTROLLER' | 'ADMIN';
}

export const EnterpriseAuthPortal: React.FC<EnterpriseAuthPortalProps> = ({ defaultRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialTab = (): 'USER' | 'CASHIER' | 'STOCK_CONTROLLER' | 'ADMIN' => {
    if (defaultRole) return defaultRole;
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role')?.toUpperCase();
    if (roleParam === 'ADMIN') return 'ADMIN';
    if (roleParam === 'CASHIER' || roleParam === 'POS') return 'CASHIER';
    if (roleParam === 'STOCK' || roleParam === 'STOCK_CONTROLLER' || roleParam === 'INVENTORY') return 'STOCK_CONTROLLER';
    if (location.pathname.includes('/admin')) return 'ADMIN';
    if (location.pathname.includes('/pos')) return 'CASHIER';
    if (location.pathname.includes('/stock')) return 'STOCK_CONTROLLER';
    return 'USER';
  };

  const [activeTab, setActiveTab] = useState<'USER' | 'CASHIER' | 'STOCK_CONTROLLER' | 'ADMIN'>(getInitialTab);

  const tabs = [
    { id: 'USER' as const, label: 'Customer', icon: <ShoppingBag size={14} />, dest: '/shop' },
    { id: 'CASHIER' as const, label: 'Cashier POS', icon: <Barcode size={14} />, dest: '/pos' },
    { id: 'STOCK_CONTROLLER' as const, label: 'Stock Control', icon: <Warehouse size={14} />, dest: '/stock' },
    { id: 'ADMIN' as const, label: 'Executive Admin', icon: <Shield size={14} />, dest: '/admin' }
  ];

  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px', boxSizing: 'border-box' }}>
      {/* Back to Storefront Link */}
      <div style={{ maxWidth: '600px', margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link
          to="/shop"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'rgba(255, 255, 255, 0.7)',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Storefront</span>
        </Link>
        <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.04em' }}>
          ENTERPRISE SECURITY PORTAL
        </span>
      </div>

      {/* Role Tab Switcher */}
      <div
        className="ios-glass-capsule"
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '6px',
          padding: '6px',
          maxWidth: '560px',
          margin: '0 auto 24px auto',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '9999px',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '9px 12px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.65)'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      {activeTab === 'USER' && (
        <CustomerLoginPage />
      )}

      {activeTab === 'CASHIER' && (
        <CashierLoginGuard onSuccess={() => navigate('/pos')} />
      )}

      {activeTab === 'STOCK_CONTROLLER' && (
        <StockLoginGuard onSuccess={() => navigate('/stock')} />
      )}

      {activeTab === 'ADMIN' && (
        <AdminLoginGuard onSuccess={() => navigate('/admin')} />
      )}
    </div>
  );
};
