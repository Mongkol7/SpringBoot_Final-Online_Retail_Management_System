import React, { useState, useEffect } from 'react';
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
  PackageOpen,
  AlertTriangle,
  Building2,
  Lock,
  LogIn
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
    setBatchPreference,
    refreshCartPrices,
    getSubtotal,
    getTax,
    getTotal,
    getItemCount,
    getWholesaleSavings,
    getEffectiveTier,
    isAuthenticated,
    setNotification
  } = useCustomerCartStore();

  const effectiveTier = getEffectiveTier();

  // Automatically synchronize line prices with current wholesale/retail tier & batch preferences
  useEffect(() => {
    refreshCartPrices();
  }, [effectiveTier, isAuthenticated, refreshCartPrices]);
  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();
  const itemCount = getItemCount();
  const wholesaleSavings = getWholesaleSavings();

  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ cartItemId: number; productId: number; name: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showGuestCheckoutAlert, setShowGuestCheckoutAlert] = useState<boolean>(false);

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      setNotification({
        message: 'Store Guest: Sign in required to proceed to checkout. Your cart is saved!',
        badge: 'GUEST CHECKOUT'
      });
      setShowGuestCheckoutAlert(true);
      return;
    }
    handleGoToCheckout();
  };

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
              Pricing applied:{' '}
              <strong style={{ color: isAuthenticated && effectiveTier === 'WHOLESALE' ? '#D97706' : '#111827' }}>
                {isAuthenticated && effectiveTier === 'WHOLESALE'
                  ? '★ Verified Wholesale Partner'
                  : 'Standard Retail Store Pricing'}
              </strong>
              {isAuthenticated && effectiveTier === 'WHOLESALE' && (
                <span style={{ color: '#059669', fontWeight: 700, marginLeft: '6px' }}>
                  (Wholesale B2B rates applied on 10+ units)
                </span>
              )}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
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

      {/* Guest Cart Info Banner */}
      {!isAuthenticated && items.length > 0 && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: '18px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1E40AF' }}>
            <Building2 size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>Shopping as Guest:</strong> Items in your cart are charged at standard retail store prices. Sign in with a verified wholesale account to unlock B2B pricing on orders of 10+ units.
            </span>
          </div>
          <button
            onClick={() => navigate('/login?redirect=/cart')}
            style={{
              padding: '7px 16px',
              borderRadius: '9999px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
            }}
          >
            Sign In to Unlock Wholesale →
          </button>
        </div>
      )}

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

                    {/* Multi-Batch & Clearance Allocation Badge */}
                    {item.batchAllocationSummary && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#B45309',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '2px'
                        }}
                      >
                        <Sparkles size={12} color="#D97706" />
                        <span>{item.batchAllocationSummary}</span>
                      </div>
                    )}

                    {/* In-Cart Batch Switcher (Available for both Wholesale and Retail shoppers) */}
                    {item.canChooseBatch && (
                      <div
                        style={{
                          marginTop: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#F3F4F6',
                          padding: '3px 4px',
                          borderRadius: '9999px',
                          border: '1px solid rgba(0, 0, 0, 0.08)'
                        }}
                      >
                        <button
                          onClick={() => setBatchPreference(item.id, 'FRESH')}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor: item.batchPreference === 'FRESH' ? '#10B981' : 'transparent',
                            color: item.batchPreference === 'FRESH' ? '#FFFFFF' : '#4B5563',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          ✨ Fresh (${(effectiveTier === 'WHOLESALE' ? item.product.wholesalePrice : item.product.retailPrice).toFixed(2)})
                        </button>
                        <button
                          onClick={() => setBatchPreference(item.id, 'CLEARANCE')}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            border: 'none',
                            backgroundColor: item.batchPreference === 'CLEARANCE' ? '#F59E0B' : 'transparent',
                            color: item.batchPreference === 'CLEARANCE' ? '#FFFFFF' : '#4B5563',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          🔥 Clearance 25% OFF (${(effectiveTier === 'WHOLESALE' ? (item.product.wholesaleClearancePrice || item.product.wholesalePrice * 0.75) : (item.product.clearancePrice || item.product.retailPrice * 0.75)).toFixed(2)})
                        </button>
                      </div>
                    )}

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
                          onClick={() => updateQuantity(item.id, item.minQty || 10)}
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
                      onClick={() => {
                        if (item.quantity <= 1) {
                          setDeleteConfirmItem({ cartItemId: item.id, productId: item.productId, name: item.product.name });
                        } else {
                          updateQuantity(item.id, item.quantity - 1);
                        }
                      }}
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
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
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
                    onClick={() => setDeleteConfirmItem({ cartItemId: item.id, productId: item.productId, name: item.product.name })}
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
                    title="Remove item from cart"
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
                onClick={handleProceedToCheckout}
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

      {/* Store Guest Checkout Alert Modal */}
      {showGuestCheckoutAlert && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
          onClick={() => setShowGuestCheckoutAlert(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '28px',
              padding: '36px 30px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
              textAlign: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(250, 62, 84, 0.1)',
                color: '#FA3E54',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px auto'
              }}
            >
              <Lock size={28} />
            </div>

            <div
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(250, 62, 84, 0.08)',
                color: '#FA3E54',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                marginBottom: '10px'
              }}
            >
              STORE GUEST CHECKOUT
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 10px 0', color: '#111827', letterSpacing: '-0.02em' }}>
              Sign In to Proceed to Checkout
            </h3>

            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              You are shopping as a <strong>Store Guest</strong>. To complete your order and reserve warehouse stock, please sign in or register a customer account.
            </p>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: '#F3F4F6',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                fontSize: '12px',
                color: '#374151',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '24px'
              }}
            >
              <ShieldCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
              <span>
                Don't worry! All <strong>{itemCount} item{itemCount > 1 ? 's' : ''}</strong> and batch choices in your cart will remain saved when you sign in.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowGuestCheckoutAlert(false);
                  navigate('/login?redirect=/checkout&reason=guest_checkout');
                }}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: '#FA3E54',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(250, 62, 84, 0.35)'
                }}
              >
                <LogIn size={16} />
                <span>Sign In / Create Account to Pay</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGuestCheckoutAlert(false)}
                style={{
                  width: '100%',
                  padding: '11px 18px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  backgroundColor: 'transparent',
                  color: '#6B7280',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Single Item Confirmation Modal */}
      {deleteConfirmItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
          onClick={() => setDeleteConfirmItem(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '28px',
              padding: '32px 28px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
              textAlign: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <Trash2 size={26} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: '#111827' }}>
              Remove Item from Cart?
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>'{deleteConfirmItem.name}'</strong> from your shopping cart?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  removeFromCart(deleteConfirmItem.cartItemId);
                  setDeleteConfirmItem(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)'
                }}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Entire Cart Confirmation Modal */}
      {showClearConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '28px',
              padding: '32px 28px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
              textAlign: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <AlertTriangle size={26} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: '#111827' }}>
              Clear Entire Cart?
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Are you sure you want to remove all <strong>{itemCount} items</strong> from your cart? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                }}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)'
                }}
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
