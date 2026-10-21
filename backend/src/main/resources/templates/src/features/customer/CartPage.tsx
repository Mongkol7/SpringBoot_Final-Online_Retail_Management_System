import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IosCardGlass } from '../../components/ui/IosCardGlass';
import { IosButton } from '../../components/ui/IosButton';
import { IosBadge } from '../../components/ui/IosBadge';
import { useCustomerCartStore } from '../../store/customerCartStore';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  PackageOpen,
  Clock
} from 'lucide-react';

interface CartPageProps {
  onNavigateToShop?: () => void;
  onNavigateToCheckout?: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  onNavigateToShop,
  onNavigateToCheckout
}) => {
  const navigate = useNavigate();
  const handleGoToShop = onNavigateToShop || (() => navigate('/shop'));
  const handleGoToCheckout = onNavigateToCheckout || (() => navigate('/checkout'));
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    getSubtotal,
    getTax,
    getTotal,
    getItemCount,
    getWholesaleSavings,
    getEffectiveTier
  } = useCustomerCartStore();

  const effectiveTier = getEffectiveTier();
  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();
  const itemCount = getItemCount();
  const wholesaleSavings = getWholesaleSavings();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {onNavigateToShop && (
            <button
              onClick={onNavigateToShop}
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
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Shopping Cart
              </h1>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF'
                }}
              >
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ios-text-muted, #A1A1AA)', margin: '4px 0 0 0' }}>
              Pricing applied: <strong>{effectiveTier} Tier</strong>
              {effectiveTier === 'WHOLESALE' && ' (Wholesale discounts reflected below)'}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <IosButton
            variant="danger"
            onClick={clearCart}
            style={{ fontSize: '12px', padding: '8px 16px' }}
          >
            <Trash2 size={14} /> Clear Cart
          </IosButton>
        )}
      </div>

      {/* Main Content Layout */}
      {items.length === 0 ? (
        <IosCardGlass glow style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}
          >
            <PackageOpen size={32} color="#71717A" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: '#FFFFFF' }}>
            Your Cart is Empty
          </h2>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <IosButton variant="primary" onClick={handleGoToShop}>
              <ShoppingBag size={16} /> Explore Categories
            </IosButton>
            <IosButton variant="glass" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
              Proceed to Checkout <ArrowRight size={16} />
            </IosButton>
          </div>
        </IosCardGlass>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 380px',
            gap: '24px',
            alignItems: 'start'
          }}
        >
          {/* Cart Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item) => (
              <IosCardGlass
                key={item.id}
                glow
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  gap: '16px'
                }}
              >
                {/* Product Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '240px', flex: '1 1 300px' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      flexShrink: 0
                    }}
                  >
                    <ShoppingBag size={24} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--ios-text-subtle, #71717A)' }}>
                        {item.product.sku}
                      </span>
                      {item.product.isPerishable && (
                        <IosBadge variant="warning" style={{ fontSize: '9px', padding: '1px 6px' }}>
                          <Clock size={9} /> FEFO
                        </IosBadge>
                      )}

                      {/* Dynamic Tier Badges */}
                      {item.discountType === 'WHOLESALE' && (
                        <IosBadge variant="wholesale" glow style={{ fontSize: '9px', padding: '1px 8px' }}>
                          Wholesale Tier
                        </IosBadge>
                      )}
                      {item.discountType === 'RETAIL_BULK' && (
                        <IosBadge variant="info" style={{ fontSize: '9px', padding: '1px 8px' }}>
                          Bulk Tier (-5%)
                        </IosBadge>
                      )}
                      {effectiveTier === 'WHOLESALE' && item.discountType === 'NONE' && (
                        <IosBadge variant="warning" style={{ fontSize: '9px', padding: '1px 8px' }}>
                          Retained at Retail Price (Needs {item.minQty || 10}+ for Wholesale)
                        </IosBadge>
                      )}
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                      {item.product.name}
                    </h4>

                    {/* Price with crossed-out original if discounted */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                        ${item.appliedPrice.toFixed(2)} each
                      </span>

                      {item.originalPrice > item.appliedPrice && (
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--ios-text-subtle, #71717A)',
                            textDecoration: 'line-through'
                          }}
                        >
                          ${item.originalPrice.toFixed(2)}
                        </span>
                      )}

                      {item.unitSavings > 0 && (
                        <span style={{ fontSize: '11px', color: '#30D158', fontWeight: 600 }}>
                          Save ${item.unitSavings.toFixed(2)}/ea
                        </span>
                      )}
                    </div>

                    {/* Quantity Threshold Unlock Helper */}
                    {effectiveTier === 'WHOLESALE' && item.neededForWholesale > 0 && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#FF9F0A',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '2px'
                        }}
                      >
                        <span>Add {item.neededForWholesale} more to unlock Wholesale Price (${item.product.wholesalePrice.toFixed(2)})</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.minQty || 10)}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(255, 159, 10, 0.15)',
                            border: '1px solid rgba(255, 159, 10, 0.3)',
                            color: '#FF9F0A',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          className="ios-glow-hover"
                        >
                          Set to {item.minQty || 10}
                        </button>
                      </div>
                    )}

                    {effectiveTier === 'RETAIL' && item.quantity < 10 && (
                      <div style={{ fontSize: '11px', color: 'var(--ios-text-subtle, #71717A)', marginTop: '2px' }}>
                        Buy {10 - item.quantity} more for 5% bulk retail discount
                      </div>
                    )}
                  </div>
                </div>

                {/* Stepper Controls & Line Subtotal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {/* Quantity Stepper */}
                  <div
                    className="ios-glass-capsule"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '4px 8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '50%'
                      }}
                      className="ios-glow-hover"
                    >
                      <Minus size={14} />
                    </button>

                    <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '50%'
                      }}
                      className="ios-glow-hover"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Line Total & Line Savings */}
                  <div style={{ textAlign: 'right', minWidth: '80px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                      ${item.subtotal.toFixed(2)}
                    </div>
                    {item.totalSavings > 0 && (
                      <div style={{ fontSize: '11px', color: '#30D158', fontWeight: 600 }}>
                        -${item.totalSavings.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--ios-text-subtle, #71717A)',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '50%',
                      transition: 'color 0.2s ease'
                    }}
                    className="ios-glow-hover"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </IosCardGlass>
            ))}

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '8px' }}>
              <IosButton variant="glass" onClick={handleGoToShop}>
                <ArrowLeft size={14} /> Back to Categories
              </IosButton>
            </div>
          </div>

          {/* Sticky Summary Card */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <IosCardGlass glow style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                  Order Summary
                </h3>
                <IosBadge variant={effectiveTier === 'WHOLESALE' ? 'wholesale' : 'default'}>
                  {effectiveTier}
                </IosBadge>
              </div>

              {/* Savings Callout Banner */}
              {wholesaleSavings > 0 && (
                <div
                  style={{
                    backgroundColor: 'rgba(48, 209, 88, 0.1)',
                    border: '1px solid rgba(48, 209, 88, 0.3)',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <Sparkles size={18} color="#30D158" />
                  <div style={{ fontSize: '12px', color: '#30D158', fontWeight: 600 }}>
                    {effectiveTier === 'WHOLESALE' ? 'Wholesale Volume Pricing' : 'Bulk Quantity Discount'} Applied: Saved <strong>${wholesaleSavings.toFixed(2)}</strong>!
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--ios-text-muted, #A1A1AA)' }}>
                  <span>Subtotal ({itemCount} items)</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--ios-text-muted, #A1A1AA)' }}>
                  <span>Estimated Tax (7% VAT)</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>${tax.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--ios-text-muted, #A1A1AA)' }}>
                  <span>Shipping & Fulfillment</span>
                  <span style={{ color: '#30D158', fontWeight: 600 }}>FREE (Express)</span>
                </div>

                <div
                  style={{
                    height: '1px',
                    backgroundColor: 'var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
                    margin: '8px 0'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>Total Amount</span>
                  <span style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF' }}>
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Inventory Dispatch Guarantee Note */}
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
                  Inventory allocation via FIFO/FEFO occurs instantly upon checkout.
                </span>
              </div>

              {/* Checkout Button */}
              <IosButton
                variant="primary"
                onClick={handleGoToCheckout}
                disabled={items.length === 0}
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                Proceed to Checkout <ArrowRight size={16} />
              </IosButton>
            </IosCardGlass>
          </div>
        </div>
      )}
    </div>
  );
};
