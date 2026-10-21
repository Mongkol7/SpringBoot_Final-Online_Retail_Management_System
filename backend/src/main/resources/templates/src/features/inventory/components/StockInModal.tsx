import React, { useState, useEffect, FormEvent } from 'react';
import { X, ArrowDownToLine, Leaf, ArrowLeftRight, Sparkles } from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';

export const StockInModal: React.FC = () => {
  const {
    products,
    suppliers,
    closeModal,
    recordStockIn,
    preselectedProductForIntake
  } = useInventoryStore();

  const [productId, setProductId] = useState<string>(
    preselectedProductForIntake ? String(preselectedProductForIntake.id) : (products[0] ? String(products[0].id) : '')
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

  // Generate intelligent batch code when product changes
  const generateBatchCode = () => {
    if (!selectedProduct) return '';
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `BATCH-${selectedProduct.sku.replace(/^SKU-|^DRK-|^FRS-|^PAN-|^SNK-/, '')}-${dateStr}-${rand}`;
  };

  useEffect(() => {
    if (!batchCode && selectedProduct) {
      setBatchCode(generateBatchCode());
    }
  }, [productId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (isPerishable && !expiryDate) {
      alert('Expiry Date is required for perishable products under the FEFO policy.');
      return;
    }
    if (expiryDate && expiryDate <= today) {
      alert('Expiry Date must be a future date. Stock delivery cannot be ingested with an expired or today\'s date.');
      return;
    }

    setIsSubmitting(true);
    await recordStockIn({
      productId: Number(productId),
      supplierId: Number(supplierId) || (suppliers[0]?.id ?? 1),
      batchCode: batchCode.trim() || generateBatchCode(),
      quantity: Number(quantity),
      expiryDate: expiryDate || null
    });
    setIsSubmitting(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        className="ios-glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 1px 1px rgba(255,255,255,0.15)',
          animation: 'stock-enter 0.25s ease'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.12em', fontWeight: 800, color: '#A1A1AA' }}>
                INBOUND SHIPMENT INTAKE
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: isPerishable ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                  color: '#FFFFFF'
                }}
              >
                {isPerishable ? 'FEFO ROTATION' : 'FIFO ROTATION'}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: '4px 0 0' }}>
              Stock-In Ingestion Sheet
            </h2>
          </div>
          <button
            onClick={closeModal}
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
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Product Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
              SELECT PRODUCT <span style={{ color: '#FFFFFF' }}>*</span>
            </label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setBatchCode(''); // Will trigger auto-gen
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
              {products
                .filter((p) => !p.isDeleted)
                .map((p) => (
                  <option key={p.id} value={p.id} style={{ background: '#18181B', color: '#FFFFFF' }}>
                    {p.name} ({p.sku}) {p.isPerishable ? '• Perishable' : ''}
                  </option>
                ))}
            </select>
          </div>

          {/* Supplier Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
              FULFILLMENT SUPPLIER <span style={{ color: '#FFFFFF' }}>*</span>
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
                  BATCH CODE
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
                    gap: '3px'
                  }}
                >
                  <Sparkles size={11} /> Auto-Generate
                </button>
              </div>
              <input
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                placeholder="e.g. BATCH-2026-X1"
                required
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
                INTAKE QUANTITY <span style={{ color: '#FFFFFF' }}>*</span>
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
              EXPIRY DATE {isPerishable ? <span style={{ color: '#FFFFFF' }}>(MANDATORY FOR PERISHABLES)</span> : <span style={{ color: '#71717A' }}>(OPTIONAL FOR NON-PERISHABLE)</span>}
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
                border: `1px solid ${isPerishable && !expiryDate ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'}`,
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            {isPerishable && (
              <small style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#A1A1AA', marginTop: '4px' }}>
                <Leaf size={11} color="#FFFFFF" /> Perishable product strictly rotates under First-Expiry, First-Out (FEFO).
              </small>
            )}
          </div>

          {/* Strategy Summary Card */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '10px', color: '#71717A', letterSpacing: '0.08em' }}>DISPATCH QUEUE POLICY</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                {isPerishable ? 'FEFO Strategy (Sorted by Expiry)' : 'FIFO Strategy (Sorted by Ingestion Timestamp)'}
              </div>
            </div>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}>
              {isPerishable ? <Leaf size={14} color="#FFFFFF" /> : <ArrowLeftRight size={14} color="#FFFFFF" />}
            </div>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={closeModal}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 2,
                padding: '12px',
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
                boxShadow: '0 4px 16px rgba(255, 255, 255, 0.2)'
              }}
            >
              <ArrowDownToLine size={16} />
              {isSubmitting ? 'Recording Ingest…' : 'Ingest Stock Delivery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
