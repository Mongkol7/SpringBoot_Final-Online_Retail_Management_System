import React, { useState, useEffect } from 'react';
import { PosShift } from '../../types/schema';
import { X, DollarSign, Calculator, AlertTriangle, CheckCircle, ShieldCheck, Lock } from 'lucide-react';

interface ShiftManagementModalProps {
  isOpen: boolean;
  activeShift: PosShift | null;
  cashierName?: string;
  cashierId?: number;
  onClose: () => void;
  onOpenShift: (floatAmount: number, notes: string) => Promise<void>;
  onCloseShift: (closingCash: number, notes: string, lockRegister?: boolean) => Promise<void>;
}

export const ShiftManagementModal: React.FC<ShiftManagementModalProps> = ({
  isOpen,
  activeShift,
  cashierName,
  cashierId,
  onClose,
  onOpenShift,
  onCloseShift
}) => {
  const [openingFloat, setOpeningFloat] = useState<string>('100.00');
  const [closingCash, setClosingCash] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [lockRegisterAfter, setLockRegisterAfter] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeShift && isOpen) {
      const exp = (activeShift.openingFloat || 0) + (activeShift.systemCashTotal || 0);
      setClosingCash(exp.toFixed(2));
    }
  }, [activeShift, isOpen]);

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
    setError(null);
    try {
      await onOpenShift(parseFloat(openingFloat) || 0, notes);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to open shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onCloseShift(parseFloat(closingCash) || 0, notes, lockRegisterAfter);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to close/reconcile shift');
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

        {/* Active Cashier Identity Tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '18px',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={14} color="#10B981" />
            <span style={{ color: 'var(--ios-text-muted)' }}>Shift Operator:</span>
            <strong style={{ color: '#FFFFFF' }}>{cashierName || activeShift?.cashierName || 'POS Lead Cashier'}</strong>
          </div>
          <span style={{ fontSize: '11px', color: '#60A5FA', backgroundColor: 'rgba(96, 165, 250, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
            Staff ID #{cashierId || activeShift?.cashierId || 1}
          </span>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#FCA5A5',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={16} color="#EF4444" />
            <span>{error}</span>
          </div>
        )}

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  Physical Cash Counted in Drawer ($)
                </label>
                <button
                  type="button"
                  onClick={() => setClosingCash(expectedTotal.toFixed(2))}
                  style={{
                    fontSize: '11px',
                    color: '#34D399',
                    backgroundColor: 'rgba(52, 211, 153, 0.12)',
                    border: '1px solid rgba(52, 211, 153, 0.25)',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Exact Match (${expectedTotal.toFixed(2)})
                </button>
              </div>
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

            {/* Shift Handover / Lock Terminal Toggle */}
            <div
              onClick={() => setLockRegisterAfter((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: lockRegisterAfter ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${lockRegisterAfter ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                type="checkbox"
                checked={lockRegisterAfter}
                onChange={(e) => setLockRegisterAfter(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#10B981', width: '16px', height: '16px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={12} color={lockRegisterAfter ? '#10B981' : '#F59E0B'} />
                  <span>Lock register & return to PIN screen for next cashier</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ios-text-muted)', marginTop: '2px' }}>
                  Safely signs out active cashier so incoming cashier can enter their 4-digit PIN
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '4px',
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
                gap: '8px',
                boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)'
              }}
            >
              <Calculator size={18} />
              {isSubmitting
                ? 'Reconciling...'
                : lockRegisterAfter
                ? 'Confirm Reconciliation & Lock for Next Cashier'
                : 'Confirm Reconciliation & Close Shift'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
