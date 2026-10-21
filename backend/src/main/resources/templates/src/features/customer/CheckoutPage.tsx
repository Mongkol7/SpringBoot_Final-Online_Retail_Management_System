import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IosCardGlass } from '../../components/ui/IosCardGlass';
import { IosButton } from '../../components/ui/IosButton';
import { IosInput } from '../../components/ui/IosInput';
import { IosBadge } from '../../components/ui/IosBadge';
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
  PackageCheck
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
      setCompletedOrderNumber(order.orderNumber);

      setNotification({
        message: `Order #${order.orderNumber} placed! Awaiting Admin Confirmation.`,
        badge: 'PENDING'
      });

      if (onOrderSuccess) {
        onOrderSuccess(order.orderNumber);
      }
      navigate('/shop', {
        state: {
          justPlacedOrder: order
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
      <div style={{ maxWidth: '540px', margin: '40px auto 0 auto' }}>
        <IosCardGlass glow style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              color: '#FFFFFF'
            }}
          >
            <Lock size={30} />
          </div>

          <IosBadge variant="wholesale" style={{ marginBottom: '14px' }}>
            AUTHENTICATION REQUIRED
          </IosBadge>

          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px 0', color: '#FFFFFF' }}>
            Customer Sign In Required
          </h2>

          <p style={{ fontSize: '14px', color: 'var(--ios-text-muted, #A1A1AA)', margin: '0 0 28px 0', lineHeight: 1.6 }}>
            Online orders trigger immediate stock allocation via warehouse <strong>FIFO/FEFO</strong> and require a verified customer session.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <IosButton
              variant="primary"
              onClick={() => navigate('/login?redirect=/checkout')}
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            >
              Sign In to Complete Checkout
            </IosButton>

            <IosButton
              variant="glass"
              onClick={() => navigate('/signup')}
              style={{ width: '100%' }}
            >
              Sign Up as Customer
            </IosButton>

            <IosButton
              variant="glass"
              onClick={handleGoToCart}
              style={{ width: '100%', border: 'none', color: '#A1A1AA' }}
            >
              <ArrowLeft size={14} /> Back to Cart
            </IosButton>
          </div>
        </IosCardGlass>
      </div>
    );
  }

  // If order was just placed, display celebration confirmation
  if (completedOrderNumber) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto 0 auto' }}>
        <IosCardGlass glow style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'rgba(48, 209, 88, 0.12)',
              border: '1px solid rgba(48, 209, 88, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}
          >
            <CheckCircle2 size={40} color="#30D158" />
          </div>

          <IosBadge variant="success" glow style={{ marginBottom: '16px' }}>
            ORDER PLACED & PAID
          </IosBadge>

          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', color: '#FFFFFF' }}>
            Thank You, {recipientName}!
          </h1>

          <p style={{ fontSize: '15px', color: 'var(--ios-text-muted, #A1A1AA)', margin: '0 0 24px 0', lineHeight: 1.6 }}>
            Your order <strong>#{completedOrderNumber}</strong> has been confirmed. Stock allocation has been executed
            via warehouse <strong>FIFO/FEFO</strong> deduction.
          </p>

          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
              borderRadius: 'var(--ios-radius-card, 24px)',
              padding: '20px',
              textAlign: 'left',
              marginBottom: '32px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--ios-text-muted, #A1A1AA)' }}>Order Reference:</span>
              <span style={{ color: '#FFFFFF', fontFamily: 'monospace', fontWeight: 700 }}>{completedOrderNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--ios-text-muted, #A1A1AA)' }}>Channel & Tier:</span>
              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>ONLINE · {effectiveTier}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--ios-text-muted, #A1A1AA)' }}>Payment Method:</span>
              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{paymentMethod}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--ios-text-muted, #A1A1AA)' }}>Shipping Destination:</span>
              <span style={{ color: '#FFFFFF', fontWeight: 600, maxWidth: '280px', textAlign: 'right' }}>
                {shippingAddress}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <IosButton variant="glass" onClick={handleGoToShop}>
              Return to Shop
            </IosButton>
            <IosButton
              variant="primary"
              onClick={() => (onOrderSuccess ? onOrderSuccess(completedOrderNumber) : navigate('/orders'))}
            >
              Track Order Status <ChevronRight size={16} />
            </IosButton>
          </div>
        </IosCardGlass>
      </div>
    );
  }

  // If cart is empty and no completed order, show empty state
  if (items.length === 0) {
    return (
      <IosCardGlass glow style={{ textAlign: 'center', padding: '70px 24px', maxWidth: '600px', margin: '40px auto' }}>
        <PackageCheck size={48} color="#71717A" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: '#FFFFFF' }}>
          No Items to Checkout
        </h2>
        <p style={{ color: 'var(--ios-text-muted, #A1A1AA)', fontSize: '14px', margin: '0 0 24px 0' }}>
          Please add products to your shopping cart before completing checkout.
        </p>
        <IosButton variant="primary" onClick={handleGoToShop}>
          Explore Categories
        </IosButton>
      </IosCardGlass>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Checkout Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={handleGoToCart}
          className="ios-glass-capsule ios-glow-hover"
          style={{
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              Secure Online Checkout
            </h1>
            <IosBadge variant="wholesale">
              <Lock size={12} /> JWT Authenticated
            </IosBadge>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ios-text-muted, #A1A1AA)', margin: '4px 0 0 0' }}>
            Customer: <strong>{user.fullName}</strong> ({user.email}) · Pricing: <strong>{effectiveTier} Tier</strong>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder}>
        <div
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
            <IosCardGlass glow style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#FFFFFF'
                  }}
                >
                  1
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                    Shipping & Delivery Details
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--ios-text-muted, #A1A1AA)' }}>
                    Physical destination for batch delivery
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <IosInput
                  label="Recipient Full Name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  icon={<UserIcon size={16} />}
                  required
                />
                <IosInput
                  label="Contact Phone"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  icon={<Phone size={16} />}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--ios-text-muted, #A1A1AA)',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase'
                  }}
                >
                  Delivery Street Address
                </label>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '14px',
                      color: 'var(--ios-text-subtle, #71717A)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <MapPin size={16} />
                  </div>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 42px',
                      backgroundColor: 'var(--ios-surface-glass-2, rgba(28, 28, 32, 0.60))',
                      backdropFilter: 'var(--ios-blur-subtle, blur(16px))',
                      WebkitBackdropFilter: 'var(--ios-blur-subtle, blur(16px))',
                      border: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
                      borderRadius: 'var(--ios-radius-input, 14px)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit'
                    }}
                    className="ios-glow-hover"
                    required
                  />
                </div>
              </div>

              <IosInput
                label="Delivery Special Instructions (Optional)"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="e.g. Call upon arrival"
              />
            </IosCardGlass>

            {/* Stage 2: Payment Method */}
            <IosCardGlass glow style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#FFFFFF'
                  }}
                >
                  2
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                    Payment Method
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--ios-text-muted, #A1A1AA)' }}>
                    Select your preferred transaction channel
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                {/* Credit / Debit Card */}
                <div
                  onClick={() => setPaymentMethod('CARD')}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--ios-radius-card, 24px)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: paymentMethod === 'CARD'
                      ? '1px solid #FFFFFF'
                      : '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
                    backgroundColor: paymentMethod === 'CARD'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.03)'
                  }}
                  className="ios-glow-hover"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <CreditCard size={20} color={paymentMethod === 'CARD' ? '#FFFFFF' : '#A1A1AA'} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Card Payment</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--ios-text-muted, #A1A1AA)' }}>
                    Visa, Mastercard, AMEX
                  </span>
                </div>

                {/* QR Code / Bakong */}
                <div
                  onClick={() => setPaymentMethod('QR')}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--ios-radius-card, 24px)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: paymentMethod === 'QR' || paymentMethod === 'BANK_TRANSFER'
                      ? '1px solid #FFFFFF'
                      : '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
                    backgroundColor: paymentMethod === 'QR' || paymentMethod === 'BANK_TRANSFER'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.03)'
                  }}
                  className="ios-glow-hover"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <QrCode size={20} color={paymentMethod === 'QR' || paymentMethod === 'BANK_TRANSFER' ? '#FFFFFF' : '#A1A1AA'} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>QR Payment</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--ios-text-muted, #A1A1AA)' }}>
                    Bakong KHQR & Mobile Bank
                  </span>
                </div>

                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('CASH')}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--ios-radius-card, 24px)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: paymentMethod === 'CASH'
                      ? '1px solid #FFFFFF'
                      : '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
                    backgroundColor: paymentMethod === 'CASH'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.03)'
                  }}
                  className="ios-glow-hover"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Banknote size={20} color={paymentMethod === 'CASH' ? '#FFFFFF' : '#A1A1AA'} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Cash on Delivery</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--ios-text-muted, #A1A1AA)' }}>
                    Pay upon physical arrival
                  </span>
                </div>
              </div>
            </IosCardGlass>
          </div>

          {/* Right Column: Stage 3 (Order Review & Slide to Pay) */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <IosCardGlass glow style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#FFFFFF'
                  }}
                >
                  3
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                    Confirm & Authorize
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--ios-text-muted, #A1A1AA)' }}>
                    {itemCount} items in shipment
                  </span>
                </div>
              </div>

              {/* Items Preview */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  marginBottom: '20px',
                  paddingRight: '6px'
                }}
              >
                {items.map((i) => (
                  <div
                    key={i.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--ios-text-subtle, #71717A)', fontFamily: 'monospace' }}>
                        {i.quantity}x
                      </span>
                      <span style={{ color: '#FFFFFF', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {i.product.name}
                      </span>
                      {i.discountType === 'WHOLESALE' && (
                        <IosBadge variant="wholesale" style={{ fontSize: '8px', padding: '1px 6px' }}>
                          Wholesale
                        </IosBadge>
                      )}
                      {i.discountType === 'RETAIL_BULK' && (
                        <IosBadge variant="info" style={{ fontSize: '8px', padding: '1px 6px' }}>
                          Bulk -5%
                        </IosBadge>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#FFFFFF', fontWeight: 600 }}>${i.subtotal.toFixed(2)}</div>
                      {i.totalSavings > 0 && (
                        <div style={{ fontSize: '10px', color: '#30D158' }}>Save ${i.totalSavings.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  height: '1px',
                  backgroundColor: 'var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
                  marginBottom: '16px'
                }}
              />

              {/* Financial Totals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--ios-text-muted, #A1A1AA)' }}>
                  <span>Subtotal</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--ios-text-muted, #A1A1AA)' }}>
                  <span>VAT (7%)</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>${tax.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--ios-text-muted, #A1A1AA)' }}>
                  <span>Inventory Routing</span>
                  <span style={{ color: '#30D158', fontWeight: 600 }}>FIFO/FEFO Central</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Total Due</span>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF' }}>
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {error && (
                <div style={{ fontSize: '12px', color: '#FF453A', marginBottom: '16px' }}>
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
                  color: 'var(--ios-text-subtle, #71717A)',
                  marginBottom: '20px',
                  lineHeight: 1.4
                }}
              >
                <ShieldCheck size={16} />
                <span>
                  Immediate batch deduction executed via Spring Boot transaction.
                </span>
              </div>

              {/* Authorize & Place Order Button */}
              <IosButton
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '15px',
                  position: 'relative'
                }}
              >
                {isSubmitting ? (
                  'Allocating Batches & Submitting...'
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Slide to Confirm · ${total.toFixed(2)}
                  </>
                )}
              </IosButton>
            </IosCardGlass>
          </div>
        </div>
      </form>
    </div>
  );
};
