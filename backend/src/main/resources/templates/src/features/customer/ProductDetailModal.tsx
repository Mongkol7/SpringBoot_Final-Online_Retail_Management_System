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
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { CATEGORIES_LIST } from './customerApi';
import { calculateItemPrice } from '../../utils/pricingCalculator';

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
  const { items, addToCart, getEffectiveTier, getDisplayTier, setNotification } = useCustomerCartStore();
  const displayTier = getDisplayTier ? getDisplayTier() : (getEffectiveTier() === 'WHOLESALE' ? 'WHOLESALE' : 'RETAIL');

  const [quantity, setQuantity] = useState<number>(1);
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<boolean>(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  // Reset quantity and warnings when product changes
  useEffect(() => {
    setQuantity(1);
    setStockWarning(null);
    setJustAdded(false);
    setSelectedImageIndex(0);
    const isShortDated = (product?.freshStockQuantity === 0 && (product?.nearExpiryQuantity || 0) > 0) ||
      (product?.daysUntilExpiry !== undefined && product.daysUntilExpiry <= 30 && (!product.freshStockQuantity || product.freshStockQuantity === 0));
    setBatchPreference(isShortDated ? 'CLEARANCE' : 'FRESH');
  }, [product, isOpen]);

  // Parse gallery images (properly parses JSON array strings, comma-separated lists, and direct URLs)
  const galleryImages: string[] = React.useMemo(() => {
    if (!product) return [];
    const list: string[] = [];
    const add = (url: any) => {
      if (!url || typeof url !== 'string') return;
      const u = url.trim();
      if (u === 'data:image/jpeg;base64' || u === 'data:image/png;base64' || u === 'data:image/webp;base64') return;
      if (u && !list.includes(u)) list.push(u);
    };

    if (product.images) {
      if (Array.isArray(product.images)) {
        product.images.forEach(add);
      } else if (typeof product.images === 'string') {
        const str = product.images.trim();
        if (str.startsWith('data:')) {
          add(str);
        } else if (str.startsWith('[') && str.endsWith(']')) {
          try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) parsed.forEach(add);
          } catch {
            if (str.includes('data:')) {
              const cleaned = str.replace(/^[\[\s"']+|[\]\s"']+$/g, '');
              if (cleaned.startsWith('data:')) add(cleaned);
            } else {
              str.replace(/[\[\]"]/g, '').split(',').forEach(add);
            }
          }
        } else if (str.includes(',')) {
          str.split(',').forEach(add);
        } else {
          add(str);
        }
      }
    }

    if (product.imageUrl) {
      const str = product.imageUrl.trim();
      if (str.startsWith('data:')) {
        add(str);
      } else if (str.startsWith('[') && str.endsWith(']')) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) parsed.forEach(add);
        } catch {
          add(str);
        }
      } else if (str.includes(',')) {
        str.split(',').forEach(add);
      } else {
        add(str);
      }
    }
    return list;
  }, [product]);

  const activeImage = galleryImages[selectedImageIndex] || galleryImages[0] || product?.imageUrl || '';

  if (!isOpen || !product) return null;

  // Real-time stock from DB
  const totalStock = product.stockQuantity !== undefined
    ? Number(product.stockQuantity)
    : (product.availableStock !== undefined ? Number(product.availableStock) : 0);

  const nearExpiryStock = product.nearExpiryQuantity !== undefined && product.nearExpiryQuantity > 0
    ? Number(product.nearExpiryQuantity)
    : 0;

  const freshStock = product.freshStockQuantity !== undefined
    ? Number(product.freshStockQuantity)
    : Math.max(0, totalStock - nearExpiryStock);

  const isShortDatedOnly = (product.freshStockQuantity === 0 && nearExpiryStock > 0) ||
    (product.daysUntilExpiry !== undefined && product.daysUntilExpiry <= 30 && (!product.freshStockQuantity || product.freshStockQuantity === 0));

  // Wholesale batch preference selection: 'FRESH' (guaranteed shelf life) vs 'CLEARANCE' (25% off wholesale)
  const [batchPreference, setBatchPreference] = useState<'FRESH' | 'CLEARANCE'>(
    isShortDatedOnly ? 'CLEARANCE' : 'FRESH'
  );

  // Real-time batch-aware in-cart quantities
  const inCartFresh = items
    .filter((i) => i.productId === product.id && (i.batchPreference || 'FRESH') === 'FRESH')
    .reduce((sum, i) => sum + i.quantity, 0);

  const inCartClearance = items
    .filter((i) => i.productId === product.id && i.batchPreference === 'CLEARANCE')
    .reduce((sum, i) => sum + i.quantity, 0);

  const liveFreshStock = Math.max(0, freshStock - inCartFresh);
  const liveClearanceStock = Math.max(0, nearExpiryStock - inCartClearance);

  const availableBatchStock = batchPreference === 'CLEARANCE'
    ? liveClearanceStock
    : liveFreshStock;
  const availableStock = availableBatchStock;
  const currentInCart = batchPreference === 'CLEARANCE' ? inCartClearance : inCartFresh;

  const tier = getEffectiveTier();
  const categoryName = CATEGORIES_LIST.find((c) => c.id === product.categoryId)?.name || 'General Bites';

  // Tiered and multi-batch pricing calculation with total product quantity aggregation
  const priceCalculation = React.useMemo(() => {
    if (!product) return null;
    const totalProductQuantity = inCartFresh + inCartClearance + quantity;
    return calculateItemPrice(product, quantity, tier, batchPreference, totalProductQuantity);
  }, [product, quantity, tier, batchPreference, inCartFresh, inCartClearance]);

  const unitPrice = priceCalculation?.unitPrice || product.retailPrice;
  const lineSubtotal = priceCalculation?.subtotal || (unitPrice * quantity);

  // Step quantity with strict real-time stock boundary checks
  const handleIncrease = () => {
    if (quantity >= availableBatchStock) {
      setStockWarning(`⚠️ Stock Limit: Only ${availableBatchStock} more units available for this ${batchPreference === 'CLEARANCE' ? 'Clearance' : 'Fresh'} batch. You currently have ${currentInCart} in your cart.`);
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

    if (num > availableBatchStock) {
      setQuantity(Math.max(1, availableBatchStock));
      setStockWarning(`⚠️ Real-time Stock Limit Reached: Cannot select ${num}. Maximum available to add is ${availableBatchStock}.`);
    } else {
      setQuantity(num);
      setStockWarning(null);
    }
  };

  const handleAddToCart = () => {
    if (availableBatchStock <= 0) {
      setStockWarning(`⚠️ '${product.name}' (${batchPreference === 'CLEARANCE' ? 'Clearance Batch' : 'Fresh Batch'}) has no remaining stock available to add.`);
      return;
    }

    if (quantity > availableBatchStock) {
      setStockWarning(`⚠️ Cannot add ${quantity} units. Stock limit is ${availableBatchStock} for this ${batchPreference === 'CLEARANCE' ? 'Clearance' : 'Fresh'} batch (You already have ${currentInCart} in cart).`);
      return;
    }

    addToCart(product, quantity, batchPreference);
    setJustAdded(true);
    setNotification({
      message: `✓ Added ${quantity}x '${product.name}' (${batchPreference === 'CLEARANCE' ? 'Clearance Batch' : 'Fresh Batch'}) to your cart!`,
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
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {activeImage ? (
                <img
                  src={activeImage}
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
                  display: activeImage ? 'none' : 'flex',
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

            {/* Thumbnail Gallery */}
            {galleryImages.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '240px', padding: '6px 0' }}>
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      border: selectedImageIndex === idx ? '2px solid #111827' : '1px solid rgba(0, 0, 0, 0.12)',
                      backgroundColor: '#FFFFFF',
                      padding: '2px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <img src={img} alt={`thumb-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </button>
                ))}
              </div>
            )}

            <div style={{ marginTop: '12px', fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>
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

              {/* Expiration Date & Near-Expiry Badge */}
              {product.currentBatchExpiryDate ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    backgroundColor: (product.daysUntilExpiry !== undefined && product.daysUntilExpiry <= 30) ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                    border: (product.daysUntilExpiry !== undefined && product.daysUntilExpiry <= 30) ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)',
                    fontSize: '11px',
                    marginBottom: '10px'
                  }}
                >
                  <Calendar size={13} color={(product.daysUntilExpiry !== undefined && product.daysUntilExpiry <= 30) ? '#D97706' : '#2563EB'} />
                  <span style={{ fontWeight: 700, color: (product.daysUntilExpiry !== undefined && product.daysUntilExpiry <= 30) ? '#92400E' : '#1E40AF' }}>
                    Exp: {new Date(product.currentBatchExpiryDate).toLocaleDateString()}
                    {product.daysUntilExpiry !== undefined && ` (${product.daysUntilExpiry <= 0 ? 'Today' : `${product.daysUntilExpiry}d left`})`}
                  </span>
                </div>
              ) : null}

              {/* Wholesale Batch Choice Segmented Control */}
              {/* Batch Choice Segmented Control (Available for all shoppers when both fresh and clearance batches exist) */}
              {priceCalculation?.hasBothBatches ? (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(240, 253, 244, 0.95), rgba(254, 243, 199, 0.9))',
                    border: '1.5px solid rgba(16, 185, 129, 0.35)',
                    marginBottom: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Layers size={14} color="#059669" />
                      Select Warehouse Batch
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#047857', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '9999px' }}>
                      Fresh vs Clearance
                    </span>
                  </div>

                  {/* Toggle Pills */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div
                      onClick={() => setBatchPreference('FRESH')}
                      style={{
                        cursor: 'pointer',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        backgroundColor: batchPreference === 'FRESH' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                        border: batchPreference === 'FRESH' ? '2px solid #10B981' : '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: batchPreference === 'FRESH' ? '0 2px 8px rgba(16, 185, 129, 0.15)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#065F46' }}>✨ Fresh Batch</div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#111827' }}>
                        ${(displayTier === 'WHOLESALE' ? product.wholesalePrice : product.retailPrice).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#047857' }}>{liveFreshStock} in stock {inCartFresh > 0 && <span style={{ opacity: 0.8 }}>({inCartFresh} in cart)</span>}</div>
                    </div>

                    <div
                      onClick={() => setBatchPreference('CLEARANCE')}
                      style={{
                        cursor: 'pointer',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        backgroundColor: batchPreference === 'CLEARANCE' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                        border: batchPreference === 'CLEARANCE' ? '2px solid #F59E0B' : '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: batchPreference === 'CLEARANCE' ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#B45309' }}>🔥 Clearance (-25%)</div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#D97706' }}>
                        ${(displayTier === 'WHOLESALE'
                          ? (product.wholesaleClearancePrice || product.wholesalePrice * 0.75)
                          : (product.clearancePrice || product.retailPrice * 0.75)
                        ).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#B45309' }}>{liveClearanceStock} in stock {inCartClearance > 0 && <span style={{ opacity: 0.8 }}>({inCartClearance} in cart)</span>}</div>
                    </div>
                  </div>
                </div>
              ) : product.nearExpiryQuantity && product.nearExpiryQuantity > 0 && !priceCalculation?.hasBothBatches ? (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.9), rgba(254, 226, 226, 0.6))',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    marginBottom: '10px',
                    fontSize: '11px',
                    color: '#92400E'
                  }}
                >
                  <AlertTriangle size={14} color="#D97706" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  <strong>Short-Dated Stock Only (25% Clearance):</strong> Exp: {product.currentBatchExpiryDate ? new Date(product.currentBatchExpiryDate).toLocaleDateString() : '< 30d'} @ ${(displayTier === 'WHOLESALE' ? (product.wholesaleClearancePrice || product.wholesalePrice * 0.75) : (product.clearancePrice || product.retailPrice * 0.75)).toFixed(2)}/ea
                </div>
              ) : null}

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
                {displayTier === 'WHOLESALE' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: batchPreference === 'CLEARANCE' ? '#D97706' : '#B45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building2 size={13} color={batchPreference === 'CLEARANCE' ? '#D97706' : '#B45309'} />
                        {batchPreference === 'CLEARANCE' ? 'Clearance Wholesale (25% OFF):' : 'Fresh Wholesale Price:'}
                      </span>
                      <span style={{ fontSize: '22px', fontWeight: 900, color: batchPreference === 'CLEARANCE' ? '#D97706' : '#B45309' }}>
                        ${(batchPreference === 'CLEARANCE' ? (product.wholesaleClearancePrice || product.wholesalePrice * 0.75) : product.wholesalePrice).toFixed(2)}
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
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>
                        {batchPreference === 'CLEARANCE' ? 'Standard Wholesale:' : 'Normal Price:'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', textDecoration: 'line-through', color: '#9CA3AF', fontWeight: 600 }}>
                          ${(batchPreference === 'CLEARANCE' ? product.wholesalePrice : product.retailPrice).toFixed(2)}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#ECFDF5', color: '#059669' }}>
                          SAVE ${(product.retailPrice - product.wholesalePrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : displayTier === 'PENDING_WHOLESALE' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>Normal Price (Active):</span>
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
                      <span style={{ fontSize: '12px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building2 size={13} color="#D97706" />
                        Wholesale Price:
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#B45309' }}>
                          ${product.wholesalePrice.toFixed(2)}
                        </span>
                        <div style={{ fontSize: '10px', color: '#D97706', fontWeight: 700 }}>
                          ⏳ Pending Admin Approval
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {batchPreference === 'CLEARANCE' ? (
                          <>
                            <Sparkles size={13} color="#D97706" />
                            Clearance Price (25% OFF):
                          </>
                        ) : (
                          'Normal Price:'
                        )}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        {batchPreference === 'CLEARANCE' ? (
                          <span style={{ fontSize: '14px', textDecoration: 'line-through', color: '#9CA3AF', fontWeight: 600 }}>
                            ${product.retailPrice.toFixed(2)}
                          </span>
                        ) : null}
                        <span style={{ fontSize: '20px', fontWeight: 900, color: batchPreference === 'CLEARANCE' ? '#D97706' : '#111827' }}>
                          ${(batchPreference === 'CLEARANCE' ? (product.clearancePrice || product.retailPrice * 0.75) : product.retailPrice).toFixed(2)}
                        </span>
                      </div>
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
                        Wholesale Price:
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#B45309' }}>
                        ${product.wholesalePrice.toFixed(2)}{' '}
                        <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600 }}>({product.wholesaleMinQty || 10}+ units)</span>
                      </span>
                    </div>
                  </>
                )}
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
              {/* Multi-Batch Allocation Split (FEFO) */}
              {priceCalculation?.hasNearExpiryDiscount && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '14px',
                    fontSize: '11px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800, color: '#92400E' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Layers size={12} color="#D97706" />
                      FEFO Multi-Batch Split
                    </span>
                    <span style={{ color: '#059669', backgroundColor: '#D1FAE5', padding: '1px 6px', borderRadius: '9999px' }}>
                      Save ${priceCalculation.savings.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ color: '#78350F' }}>
                    ⚡ <strong>{priceCalculation.nearExpiryUnits}x</strong> Near-Expiry Batch @ ${(priceCalculation.clearanceUnitPrice || 0).toFixed(2)} ({priceCalculation.clearanceDiscountPercent || 25}% OFF)
                  </div>
                  {(priceCalculation.freshUnits || 0) > 0 && (
                    <div style={{ color: '#1E293B' }}>
                      🌿 <strong>{priceCalculation.freshUnits}x</strong> Fresh Warehouse Stock @ ${(priceCalculation.regularUnitPrice || product.retailPrice).toFixed(2)}
                    </div>
                  )}
                </div>
              )}

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
