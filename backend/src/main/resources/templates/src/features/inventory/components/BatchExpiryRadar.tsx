import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownToLine, ArrowLeftRight, Boxes, ChevronRight, Leaf, Search, ShieldAlert, ShieldCheck, SlidersHorizontal, X, AlertTriangle } from 'lucide-react';
import { useInventoryStore, computeBatchState } from '../../../store/useInventoryStore';
import { StockBatch } from '../../../services/inventoryService';

type ProductGroup = { product: NonNullable<StockBatch['product']>; batches: StockBatch[] };
const statePriority: Record<'healthy' | 'soon' | 'expired', number> = { expired: 0, soon: 1, healthy: 2 };

export const BatchExpiryRadar: React.FC = () => {
  const { batches, radarFilter, setRadarFilter, search, setSearch, openModal } = useInventoryStore();
  const [selectedProduct, setSelectedProduct] = useState<ProductGroup | null>(null);
  const activeBatches = batches.filter((batch) => batch.currentQuantity > 0 || batch.isExpired);
  const healthyCount = activeBatches.filter((batch) => computeBatchState(batch).className === 'healthy').length;
  const soonCount = activeBatches.filter((batch) => computeBatchState(batch).className === 'soon').length;
  const expiredCount = batches.filter((batch) => computeBatchState(batch).className === 'expired').length;

  const allGroups = useMemo(() => {
    const groups = new Map<number, ProductGroup>();
    activeBatches.forEach((batch) => {
      if (!batch.product) return;
      const existing = groups.get(batch.product.id);
      if (existing) existing.batches.push(batch);
      else groups.set(batch.product.id, { product: batch.product, batches: [batch] });
    });
    return Array.from(groups.values());
  }, [activeBatches]);

  const lowStockCount = useMemo(() => {
    return allGroups.filter((g) => {
      const available = g.batches
        .filter((b) => computeBatchState(b).className !== 'expired')
        .reduce((sum, b) => sum + b.currentQuantity, 0);
      return available <= (g.product.minStockThreshold ?? 10);
    }).length;
  }, [allGroups]);

  const productGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    return allGroups.filter((group) => {
      const states = group.batches.map((batch) => computeBatchState(batch).className);
      const available = group.batches
        .filter((b) => computeBatchState(b).className !== 'expired')
        .reduce((sum, b) => sum + b.currentQuantity, 0);
      const isLowStock = available <= (group.product.minStockThreshold ?? 10);

      if (radarFilter === 'healthy' && !states.includes('healthy')) return false;
      if (radarFilter === 'low-stock' && !isLowStock) return false;
      if (radarFilter === 'expired' && !states.includes('soon') && !states.includes('expired')) return false;

      if (!query) return true;
      return group.product.name.toLowerCase().includes(query) ||
             group.product.sku.toLowerCase().includes(query) ||
             group.batches.some((batch) => batch.batchCode.toLowerCase().includes(query) || (batch.supplier?.name || '').toLowerCase().includes(query));
    }).map((group) => ({
      ...group,
      batches: [...group.batches].sort((a, b) =>
        group.product.isPerishable
          ? (a.expiryDate || '9999').localeCompare(b.expiryDate || '9999')
          : (a.receivedAt || '').localeCompare(b.receivedAt || '')
      )
    })).sort((a, b) => {
      const aState = Math.min(...a.batches.map((batch) => statePriority[computeBatchState(batch).className]));
      const bState = Math.min(...b.batches.map((batch) => statePriority[computeBatchState(batch).className]));
      return aState !== bState ? aState - bState : a.product.name.localeCompare(b.product.name);
    });
  }, [allGroups, radarFilter, search]);

  const formatDate = (value?: string) => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Expiry (FIFO)';
  const getGroupStates = (group: ProductGroup) => Array.from(new Set(group.batches.map((batch) => computeBatchState(batch).className))).sort((a, b) => statePriority[a] - statePriority[b]);
  const stateLabel = (state: 'healthy' | 'soon' | 'expired') => state === 'expired' ? 'Expired' : state === 'soon' ? 'Expiring Soon' : 'Healthy';
  const stateColor = (state: 'healthy' | 'soon' | 'expired') => state === 'expired' ? '#FF453A' : state === 'soon' ? '#FFD60A' : '#FFFFFF';

  return <div className="ios-glass-panel" style={{ padding: '24px', borderRadius: '24px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
      <div><span style={eyebrow}>PRODUCT EXPIRY INTELLIGENCE</span><h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', margin: '4px 0' }}>FIFO & FEFO Expiry Radar</h2><p style={{ fontSize: '12px', color: 'var(--ios-text-muted)', margin: 0 }}>One row per product. Open the product to view every batch and its expiry status.</p></div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><button onClick={() => openModal('stockIn')} style={primaryButton}><ArrowDownToLine size={15} /> New Stock In</button></div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
      <Kpi label="Active Batches" value={activeBatches.length} hint="Across all products" icon={<Boxes size={16} />} onClick={() => setRadarFilter('all')} active={radarFilter === 'all'} />
      <Kpi label="Healthy Batches" value={healthyCount} hint="More than 7 days remaining" icon={<ShieldCheck size={16} />} onClick={() => setRadarFilter('healthy')} active={radarFilter === 'healthy'} />
      <Kpi label="Low Stock" value={lowStockCount} hint="At or below reorder threshold" icon={<AlertTriangle size={16} />} onClick={() => setRadarFilter('low-stock')} active={radarFilter === 'low-stock'} />
      <Kpi label="Expire" value={soonCount + expiredCount} hint="Expiring soon or locked" icon={<ShieldAlert size={16} />} onClick={() => setRadarFilter('expired')} active={radarFilter === 'expired'} />
    </div>
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}><div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}><Search size={15} color="#71717A" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, SKU, batch, or supplier…" style={{ background: 'transparent', border: 'none', outline: 'none', color: '#FFFFFF', fontSize: '12px', width: '100%' }} /></div><div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}><span style={legend}><Leaf size={13} /> <b>FEFO:</b> Perishable</span><span style={{ color: '#71717A' }}>·</span><span style={legend}><ArrowLeftRight size={13} /> <b>FIFO:</b> Non-Perishable</span></div></div>
    <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}><thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#71717A', fontSize: '10px', letterSpacing: '0.08em' }}><th style={cellHeader}>PRODUCT & SKU</th><th style={cellHeader}>ROTATION</th><th style={cellHeader}>BATCHES</th><th style={cellHeader}>AVAILABLE / TOTAL</th><th style={cellHeader}>STATUS</th><th style={{ ...cellHeader, textAlign: 'right' }}>ACTIONS</th></tr></thead><tbody>
      {productGroups.map((group, index) => { const states = getGroupStates(group); const total = group.batches.reduce((sum, batch) => sum + batch.currentQuantity, 0); const available = group.batches.filter((batch) => computeBatchState(batch).className !== 'expired').reduce((sum, batch) => sum + batch.currentQuantity, 0); const isLow = available <= (group.product.minStockThreshold ?? 10); return <tr key={group.product.id} className="ios-glow-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={cell}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={sequence}>{String(index + 1).padStart(2, '0')}</span>{group.product.imageUrl ? <img src={group.product.imageUrl} alt="" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'; }} style={productThumb} /> : <div style={productFallback}>{group.product.name.charAt(0).toUpperCase()}</div>}<div><b style={{ color: '#FFFFFF' }}>{group.product.name}</b><div style={muted}>{group.product.sku}</div></div></div></td><td style={cell}><span style={badge}>{group.product.isPerishable ? <Leaf size={11} /> : <ArrowLeftRight size={11} />}{group.product.isPerishable ? 'FEFO' : 'FIFO'}</span></td><td style={cell}><b style={{ color: '#FFFFFF' }}>{group.batches.length}</b><div style={muted}>{group.batches.length === 1 ? 'batch' : 'batches'} in detail</div></td><td style={cell}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><b style={{ color: isLow ? '#FFD60A' : '#FFFFFF', fontSize: '13px' }}>{available} / {total}</b>{isLow && <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255, 214, 10, 0.15)', color: '#FFD60A', fontWeight: 700 }}>LOW</span>}</div><div style={muted}>sellable / total units</div></td><td style={cell}><div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>{states.map((state) => <span key={state} style={{ ...statusBadge, color: stateColor(state), borderColor: `${stateColor(state)}55` }}><span style={{ ...dot, background: stateColor(state) }} />{stateLabel(state)}</span>)}</div></td><td style={{ ...cell, textAlign: 'right' }}><div style={{ display: 'flex', justifyContent: 'flex-end', gap: '7px', flexWrap: 'wrap' }}><button onClick={() => openModal('stockIn', group.product)} style={addStockButton}><ArrowDownToLine size={12} /> Add stock</button><button onClick={() => setSelectedProduct(group)} style={detailButton}>View batches <ChevronRight size={13} /></button></div></td></tr>; })}
      {productGroups.length === 0 && <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#71717A' }}>No products match the selected criteria.</td></tr>}
    </tbody></table></div>
    {selectedProduct &&
      createPortal(
        <div style={overlay} onClick={() => setSelectedProduct(null)}>
          <div style={detailPanel} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <span style={eyebrow}>PRODUCT BATCH DETAILS</span>
                <h3 style={{ color: '#FFFFFF', margin: '5px 0 3px', fontSize: '19px' }}>{selectedProduct.product.name}</h3>
                <span style={muted}>{selectedProduct.product.sku} · {selectedProduct.batches.length} batches</span>
              </div>
              <button onClick={() => setSelectedProduct(null)} style={closeButton} aria-label="Close details">
                <X size={17} />
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
                <thead>
                  <tr style={{ color: '#71717A', fontSize: '9px', letterSpacing: '0.08em' }}>
                    <th style={cellHeader}>BATCH</th>
                    <th style={cellHeader}>RECEIVED</th>
                    <th style={cellHeader}>EXPIRY</th>
                    <th style={cellHeader}>QUANTITY</th>
                    <th style={cellHeader}>STATUS</th>
                    <th style={{ ...cellHeader, textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProduct.batches.map((batch) => {
                    const state = computeBatchState(batch);
                    return (
                      <tr key={batch.id} style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <td style={cell}>
                          <b style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{batch.batchCode}</b>
                          <div style={muted}>{batch.supplier?.name || 'Unassigned'}</div>
                        </td>
                        <td style={{ ...cell, color: '#A1A1AA' }}>{formatDate(batch.receivedAt)}</td>
                        <td style={{ ...cell, color: stateColor(state.className), fontWeight: state.className !== 'healthy' ? 700 : 400 }}>
                          {formatDate(batch.expiryDate)}
                        </td>
                        <td style={cell}>
                          <b style={{ color: '#FFFFFF' }}>{batch.currentQuantity}</b>
                          <span style={muted}> / {batch.initialQuantity}</span>
                        </td>
                        <td style={cell}>
                          <span style={{ ...statusBadge, color: stateColor(state.className), borderColor: `${stateColor(state.className)}55` }}>
                            <span style={{ ...dot, background: stateColor(state.className) }} />
                            {state.label}
                          </span>
                        </td>
                        <td style={{ ...cell, textAlign: 'right' }}>
                          <button onClick={() => openModal('adjustment', batch)} style={detailButton}>
                            <SlidersHorizontal size={12} /> Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body
      )}
  </div>;
};

const Kpi: React.FC<{ label: string; value: number; hint: string; icon: React.ReactNode; onClick: () => void; active: boolean }> = ({ label, value, hint, icon, onClick, active }) => <div onClick={onClick} style={{ padding: '14px 18px', borderRadius: '16px', background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? '#FFFFFF' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer' }}><div style={{ display: 'flex', justifyContent: 'space-between', color: '#A1A1AA', fontSize: '11px', fontWeight: 600 }}>{label}{icon}</div><div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>{value}</div><small style={{ fontSize: '10px', color: '#71717A' }}>{hint}</small></div>;
const cellHeader: React.CSSProperties = { padding: '12px 14px' };
const cell: React.CSSProperties = { padding: '12px 14px' };
const muted: React.CSSProperties = { fontSize: '10px', color: '#71717A' };
const legend: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#FFFFFF' };
const sequence: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', fontWeight: 800, fontSize: '11px' };
const productThumb: React.CSSProperties = { width: '38px', height: '38px', flex: '0 0 38px', objectFit: 'cover', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' };
const productFallback: React.CSSProperties = { ...productThumb, display: 'grid', placeItems: 'center', color: '#FFFFFF', fontSize: '15px', fontWeight: 800 };
const badge: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.12)' };
const statusBadge: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '9999px', fontSize: '9px', fontWeight: 700, border: '1px solid' };
const dot: React.CSSProperties = { width: '6px', height: '6px', borderRadius: '50%' };
const detailButton: React.CSSProperties = { padding: '6px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', fontSize: '10px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' };
const addStockButton: React.CSSProperties = { ...detailButton, background: '#FFFFFF', borderColor: '#FFFFFF', color: '#000000' };
const pillButton: React.CSSProperties = { padding: '9px 16px', borderRadius: '9999px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' };
const primaryButton: React.CSSProperties = { ...pillButton, background: '#FFFFFF', color: '#000000', border: 'none', fontWeight: 700 };
const overlay: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100vw',
  height: '100vh',
  zIndex: 99999,
  background: 'rgba(0, 0, 0, 0.78)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  boxSizing: 'border-box',
  overflowY: 'auto'
};
const detailPanel: React.CSSProperties = {
  width: '100%',
  maxWidth: '920px',
  margin: 'auto',
  maxHeight: 'min(90vh, 800px)',
  overflowY: 'auto',
  padding: '26px',
  borderRadius: '24px',
  background: '#151517',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.15)',
  animation: 'stock-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
};
const closeButton: React.CSSProperties = { width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', cursor: 'pointer', display: 'grid', placeItems: 'center' };
const eyebrow: React.CSSProperties = { fontSize: '9px', letterSpacing: '0.14em', fontWeight: 800, color: '#A1A1AA' };
