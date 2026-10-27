import React from 'react';
import {
  Package,
  Boxes,
  AlertTriangle,
  Clock3,
  ChevronRight,
  Leaf,
  ArrowLeftRight,
  ShieldCheck,
  Plus,
  ArrowDownToLine
} from 'lucide-react';
import { useInventoryStore, computeBatchState } from '../../../store/useInventoryStore';
import { LowStockAlertBanner } from '../components/LowStockAlertBanner';

export const StockOverviewPage: React.FC = () => {
  const {
    products,
    categories,
    batches,
    transactions,
    lowStockProducts,
    soonExpiringCount,
    setTab,
    setRadarFilter
  } = useInventoryStore();

  const activeProducts = products.filter((p) => !p.isDeleted);
  const activeBatches = batches.filter((b) => b.currentQuantity > 0);
  const totalUnits = batches
    .filter((b) => !computeBatchState(b).className.includes('expired'))
    .reduce((sum, b) => sum + Number(b.currentQuantity || 0), 0);
  const lowStock = lowStockProducts();
  const soonCount = soonExpiringCount();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 4 Frosted Glass KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        {/* Card 1: Active Products */}
        <div
          onClick={() => setTab('catalog')}
          className="ios-glass-panel ios-glow-hover"
          style={{ padding: '20px', borderRadius: '20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#A1A1AA' }}>
            <span style={{ fontSize: '11px', fontWeight: 600 }}>Active Catalog</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', color: '#FFFFFF' }}>
              <Package size={16} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', marginTop: '10px' }}>
            {activeProducts.length}
          </div>
          <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>
            Distributed in {categories.length} categories
          </div>
        </div>

        {/* Card 2: Total Units On Hand */}
        <div
          onClick={() => setTab('batches')}
          className="ios-glass-panel ios-glow-hover"
          style={{ padding: '20px', borderRadius: '20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#A1A1AA' }}>
            <span style={{ fontSize: '11px', fontWeight: 600 }}>Available Units</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', color: '#FFFFFF' }}>
              <Boxes size={16} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', marginTop: '10px' }}>
            {totalUnits.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>
            Across {activeBatches.length} active lots
          </div>
        </div>

        {/* Card 3: Low Stock Alerts */}
        <div
          onClick={() => {
            setRadarFilter('low-stock');
            setTab('batches');
          }}
          className="ios-glass-panel ios-glow-hover"
          style={{
            padding: '20px',
            borderRadius: '20px',
            cursor: 'pointer',
            border: lowStock.length > 0 ? '1px solid rgba(255, 214, 10, 0.3)' : undefined
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#A1A1AA' }}>
            <span style={{ fontSize: '11px', fontWeight: 600 }}>Low-Stock Radar</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: lowStock.length > 0 ? 'rgba(255, 214, 10, 0.15)' : 'rgba(255,255,255,0.08)',
                display: 'grid',
                placeItems: 'center',
                color: lowStock.length > 0 ? '#FFD60A' : '#FFFFFF'
              }}
            >
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: lowStock.length > 0 ? '#FFD60A' : '#FFFFFF', marginTop: '10px' }}>
            {lowStock.length}
          </div>
          <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>
            {lowStock.length > 0 ? 'Items below reorder point (Click to inspect)' : 'All stock levels healthy'}
          </div>
        </div>

        {/* Card 4: Expiry Watch */}
        <div
          onClick={() => {
            setRadarFilter('expired');
            setTab('batches');
          }}
          className="ios-glass-panel ios-glow-hover"
          style={{
            padding: '20px',
            borderRadius: '20px',
            cursor: 'pointer',
            border: soonCount > 0 ? '1px solid rgba(255, 59, 48, 0.3)' : undefined
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#A1A1AA' }}>
            <span style={{ fontSize: '11px', fontWeight: 600 }}>Expiry Watch</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: soonCount > 0 ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255,255,255,0.08)',
                display: 'grid',
                placeItems: 'center',
                color: soonCount > 0 ? '#FF453A' : '#FFFFFF'
              }}
            >
              <Clock3 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: soonCount > 0 ? '#FF453A' : '#FFFFFF', marginTop: '10px' }}>
            {soonCount}
          </div>
          <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>
            {soonCount > 0 ? 'Batches expiring within 30 days (< 1 month) · Click to inspect' : 'No near-term expirations'}
          </div>
        </div>
      </div>

      {/* Low-Stock Alert Banner */}
      <LowStockAlertBanner />

      {/* Dual Panel: Rotation Policy Guide + Recent Movement Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(0, 1.4fr)', gap: '18px' }}>
        {/* Rotation Policies */}
        <div className="ios-glass-panel" style={{ padding: '24px', borderRadius: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '10px', letterSpacing: '0.12em', fontWeight: 800, color: '#A1A1AA' }}>
                ROTATION ALGORITHM
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', margin: '2px 0 0' }}>
                FIFO / FEFO Policy
              </h3>
            </div>
            <ShieldCheck size={20} color="#FFFFFF" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* FEFO Card */}
            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', color: '#FFFFFF' }}>
                <Leaf size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <b style={{ fontSize: '13px', color: '#FFFFFF' }}>FEFO Rotation</b>
                  <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: '#FFFFFF', color: '#000000', fontWeight: 700 }}>
                    PERISHABLE
                  </span>
                </div>
                <small style={{ fontSize: '11px', color: 'var(--ios-text-muted)', display: 'block', marginTop: '2px' }}>
                  First-Expiry, First-Out. Orders prioritize earliest expiration lot.
                </small>
              </div>
            </div>

            {/* FIFO Card */}
            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', color: '#FFFFFF' }}>
                <ArrowLeftRight size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <b style={{ fontSize: '13px', color: '#FFFFFF' }}>FIFO Rotation</b>
                  <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', fontWeight: 700 }}>
                    DRY GOODS
                  </span>
                </div>
                <small style={{ fontSize: '11px', color: 'var(--ios-text-muted)', display: 'block', marginTop: '2px' }}>
                  First-In, First-Out. Orders prioritize oldest received batch intake.
                </small>
              </div>
            </div>
          </div>

          <button
            onClick={() => setTab('batches')}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '16px'
            }}
          >
            Inspect Batch Radar Dispatch <ChevronRight size={14} />
          </button>
        </div>

        {/* Recent Ledger Activity */}
        <div className="ios-glass-panel" style={{ padding: '24px', borderRadius: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '10px', letterSpacing: '0.12em', fontWeight: 800, color: '#A1A1AA' }}>
                AUDIT TRAIL
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', margin: '2px 0 0' }}>
                Latest Movement
              </h3>
            </div>
            <button
              onClick={() => setTab('ledger')}
              style={{ background: 'transparent', border: 'none', color: '#A1A1AA', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              Full Ledger <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {transactions.slice(0, 4).map((tx) => {
              const isPositive = tx.quantityDelta > 0;
              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: isPositive ? 'rgba(255,255,255,0.1)' : 'rgba(255,59,48,0.1)',
                        display: 'grid',
                        placeItems: 'center',
                        color: isPositive ? '#FFFFFF' : '#FF453A'
                      }}
                    >
                      {isPositive ? <Plus size={14} /> : <ArrowDownToLine size={14} />}
                    </div>
                    <div>
                      <b style={{ fontSize: '12px', color: '#FFFFFF', display: 'block' }}>
                        {tx.batch?.product?.name || 'Stock Event'}
                      </b>
                      <small style={{ fontSize: '10px', color: '#71717A' }}>
                        {tx.type.replace(/_/g, ' ')} • {tx.batch?.batchCode || 'LOT'}
                      </small>
                    </div>
                  </div>

                  <b style={{ fontSize: '13px', color: isPositive ? '#FFFFFF' : '#FF453A' }}>
                    {isPositive ? `+${tx.quantityDelta}` : tx.quantityDelta}
                  </b>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
