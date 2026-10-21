import React, { useState, FormEvent } from 'react';
import { X, Check } from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';

export const AdjustmentModal: React.FC = () => {
  const { batches, selectedBatch, closeModal, recordAdjustment } = useInventoryStore();

  const [batchId, setBatchId] = useState<string>(
    selectedBatch ? String(selectedBatch.id) : (batches[0] ? String(batches[0].id) : '')
  );
  const [delta, setDelta] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activeTargetBatch = batches.find((b) => b.id === Number(batchId)) || selectedBatch;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeTargetBatch) return;

    const numDelta = parseInt(delta, 10);
    if (!numDelta) {
      alert('Enter a non-zero quantity change (+ or -).');
      return;
    }

    if (activeTargetBatch.currentQuantity + numDelta < 0) {
      alert(`Cannot reduce quantity below 0. Current on hand: ${activeTargetBatch.currentQuantity}.`);
      return;
    }

    setIsSubmitting(true);
    await recordAdjustment({
      batchId: activeTargetBatch.id,
      delta: numDelta,
      reason: reason.trim() || 'Manual stock correction'
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
          maxWidth: '460px',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 1px 1px rgba(255,255,255,0.15)',
          animation: 'stock-enter 0.25s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '10px', letterSpacing: '0.12em', fontWeight: 800, color: '#A1A1AA' }}>
              IMMUTABLE AUDIT ENTRY
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: '4px 0 0' }}>
              Adjust Batch Units
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
              SELECT BATCH <span style={{ color: '#FFFFFF' }}>*</span>
            </label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontFamily: 'monospace',
                outline: 'none'
              }}
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id} style={{ background: '#18181B', color: '#FFFFFF' }}>
                  {b.batchCode} • {b.product?.name} ({b.currentQuantity} units)
                </option>
              ))}
            </select>
          </div>

          {activeTargetBatch && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <span style={{ fontSize: '11px', color: '#A1A1AA' }}>Current Available Stock</span>
              <b style={{ fontSize: '13px', color: '#FFFFFF' }}>{activeTargetBatch.currentQuantity} units</b>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
              QUANTITY CHANGE (+ OR −) <span style={{ color: '#FFFFFF' }}>*</span>
            </label>
            <input
              type="number"
              step="1"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="e.g. +10 or -3"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 700,
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#A1A1AA', marginBottom: '6px' }}>
              AUDIT REASON <span style={{ color: '#FFFFFF' }}>*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Damaged during inspection, inventory count recount..."
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '12px',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
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
              <Check size={16} />
              {isSubmitting ? 'Recording…' : 'Record Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
