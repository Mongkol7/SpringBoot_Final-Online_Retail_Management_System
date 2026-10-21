import React, { useState, useEffect, useCallback } from 'react';
import { CashierStaff, posService } from '../../services/posService';
import {
  Lock,
  UserCheck,
  AlertCircle,
  Delete,
  RotateCcw,
  Sparkles,
  KeyRound,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface CashierPinModalProps {
  isOpen: boolean;
  onSuccess: (cashier: CashierStaff) => void;
  onClose?: () => void;
  canCancel?: boolean;
}

export const CashierPinModal: React.FC<CashierPinModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  canCancel = false
}) => {
  const [cashierStaffList, setCashierStaffList] = useState<CashierStaff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<CashierStaff | null>(null);
  const [pin, setPin] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Load available cashier staff profiles
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    posService.getCashierStaff()
      .then((staff) => {
        if (!isMounted) return;
        setCashierStaffList(staff);
        // Default to active cashier if exists, or first staff member
        const active = posService.getActiveCashier();
        const found = active ? staff.find((s) => s.id === active.id) : staff[0];
        setSelectedStaff(found || staff[0] || null);
      })
      .catch(() => {
        if (!isMounted) return;
        const fallback = posService.getActiveCashier();
        setSelectedStaff(fallback);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Phnom Penh Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Phnom_Penh',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(now);
      setCurrentTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset PIN when switching selected cashier
  const handleSelectStaff = (staff: CashierStaff) => {
    setSelectedStaff(staff);
    setPin('');
    setErrorMessage(null);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleVerifyPin = useCallback(async (pinToVerify: string) => {
    if (!selectedStaff) {
      setErrorMessage('Please select a cashier staff profile first.');
      return;
    }
    if (pinToVerify.length < 4) {
      setErrorMessage('PIN must be at least 4 digits.');
      triggerShake();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const authenticatedStaff = await posService.loginWithPin(selectedStaff.id, pinToVerify);
      onSuccess(authenticatedStaff);
      setPin('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Incorrect PIN. Please re-enter your 4-digit code.');
      triggerShake();
      setPin('');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStaff, onSuccess]);

  // Handle digit press from keypad or physical keyboard
  const handleDigit = useCallback((digit: string) => {
    if (pin.length >= 6 || isLoading) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMessage(null);

    // Auto-verify when 4 digits reached
    if (nextPin.length === 4) {
      handleVerifyPin(nextPin);
    }
  }, [pin, isLoading, handleVerifyPin]);

  const handleBackspace = useCallback(() => {
    if (isLoading) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  }, [isLoading]);

  const handleClear = useCallback(() => {
    if (isLoading) return;
    setPin('');
    setErrorMessage(null);
  }, [isLoading]);

  // Physical keyboard listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        if (canCancel && onClose) {
          e.preventDefault();
          onClose();
        } else {
          handleClear();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length >= 4) {
          handleVerifyPin(pin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDigit, handleBackspace, handleClear, handleVerifyPin, pin, canCancel, onClose]);

  if (!isOpen) return null;

  // Keypad numbers configuration (with iOS alphanumeric sub-labels)
  const keypadKeys = [
    { num: '1', sub: ' ' },
    { num: '2', sub: 'A B C' },
    { num: '3', sub: 'D E F' },
    { num: '4', sub: 'G H I' },
    { num: '5', sub: 'J K L' },
    { num: '6', sub: 'M N O' },
    { num: '7', sub: 'P Q R S' },
    { num: '8', sub: 'T U V' },
    { num: '9', sub: 'W X Y Z' },
    { action: 'CLEAR', label: 'Clear' },
    { num: '0', sub: '+' },
    { action: 'BACKSPACE', label: '⌫' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(7, 11, 21, 0.88)',
        backdropFilter: 'blur(36px) saturate(180%)',
        WebkitBackdropFilter: 'blur(36px) saturate(180%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
    >
      <div
        className={isShaking ? 'pin-shake-anim' : ''}
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.92) 100%)',
          borderRadius: '28px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.65), 0 0 40px rgba(59, 130, 246, 0.15)',
          padding: '28px 24px',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        {/* Terminal Header Bar */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '16px',
            marginBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 10px #10B981'
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#94A3B8' }}>
              REGISTER 01 • STORE #01
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#60A5FA' }}>
            <Clock size={12} />
            <span>{currentTime || 'Phnom Penh'}</span>
          </div>
        </div>

        {/* Lock Screen Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 12px',
              borderRadius: '50%',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60A5FA',
              boxShadow: '0 0 24px rgba(59, 130, 246, 0.35)'
            }}
          >
            <Lock size={26} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Cashier Staff Identification
          </h2>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
            Step 2: Select your cashier profile and enter your 4-digit PIN to operate this register.
          </p>
        </div>

        {/* Cashier Staff Profiles Grid / Carousel */}
        <div style={{ width: '100%', marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Active Register Cashiers:
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '10px',
              width: '100%'
            }}
          >
            {cashierStaffList.map((staff) => {
              const isSelected = selectedStaff?.id === staff.id;
              const initials = staff.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <button
                  key={staff.id}
                  onClick={() => handleSelectStaff(staff)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '16px',
                    border: isSelected ? '2px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    boxShadow: isSelected ? '0 0 20px rgba(56, 189, 248, 0.25)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: staff.avatarColor || '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '12px',
                      color: '#FFFFFF',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {staff.fullName}
                    </div>
                    <div style={{ fontSize: '10px', color: isSelected ? '#38BDF8' : '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>ID #{staff.id}</span>
                      <span>•</span>
                      <span>{staff.role}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={16} color="#38BDF8" style={{ flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Cashier Active Pill */}
        {selectedStaff && (
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '11px',
              color: '#E2E8F0',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <UserCheck size={13} color="#10B981" />
            <span>Logging in as: <strong>{selectedStaff.fullName}</strong> (Staff #{selectedStaff.id})</span>
          </div>
        )}

        {/* PIN Dots Visual Indicator */}
        <div style={{ marginBottom: '14px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '8px' }}>
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: isFilled ? '#10B981' : 'transparent',
                    border: isFilled ? '2px solid #10B981' : '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: isFilled ? '0 0 14px #10B981, inset 0 0 6px #10B981' : 'none',
                    transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                />
              );
            })}
          </div>

          {/* Error Message Feedback */}
          {errorMessage ? (
            <div
              style={{
                fontSize: '11px',
                color: '#F87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                animation: 'fadeIn 0.2s ease'
              }}
            >
              <AlertCircle size={13} />
              <span>{errorMessage}</span>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              Enter 4 digits or use physical keyboard
            </div>
          )}
        </div>

        {/* iOS-Style Tactile Keypad */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 76px)',
            gap: '12px',
            justifyContent: 'center',
            marginBottom: '18px'
          }}
        >
          {keypadKeys.map((k, idx) => {
            if (k.action === 'CLEAR') {
              return (
                <button
                  key={idx}
                  onClick={handleClear}
                  disabled={isLoading || pin.length === 0}
                  style={{
                    width: '76px',
                    height: '64px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: pin.length > 0 ? '#94A3B8' : 'rgba(255, 255, 255, 0.2)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: pin.length > 0 ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <RotateCcw size={15} />
                  <span>Clear</span>
                </button>
              );
            }

            if (k.action === 'BACKSPACE') {
              return (
                <button
                  key={idx}
                  onClick={handleBackspace}
                  disabled={isLoading || pin.length === 0}
                  style={{
                    width: '76px',
                    height: '64px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: pin.length > 0 ? '#F43F5E' : 'rgba(255, 255, 255, 0.2)',
                    fontSize: '18px',
                    cursor: pin.length > 0 ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Delete size={20} />
                </button>
              );
            }

            return (
              <button
                key={idx}
                onClick={() => handleDigit(k.num!)}
                disabled={isLoading}
                style={{
                  width: '76px',
                  height: '64px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.12s ease',
                  userSelect: 'none'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.93)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <span style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1 }}>{k.num}</span>
                {k.sub && (
                  <span style={{ fontSize: '8px', fontWeight: 600, letterSpacing: '0.12em', color: '#94A3B8', marginTop: '3px' }}>
                    {k.sub}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Demo Helper & Bypass */}
        <div
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center',
            fontSize: '11px',
            color: '#94A3B8'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <KeyRound size={13} color="#F59E0B" />
            <span>Demo PINs: <strong>Lead Cashier: 1234</strong> • <strong>Mono: 2026</strong> • <strong>Sarah: 2233</strong> • <strong>David: 4455</strong></span>
          </div>
          <button
            onClick={() => {
              const demoPin = selectedStaff?.id === 5 ? '2026' : selectedStaff?.id === 18 ? '2233' : selectedStaff?.id === 19 ? '4455' : '1234';
              setPin(demoPin);
              handleVerifyPin(demoPin);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#34D399',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Sparkles size={12} />
            Quick Auto-Fill Valid PIN
          </button>
        </div>

        {/* Optional Cancel/Dismiss (only if canCancel is true) */}
        {canCancel && onClose && (
          <button
            onClick={onClose}
            style={{
              marginTop: '12px',
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '12px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Cancel & Return
          </button>
        )}
      </div>

      <style>{`
        @keyframes pinShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .pin-shake-anim {
          animation: pinShake 0.4s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CashierPinModal;
