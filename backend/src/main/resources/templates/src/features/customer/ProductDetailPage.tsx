import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../../types/schema';
import { useCustomerCartStore } from '../../store/customerCartStore';
import { customerApi, CATEGORIES_LIST } from './customerApi';
import {
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  AlertCircle,
  AlertTriangle,
  Clock,
  Layers,
  Coffee,
  Cookie,
  Milk,
  Dumbbell,
  Building2,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Box,
  ChevronRight
} from 'lucide-react';

interface ProductDetailPageProps {
  productId?: string | number;
  onNavigateToShop?: () => void;
  onNavigateToCart?: () => void;
  onNavigateToCheckout?: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId: propProductId,
  onNavigateToShop,
  onNavigateToCart,
  onNavigateToCheckout
}) => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Resolve target product ID from route parameter, props, or URL
  const targetId = propProductId || params.id || window.location.pathname.split('/').filter(Boolean).pop();

  const {
    items,
    addToCart,
    getEffectiveTier,
    getDisplayTier,
    getItemCount,
    setNotification,
    isAuthenticated
  } = useCustomerCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState<number>(1);
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const [toastAlert, setToastAlert] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastAlert) {
      const timer = setTimeout(() => setToastAlert(null), 3800);
      return () => clearTimeout(timer);
    }
  }, [toastAlert]);

  // Fetch product from database (Stock Controller DB synchronization)
  useEffect(() => {
    let isMounted = true;
    if (!targetId) {
      setError('Product ID not specified');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    customerApi.getProductById(targetId)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setProduct(data);
        } else {
          setError('Product not found in the warehouse catalog.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to retrieve product details from database.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetId]);

  const handleBack = () => {
    if (onNavigateToShop) {
      onNavigateToShop();
    } else {
      navigate('/shop');
    }
  };

  const handleGoToCart = () => {
    if (onNavigateToCart) {
      onNavigateToCart();
    } else {
      navigate('/cart');
    }
  };

  const handleGoToCheckout = () => {
    if (onNavigateToCheckout) {
      onNavigateToCheckout();
    } else {
      navigate('/checkout');
    }
  };

  // Real-time stock calculation from DB
  const availableStock = product
    ? (product.stockQuantity !== undefined
        ? Number(product.stockQuantity)
        : (product.availableStock !== undefined ? Number(product.availableStock) : 0))
    : 0;

  const existingInCartItem = product ? items.find((i) => i.productId === product.id) : null;
  const currentInCart = existingInCartItem ? existingInCartItem.quantity : 0;
  const remainingStock = Math.max(0, availableStock - currentInCart);

  const tier = getEffectiveTier();
  const displayTier = getDisplayTier();
  const categoryName = product
    ? (CATEGORIES_LIST.find((c) => c.id === product.categoryId)?.name || 'Artisanal Selection')
    : 'Artisanal Selection';

  // Wholesale qualification calculation
  const isWholesaleQualified =
    tier === 'WHOLESALE' && product && quantity >= (product.wholesaleMinQty || 10);
  const unitPrice = product
    ? (isWholesaleQualified ? product.wholesalePrice : product.retailPrice)
    : 0;
  const lineSubtotal = unitPrice * quantity;

  // Quantity stepper adjustments with real-time stock boundary checks
  const handleIncrease = () => {
    if (quantity + currentInCart >= availableStock) {
      setStockWarning(
        `⚠️ Stock Limit Warning: Only ${availableStock} units available in warehouse batches. You currently have ${currentInCart} in your cart.`
      );
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
      setStockWarning(
        `⚠️ Real-time Stock Ceiling: Cannot select ${num} units. Maximum remaining available to add is ${remainingStock}.`
      );
    } else {
      setQuantity(num);
      setStockWarning(null);
    }
  };

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!product) return;

    if (availableStock <= 0) {
      setToastAlert({
        message: `⚠️ '${product.name}' is out of stock in warehouse batches.`,
        type: 'warning'
      });
      return;
    }

    if (quantity + currentInCart > availableStock) {
      setToastAlert({
        message: `⚠️ Stock Limit Warning: Only ${remainingStock} more units can be added to your cart.`,
        type: 'warning'
      });
      return;
    }

    if (!isAuthenticated) {
      localStorage.setItem('pending_cart_item', JSON.stringify({ product, quantity }));
      setNotification({
        message: 'Please sign in or register to complete adding items to your cart.',
        badge: 'SIGN IN'
      });
      navigate('/login?redirect=/shop');
      return;
    }

    setIsAdding(true);
    addToCart(product, quantity);

    setToastAlert({
      message: `✓ Added ${quantity} unit${quantity > 1 ? 's' : ''} of '${product.name}' to cart!`,
      type: 'success'
    });

    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  const handleBuyNow = () => {
    if (!product) return;
    handleAddToCart();
    setTimeout(() => {
      handleGoToCheckout();
    }, 300);
  };

  // Helper icon for categories
  const renderCategoryIcon = (categoryId: number) => {
    switch (categoryId) {
      case 1:
        return <Coffee size={20} />;
      case 2:
        return <Cookie size={20} />;
      case 3:
        return <Milk size={20} />;
      case 4:
        return <Dumbbell size={20} />;
      default:
        return <Layers size={20} />;
    }
  };

  // Parse gallery images
  const galleryImages: string[] = [];
  if (product) {
    if (product.imageUrl) galleryImages.push(product.imageUrl);
    if ((product as any).images && Array.isArray((product as any).images)) {
      (product as any).images.forEach((img: string) => {
        if (img && !galleryImages.includes(img)) galleryImages.push(img);
      });
    }
  }

  // Loading skeleton screen
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '480px',
          padding: '60px 20px',
          gap: '16px'
        }}
      >
        <Loader2 size={36} className="animate-spin" style={{ color: '#0A84FF' }} />
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#6B7280' }}>
          Loading real-time product data from warehouse database...
        </p>
      </div>
    );
  }

  // Not Found / Error screen
  if (error || !product) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '440px',
          padding: '60px 20px',
          textAlign: 'center',
          gap: '18px'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <AlertCircle size={32} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: 0 }}>
          {error || 'Product Not Found'}
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '440px', margin: 0 }}>
          The product you are looking for may have been archived or does not exist in the central catalog.
        </p>
        <button
          onClick={handleBack}
          style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '9999px',
            backgroundColor: '#111827',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>Return to Storefront</span>
        </button>
      </div>
    );
  }

  const activeImage = galleryImages[selectedImageIndex] || product.imageUrl || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Header Capsule: Breadcrumb & Return Navigation */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 20px',
          borderRadius: '20px',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '9999px',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              backgroundColor: '#F5F5F7',
              color: '#111827',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft size={15} />
            <span>Storefront</span>
          </button>

          {/* Breadcrumb Path */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#6B7280'
            }}
          >
            <ChevronRight size={14} color="#9CA3AF" />
            <span style={{ cursor: 'pointer' }} onClick={handleBack}>Catalog</span>
            <ChevronRight size={14} color="#9CA3AF" />
            <span style={{ color: '#111827', fontWeight: 700, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.name}
            </span>
          </div>
        </div>

        {/* Live Stock Controller DB Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#059669',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}
          >
            <Box size={13} />
            <span>STOCK CONTROLLER DB SYNC</span>
          </div>

          {/* Quick Cart Trigger */}
          <button
            onClick={handleGoToCart}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '9999px',
              backgroundColor: '#111827',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <ShoppingCart size={14} />
            <span>Cart ({getItemCount()})</span>
          </button>
        </div>
      </div>

      {/* Pending Wholesale Review Banner */}
      {displayTier === 'PENDING_WHOLESALE' && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: '18px',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FCD34D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={18} color="#D97706" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: '#78350F' }}>
              <strong style={{ color: '#92400E' }}>Wholesale Application Under Review:</strong> Normal prices apply until confirmed by an Administrator. Both normal and wholesale prices are shown below for your reference.
            </span>
          </div>
          <button
            onClick={() => navigate('/wholesale-apply')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #FCD34D',
              color: '#92400E',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Check Status →
          </button>
        </div>
      )}

      {/* Main Two-Column Product Detail Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '32px',
          alignItems: 'start'
        }}
      >
        {/* ================= LEFT COLUMN: PRODUCT IMAGERY & MEDIA ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Main Stage Image Capsule */}
          <div
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: '28px',
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              padding: '24px'
            }}
          >
            {/* Top Badges Overlay */}
            <div
              style={{
                position: 'absolute',
                top: '18px',
                left: '18px',
                right: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 2
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(12px)',
                  color: '#111827',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}
              >
                {categoryName}
              </span>

              {product.isPerishable ? (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: '#DC2626',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Clock size={12} />
                  <span>FEFO Perishable</span>
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: '#2563EB',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ShieldCheck size={12} />
                  <span>FIFO Shelf-Stable</span>
                </span>
              )}
            </div>

            {/* Product Image */}
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transition: 'transform 0.4s ease'
                }}
                className="hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.detail-img-fallback') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}

            {/* Fallback Icon Container */}
            <div
              className="detail-img-fallback"
              style={{
                display: activeImage ? 'none' : 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                width: '100%',
                height: '100%'
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#111827'
                }}
              >
                {renderCategoryIcon(product.categoryId)}
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#9CA3AF' }}>
                {product.sku}
              </span>
            </div>
          </div>

          {/* Alternate Image Gallery Thumbnails */}
          {galleryImages.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '16px',
                    border: selectedImageIndex === idx ? '2px solid #000000' : '1px solid rgba(0, 0, 0, 0.1)',
                    backgroundColor: '#FFFFFF',
                    padding: '4px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <img src={img} alt={`view-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}

          {/* Trust Guarantees */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              padding: '16px',
              borderRadius: '20px',
              backgroundColor: '#F9FAFB',
              border: '1px solid rgba(0, 0, 0, 0.05)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
              <Truck size={18} color="#059669" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#111827' }}>Rapid Dispatch</span>
              <span style={{ fontSize: '10px', color: '#6B7280' }}>Phnom Penh Hub</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
              <ShieldCheck size={18} color="#2563EB" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#111827' }}>Verified Quality</span>
              <span style={{ fontSize: '10px', color: '#6B7280' }}>Batch Inspected</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
              <RotateCcw size={18} color="#7C3AED" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#111827' }}>Freshness Promise</span>
              <span style={{ fontSize: '10px', color: '#6B7280' }}>100% Guaranteed</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: PRODUCT SPECIFICATIONS & ACTIONS ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Header & Title */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: '#9CA3AF' }}>
                {product.sku}
              </span>
              <span style={{ color: '#D1D5DB' }}>•</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>
                Category: {categoryName}
              </span>
            </div>

            <h1
              style={{
                fontSize: '28px',
                fontWeight: 900,
                color: '#111827',
                lineHeight: 1.25,
                margin: '0 0 12px 0'
              }}
            >
              {product.name}
            </h1>

            <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: 1.6, margin: 0 }}>
              {product.description || 'Artisanal product carefully curated and quality-checked by our retail warehouse specialists.'}
            </p>
          </div>

          {/* Real-time DB Stock Availability Indicator */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '20px',
              backgroundColor: availableStock > 10 ? 'rgba(16, 185, 129, 0.08)' : availableStock > 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: availableStock > 10 ? '1px solid rgba(16, 185, 129, 0.25)' : availableStock > 0 ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: availableStock > 10 ? '#10B981' : availableStock > 0 ? '#F59E0B' : '#EF4444',
                    boxShadow: availableStock > 0 ? '0 0 8px currentColor' : 'none'
                  }}
                />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: availableStock > 10 ? '#065F46' : availableStock > 0 ? '#92400E' : '#991B1B'
                  }}
                >
                  {availableStock > 10
                    ? `In Stock — ${availableStock} units available in warehouse`
                    : availableStock > 0
                    ? `Low Stock Warning — Only ${availableStock} units remaining!`
                    : 'Out of Stock in warehouse'}
                </span>
              </div>

              {currentInCart > 0 && (
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#4B5563' }}>
                  ({currentInCart} in your cart)
                </span>
              )}
            </div>

            <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>
              Live inventory verified directly against database batches. Orders are dynamically fulfilled using automated {product.isPerishable ? 'FEFO (First-Expired, First-Out)' : 'FIFO (First-In, First-Out)'} algorithms.
            </p>
          </div>

          {/* Pricing Card */}
          <div
            style={{
              padding: '20px',
              borderRadius: '24px',
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
            }}
          >
            {tier === 'WHOLESALE' ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(251, 192, 45, 0.18)',
                      color: '#B45309',
                      border: '1px solid rgba(251, 192, 45, 0.4)'
                    }}
                  >
                    ★ CONFIRMED WHOLESALE PARTNER
                  </span>
                  <span style={{ fontSize: '12px', color: '#059669', fontWeight: 800 }}>
                    Save ${(product.retailPrice - product.wholesalePrice).toFixed(2)}/unit
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', flexWrap: 'wrap', backgroundColor: '#FBFBFB', padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#B45309', fontWeight: 800, textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>
                      Wholesale Price
                    </span>
                    <span style={{ fontSize: '32px', fontWeight: 900, color: '#111827' }}>
                      ${product.wholesalePrice.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(0, 0, 0, 0.1)', paddingLeft: '18px' }}>
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>
                      Normal Price
                    </span>
                    <span style={{ fontSize: '18px', color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 700 }}>
                      ${product.retailPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 600 }}>
                    <Sparkles size={14} />
                    <span>
                      Wholesale rate active on orders of <strong>{product.wholesaleMinQty || 10}+</strong> units.
                    </span>
                  </div>
                  <div style={{ color: '#6B7280' }}>
                    Quantities under {product.wholesaleMinQty || 10} will be billed at normal price (${product.retailPrice.toFixed(2)}/unit).
                  </div>
                </div>
              </div>
            ) : displayTier === 'PENDING_WHOLESALE' ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: '#FEF3C7',
                      color: '#92400E',
                      border: '1px solid #FCD34D'
                    }}
                  >
                    ⏳ WHOLESALE PENDING ADMIN CONFIRMATION
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px', flexWrap: 'wrap', backgroundColor: '#FFFBEB', padding: '12px 16px', borderRadius: '16px', border: '1px solid #FDE68A' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#92400E', fontWeight: 800, textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>
                      Normal Price (Active)
                    </span>
                    <span style={{ fontSize: '32px', fontWeight: 900, color: '#111827' }}>
                      ${product.retailPrice.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(146, 64, 14, 0.2)', paddingLeft: '18px' }}>
                    <span style={{ fontSize: '11px', color: '#92400E', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>
                      Wholesale Price
                    </span>
                    <span style={{ fontSize: '20px', color: '#92400E', fontWeight: 900 }}>
                      ${product.wholesalePrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400E', fontSize: '12px', marginTop: '10px' }}>
                  <Clock size={14} />
                  <span>
                    Wholesale pricing (${product.wholesalePrice.toFixed(2)}) unlocks automatically upon Administrator approval.
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: '#111827' }}>
                    ${product.retailPrice.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 600 }}>
                    Normal Store Price
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563EB' }}>
                    <Sparkles size={13} />
                    <span>
                      Bulk Rate: <strong>${(product.retailPrice * 0.95).toFixed(2)}</strong> (5% discount on 10+ units)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280' }}>
                    <Building2 size={13} />
                    <span>
                      Commercial Wholesale: <strong>${product.wholesalePrice.toFixed(2)}</strong> (Apply for Wholesale account to unlock)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Quantity Selector with Real-time Boundary Checks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                Select Quantity:
              </label>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                Remaining Available: <strong>{remainingStock} units</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '9999px',
                  padding: '4px',
                  border: '1px solid rgba(0, 0, 0, 0.08)'
                }}
              >
                <button
                  type="button"
                  onClick={handleDecrease}
                  disabled={quantity <= 1}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    color: quantity <= 1 ? '#D1D5DB' : '#111827',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                  }}
                >
                  <Minus size={16} />
                </button>

                <input
                  type="number"
                  min="1"
                  max={Math.max(1, remainingStock)}
                  value={quantity}
                  onChange={(e) => handleQuantityInput(e.target.value)}
                  style={{
                    width: '64px',
                    textAlign: 'center',
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#111827',
                    outline: 'none'
                  }}
                />

                <button
                  type="button"
                  onClick={handleIncrease}
                  disabled={availableStock <= 0 || quantity + currentInCart >= availableStock}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: availableStock <= 0 || quantity + currentInCart >= availableStock ? 'not-allowed' : 'pointer',
                    color: availableStock <= 0 || quantity + currentInCart >= availableStock ? '#D1D5DB' : '#111827',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Live Subtotal Preview */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>Estimated Total</span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#111827' }}>
                  ${lineSubtotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Real-time Stock Ceiling Warning Banner */}
            {stockWarning && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#DC2626',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{stockWarning}</span>
              </div>
            )}
          </div>

          {/* Action Buttons: Add to Cart & Buy Now */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={availableStock <= 0 || isAdding}
              style={{
                flex: 1,
                padding: '16px 24px',
                borderRadius: '9999px',
                backgroundColor: availableStock <= 0 ? '#E5E7EB' : '#111827',
                color: availableStock <= 0 ? '#9CA3AF' : '#FFFFFF',
                border: 'none',
                fontWeight: 800,
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: availableStock <= 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: availableStock > 0 ? '0 10px 24px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              {isAdding ? (
                <>
                  <Check size={18} />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  <span>{availableStock <= 0 ? 'Out of Stock' : `Add to Cart • $${lineSubtotal.toFixed(2)}`}</span>
                </>
              )}
            </button>

            {availableStock > 0 && (
              <button
                type="button"
                onClick={handleBuyNow}
                style={{
                  padding: '16px 24px',
                  borderRadius: '9999px',
                  backgroundColor: '#0A84FF',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 10px 24px rgba(10, 132, 255, 0.25)'
                }}
              >
                <span>Buy Now</span>
              </button>
            )}
          </div>

          {/* Technical Specifications Table */}
          <div
            style={{
              marginTop: '12px',
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              paddingTop: '20px'
            }}
          >
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#111827', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Product Specifications & Warehouse Specs
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <span style={{ color: '#6B7280' }}>SKU Code</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#111827' }}>{product.sku}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <span style={{ color: '#6B7280' }}>Category</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>{categoryName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <span style={{ color: '#6B7280' }}>Fulfillment Rule</span>
                <span style={{ fontWeight: 700, color: product.isPerishable ? '#DC2626' : '#2563EB' }}>
                  {product.isPerishable ? 'FEFO (Perishable)' : 'FIFO (Standard)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <span style={{ color: '#6B7280' }}>Min Stock Alert</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>{product.minStockThreshold} units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <span style={{ color: '#6B7280' }}>Wholesale Minimum</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>{product.wholesaleMinQty || 10} units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <span style={{ color: '#6B7280' }}>Database ID</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#111827' }}>#{product.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Success / Warning Toast Alert */}
      {toastAlert && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 1200,
            backgroundColor: toastAlert.type === 'success' ? '#10B981' : '#EF4444',
            color: '#FFFFFF',
            padding: '14px 22px',
            borderRadius: '9999px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 800,
            fontSize: '13px',
            animation: 'toastSlideIn 0.25s ease'
          }}
        >
          {toastAlert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toastAlert.message}</span>
          <button
            onClick={() => setToastAlert(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              marginLeft: '6px',
              padding: 0,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
