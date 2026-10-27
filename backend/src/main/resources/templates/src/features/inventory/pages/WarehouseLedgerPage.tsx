import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Search,
  Eye,
  Plus,
  ArrowDownToLine,
  SlidersHorizontal,
  ShoppingCart,
  Globe,
  Trash2,
  X,
  Package,
  Truck,
  Layers
} from 'lucide-react';
import { useInventoryStore, computeBatchState } from '../../../store/useInventoryStore';
import { StockTransaction } from '../../../services/inventoryService';

export const WarehouseLedgerPage: React.FC = () => {
  const { transactions, transactionFilter, setTransactionFilter } = useInventoryStore();
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<StockTransaction | null>(null);

  const formatDateTime = (val?: string) =>
    val
      ? new Date(val).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      : 'Just now';

  const formatDateOnly = (val?: string) =>
    val
      ? new Date(`${val.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      : 'N/A';

  const typeMeta = (type: StockTransaction['type']) => {
    switch (type) {
      case 'STOCK_IN':
        return { label: 'Stock-In Inbound', icon: <Plus size={13} />, color: '#FFFFFF', bg: 'rgba(255,255,255,0.12)' };
      case 'POS_SALE':
        return { label: 'POS Terminal Sale', icon: <ShoppingCart size={13} />, color: '#A1A1AA', bg: 'rgba(255,255,255,0.06)' };
      case 'ONLINE_SALE':
        return { label: 'Storefront Online Order', icon: <Globe size={13} />, color: '#A1A1AA', bg: 'rgba(255,255,255,0.06)' };
      case 'MANUAL_ADJUSTMENT':
        return { label: 'Manual Adjustment', icon: <SlidersHorizontal size={13} />, color: '#FFD60A', bg: 'rgba(255,214,10,0.12)' };
      case 'EXPIRED_WRITE_OFF':
        return { label: 'Expired Write-Off', icon: <Trash2 size={13} />, color: '#FF453A', bg: 'rgba(255,59,48,0.12)' };
      default:
        return { label: type.replace(/_/g, ' '), icon: <Layers size={13} />, color: '#FFFFFF', bg: 'rgba(255,255,255,0.08)' };
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = transactionFilter === 'ALL' || t.type === transactionFilter;
    if (!matchesType) return false;
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (t.batch?.product?.name || '').toLowerCase().includes(q) ||
      (t.batch?.product?.sku || '').toLowerCase().includes(q) ||
      (t.batch?.batchCode || '').toLowerCase().includes(q) ||
      (t.reason || '').toLowerCase().includes(q) ||
      (t.user?.fullName || '').toLowerCase().includes(q) ||
      (t.batch?.supplier?.name || '').toLowerCase().includes(q)
    );
  });

  const totalInbound = transactions
    .filter((t) => t.quantityDelta > 0)
    .reduce((sum, t) => sum + t.quantityDelta, 0);

  const totalOutbound = transactions
    .filter((t) => t.quantityDelta < 0)
    .reduce((sum, t) => sum + Math.abs(t.quantityDelta), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="ios-glass-panel" style={{ padding: '24px', borderRadius: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '20px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#FFFFFF" />
              <span style={{ fontSize: '10px', letterSpacing: '0.14em', fontWeight: 800, color: '#A1A1AA' }}>
                IMMUTABLE AUDIT TRAIL
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px' }}>
              Warehouse Movement Ledger
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--ios-text-muted)', margin: 0 }}>
              Cryptographically timestamped transaction log for all physical stock movements, cashier sales, and inventory write-offs.
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '10px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ fontSize: '10px', color: '#71717A', fontWeight: 600 }}>TOTAL EVENTS</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>{transactions.length}</div>
            </div>
            <div
              style={{
                padding: '10px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ fontSize: '10px', color: '#71717A', fontWeight: 600 }}>INBOUND RECEIVED</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>+{totalInbound}</div>
            </div>
            <div
              style={{
                padding: '10px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ fontSize: '10px', color: '#71717A', fontWeight: 600 }}>DISPATCHED / SOLD</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FF453A' }}>-{totalOutbound}</div>
            </div>
          </div>
        </div>

        {/* Toolbar & Filter Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '18px'
          }}
        >
          {/* Search Box */}
          <div
            style={{
              flex: 1,
              minWidth: '240px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px'
            }}
          >
            <Search size={15} color="#71717A" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, SKU, lot code, actor, or reason…"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#FFFFFF',
                fontSize: '12px',
                width: '100%'
              }}
            />
          </div>

          {/* Type Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '2px 0' }}>
            {(
              [
                { id: 'ALL', label: 'All Movements' },
                { id: 'STOCK_IN', label: 'Stock-In' },
                { id: 'POS_SALE', label: 'POS Sales' },
                { id: 'ONLINE_SALE', label: 'Online Sales' },
                { id: 'MANUAL_ADJUSTMENT', label: 'Adjustments' },
                { id: 'EXPIRED_WRITE_OFF', label: 'Write-Offs' }
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTransactionFilter(opt.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: transactionFilter === opt.id ? '#FFFFFF' : 'rgba(255, 255, 255, 0.06)',
                  color: transactionFilter === opt.id ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#71717A',
                  fontSize: '10px',
                  letterSpacing: '0.08em'
                }}
              >
                <th style={{ padding: '12px 14px' }}>TIMESTAMP</th>
                <th style={{ padding: '12px 14px' }}>MOVEMENT TYPE</th>
                <th style={{ padding: '12px 14px' }}>LOT / BATCH</th>
                <th style={{ padding: '12px 14px' }}>PRODUCT MASTER</th>
                <th style={{ padding: '12px 14px' }}>QTY DELTA</th>
                <th style={{ padding: '12px 14px' }}>ACTOR / REASON</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx: StockTransaction) => {
                const isPositive = tx.quantityDelta > 0;
                const meta = typeMeta(tx.type);

                return (
                  <tr
                    key={tx.id}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                    className="ios-glow-hover"
                  >
                    <td style={{ padding: '12px 14px', color: '#A1A1AA', whiteSpace: 'nowrap' }}>
                      {formatDateTime(tx.createdAt)}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '4px 9px',
                          borderRadius: '9999px',
                          background: meta.bg,
                          color: meta.color,
                          border: `1px solid ${meta.color}33`
                        }}
                      >
                        {meta.icon}
                        {meta.label}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#FFFFFF' }}>
                      {tx.batch?.batchCode || 'LOT-GENERAL'}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <b style={{ color: '#FFFFFF', display: 'block' }}>
                        {tx.batch?.product?.name || 'Inventory Item'}
                      </b>
                      {tx.batch?.product?.sku && (
                        <small style={{ color: '#71717A', fontFamily: 'monospace' }}>
                          {tx.batch.product.sku}
                        </small>
                      )}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <b
                        style={{
                          fontSize: '13px',
                          color: isPositive ? '#FFFFFF' : '#FF453A'
                        }}
                      >
                        {isPositive ? `+${tx.quantityDelta}` : tx.quantityDelta}
                      </b>
                    </td>

                    <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>
                      <div>{tx.reason || 'Operational stock change'}</div>
                      {tx.user?.fullName && (
                        <small style={{ fontSize: '10px', color: '#71717A' }}>
                          By: {tx.user.fullName}
                        </small>
                      )}
                    </td>

                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedTx(tx)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Eye size={12} />
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#71717A' }}>
                    No warehouse movement audit records match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Detail Modal (Centered via React Portal) */}
      {selectedTx &&
        createPortal(
          <div
            style={{
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
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedTx(null);
            }}
          >
            <div
              className="ios-glass-panel"
              style={{
                width: '100%',
                maxWidth: '680px',
                margin: 'auto',
                maxHeight: 'min(90vh, 800px)',
                overflowY: 'auto',
                borderRadius: '24px',
                padding: '28px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 1px 1px rgba(255,255,255,0.15)',
                animation: 'stock-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', letterSpacing: '0.12em', fontWeight: 800, color: '#A1A1AA' }}>
                      AUDIT PROVENANCE RECORD #{selectedTx.id}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: typeMeta(selectedTx.type).bg,
                        color: typeMeta(selectedTx.type).color,
                        border: `1px solid ${typeMeta(selectedTx.type).color}33`
                      }}
                    >
                      {typeMeta(selectedTx.type).label}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: '4px 0 0' }}>
                    Stock Movement Details
                  </h3>
                  <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>
                    Recorded on {formatDateTime(selectedTx.createdAt)}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTx(null)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#FFFFFF',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer'
                  }}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Quantity Impact Highlight */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  background: selectedTx.quantityDelta > 0 ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 59, 48, 0.08)',
                  border: `1px solid ${selectedTx.quantityDelta > 0 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 59, 48, 0.25)'}`,
                  marginBottom: '18px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: selectedTx.quantityDelta > 0 ? '#FFFFFF' : '#FF453A',
                      color: '#000000',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800
                    }}
                  >
                    {selectedTx.quantityDelta > 0 ? <Plus size={20} color="#000000" /> : <ArrowDownToLine size={20} color="#FFFFFF" />}
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#A1A1AA' }}>STOCK LEVEL IMPACT</span>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                      {selectedTx.quantityDelta > 0 ? 'Warehouse Intake / Addition' : 'Stock Consumption / Deduction'}
                    </h4>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 900,
                      color: selectedTx.quantityDelta > 0 ? '#FFFFFF' : '#FF453A'
                    }}
                  >
                    {selectedTx.quantityDelta > 0 ? `+${selectedTx.quantityDelta}` : selectedTx.quantityDelta} units
                  </div>
                  <small style={{ fontSize: '10px', color: '#71717A' }}>Physical inventory delta</small>
                </div>
              </div>

              {/* Product Info Card */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '14px'
                }}
              >
                <div style={{ fontSize: '10px', letterSpacing: '0.1em', fontWeight: 800, color: '#A1A1AA', marginBottom: '10px' }}>
                  PRODUCT SPECIFICATION
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}
                  >
                    {selectedTx.batch?.product?.imageUrl ? (
                      <img
                        src={selectedTx.batch.product.imageUrl}
                        alt=""
                        style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }}
                      />
                    ) : (
                      <Package size={22} color="#71717A" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                      {selectedTx.batch?.product?.name || 'Unknown Product'}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '3px', fontSize: '11px', color: '#A1A1AA' }}>
                      <span>SKU: <b style={{ fontFamily: 'monospace', color: '#FFFFFF' }}>{selectedTx.batch?.product?.sku || 'N/A'}</b></span>
                      <span>•</span>
                      <span>Category: <b style={{ color: '#FFFFFF' }}>{selectedTx.batch?.product?.category?.name || 'General'}</b></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Batch & Lot Info Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '14px'
                }}
              >
                {/* Batch Information */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ fontSize: '10px', letterSpacing: '0.1em', fontWeight: 800, color: '#A1A1AA', marginBottom: '8px' }}>
                    BATCH / LOT ATTRIBUTES
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#71717A' }}>Lot Code: </span>
                      <b style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{selectedTx.batch?.batchCode || 'LOT-GENERAL'}</b>
                    </div>
                    {selectedTx.batch && (
                      <div>
                        <span style={{ color: '#71717A' }}>Batch Status: </span>
                        <b style={{ color: computeBatchState(selectedTx.batch).className === 'expired' ? '#FF453A' : computeBatchState(selectedTx.batch).className === 'soon' ? '#FFD60A' : '#FFFFFF' }}>
                          {computeBatchState(selectedTx.batch).label}
                        </b>
                      </div>
                    )}
                    <div>
                      <span style={{ color: '#71717A' }}>Expiration: </span>
                      <b style={{ color: '#FFFFFF' }}>{formatDateOnly(selectedTx.batch?.expiryDate)}</b>
                    </div>
                    <div>
                      <span style={{ color: '#71717A' }}>Received Date: </span>
                      <b style={{ color: '#FFFFFF' }}>{formatDateOnly(selectedTx.batch?.receivedAt)}</b>
                    </div>
                    <div>
                      <span style={{ color: '#71717A' }}>Lot Stock (Now): </span>
                      <b style={{ color: '#FFFFFF' }}>{selectedTx.batch?.currentQuantity ?? 0}</b>
                      <span style={{ color: '#71717A' }}> / {selectedTx.batch?.initialQuantity ?? 0} initial</span>
                    </div>
                  </div>
                </div>

                {/* Audit & Actor Provenance */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ fontSize: '10px', letterSpacing: '0.1em', fontWeight: 800, color: '#A1A1AA', marginBottom: '8px' }}>
                    ACTOR & REASON LOG
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#71717A' }}>Operator / Actor: </span>
                      <b style={{ color: '#FFFFFF' }}>{selectedTx.user?.fullName || selectedTx.user?.email || 'System Daemon'}</b>
                    </div>
                    {selectedTx.user?.email && (
                      <div>
                        <span style={{ color: '#71717A' }}>User Email: </span>
                        <span style={{ color: '#A1A1AA' }}>{selectedTx.user.email}</span>
                      </div>
                    )}
                    <div>
                      <span style={{ color: '#71717A' }}>Reason / Memo: </span>
                      <span style={{ color: '#FFFFFF' }}>{selectedTx.reason || 'Routine movement logged'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier Provenance if present */}
              {selectedTx.batch?.supplier && (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: '18px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Truck size={14} color="#A1A1AA" />
                    <span style={{ fontSize: '10px', letterSpacing: '0.1em', fontWeight: 800, color: '#A1A1AA' }}>
                      SUPPLIER INTAKE SOURCE
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <b style={{ color: '#FFFFFF', fontSize: '13px' }}>{selectedTx.batch.supplier.name}</b>
                      {selectedTx.batch.supplier.contactName && (
                        <span style={{ fontSize: '11px', color: '#A1A1AA', marginLeft: '6px' }}>
                          (Contact: {selectedTx.batch.supplier.contactName})
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#71717A' }}>
                      {selectedTx.batch.supplier.phone && <span>{selectedTx.batch.supplier.phone} · </span>}
                      {selectedTx.batch.supplier.email && <span>{selectedTx.batch.supplier.email}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedTx(null)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  background: '#FFFFFF',
                  border: 'none',
                  color: '#000000',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
