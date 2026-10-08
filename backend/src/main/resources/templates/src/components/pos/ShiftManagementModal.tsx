import React, { useState } from 'react';
import { PosShift } from '../../types/schema';
import { X, DollarSign, Calculator, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';

interface ShiftManagementModalProps {
  isOpen: boolean;
  activeShift: PosShift | null;
  onClose: () => void;
  onOpenShift: (floatAmount: number, notes: string) => Promise<void>;
  onCloseShift: (closingCash: number, notes: string) => Promise<void>;
}

export const ShiftManagementModal: React.FC<ShiftManagementModalProps> = ({
  isOpen,
  activeShift,
  onClose,
  onOpenShift,
  onCloseShift
}) => {
  const [openingFloat, setOpeningFloat] = useState<string>('100.00');
  const [closingCash, setClosingCash] = useState<string>('250.00');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const isShiftOpen = activeShift && activeShift.status === 'OPEN';
  const systemSales = activeShift ? activeShift.systemCashTotal : 0;
  const floatVal = activeShift ? activeShift.openingFloat : 0;
  const expectedTotal = floatVal + systemSales;
  const countedCashVal = parseFloat(closingCash) || 0;
  const variance = Math.round((countedCashVal - expectedTotal) * 100) / 100;

  const handleOpenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onOpenShift(parseFloat(openingFloat) || 0, notes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCloseShift(parseFloat(closingCash) || 0, notes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="ios-glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '30px',
          backgroundColor: '#0F0F12',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          color: '#FFFFFF'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Calculator size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                {isShiftOpen ? 'Reconcile & Close Shift' : 'Open Cashier Shift Float'}
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ios-text-muted)' }}>
                {isShiftOpen ? 'Cash drawer reconciliation & end-of-day variance' : 'Log morning cash drawer starting float'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ios-text-muted)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content based on shift state */}
        {!isShiftOpen ? (
          <form onSubmit={handleOpenSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Opening Cash Float ($)
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717A' }}
                />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 36px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <p style={{ fontSize: '11px', color: '#71717A', marginTop: '4px' }}>
                Standard starting float is $100.00 for small change coins and bills.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Shift Notes / Terminal ID
              </label>
              <input
                type="text"
                placeholder="e.g. Main POS Terminal - Morning Shift"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '10px',
                padding: '14px',
                backgroundColor: '#FFFFFF',
                color: '#000000',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <ShieldCheck size={18} />
              {isSubmitting ? 'Opening Shift...' : 'Confirm & Open Shift'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCloseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* System Calculation Breakdown */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ios-text-muted)' }}>Opening Float:</span>
                <span style={{ fontWeight: 600 }}>${floatVal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ios-text-muted)' }}>System Cash Sales:</span>
                <span style={{ fontWeight: 600 }}>+${systemSales.toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700 }}>
                <span>Expected Drawer Total:</span>
                <span>${expectedTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Cashier Counted Cash */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Physical Cash Counted in Drawer ($)
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717A' }}
                />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 36px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Real-time Variance HUD */}
            <div
              style={{
                padding: '14px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor:
                  variance === 0
                    ? 'rgba(16, 185, 129, 0.15)'
                    : variance < 0
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(59, 130, 246, 0.15)',
                border: `1px solid ${
                  variance === 0
                    ? 'rgba(16, 185, 129, 0.4)'
                    : variance < 0
                    ? 'rgba(239, 68, 68, 0.4)'
                    : 'rgba(59, 130, 246, 0.4)'
                }`
              }}
            >
              {variance === 0 ? (
                <CheckCircle size={22} color="#10B981" />
              ) : variance < 0 ? (
                <AlertTriangle size={22} color="#EF4444" />
              ) : (
                <CheckCircle size={22} color="#3B82F6" />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>
                  {variance === 0
                    ? 'Drawer Perfectly Balanced'
                    : variance < 0
                    ? `Drawer Short by $${Math.abs(variance).toFixed(2)}`
                    : `Drawer Over by +$${variance.toFixed(2)}`}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>
                  Variance: ${variance.toFixed(2)} (Counted vs. Expected)
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Closing Reconciliation Notes
              </label>
              <input
                type="text"
                placeholder="e.g. End of day count verified"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '8px',
                padding: '14px',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Calculator size={18} />
              {isSubmitting ? 'Reconciling...' : 'Confirm Reconciliation & Close Shift'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
