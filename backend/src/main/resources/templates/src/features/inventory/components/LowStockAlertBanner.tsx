import React from 'react';
import { AlertTriangle, Plus, ChevronRight, PackageCheck } from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { StockProduct } from '../../../services/inventoryService';

export const LowStockAlertBanner: React.FC = () => {
  const { products, productStock, openModal, setTab, setRadarFilter } = useInventoryStore();

  const lowStockItems = products.filter((p) => {
    if (p.isDeleted) return false;
    const stock = productStock(p.id);
    return stock <= p.minStockThreshold;
  });

  if (lowStockItems.length === 0) {
    return (
      <div className="ios-glass-panel" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.06)', display: 'grid', placeItems: 'center', color: '#FFFFFF' }}>
          <PackageCheck size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>All Stock Levels Compliant</div>
          <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>No products currently breach their minimum reorder thresholds.</div>
        </div>
        <button
          onClick={() => setTab('catalog')}
          style={{ background: 'transparent', border: 'none', color: '#A1A1AA', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
        >
          View Catalog <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="ios-glass-panel"
      style={{
        padding: '20px 24px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        background: 'linear-gradient(145deg, rgba(30, 26, 20, 0.7), rgba(18, 18, 20, 0.85))',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.12)',
              display: 'grid',
              placeItems: 'center',
              color: '#FFFFFF'
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.12em', fontWeight: 800, color: '#A1A1AA' }}>RADAR ALERT</span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: '#FFFFFF',
                  color: '#000000'
                }}
              >
                {lowStockItems.length} ITEMS CRITICAL
              </span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: '2px 0 0' }}>
              Reorder Point Breach Detected
            </h3>
          </div>
        </div>

        <button
          onClick={() => {
            setRadarFilter('low-stock');
            setTab('batches');
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
        >
          Inspect all <ChevronRight size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
        {lowStockItems.slice(0, 4).map((product: StockProduct) => {
          const onHand = productStock(product.id);
          const ratio = Math.min(100, Math.round((onHand / Math.max(product.minStockThreshold, 1)) * 100));

          return (
            <div
              key={product.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <b style={{ fontSize: '12px', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {product.name}
                  </b>
                  {product.isPerishable && (
                    <span style={{ fontSize: '8px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#A1A1AA' }}>
                      FEFO
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                  <small style={{ fontSize: '10px', color: 'var(--ios-text-subtle)' }}>{product.sku}</small>
                  <small style={{ fontSize: '10px', color: '#A1A1AA' }}>Min: {product.minStockThreshold} units</small>
                </div>
                {/* Progress bar */}
                <div style={{ height: '3px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${ratio}%`, height: '100%', background: '#FFFFFF', borderRadius: '3px' }} />
                </div>
              </div>

              <div style={{ textAlign: 'right', marginRight: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>{onHand}</div>
                <small style={{ fontSize: '9px', color: '#A1A1AA' }}>on hand</small>
              </div>

              <button
                onClick={() => openModal('stockIn', product)}
                title={`Receive stock for ${product.name}`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: '#FFFFFF',
                  color: '#000000',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'transform 0.15s ease'
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
