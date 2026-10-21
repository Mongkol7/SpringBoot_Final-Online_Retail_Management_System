import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  PackageOpen
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
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 900, margin: 0, color: '#111827', letterSpacing: '-0.02em' }}>
                Shopping Cart
              </h1>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(0, 0, 0, 0.06)',
                  color: '#111827'
                }}
              >
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>
              Pricing applied: <strong>{effectiveTier} Tier</strong>
              {effectiveTier === 'WHOLESALE' && ' (Wholesale discounts reflected below)'}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={clearCart}
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '8px 18px',
              borderRadius: '9999px',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={14} /> Clear Cart
          </button>
        )}
      </div>

      {/* Main Content Layout */}
      {items.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 24px',
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#F5F5F7',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}
          >
            <PackageOpen size={32} color="#9CA3AF" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0', color: '#111827' }}>
            Your Cart is Empty
          </h2>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 24px 0' }}>
            Looks like you haven't added any artisanal snacks or cold drinks yet.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleGoToShop}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                borderRadius: '9999px',
                backgroundColor: '#FA3E54',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(250, 62, 84, 0.35)'
              }}
            >
              <ShoppingBag size={16} /> Explore Categories
            </button>
          </div>
        </div>
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
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  gap: '16px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '24px',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 10px 24px -6px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Product Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '240px', flex: '1 1 300px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      backgroundColor: '#F3F4F6',
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#111827',
                      flexShrink: 0,
                      overflow: 'hidden',
                      padding: 0
                    }}
                  >
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      />
                    ) : (
                      <ShoppingBag size={24} />
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#9CA3AF' }}>
                        {item.product.sku}
                      </span>
                      {item.product.isPerishable && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 8px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#B45309',
                            border: '1px solid rgba(245, 158, 11, 0.3)'
                          }}
                        >
                          FEFO
                        </span>
                      )}

                      {/* Dynamic Tier Badges */}
                      {item.discountType === 'WHOLESALE' && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(251, 192, 45, 0.2)',
                            color: '#B45309',
                            border: '1px solid rgba(251, 192, 45, 0.4)'
                          }}
                        >
                          Wholesale Tier
                        </span>
                      )}
                      {item.discountType === 'RETAIL_BULK' && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            color: '#2563EB',
                            border: '1px solid rgba(37, 99, 235, 0.3)'
                          }}
                        >
                          Bulk Tier (-5%)
                        </span>
                      )}
                      {effectiveTier === 'WHOLESALE' && item.discountType === 'NONE' && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 8px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#B45309'
                          }}
                        >
                          Needs {item.minQty || 10}+ for Wholesale
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#111827' }}>
                      {item.product.name}
                    </h4>

                    {/* Price with crossed-out original if discounted */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>
                        ${item.appliedPrice.toFixed(2)} each
                      </span>

                      {item.originalPrice > item.appliedPrice && (
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#9CA3AF',
                            textDecoration: 'line-through'
                          }}
                        >
                          ${item.originalPrice.toFixed(2)}
                        </span>
                      )}

                      {item.unitSavings > 0 && (
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                          Save ${item.unitSavings.toFixed(2)}/ea
                        </span>
                      )}
                    </div>

                    {/* Quantity Threshold Unlock Helper */}
                    {effectiveTier === 'WHOLESALE' && item.neededForWholesale > 0 && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#B45309',
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
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            color: '#B45309',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Set to {item.minQty || 10}
                        </button>
                      </div>
                    )}

                    {effectiveTier === 'RETAIL' && item.quantity < 10 && (
                      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                        Buy {10 - item.quantity} more for 5% bulk retail discount
                      </div>
                    )}
                  </div>
                </div>

                {/* Stepper Controls & Line Subtotal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {/* Quantity Stepper */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '4px 10px',
                      backgroundColor: '#F5F5F7',
                      borderRadius: '9999px',
                      border: '1px solid rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#111827',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '50%'
                      }}
                    >
                      <Minus size={14} />
                    </button>

                    <span style={{ fontSize: '14px', fontWeight: 800, minWidth: '24px', textAlign: 'center', color: '#111827' }}>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#111827',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '50%'
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Line Total & Line Savings */}
                  <div style={{ textAlign: 'right', minWidth: '80px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#111827' }}>
                      ${item.subtotal.toFixed(2)}
                    </div>
                    {item.totalSavings > 0 && (
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
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
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '50%',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '8px' }}>
              <button
                onClick={handleGoToShop}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFFFFF',
                  color: '#111827',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={14} /> Back to Categories
              </button>
            </div>
          </div>

          {/* Sticky Summary Card */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '28px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.06)',
                padding: '28px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#111827' }}>
                  Order Summary
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor: effectiveTier === 'WHOLESALE' ? 'rgba(251, 192, 45, 0.2)' : 'rgba(0, 0, 0, 0.06)',
                    color: effectiveTier === 'WHOLESALE' ? '#B45309' : '#374151'
                  }}
                >
                  {effectiveTier}
                </span>
              </div>

              {/* Savings Callout Banner */}
              {wholesaleSavings > 0 && (
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <Sparkles size={18} color="#059669" />
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>
                    {effectiveTier === 'WHOLESALE' ? 'Wholesale Volume Pricing' : 'Bulk Quantity Discount'} Applied: Saved <strong>${wholesaleSavings.toFixed(2)}</strong>!
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6B7280' }}>
                  <span>Subtotal ({itemCount} items)</span>
                  <span style={{ color: '#111827', fontWeight: 700 }}>${subtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6B7280' }}>
                  <span>Estimated Tax (7% VAT)</span>
                  <span style={{ color: '#111827', fontWeight: 700 }}>${tax.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6B7280' }}>
                  <span>Shipping & Fulfillment</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>FREE (Express)</span>
                </div>

                <div
                  style={{
                    height: '1px',
                    backgroundColor: 'rgba(0, 0, 0, 0.06)',
                    margin: '8px 0'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>Total Amount</span>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: '#111827' }}>
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
                  color: '#6B7280',
                  marginBottom: '20px',
                  lineHeight: 1.4
                }}
              >
                <ShieldCheck size={16} color="#059669" />
                <span>
                  Inventory allocation via FIFO/FEFO occurs instantly upon checkout.
                </span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleGoToCheckout}
                disabled={items.length === 0}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '15px',
                  fontWeight: 800,
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: '#FA3E54',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(250, 62, 84, 0.4)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
