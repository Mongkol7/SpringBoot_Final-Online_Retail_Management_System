import React, { useState, FormEvent } from 'react';
import {
  ArrowDownToLine,
  Leaf,
  ArrowLeftRight,
  CheckCircle2,
  Boxes,
  Truck,
  Sparkles
} from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';

export const BatchIntakePage: React.FC = () => {
  const { products, suppliers, batches, recordStockIn, setTab } = useInventoryStore();

  const activeProducts = products.filter((p) => !p.isDeleted);
  const [productId, setProductId] = useState<string>(
    activeProducts[0] ? String(activeProducts[0].id) : ''
  );
  const [supplierId, setSupplierId] = useState<string>(
    suppliers[0] ? String(suppliers[0].id) : ''
  );
  const [batchCode, setBatchCode] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('50');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedProduct = products.find((p) => p.id === Number(productId));
  const isPerishable = Boolean(selectedProduct?.isPerishable);
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minimumExpiryDate = tomorrow.toISOString().slice(0, 10);

  const generateBatchCode = () => {
    if (!selectedProduct) return '';
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `BATCH-${selectedProduct.sku.replace(/^SKU-|^DRK-|^FRS-|^PAN-|^SNK-/, '')}-${dateStr}-${rand}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (isPerishable && !expiryDate) {
      alert('Expiry Date is required for perishable items under FEFO rotation.');
      return;
    }
    if (expiryDate && expiryDate <= today) {
      alert('Expiry Date must be a future date. Stock delivery cannot be ingested with an expired or today\'s date.');
      return;
    }

    setIsSubmitting(true);
    const ok = await recordStockIn({
      productId: Number(productId),
      supplierId: Number(supplierId) || (suppliers[0]?.id ?? 1),
      batchCode: batchCode.trim() || generateBatchCode(),
      quantity: Number(quantity),
      expiryDate: expiryDate || null
    });
    setIsSubmitting(false);

    if (ok) {
      setBatchCode('');
      setQuantity('50');
      setExpiryDate('');
      setTab('batches');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 0.9fr)', gap: '18px' }}>
      {/* Intake Ingestion Form */}
      <div className="ios-glass-panel" style={{ padding: '28px', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div>
            <span style={{ fontSize: '10px', letterSpacing: '0.14em', fontWeight: 800, color: '#A1A1AA' }}>
              INBOUND LOGISTICS
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', margin: '4px 0 0' }}>
              Inbound Batch Ingestion Sheet
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--ios-text-muted)', margin: '4px 0 0' }}>
              Record traceable lot deliveries with supplier attribution and automated expiry rotation tagging.
            </p>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              display: 'grid',
              placeItems: 'center',
              color: '#FFFFFF'
            }}
          >
            <ArrowDownToLine size={20} />
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Product Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
              PRODUCT SELECTION <span style={{ color: '#FFFFFF' }}>*</span>
            </label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setBatchCode('');
              }}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id} style={{ background: '#18181B', color: '#FFFFFF' }}>
                  {p.name} ({p.sku}) {p.isPerishable ? '• FEFO Perishable' : '• FIFO Dry'}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Picker */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
              ORIGINATING SUPPLIER <span style={{ color: '#FFFFFF' }}>*</span>
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id} style={{ background: '#18181B', color: '#FFFFFF' }}>
                  {s.name} ({s.contactName || 'Primary'})
                </option>
              ))}
            </select>
          </div>

          {/* Batch Code + Quantity Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#A1A1AA' }}>
                  BATCH LOT CODE
                </label>
                <button
                  type="button"
                  onClick={() => setBatchCode(generateBatchCode())}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Sparkles size={11} /> Generate
                </button>
              </div>
              <input
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                placeholder="Auto-generated if left blank"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
                INTAKE UNITS <span style={{ color: '#FFFFFF' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
              EXPIRATION DATE {isPerishable ? <span style={{ color: '#FFFFFF' }}>(MANDATORY FOR PERISHABLES)</span> : <span style={{ color: '#71717A' }}>(OPTIONAL)</span>}
            </label>
            <input
              type="date"
              required={isPerishable}
              min={minimumExpiryDate}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          {/* Strategy Preview */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '10px', color: '#71717A', letterSpacing: '0.08em' }}>DISPATCH QUEUE RULE</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                {isPerishable ? 'FEFO • Priority by Earliest Expiration' : 'FIFO • Priority by Arrival Sequence'}
              </div>
            </div>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              {isPerishable ? <Leaf size={16} color="#FFFFFF" /> : <ArrowLeftRight size={16} color="#FFFFFF" />}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              background: '#FFFFFF',
              border: 'none',
              color: '#000000',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(255, 255, 255, 0.2)',
              marginTop: '8px'
            }}
          >
            <ArrowDownToLine size={16} />
            {isSubmitting ? 'Recording Batch Ingestion…' : 'Commit Batch to Stock Ledger'}
          </button>
        </form>
      </div>

      {/* Sidebar: Checklist & Overview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Verification Checklist */}
        <div className="ios-glass-panel" style={{ padding: '22px', borderRadius: '20px' }}>
          <span style={{ fontSize: '10px', letterSpacing: '0.12em', fontWeight: 800, color: '#A1A1AA' }}>
            RECEIVING PROTOCOL
          </span>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: '4px 0 14px' }}>
            Batch Verification Steps
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#FFFFFF" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <b style={{ fontSize: '12px', color: '#FFFFFF', display: 'block' }}>1. Physical Inspection</b>
                <small style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                  Confirm cartons and seals are undamaged before signature.
                </small>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#FFFFFF" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <b style={{ fontSize: '12px', color: '#FFFFFF', display: 'block' }}>2. Supplier Slip Reconciliation</b>
                <small style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                  Verify delivered count matches vendor packing manifest.
                </small>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={16} color="#FFFFFF" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <b style={{ fontSize: '12px', color: '#FFFFFF', display: 'block' }}>3. FEFO Date Inscription</b>
                <small style={{ fontSize: '11px', color: 'var(--ios-text-muted)' }}>
                  Record printed expiration date to enforce automatic rotation lockouts.
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="ios-glass-panel" style={{ padding: '22px', borderRadius: '20px' }}>
          <span style={{ fontSize: '10px', letterSpacing: '0.12em', fontWeight: 800, color: '#A1A1AA' }}>
            LOGISTICS SNAPSHOT
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#A1A1AA', fontSize: '11px' }}>
                <Boxes size={14} /> Batches
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                {batches.length}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#A1A1AA', fontSize: '11px' }}>
                <Truck size={14} /> Suppliers
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                {suppliers.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
