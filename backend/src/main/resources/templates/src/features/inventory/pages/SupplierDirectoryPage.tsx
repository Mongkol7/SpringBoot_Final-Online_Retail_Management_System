import React from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { StockSupplier, StockTransaction } from '../../../services/inventoryService';

export const SupplierDirectoryPage: React.FC = () => {
  const {
    suppliers,
    batches,
    transactions,
    transactionFilter,
    setTransactionFilter,
    openModal,
    deleteSupplier
  } = useInventoryStore();

  const filteredTransactions = transactions.filter(
    (t) => transactionFilter === 'ALL' || t.type === transactionFilter
  );

  const formatDateTime = (val?: string) =>
    val
      ? new Date(val).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Just now';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Suppliers Section */}
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
            <span style={{ fontSize: '10px', letterSpacing: '0.14em', fontWeight: 800, color: '#A1A1AA' }}>
              VENDOR RELATIONSHIPS
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Supplier Directory
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF'
                }}
              >
                {suppliers.length} vendors
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ios-text-muted)', margin: 0 }}>
              Authorized delivery partners and batch provenance sources linked to warehouse intake.
            </p>
          </div>

          <button
            onClick={() => openModal('supplier')}
            style={{
              padding: '9px 18px',
              borderRadius: '9999px',
              background: '#FFFFFF',
              border: 'none',
              color: '#000000',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(255, 255, 255, 0.15)'
            }}
          >
            <Plus size={15} />
            Register Supplier
          </button>
        </div>

        {/* Suppliers Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {suppliers.map((s: StockSupplier) => {
            const supplierBatches = batches.filter((b) => b.supplier?.id === s.id);
            const totalUnitsDelivered = supplierBatches.reduce(
              (sum, b) => sum + Number(b.initialQuantity || 0),
              0
            );

            return (
              <div
                key={s.id}
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'transform 0.15s ease'
                }}
                className="ios-glow-hover"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '13px'
                      }}
                    >
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                        {s.name}
                      </h4>
                      <small style={{ fontSize: '10px', color: '#71717A' }}>
                        {supplierBatches.length} lots • {totalUnitsDelivered} units
                      </small>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => openModal('supplier', s)}
                      title={`Edit ${s.name}`}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: 'none',
                        color: '#A1A1AA',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => void deleteSupplier(s)}
                      title={`Remove ${s.name}`}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'rgba(255, 59, 48, 0.08)',
                        border: 'none',
                        color: '#FF453A',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#A1A1AA' }}>
                  {s.contactName && (
                    <div style={{ color: '#FFFFFF', fontWeight: 600 }}>Contact: {s.contactName}</div>
                  )}
                  {s.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={12} color="#71717A" />
                      <a href={`mailto:${s.email}`} style={{ color: '#A1A1AA', textDecoration: 'none' }}>
                        {s.email}
                      </a>
                    </div>
                  )}
                  {s.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={12} color="#71717A" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={12} color="#71717A" />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Immutable Transaction Ledger Section */}
      <div className="ios-glass-panel" style={{ padding: '24px', borderRadius: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '18px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#FFFFFF" />
              <span style={{ fontSize: '10px', letterSpacing: '0.14em', fontWeight: 800, color: '#A1A1AA' }}>
                IMMUTABLE AUDIT TRAIL
              </span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: '4px 0 0' }}>
              Warehouse Movement Ledger
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--ios-text-muted)', margin: '2px 0 0' }}>
              Cryptographically timestamped transaction log for all stock movements, sales, and corrections.
            </p>
          </div>

          {/* Type Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {(
              [
                { id: 'ALL', label: 'All Events' },
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
                  padding: '7px 12px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: transactionFilter === opt.id ? '#FFFFFF' : 'rgba(255, 255, 255, 0.06)',
                  color: transactionFilter === opt.id ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
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
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#71717A', fontSize: '10px', letterSpacing: '0.08em' }}>
                <th style={{ padding: '12px 14px' }}>TIMESTAMP</th>
                <th style={{ padding: '12px 14px' }}>TYPE</th>
                <th style={{ padding: '12px 14px' }}>LOT / BATCH</th>
                <th style={{ padding: '12px 14px' }}>PRODUCT TITLE</th>
                <th style={{ padding: '12px 14px' }}>DELTA</th>
                <th style={{ padding: '12px 14px' }}>ACTOR / REASON</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx: StockTransaction) => {
                const isPositive = tx.quantityDelta > 0;

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
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#FFFFFF'
                        }}
                      >
                        {tx.type.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#FFFFFF' }}>
                      {tx.batch?.batchCode || 'LOT-GENERAL'}
                    </td>

                    <td style={{ padding: '12px 14px', color: '#FFFFFF', fontWeight: 600 }}>
                      {tx.batch?.product?.name || 'Inventory Adjustment'}
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
                      <div>{tx.reason || 'Routine movement'}</div>
                      {tx.user?.fullName && (
                        <small style={{ fontSize: '10px', color: '#71717A' }}>
                          By: {tx.user.fullName}
                        </small>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#71717A' }}>
                    No audit records found matching this transaction filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
