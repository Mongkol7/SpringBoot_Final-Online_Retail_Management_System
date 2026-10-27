import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  itemType: 'product' | 'supplier' | 'category';
  itemName: string;
  itemSubtitle?: string;
  isRestore?: boolean;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  itemType,
  itemName,
  itemSubtitle,
  isRestore = false,
  confirmLabel,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const defaultTitle = isRestore
    ? `Restore ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}?`
    : `Are you sure you want to delete this ${itemType}?`;

  const actionText = confirmLabel || (isRestore ? 'Restore Record' : 'Light Delete (Safe Archive)');

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="ios-glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          margin: 'auto',
          borderRadius: '24px',
          padding: '26px',
          background: 'linear-gradient(145deg, rgba(26, 26, 30, 0.98), rgba(14, 14, 16, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(255, 255, 255, 0.15)',
          animation: 'stock-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          color: '#FFFFFF'
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: isRestore ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 69, 58, 0.15)',
                border: `1px solid ${isRestore ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 69, 58, 0.3)'}`,
                display: 'grid',
                placeItems: 'center',
                color: isRestore ? '#34C759' : '#FF453A'
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.14em',
                  fontWeight: 800,
                  color: isRestore ? '#34C759' : '#FF9F0A'
                }}
              >
                {isRestore ? 'REACTIVATION AUDIT' : 'LIGHT DELETE · SAFE ARCHIVE'}
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0', color: '#FFFFFF' }}>
                {title || defaultTitle}
              </h3>
            </div>
          </div>

          <button
            onClick={onCancel}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#A1A1AA',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer'
            }}
            title="Cancel"
          >
            <X size={15} />
          </button>
        </div>

        {/* Target Item Card */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#A1A1AA'
              }}
            >
              {itemType.toUpperCase()}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#34C759' }}>
              <ShieldCheck size={12} />
              <span>Light Delete · Kept in DB</span>
            </div>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginTop: '6px' }}>
            {itemName}
          </div>
          {itemSubtitle && (
            <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px', fontFamily: 'monospace' }}>
              {itemSubtitle}
            </div>
          )}
        </div>

        {/* Explanatory Notice */}
        <div
          style={{
            fontSize: '12px',
            lineHeight: 1.5,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '22px'
          }}
        >
          {isRestore ? (
            <span>
              This record will be reactivated in the live catalog and made available across store and inventory workflows.
            </span>
          ) : (
            <span>
              <b>Are you sure?</b> This action performs a <b>light delete</b>. The record will <b>not be permanently erased</b> from the database. All transaction receipts, historic batches, and movement ledger records will remain safely intact.
            </span>
          )}
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onCancel}
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
            type="button"
            onClick={() => void onConfirm()}
            style={{
              flex: 1.5,
              padding: '12px',
              borderRadius: '14px',
              background: isRestore ? '#FFFFFF' : '#FF453A',
              border: 'none',
              color: isRestore ? '#000000' : '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: isRestore ? '0 4px 16px rgba(255,255,255,0.2)' : '0 4px 16px rgba(255, 69, 58, 0.35)'
            }}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
