import React, { useEffect, useState } from 'react';
import {
  Boxes,
  RefreshCw,
  LogIn,
  LogOut,
  Layers3,
  Package,
  Truck,
  Check,
  AlertTriangle,
  X,
  Clock,
  FileText
} from 'lucide-react';
import { useInventoryStore, StockTab } from '../../store/useInventoryStore';
import { useAuth } from '../../context/AuthContext';
import { hasInventorySession } from '../../services/inventoryService';
import { StockOverviewPage } from './pages/StockOverviewPage';
import { StockCatalogPage } from './pages/StockCatalogPage';
import { BatchExpiryRadar } from './components/BatchExpiryRadar';
import { SupplierDirectoryPage } from './pages/SupplierDirectoryPage';
import { WarehouseLedgerPage } from './pages/WarehouseLedgerPage';

// Modals
import { ProductModal } from './components/ProductModal';
import { StockInModal } from './components/StockInModal';
import { SupplierModal } from './components/SupplierModal';
import { CategoryModal } from './components/CategoryModal';
import { AdjustmentModal } from './components/AdjustmentModal';
import { InventoryLoginModal } from './components/InventoryLoginModal';
import { LogoutConfirmModal } from '../../components/ui/LogoutConfirmModal';

import './stock.css';

export const StockWorkspace: React.FC = () => {
  const { currentUser, logoutRole } = useAuth();
  const {
    activeTab,
    setTab,
    isConnected,
    isSyncing,
    syncError,
    syncSession,
    refresh,
    logout,
    toast,
    clearToast,
    activeModal,
    openModal,
    soonExpiringCount
  } = useInventoryStore();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const soonCount = soonExpiringCount();
  // Migrate any previously selected Stock Inbound tab to the unified radar view.
  const visibleTab = activeTab === 'intake' ? 'batches' : activeTab;

  // Phnom Penh Clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Phnom_Penh',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rehydrate the inventory session after unified login. The inventory store
  // may have initialized before authService wrote inventory_jwt.
  useEffect(() => {
    syncSession();
    if (hasInventorySession()) {
      void refresh();
    }
  }, [currentUser, refresh, syncSession]);

  const navItems: { id: StockTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <Layers3 size={15} /> },
    { id: 'catalog', label: 'Catalog & Tiers', icon: <Package size={15} /> },
    { id: 'batches', label: 'FIFO/FEFO Radar', icon: <Boxes size={15} />, badge: soonCount > 0 ? soonCount : undefined },
    { id: 'ledger', label: 'Movement Ledger', icon: <FileText size={15} /> },
    { id: 'suppliers', label: 'Supplier Directory', icon: <Truck size={15} /> }
  ];

  return (
    <div className="stock-workspace" style={{ width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Topline Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: '#FFFFFF',
              color: '#000000',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900
            }}
          >
            <Boxes size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#FFFFFF' }}>
                AURA LOGISTICS
              </span>
              <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.12)', color: '#A1A1AA' }}>
                PERSON 3
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#71717A' }}>
              <Clock size={11} />
              <span>Phnom Penh: {currentTime || '08:45 AM'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Connection Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9999px',
              background: isConnected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '11px',
              fontWeight: 600,
              color: '#FFFFFF'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isConnected ? '#FFFFFF' : '#71717A',
                boxShadow: isConnected ? '0 0 8px rgba(255,255,255,0.8)' : 'none'
              }}
            />
            {isConnected ? 'PostgreSQL Live' : 'Local Preview'}
          </div>

          {isConnected ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign Out"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer'
              }}
            >
              <LogOut size={15} />
            </button>
          ) : (
            <button
              onClick={() => openModal('login')}
              style={{
                padding: '8px 14px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <LogIn size={13} /> Connect Backend
            </button>
          )}

          <button
            onClick={() => void refresh()}
            disabled={isSyncing}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer'
            }}
            title="Refresh Workspace"
          >
            <RefreshCw size={14} className={isSyncing ? 'stock-spin' : ''} />
          </button>

        </div>
      </header>

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        roleLabel="Stock Controller"
        userName={currentUser?.fullName || currentUser?.email}
        description="Your live inventory session will be closed and this workspace will return to local preview mode."
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          logout();
          logoutRole('STOCK_CONTROLLER');
          setShowLogoutConfirm(false);
        }}
      />

      {/* Hero Intro */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '24px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '16px', height: '1px', background: '#FFFFFF' }} />
            <span style={{ fontSize: '10px', letterSpacing: '0.14em', fontWeight: 800, color: '#A1A1AA' }}>
              WAREHOUSE CONTROL & RADAR
            </span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.03em' }}>
            Stock, in <i>absolute</i> order.
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--ios-text-muted)', margin: '4px 0 0' }}>
            Product master cataloging, FIFO/FEFO expiration radar, automated threshold alerts, and inbound delivery ingestion.
          </p>
        </div>
      </div>

      {/* Sync Error Notice */}
      {syncError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderRadius: '14px',
            background: 'rgba(255, 59, 48, 0.12)',
            border: '1px solid rgba(255, 59, 48, 0.3)',
            color: '#FF453A',
            fontSize: '12px',
            marginBottom: '18px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span>Connection Notice: {syncError}</span>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Switch to Offline Demo
          </button>
        </div>
      )}

      {/* Segmented Control Pill Navigation */}
      <nav
        style={{
          display: 'flex',
          gap: '6px',
          padding: '6px',
          borderRadius: '9999px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          marginBottom: '24px',
          overflowX: 'auto'
        }}
      >
        {navItems.map((item) => {
          const isActive = visibleTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                flex: 1,
                minWidth: 'max-content',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '9999px',
                border: 'none',
                background: isActive ? '#FFFFFF' : 'transparent',
                color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.65)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isActive ? '0 2px 10px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    background: isActive ? '#000000' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#000000'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active Tab Screen Routing */}
      <main style={{ minHeight: '500px' }}>
        {visibleTab === 'overview' && <StockOverviewPage />}
        {visibleTab === 'catalog' && <StockCatalogPage />}
        {visibleTab === 'batches' && <BatchExpiryRadar />}
        {visibleTab === 'ledger' && <WarehouseLedgerPage />}
        {visibleTab === 'suppliers' && <SupplierDirectoryPage />}
      </main>

      {/* Active Modals */}
      {activeModal === 'product' && <ProductModal />}
      {activeModal === 'stockIn' && <StockInModal />}
      {activeModal === 'supplier' && <SupplierModal />}
      {activeModal === 'categories' && <CategoryModal />}
      {activeModal === 'adjustment' && <AdjustmentModal />}
      {activeModal === 'login' && <InventoryLoginModal />}

      {/* Floating Apple-Style Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '16px',
            background: 'rgba(18, 18, 20, 0.95)',
            border: `1px solid ${toast.kind === 'error' ? 'rgba(255, 59, 48, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
            animation: 'stock-enter 0.2s ease'
          }}
        >
          {toast.kind === 'error' ? (
            <AlertTriangle size={16} color="#FF453A" />
          ) : (
            <Check size={16} color="#FFFFFF" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={clearToast}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#A1A1AA',
              cursor: 'pointer',
              marginLeft: '6px'
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default StockWorkspace;
