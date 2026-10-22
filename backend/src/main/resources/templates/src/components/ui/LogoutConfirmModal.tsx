import React, { useEffect } from 'react';
import { LogOut, ShieldAlert, X, Lock, CheckCircle2, KeyRound } from 'lucide-react';

export interface LogoutConfirmModalProps {
  isOpen: boolean;
  roleLabel?: string;
  userName?: string;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  roleLabel = 'Active User',
  userName,
  title,
  description = 'Your active session tokens will be revoked and cleared from this browser.',
  onConfirm,
  onCancel,
  confirmLabel = 'Sign Out',
  cancelLabel = 'Stay Signed In'
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      } else if (event.key === 'Enter') {
        // Prevent enter on focused cancel button
        if (document.activeElement?.tagName === 'BUTTON' && document.activeElement.textContent?.includes(cancelLabel)) {
          return;
        }
        event.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onConfirm, cancelLabel]);

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
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        animation: 'logout-backdrop-enter 220ms ease-out'
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '430px',
          overflow: 'hidden',
          color: '#FFFFFF',
          background: 'linear-gradient(180deg, rgba(28, 28, 34, 0.98) 0%, rgba(14, 14, 18, 0.99) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '26px',
          boxShadow: '0 32px 80px -16px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          animation: 'logout-modal-pop 260ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Ambient Top Light Reflection */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            height: '110px',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(239, 68, 68, 0.28), rgba(239, 68, 68, 0.05) 55%, transparent 80%)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Modal Top Bar */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px 0'
          }}
        >
          {/* Role Status Tag */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#FCA5A5',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}
          >
            <ShieldAlert size={12} />
            <span>{roleLabel} Session</span>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close logout dialog"
            style={{
              width: '32px',
              height: '32px',
              display: 'grid',
              placeItems: 'center',
              color: '#9CA3AF',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#9CA3AF';
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ position: 'relative', zIndex: 2, padding: '16px 24px 20px', textAlign: 'center' }}>
          {/* Glowing Hero Icon with Pulse Beacon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '22px',
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 55%, #991B1B 100%)',
                display: 'grid',
                placeItems: 'center',
                color: '#FFFFFF',
                boxShadow: '0 12px 30px rgba(239, 68, 68, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
                animation: 'logout-shield-beacon 2.4s infinite'
              }}
            >
              <LogOut size={28} strokeWidth={2.4} style={{ transform: 'translateX(1px)' }} />
            </div>
          </div>

          {/* Title */}
          <h2
            id="logout-modal-title"
            style={{
              margin: '0 0 8px 0',
              fontSize: '22px',
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              color: '#FFFFFF'
            }}
          >
            {title || `Sign out of ${roleLabel}?`}
          </h2>

          {/* User Account Capsule (if provided) */}
          {userName && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '10px',
                fontSize: '11px',
                color: '#D1D5DB'
              }}
            >
              <KeyRound size={12} color="#F59E0B" />
              <span>Signed in as: <strong style={{ color: '#FFFFFF' }}>{userName}</strong></span>
            </div>
          )}

          {/* Main Description */}
          <p
            style={{
              margin: '0 0 18px 0',
              color: '#9CA3AF',
              fontSize: '13px',
              lineHeight: 1.55
            }}
          >
            {description}
          </p>

          {/* Security Assurances Micro-Card */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.035)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '12px 14px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#D1D5DB' }}>
              <CheckCircle2 size={13} color="#10B981" style={{ flexShrink: 0 }} />
              <span>Active JWT credentials revoked from this browser</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#D1D5DB' }}>
              <Lock size={13} color="#60A5FA" style={{ flexShrink: 0 }} />
              <span>Restricted management panels locked immediately</span>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '16px 24px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Action Buttons Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '12px 18px',
                borderRadius: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#E5E7EB',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              style={{
                padding: '12px 18px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 24px -4px rgba(239, 68, 68, 0.45)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(239, 68, 68, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(239, 68, 68, 0.45)';
              }}
            >
              <LogOut size={15} />
              <span>{confirmLabel}</span>
            </button>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontSize: '11px',
              color: '#6B7280'
            }}
          >
            <span>
              Press <kbd style={{ padding: '2px 5px', color: '#D1D5DB', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', fontSize: '9px', fontFamily: 'monospace' }}>ESC</kbd> to cancel
            </span>
            <span>•</span>
            <span>
              Press <kbd style={{ padding: '2px 5px', color: '#D1D5DB', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', fontSize: '9px', fontFamily: 'monospace' }}>↵ ENTER</kbd> to sign out
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
