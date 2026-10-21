import React, { useState, useEffect } from 'react';
import { Product } from '../../types/schema';
import { useCustomerCartStore } from '../../store/customerCartStore';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  Clock,
  Layers,
  Coffee,
  Cookie,
  Milk,
  Dumbbell,
  Building2
} from 'lucide-react';
import { CATEGORIES_LIST } from './customerApi';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose
}) => {
  const { items, addToCart, getEffectiveTier, setNotification } = useCustomerCartStore();

  const [quantity, setQuantity] = useState<number>(1);
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  // Reset quantity and warnings when product changes
  useEffect(() => {
    setQuantity(1);
    setStockWarning(null);
    setJustAdded(false);
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  // Real-time stock from DB
  const availableStock = product.stockQuantity !== undefined
    ? Number(product.stockQuantity)
    : (product.availableStock !== undefined ? Number(product.availableStock) : 0);

  const existingItem = items.find((i) => i.productId === product.id);
  const currentInCart = existingItem ? existingItem.quantity : 0;
  const remainingStock = Math.max(0, availableStock - currentInCart);

  const tier = getEffectiveTier();
  const categoryName = CATEGORIES_LIST.find((c) => c.id === product.categoryId)?.name || 'General Bites';

  // Unit price calculation based on tier and wholesale minimum quantity
  const isWholesaleQualified =
    tier === 'WHOLESALE' && quantity >= (product.wholesaleMinQty || 10);
  const unitPrice = isWholesaleQualified ? product.wholesalePrice : product.retailPrice;
  const lineSubtotal = unitPrice * quantity;

  // Step quantity with strict real-time stock boundary checks
  const handleIncrease = () => {
    if (quantity + currentInCart >= availableStock) {
      setStockWarning(`⚠️ Stock Limit: Only ${availableStock} units available in warehouse. You currently have ${currentInCart} in your cart.`);
      return;
    }
    setStockWarning(null);
    setQuantity((prev) => prev + 1);
  };

  const handleDecrease = () => {
    setStockWarning(null);
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleQuantityInput = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      setQuantity(1);
      setStockWarning(null);
      return;
    }

    if (num + currentInCart > availableStock) {
      setQuantity(Math.max(1, remainingStock));
      setStockWarning(`⚠️ Real-time Stock Limit Reached: Cannot select ${num}. Maximum available to add is ${remainingStock}.`);
    } else {
      setQuantity(num);
      setStockWarning(null);
    }
  };

  const handleAddToCart = () => {
    if (availableStock <= 0) {
      setStockWarning('⚠️ This product is currently out of stock.');
      return;
    }

    if (quantity + currentInCart > availableStock) {
      setStockWarning(`⚠️ Cannot add ${quantity} units. Stock limit is ${availableStock} (You already have ${currentInCart} in cart).`);
      return;
    }

    addToCart(product, quantity);
    setJustAdded(true);
    setNotification({
      message: `✓ Added ${quantity}x '${product.name}' to your cart!`,
      badge: 'ADDED'
    });

    setTimeout(() => {
      onClose();
    }, 900);
  };

  const renderCategoryIcon = (categoryId: number) => {
    switch (categoryId) {
      case 1:
        return <Coffee size={28} />;
      case 2:
        return <Cookie size={28} />;
      case 3:
        return <Milk size={28} />;
      case 4:
        return <Dumbbell size={28} />;
      default:
        return <Layers size={28} />;
    }
  };

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '32px',
          maxWidth: '720px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.06)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#111827',
            zIndex: 10,
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.06)')}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {/* Product Image Stage */}
          <div
            style={{
              backgroundColor: '#F5F5F7',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: '1px solid rgba(0, 0, 0, 0.06)',
              position: 'relative'
            }}
          >
            {/* Badges on Image */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFFFFF',
                  color: '#111827',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)'
                }}
              >
                {categoryName}
              </span>

              {product.isPerishable ? (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor: '#FEF3C7',
                    color: '#B45309',
                    border: '1px solid #FCD34D',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Clock size={11} /> Perishable (FEFO)
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    backgroundColor: '#E5E7EB',
                    color: '#374151'
                  }}
                >
                  FIFO Batch
                </span>
              )}
            </div>

            {/* Main Image */}
            <div
              style={{
                width: '100%',
                maxWidth: '240px',
                aspectRatio: '1 / 1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.modal-fallback') as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}

              <div
                className="modal-fallback"
                style={{
                  display: product.imageUrl ? 'none' : 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#6B7280'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {renderCategoryIcon(product.categoryId)}
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{product.sku}</span>
              </div>
            </div>

            <div style={{ marginTop: '16px', fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>
              SKU: {product.sku} {(product as any).barcode ? `· Barcode: ${(product as any).barcode}` : ''}
            </div>
          </div>

          {/* Details & Live Action Panel */}
          <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* Live Warehouse Stock Badge */}
              <div style={{ marginBottom: '12px' }}>
                {availableStock > 10 ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      color: '#059669',
                      fontSize: '11px',
                      fontWeight: 800
                    }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    In Stock: {availableStock} units available
                  </span>
                ) : availableStock > 0 ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      backgroundColor: '#FEF3C7',
                      border: '1px solid #FCD34D',
                      color: '#B45309',
                      fontSize: '11px',
                      fontWeight: 800
                    }}
                  >
                    <AlertTriangle size={12} />
                    Low Stock: Only {availableStock} units remaining!
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      backgroundColor: '#FEE2E2',
                      border: '1px solid #FCA5A5',
                      color: '#DC2626',
                      fontSize: '11px',
                      fontWeight: 800
                    }}
                  >
                    ✕ Out of Stock (0 units)
                  </span>
                )}
              </div>

              {/* Product Title */}
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: '#111827',
                  margin: '0 0 10px 0',
                  lineHeight: 1.25,
                  letterSpacing: '-0.02em'
                }}
              >
                {product.name}
              </h2>

              {/* Description */}
              <p
                style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  lineHeight: 1.6,
                  margin: '0 0 20px 0'
                }}
              >
                {product.description || 'Artisanal single-batch delicacy prepared with premium organic ingredients.'}
              </p>

              {/* Dual Pricing Grid */}
              <div
                style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: '20px',
                  padding: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>Retail Price:</span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#111827' }}>
                    ${product.retailPrice.toFixed(2)}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    paddingTop: '8px',
                    borderTop: '1px dashed rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 size={13} color="#D97706" />
                    Wholesale B2B Rate:
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#B45309' }}>
                    ${product.wholesalePrice.toFixed(2)}{' '}
                    <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600 }}>({product.wholesaleMinQty || 10}+ units)</span>
                  </span>
                </div>
              </div>

              {/* Real-Time Stock Warning Alert */}
              {stockWarning && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    color: '#DC2626',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <span>{stockWarning}</span>
                </div>
              )}
            </div>

            {/* Bottom Actions: Stepper, Total, and Add to Cart */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  marginBottom: '16px'
                }}
              >
                {/* Real-Time Quantity Stepper */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '9999px',
                    padding: '4px',
                    border: '1px solid rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <button
                    onClick={handleDecrease}
                    disabled={quantity <= 1 || availableStock <= 0}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: quantity <= 1 || availableStock <= 0 ? 'not-allowed' : 'pointer',
                      color: '#111827',
                      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
                      opacity: quantity <= 1 || availableStock <= 0 ? 0.5 : 1
                    }}
                  >
                    <Minus size={14} />
                  </button>

                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityInput(e.target.value)}
                    disabled={availableStock <= 0}
                    style={{
                      width: '44px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: 800,
                      border: 'none',
                      background: 'transparent',
                      color: '#111827',
                      outline: 'none'
                    }}
                  />

                  <button
                    onClick={handleIncrease}
                    disabled={availableStock <= 0 || quantity + currentInCart >= availableStock}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: availableStock <= 0 || quantity + currentInCart >= availableStock ? 'not-allowed' : 'pointer',
                      color: '#111827',
                      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
                      opacity: availableStock <= 0 || quantity + currentInCart >= availableStock ? 0.5 : 1
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Subtotal Calculation */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>Total for {quantity} item{quantity > 1 ? 's' : ''}:</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#111827' }}>
                    ${lineSubtotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={availableStock <= 0 || justAdded}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: justAdded ? '#10B981' : availableStock <= 0 ? '#9CA3AF' : '#FA3E54',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: availableStock <= 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: justAdded
                    ? '0 4px 14px rgba(16, 185, 129, 0.4)'
                    : availableStock <= 0
                    ? 'none'
                    : '0 8px 24px rgba(250, 62, 84, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                {justAdded ? (
                  <>
                    <Check size={16} /> Added to Cart!
                  </>
                ) : availableStock <= 0 ? (
                  'Out of Stock'
                ) : (
                  <>
                    <ShoppingBag size={16} /> Add {quantity} to Cart · ${lineSubtotal.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
