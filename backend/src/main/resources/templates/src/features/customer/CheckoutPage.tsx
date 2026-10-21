import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerCartStore } from '../../store/customerCartStore';
import { PaymentMethod } from '../../types/schema';
import {
  CreditCard,
  QrCode,
  Banknote,
  MapPin,
  User as UserIcon,
  Phone,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Lock,
  ChevronRight,
  PackageCheck,
  ShoppingBag,
  Layers
} from 'lucide-react';

interface CheckoutPageProps {
  onNavigateToCart?: () => void;
  onNavigateToShop?: () => void;
  onOrderSuccess?: (orderNumber: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onNavigateToCart,
  onNavigateToShop,
  onOrderSuccess
}) => {
  const navigate = useNavigate();
  const handleGoToCart = onNavigateToCart || (() => navigate('/cart'));
  const handleGoToShop = onNavigateToShop || (() => navigate('/shop'));

  const {
    user,
    isAuthenticated,
    items,
    checkout,
    getSubtotal,
    getTax,
    getTotal,
    getItemCount,
    getEffectiveTier,
    setNotification
  } = useCustomerCartStore();

  const safeToFixed = (val: any, fallback = '0.00'): string => {
    const num = Number(val);
    return isNaN(num) ? fallback : num.toFixed(2);
  };

  const [shippingAddress, setShippingAddress] = useState(
    user.addresses?.[0] || 'No. 42, St. 271, Sangkat Boeng Tumpun, Phnom Penh, Cambodia'
  );
  const [recipientName, setRecipientName] = useState(user.fullName || 'Customer');
  const [recipientPhone, setRecipientPhone] = useState(user.phone || '+855 12 849 201');
  const [deliveryNotes, setDeliveryNotes] = useState('Please leave with building reception if unavailable.');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | null>(null);

  // Route guard: Redirect to /login if unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const effectiveTier = getEffectiveTier();
  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();
  const itemCount = getItemCount();

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      setError('Please provide a valid shipping address.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const order = await checkout(shippingAddress, paymentMethod, recipientName, recipientPhone);
      const assignedOrderNumber = order?.orderNumber || ((order as any)?.id ? `ORD-${(order as any).id}` : `ORD-${Date.now()}`);
      setCompletedOrderNumber(assignedOrderNumber);

      setNotification({
        message: `Order #${assignedOrderNumber} placed! Awaiting Admin Confirmation.`,
        badge: 'PENDING'
      });

      if (onOrderSuccess) {
        onOrderSuccess(assignedOrderNumber);
      }
      navigate('/shop', {
        state: {
          justPlacedOrder: {
            ...order,
            orderNumber: assignedOrderNumber
          }
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If not authenticated, require customer sign in
  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '480px', margin: '40px auto 0 auto' }}>
        <div
          style={{
            textAlign: 'center',
            padding: '48px 36px',
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(250, 62, 84, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              color: '#FA3E54'
            }}
          >
            <Lock size={28} />
          </div>

          <div
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(250, 62, 84, 0.08)',
              color: '#FA3E54',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              marginBottom: '16px'
            }}
          >
            AUTHENTICATION REQUIRED
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 10px 0', color: '#111827', letterSpacing: '-0.02em' }}>
            Customer Sign In Required
          </h2>

          <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 28px 0', lineHeight: 1.6 }}>
            Online orders trigger immediate stock allocation via warehouse <strong>FIFO/FEFO</strong> and require a verified customer session.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => navigate('/login?redirect=/checkout')}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '9999px',
                backgroundColor: '#FA3E54',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(250, 62, 84, 0.35)'
              }}
            >
              Sign In to Complete Checkout
            </button>

            <button
              onClick={() => navigate('/signup')}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '9999px',
                backgroundColor: '#F5F5F7',
                color: '#111827',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Sign Up as Customer
            </button>

            <button
              onClick={handleGoToCart}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B7280',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              ← Back to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If order was just placed, display celebration confirmation
  if (completedOrderNumber) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto 0 auto' }}>
        <div
          style={{
            textAlign: 'center',
            padding: '48px 36px',
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)'
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}
          >
            <CheckCircle2 size={40} color="#059669" />
          </div>

          <div
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '9999px',
              backgroundColor: '#ECFDF5',
              color: '#059669',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              marginBottom: '16px'
            }}
          >
            ORDER PLACED & PAID
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 8px 0', color: '#111827', letterSpacing: '-0.02em' }}>
            Thank You, {recipientName}!
          </h1>

          <p style={{ fontSize: '15px', color: '#6B7280', margin: '0 0 24px 0', lineHeight: 1.6 }}>
            Your order <strong>#{completedOrderNumber}</strong> has been submitted. Stock allocation has been executed
            via central warehouse <strong>FIFO/FEFO</strong> deduction.
          </p>

          <div
            style={{
              backgroundColor: '#F5F5F7',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              borderRadius: '20px',
              padding: '22px',
              textAlign: 'left',
              marginBottom: '32px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
              <span style={{ color: '#6B7280' }}>Order Reference:</span>
              <span style={{ color: '#111827', fontFamily: 'monospace', fontWeight: 800 }}>{completedOrderNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
              <span style={{ color: '#6B7280' }}>Channel & Tier:</span>
              <span style={{ color: '#111827', fontWeight: 700 }}>ONLINE · {effectiveTier}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
              <span style={{ color: '#6B7280' }}>Payment Method:</span>
              <span style={{ color: '#111827', fontWeight: 700 }}>{paymentMethod}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#6B7280' }}>Shipping Destination:</span>
              <span style={{ color: '#111827', fontWeight: 700, maxWidth: '280px', textAlign: 'right' }}>
                {shippingAddress}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleGoToShop}
              style={{
                padding: '14px 28px',
                borderRadius: '9999px',
                backgroundColor: '#F5F5F7',
                color: '#111827',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Return to Shop
            </button>
            <button
              onClick={() => (onOrderSuccess ? onOrderSuccess(completedOrderNumber) : navigate('/orders'))}
              style={{
                padding: '14px 28px',
                borderRadius: '9999px',
                backgroundColor: '#FA3E54',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px rgba(250, 62, 84, 0.35)'
              }}
            >
              Track Order Status <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty and no completed order, show empty state
  if (items.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '70px 24px',
          maxWidth: '560px',
          margin: '40px auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '28px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.05)'
        }}
      >
        <PackageCheck size={48} color="#9CA3AF" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 8px 0', color: '#111827' }}>
          No Items to Checkout
        </h2>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px 0' }}>
          Please add snacks or cold drinks to your shopping cart before completing checkout.
        </p>
        <button
          onClick={handleGoToShop}
          style={{
            padding: '14px 32px',
            borderRadius: '9999px',
            backgroundColor: '#FA3E54',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(250, 62, 84, 0.35)'
          }}
        >
          <ShoppingBag size={16} /> Explore Categories
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Checkout Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={handleGoToCart}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            color: '#111827',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 900, margin: 0, color: '#111827', letterSpacing: '-0.02em' }}>
              Secure Online Checkout
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(250, 62, 84, 0.08)',
                color: '#FA3E54',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Lock size={12} /> Verified Session
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>
            Customer: <strong>{user.fullName}</strong> ({user.email}) · Pricing: <strong>{effectiveTier} Tier</strong>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .checkout-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <form onSubmit={handleSubmitOrder}>
        <div
          className="checkout-grid-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 380px',
            gap: '24px',
            alignItems: 'start'
          }}
        >
          {/* Left Column: Stage 1 (Address) + Stage 2 (Payment) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Stage 1: Shipping Details */}
            <div
              style={{
                padding: '28px',
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 10px 24px -6px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(250, 62, 84, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    color: '#FA3E54'
                  }}
                >
                  1
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#111827' }}>
                    Shipping & Delivery Details
                  </h3>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>
                    Physical destination for batch delivery
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                    Recipient Full Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        borderRadius: '12px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        fontSize: '14px',
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                    Contact Phone *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        borderRadius: '12px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        fontSize: '14px',
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                  Delivery Street Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={2}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 40px',
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      fontSize: '14px',
                      color: '#111827',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                  Delivery Special Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Call upon arrival"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    fontSize: '14px',
                    color: '#111827',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Stage 2: Payment Method */}
            <div
              style={{
                padding: '28px',
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 10px 24px -6px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(250, 62, 84, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    color: '#FA3E54'
                  }}
                >
                  2
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#111827' }}>
                    Payment Method
                  </h3>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>
                    Select your preferred transaction channel
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                {/* Credit / Debit Card */}
                <div
                  onClick={() => setPaymentMethod('CARD')}
                  style={{
                    padding: '18px',
                    borderRadius: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: paymentMethod === 'CARD'
                      ? '2px solid #FA3E54'
                      : '1px solid rgba(0, 0, 0, 0.08)',
                    backgroundColor: paymentMethod === 'CARD'
                      ? 'rgba(250, 62, 84, 0.04)'
                      : '#FFFFFF'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <CreditCard size={20} color={paymentMethod === 'CARD' ? '#FA3E54' : '#6B7280'} />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>Card Payment</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>
                    Visa, Mastercard, AMEX
                  </span>
                </div>

                {/* QR Code / Bakong */}
                <div
                  onClick={() => setPaymentMethod('QR')}
                  style={{
                    padding: '18px',
                    borderRadius: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: paymentMethod === 'QR' || paymentMethod === 'BANK_TRANSFER'
                      ? '2px solid #FA3E54'
                      : '1px solid rgba(0, 0, 0, 0.08)',
                    backgroundColor: paymentMethod === 'QR' || paymentMethod === 'BANK_TRANSFER'
                      ? 'rgba(250, 62, 84, 0.04)'
                      : '#FFFFFF'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <QrCode size={20} color={paymentMethod === 'QR' || paymentMethod === 'BANK_TRANSFER' ? '#FA3E54' : '#6B7280'} />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>QR Payment</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>
                    Bakong KHQR & Mobile Bank
                  </span>
                </div>

                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('CASH')}
                  style={{
                    padding: '18px',
                    borderRadius: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: paymentMethod === 'CASH'
                      ? '2px solid #FA3E54'
                      : '1px solid rgba(0, 0, 0, 0.08)',
                    backgroundColor: paymentMethod === 'CASH'
                      ? 'rgba(250, 62, 84, 0.04)'
                      : '#FFFFFF'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <Banknote size={20} color={paymentMethod === 'CASH' ? '#FA3E54' : '#6B7280'} />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>Cash on Delivery</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>
                    Pay upon physical arrival
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Stage 3 (Order Review & Slide to Pay) */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div
              style={{
                padding: '28px',
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 10px 24px -6px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(250, 62, 84, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    color: '#FA3E54'
                  }}
                >
                  3
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#111827' }}>
                    Confirm & Authorize
                  </h3>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>
                    {itemCount} {itemCount === 1 ? 'item' : 'items'} in shipment
                  </span>
                </div>
              </div>

              {/* Items Preview */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  maxHeight: '190px',
                  overflowY: 'auto',
                  marginBottom: '20px',
                  paddingRight: '4px'
                }}
              >
                {items.map((i) => (
                  <div
                    key={i.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          backgroundColor: '#F5F5F7',
                          border: '1px solid rgba(0, 0, 0, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                          padding: 0
                        }}
                      >
                        {i.product.imageUrl ? (
                          <img
                            src={i.product.imageUrl}
                            alt={i.product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                          />
                        ) : (
                          <ShoppingBag size={18} color="#9CA3AF" />
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ color: '#111827', fontWeight: 700, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {i.product.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>
                          {i.quantity}x @ ${safeToFixed(i.appliedPrice ?? (i as any).unitPrice ?? 0)}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                      <div style={{ color: '#111827', fontWeight: 800 }}>${safeToFixed(i.subtotal)}</div>
                      {((i.totalSavings as any) || 0) > 0 && (
                        <div style={{ fontSize: '10px', color: '#059669', fontWeight: 700 }}>Save ${safeToFixed(i.totalSavings)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  height: '1px',
                  backgroundColor: 'rgba(0, 0, 0, 0.06)',
                  marginBottom: '16px'
                }}
              />

              {/* Financial Totals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280' }}>
                  <span>Subtotal</span>
                  <span style={{ color: '#111827', fontWeight: 700 }}>${safeToFixed(subtotal)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280' }}>
                  <span>VAT (7%)</span>
                  <span style={{ color: '#111827', fontWeight: 700 }}>${safeToFixed(tax)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280' }}>
                  <span>Inventory Routing</span>
                  <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Layers size={13} /> FIFO/FEFO Central
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginTop: '8px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Total Due</span>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: '#111827' }}>
                    ${safeToFixed(total)}
                  </span>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#DC2626',
                    backgroundColor: '#FEE2E2',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #FCA5A5',
                    marginBottom: '16px'
                  }}
                >
                  {error}
                </div>
              )}

              {/* Inventory Lock Shield Notice */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11px',
                  color: '#6B7280',
                  marginBottom: '20px',
                  lineHeight: 1.4
                }}
              >
                <ShieldCheck size={16} color="#059669" />
                <span>
                  Immediate batch deduction executed via Spring Boot transaction.
                </span>
              </div>

              {/* Authorize & Place Order Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '9999px',
                  backgroundColor: '#FA3E54',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(250, 62, 84, 0.35)',
                  transition: 'all 0.2s ease',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? (
                  'Allocating Batches & Submitting...'
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Confirm & Pay · ${safeToFixed(total)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
