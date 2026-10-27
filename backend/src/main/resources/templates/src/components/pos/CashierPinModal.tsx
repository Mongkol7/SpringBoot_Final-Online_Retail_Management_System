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
  Clock,
  X
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
    setTimeout(() => setIsShaking(false), 450);
  };

  const handleVerifyPin = useCallback(async (pinToVerify: string) => {
    if (!selectedStaff) {
      setErrorMessage('Please select a cashier profile first.');
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
      setErrorMessage(err.message || 'Incorrect PIN. Try demo PIN 1234.');
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

  // Keypad keys with sub-labels
  const keypadKeys = [
    { num: '1', sub: ' ' },
    { num: '2', sub: 'ABC' },
    { num: '3', sub: 'DEF' },
    { num: '4', sub: 'GHI' },
    { num: '5', sub: 'JKL' },
    { num: '6', sub: 'MNO' },
    { num: '7', sub: 'PQRS' },
    { num: '8', sub: 'TUV' },
    { num: '9', sub: 'WXYZ' },
    { action: 'CLEAR', label: 'Clr' },
    { num: '0', sub: '+' },
    { action: 'BACKSPACE', label: '⌫' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(5, 8, 18, 0.84)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        boxSizing: 'border-box'
      }}
    >
      <div
        className={isShaking ? 'pin-shake-anim' : ''}
        style={{
          width: '100%',
          maxWidth: '840px',
          maxHeight: 'min(620px, 94vh)',
          background: 'linear-gradient(145deg, rgba(22, 30, 46, 0.98) 0%, rgba(13, 18, 30, 0.99) 100%)',
          borderRadius: '28px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.8), 0 0 45px rgba(59, 130, 246, 0.15)',
          padding: '22px 28px',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {/* Top Mini Header: Register & Time & Close */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '10px',
            marginBottom: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981'
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: '#94A3B8' }}>
              REGISTER 01 • STORE #01
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#60A5FA' }}>
              <Clock size={12} />
              <span>{currentTime || 'Phnom Penh'}</span>
            </div>
            {canCancel && onClose && (
              <button
                onClick={onClose}
                title="Cancel"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Split Content: Left = Profile Selector, Right = PIN Keypad */}
        <div
          className="cashier-pin-split-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 0.95fr',
            gap: '24px',
            alignItems: 'stretch',
            flex: 1,
            minHeight: 0
          }}
        >
          {/* LEFT COLUMN: Cashier Profiles & Demo Helper */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              minHeight: 0
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(59, 130, 246, 0.18)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60A5FA'
                  }}
                >
                  <Lock size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                    1. Select Cashier Staff
                  </h3>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>Tap your profile to unlock register</span>
                </div>
              </div>

              {/* Staff Profiles Scrollable List */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  paddingRight: '6px'
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
                        padding: '9px 12px',
                        borderRadius: '14px',
                        border: isSelected ? '2px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                        boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'left'
                      }}
                    >
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor: staff.avatarColor || '#3B82F6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '12px',
                          color: '#FFFFFF',
                          flexShrink: 0
                        }}
                      >
                        {initials}
                      </div>
                      <div style={{ overflow: 'hidden', flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {staff.fullName}
                        </div>
                        <div style={{ fontSize: '11px', color: isSelected ? '#38BDF8' : '#94A3B8' }}>
                          Staff #{staff.id} • {staff.role}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={17} color="#38BDF8" style={{ flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Demo PIN Chips */}
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px dashed rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                fontSize: '11px',
                color: '#94A3B8'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={13} color="#F59E0B" />
                <span>Demo PIN: <strong>1234</strong></span>
              </div>
              <button
                onClick={() => {
                  const demoPin = selectedStaff?.id === 5 ? '2026' : selectedStaff?.id === 18 ? '2233' : selectedStaff?.id === 19 ? '4455' : '1234';
                  setPin(demoPin);
                  handleVerifyPin(demoPin);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'rgba(16, 185, 129, 0.22)',
                  color: '#34D399',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={12} />
                Auto-Fill PIN
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: PIN Indicator & Tactile Keypad */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.28)',
              borderRadius: '20px',
              padding: '16px 14px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {/* Active Cashier Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(56, 189, 248, 0.14)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontSize: '12px',
                color: '#38BDF8',
                marginBottom: '10px',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              <UserCheck size={13} color="#10B981" />
              <span><strong>{selectedStaff?.fullName || 'Select Staff'}</strong></span>
            </div>

            {/* 4 PIN Dots */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '8px' }}>
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: isFilled ? '#10B981' : 'transparent',
                      border: isFilled ? '2px solid #10B981' : '1.5px solid rgba(255, 255, 255, 0.35)',
                      boxShadow: isFilled ? '0 0 12px #10B981' : 'none',
                      transform: isFilled ? 'scale(1.2)' : 'scale(1)',
                      transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  />
                );
              })}
            </div>

            {/* Error or Hint */}
            <div style={{ height: '20px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
              {errorMessage ? (
                <div style={{ fontSize: '11px', color: '#F87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={13} />
                  <span>{errorMessage}</span>
                </div>
              ) : (
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Enter 4-digit code (keyboard enabled)
                </span>
              )}
            </div>

            {/* Keypad with generous touch-friendly sizing (78px x 48px) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 78px)',
                gap: '8px',
                justifyContent: 'center'
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
                        width: '78px',
                        height: '48px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: pin.length > 0 ? '#94A3B8' : 'rgba(255, 255, 255, 0.25)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: pin.length > 0 ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      <RotateCcw size={12} />
                      <span>Clr</span>
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
                        width: '78px',
                        height: '48px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: pin.length > 0 ? '#F43F5E' : 'rgba(255, 255, 255, 0.25)',
                        fontSize: '15px',
                        cursor: pin.length > 0 ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      <Delete size={17} />
                    </button>
                  );
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleDigit(k.num!)}
                    disabled={isLoading}
                    style={{
                      width: '78px',
                      height: '48px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.1s ease',
                      userSelect: 'none'
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.93)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
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
                    <span style={{ fontSize: '19px', fontWeight: 700, lineHeight: 1 }}>{k.num}</span>
                    {k.sub && (
                      <span style={{ fontSize: '8px', fontWeight: 600, letterSpacing: '0.08em', color: '#94A3B8', marginTop: '2px' }}>
                        {k.sub}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pinShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .pin-shake-anim {
          animation: pinShake 0.35s ease;
        }
        @media (max-width: 640px) {
          .cashier-pin-split-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CashierPinModal;
