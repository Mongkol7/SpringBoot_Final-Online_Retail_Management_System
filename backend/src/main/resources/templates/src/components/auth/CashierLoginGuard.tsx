import React, { useState, useEffect } from 'react';
import { Barcode, AlertCircle, Delete } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { posService, CashierStaff, DEFAULT_CASHIER_STAFF } from '../../services/posService';

interface CashierLoginGuardProps {
  onSuccess?: () => void;
}

export const CashierLoginGuard: React.FC<CashierLoginGuardProps> = ({ onSuccess }) => {
  const { loginCashierPin, login } = useAuth();
  const [cashierStaff, setCashierStaff] = useState<CashierStaff[]>(DEFAULT_CASHIER_STAFF);
  const [selectedStaff, setSelectedStaff] = useState<CashierStaff | null>(null);
  const [pin, setPin] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'PIN' | 'PASSWORD'>('PIN');

  // Password mode states
  const [email, setEmail] = useState('cashier@retailstore.com');
  const [password, setPassword] = useState('cashier123');

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const staff = await posService.getCashierStaff();
        if (staff && staff.length > 0) {
          setCashierStaff(staff);
          setSelectedStaff(staff[0]);
        }
      } catch {
        setSelectedStaff(DEFAULT_CASHIER_STAFF[0]);
      }
    };
    fetchStaff();
  }, []);

  const handlePinDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);
      if (nextPin.length === 4 && selectedStaff) {
        // Auto-submit on 4th digit
        triggerPinLogin(selectedStaff.id, nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const triggerPinLogin = async (staffId: number, pinCode: string) => {
    setLoading(true);
    setError(null);
    try {
      await loginCashierPin(staffId, pinCode);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Incorrect PIN code. Default is 1234.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email.trim(), password);
      if (user.role !== 'CASHIER' && user.role !== 'ADMIN') {
        setError(`Access Denied: Account role '${user.role}' lacks Cashier Terminal permission.`);
        return;
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="ios-glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '36px 32px',
          borderRadius: '28px',
          background: 'linear-gradient(135deg, rgba(24, 24, 30, 0.9) 0%, rgba(14, 14, 18, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(36px)',
          WebkitBackdropFilter: 'blur(36px)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
          color: '#FFFFFF'
        }}
      >
        {/* Terminal Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 14px',
              borderRadius: '18px',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(255, 255, 255, 0.2)'
            }}
          >
            <Barcode size={30} />
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38BDF8',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              marginBottom: '8px'
            }}
          >
            POS TERMINAL LOCKED • STORE #01
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '6px 0 4px', letterSpacing: '-0.02em' }}>
            Cashier Staff Authentication
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>
            Select your staff profile and enter your 4-digit PIN to open the register.
          </p>
        </div>

        {/* Toggle Mode: PIN vs Email/Password */}
        <div
          style={{
            display: 'flex',
            padding: '4px',
            borderRadius: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            marginBottom: '20px'
          }}
        >
          <button
            onClick={() => setMode('PIN')}
            type="button"
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: mode === 'PIN' ? '#FFFFFF' : 'transparent',
              color: mode === 'PIN' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Touchscreen PIN Pad
          </button>
          <button
            onClick={() => setMode('PASSWORD')}
            type="button"
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: mode === 'PASSWORD' ? '#FFFFFF' : 'transparent',
              color: mode === 'PASSWORD' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Staff Email & Password
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              fontSize: '12px',
              marginBottom: '18px'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {mode === 'PIN' ? (
          <div>
            {/* Cashier Profiles Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px', letterSpacing: '0.04em' }}>
                SELECT ACTIVE CASHIER:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {cashierStaff.map((staff) => {
                  const isSelected = selectedStaff?.id === staff.id;
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => {
                        setSelectedStaff(staff);
                        setPin('');
                        setError(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '14px',
                        border: isSelected ? '2px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: staff.avatarColor || '#3B82F6',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                          flexShrink: 0
                        }}
                      >
                        {staff.fullName.charAt(0)}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {staff.fullName.split(' ')[0]}
                        </div>
                        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>
                          ID #{staff.id}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PIN Indicator Dots */}
            <div style={{ textAlign: 'center', margin: '20px 0 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '8px' }}>
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: isFilled ? '#38BDF8' : 'rgba(255, 255, 255, 0.15)',
                        border: isFilled ? '2px solid #38BDF8' : '2px solid rgba(255, 255, 255, 0.25)',
                        boxShadow: isFilled ? '0 0 12px rgba(56, 189, 248, 0.6)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    />
                  );
                })}
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                {selectedStaff ? `Entering PIN for ${selectedStaff.fullName}` : 'Choose cashier profile'}
              </span>
            </div>

            {/* Numeric Keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinDigit(digit)}
                  disabled={loading}
                  style={{
                    padding: '16px 0',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    fontSize: '20px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  className="ios-glow-hover"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                style={{
                  padding: '16px 0',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                disabled={loading}
                style={{
                  padding: '16px 0',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  fontSize: '20px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                className="ios-glow-hover"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                style={{
                  padding: '16px 0',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Delete size={18} />
              </button>
            </div>

            {/* Quick 1-Click PIN badge */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  if (selectedStaff) {
                    setPin('1234');
                    triggerPinLogin(selectedStaff.id, '1234');
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38BDF8',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Quick Demo: Auto-Enter Standard PIN (1234)
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px' }}>
                CASHIER EMAIL
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px' }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 20px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                color: '#000000',
                fontSize: '13px',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '6px'
              }}
            >
              {loading ? 'Authenticating...' : 'Unlock POS Terminal'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
