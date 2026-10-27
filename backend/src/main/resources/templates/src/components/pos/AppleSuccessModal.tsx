import React, { useEffect, useState } from 'react';
import { Check, Receipt, Sparkles } from 'lucide-react';

interface AppleSuccessModalProps {
  isOpen: boolean;
  totalAmount: number;
  paymentMethod: string;
  amountTendered?: number;
  changeDue?: number;
  orderNumber?: string;
  onComplete: () => void;
}

export const AppleSuccessModal: React.FC<AppleSuccessModalProps> = ({
  isOpen,
  totalAmount,
  paymentMethod,
  amountTendered,
  changeDue = 0,
  orderNumber,
  onComplete
}) => {
  const [countdown, setCountdown] = useState<number>(2);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(2);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        className="ios-glass-panel"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '36px 28px',
          borderRadius: '28px',
          backgroundColor: 'rgba(28, 28, 30, 0.88)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
          transform: 'scale(1)',
          animation: 'applePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Animated Green Glowing Check Circle (Apple Pay style) */}
        <div
          style={{
            position: 'relative',
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 35px rgba(16, 185, 129, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.4)',
            animation: 'scaleCheck 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <Check size={46} color="#FFFFFF" strokeWidth={3.5} />
          <div
            style={{
              position: 'absolute',
              inset: '-6px',
              borderRadius: '50%',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              animation: 'pulseRing 1.5s infinite ease-out'
            }}
          />
        </div>

        {/* Payment Title & Amount */}
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '1px',
              color: '#10B981',
              textTransform: 'uppercase',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Sparkles size={13} /> Payment Approved
          </div>
          <h2
            style={{
              fontSize: '26px',
              fontWeight: 800,
              margin: '0 0 4px',
              color: '#FFFFFF',
              letterSpacing: '-0.5px'
            }}
          >
            ${totalAmount.toFixed(2)}
          </h2>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 500 }}>
            {paymentMethod === 'CASH' ? 'Cash Tendered' : `${paymentMethod} Payment`}
          </div>
        </div>

        {/* Change breakdown if Cash */}
        {paymentMethod === 'CASH' && (
          <div
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}
          >
            {amountTendered !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ios-text-muted)', fontSize: '12px' }}>
                <span>Cash Tendered:</span>
                <span>${amountTendered.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--ios-text-muted)' }}>Change Due:</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#10B981' }}>
                ${changeDue.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Order Meta Info */}
        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.4 }}>
          {orderNumber && <div>Ref: {orderNumber}</div>}
          <div>Auto-printing 80mm thermal receipt in {countdown}s</div>
        </div>

        {/* Direct Action Button */}
        <button
          onClick={onComplete}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: '9999px',
            backgroundColor: '#FFFFFF',
            color: '#000000',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '4px',
            boxShadow: '0 4px 15px rgba(255, 255, 255, 0.2)',
            transition: 'transform 0.15s ease'
          }}
        >
          <Receipt size={16} /> View Thermal Receipt Now
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes applePop {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes scaleCheck {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.35); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
export default AppleSuccessModal;
