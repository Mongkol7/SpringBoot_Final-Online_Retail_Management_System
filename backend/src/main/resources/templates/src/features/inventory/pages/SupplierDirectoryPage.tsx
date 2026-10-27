import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2
} from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { StockSupplier } from '../../../services/inventoryService';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

export const SupplierDirectoryPage: React.FC = () => {
  const {
    suppliers,
    batches,
    openModal,
    deleteSupplier
  } = useInventoryStore();

  const [pendingDeleteSupplier, setPendingDeleteSupplier] = useState<StockSupplier | null>(null);

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px' }}>
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
                  borderRadius: '18px',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        overflow: 'hidden',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0
                      }}
                    >
                      {s.profileImage ? (
                        <img
                          src={s.profileImage}
                          alt={s.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '16px' }}>
                          {s.name.charAt(0).toUpperCase()}
                        </span>
                      )}
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
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: 'none',
                        color: '#A1A1AA',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setPendingDeleteSupplier(s)}
                      title={`Remove ${s.name}`}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        background: 'rgba(255, 59, 48, 0.08)',
                        border: 'none',
                        color: '#FF453A',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
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

          {suppliers.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '48px',
                textAlign: 'center',
                color: '#71717A',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px'
              }}
            >
              <Building2 size={28} color="#52525B" style={{ margin: '0 auto 8px' }} />
              <div>No suppliers registered yet. Click &quot;Register Supplier&quot; to add your first vendor.</div>
            </div>
          )}
        </div>
      </div>

      {/* Supplier Delete Confirmation Modal */}
      {pendingDeleteSupplier && (
        <ConfirmDeleteModal
          isOpen={true}
          itemType="supplier"
          itemName={pendingDeleteSupplier.name}
          itemSubtitle={pendingDeleteSupplier.contactName ? `Contact: ${pendingDeleteSupplier.contactName} · ${pendingDeleteSupplier.email || pendingDeleteSupplier.phone || ''}` : pendingDeleteSupplier.email}
          title={`Light Delete Supplier: "${pendingDeleteSupplier.name}"?`}
          confirmLabel="Light Delete (Safe Archive)"
          onConfirm={async () => {
            const s = pendingDeleteSupplier;
            setPendingDeleteSupplier(null);
            await deleteSupplier(s);
          }}
          onCancel={() => setPendingDeleteSupplier(null)}
        />
      )}
    </div>
  );
};
