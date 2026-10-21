import React, { useEffect } from 'react';
import { LogOut, ShieldCheck, X } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  roleLabel: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  roleLabel,
  description,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)'
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
        style={{
          width: '100%',
          maxWidth: '410px',
          overflow: 'hidden',
          color: '#FFFFFF',
          background: 'linear-gradient(145deg, #171719 0%, #0A0A0B 100%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '24px',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(255, 255, 255, 0.03)',
          animation: 'logout-modal-enter 180ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ padding: '22px 22px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                color: '#FCA5A5',
                background: 'rgba(239, 68, 68, 0.13)',
                border: '1px solid rgba(248, 113, 113, 0.24)',
                borderRadius: '14px'
              }}
            >
              <LogOut size={20} />
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close logout dialog"
              style={{
                width: '30px',
                height: '30px',
                display: 'grid',
                placeItems: 'center',
                color: '#A1A1AA',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ marginTop: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#A1A1AA', fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              <ShieldCheck size={13} />
              {roleLabel} session
            </div>
            <h2 id="logout-modal-title" style={{ margin: '7px 0 0', fontSize: '22px', lineHeight: 1.15, letterSpacing: '-0.03em' }}>
              Sign out securely?
            </h2>
            <p style={{ margin: '10px 0 0', color: '#A1A1AA', fontSize: '12px', lineHeight: 1.6 }}>
              {description}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 22px', background: 'rgba(255, 255, 255, 0.035)', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <span style={{ color: '#71717A', fontSize: '10px' }}>
            Press <kbd style={{ padding: '3px 6px', color: '#D4D4D8', background: '#27272A', border: '1px solid #3F3F46', borderRadius: '5px', fontSize: '9px' }}>ESC</kbd> to cancel
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{ padding: '10px 14px', color: '#D4D4D8', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '11px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              Stay signed in
            </button>
            <button
              type="button"
              onClick={onConfirm}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 14px', color: '#FFFFFF', background: '#B4232C', border: '1px solid #D14A52', borderRadius: '11px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(180, 35, 44, 0.22)' }}
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
