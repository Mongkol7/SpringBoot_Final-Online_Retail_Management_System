import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IosCardGlass } from '../../components/ui/IosCardGlass';
import { IosButton } from '../../components/ui/IosButton';
import { IosInput } from '../../components/ui/IosInput';
import { IosBadge } from '../../components/ui/IosBadge';
import { useCustomerCartStore } from '../../store/customerCartStore';
import { customerApi, DEFAULT_CUSTOMER_PRODUCTS, CATEGORIES_LIST } from './customerApi';
import { WholesaleApplyModal } from './WholesaleApplyModal';
import { Product } from '../../types/schema';
import {
  Search,
  ShoppingBag,
  Check,
  Package,
  Layers,
  ArrowRight,
  Clock,
  Building2,
  Coffee,
  Cookie,
  Milk,
  Dumbbell,
  Loader2,
  Sparkles,
  TrendingDown,
  Info,
  CheckCircle2,
  X
} from 'lucide-react';

interface ShopPageProps {
  onNavigateToCart?: () => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({ onNavigateToCart }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const handleGoToCart = onNavigateToCart || (() => navigate('/cart'));

  const [justPlacedOrder, setJustPlacedOrder] = useState<any>(
    (location.state as any)?.justPlacedOrder || null
  );

  useEffect(() => {
    if (location.state && (location.state as any).justPlacedOrder) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const {
    user,
    isAuthenticated,
    items,
    addToCart,
    getEffectiveTier,
    getItemCount,
    setNotification,
    wholesaleApplication
  } = useCustomerCartStore();

  const [products, setProducts] = useState<Product[]>(DEFAULT_CUSTOMER_PRODUCTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [isWholesaleModalOpen, setIsWholesaleModalOpen] = useState(false);
  const [addedAnimationId, setAddedAnimationId] = useState<number | null>(null);

  const effectiveTier = getEffectiveTier();
  const cartItemCount = getItemCount();

  // If user signed in after attempting to add an item as guest, automatically add it now
  useEffect(() => {
    if (isAuthenticated) {
      const pendingStr = localStorage.getItem('pending_cart_item');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          if (pending && pending.product) {
            addToCart(pending.product, pending.quantity || 1);
            setNotification({
              message: `Added ${pending.product.name} to your cart!`,
              badge: 'CART'
            });
          }
        } catch {
          // ignore parsing error
        } finally {
          localStorage.removeItem('pending_cart_item');
        }
      }
    }
  }, [isAuthenticated, addToCart, setNotification]);

  // Fetch products from GET /api/v1/customer/products (or fallback catalog)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    customerApi.getProducts()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(() => {
        // Fallback to seeded products
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 0 || product.categoryId === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description &&
          product.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleAddToCart = (product: Product) => {
    if (!isAuthenticated) {
      // Remember pending product and prompt customer to sign in or register
      localStorage.setItem('pending_cart_item', JSON.stringify({ product, quantity: 1 }));
      setNotification({
        message: 'Please sign in or sign up first to add items to your cart.',
        badge: 'AUTH REQUIRED'
      });
      navigate('/login?redirect=/shop');
      return;
    }

    addToCart(product, 1);
    setAddedAnimationId(product.id);
    setTimeout(() => {
      setAddedAnimationId(null);
    }, 1200);
  };

  // Helper to render appropriate category icon for product placeholder
  const renderCategoryIcon = (categoryId: number) => {
    switch (categoryId) {
      case 1:
        return <Coffee size={24} />;
      case 2:
        return <Cookie size={24} />;
      case 3:
        return <Milk size={24} />;
      case 4:
        return <Dumbbell size={24} />;
      default:
        return <Layers size={24} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Placed Order Celebration Notification Banner */}
      {justPlacedOrder && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(48, 209, 88, 0.16) 0%, rgba(10, 132, 255, 0.16) 100%)',
            border: '1px solid rgba(48, 209, 88, 0.45)',
            borderRadius: 'var(--ios-radius-card, 24px)',
            padding: '24px 28px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 8px 32px rgba(48, 209, 88, 0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(48, 209, 88, 0.25)',
                border: '1px solid #30D158',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <CheckCircle2 size={26} color="#30D158" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                  Payment Completed! Order Placed Successfully
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255, 159, 10, 0.2)',
                    border: '1px solid rgba(255, 159, 10, 0.5)',
                    color: '#FF9F0A'
                  }}
                >
                  Awaiting Admin Confirmation
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)' }}>
                Order <strong style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>#{justPlacedOrder.orderNumber}</strong> (${(justPlacedOrder.totalAmount || 0).toFixed(2)}) has been recorded and warehouse batches allocated via FIFO/FEFO.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate('/orders')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                backgroundColor: '#FFFFFF',
                color: '#000000',
                fontWeight: 700,
                fontSize: '14px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(255, 255, 255, 0.25)',
                transition: 'transform 0.15s ease'
              }}
            >
              <span>See My Order</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setJustPlacedOrder(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Hero Glass Banner */}
      <IosCardGlass glow style={{ padding: '36px', position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '24px'
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <IosBadge variant={effectiveTier === 'WHOLESALE' ? 'wholesale' : 'default'} glow>
                {effectiveTier === 'WHOLESALE' ? '⭐ WHOLESALE ACCOUNT ACTIVE' : 'RETAIL STOREFRONT'}
              </IosBadge>

              {isAuthenticated && (
                <span style={{ fontSize: '12px', color: 'var(--ios-text-muted, #A1A1AA)' }}>
                  Customer: <strong>{user.fullName}</strong>
                </span>
              )}
            </div>

            <h1
              style={{
                fontSize: '32px',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                margin: '0 0 12px 0',
                color: '#FFFFFF'
              }}
            >
              Curated Retail & Wholesale Categories
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--ios-text-muted, #A1A1AA)',
                lineHeight: 1.6,
                margin: 0
              }}
            >
              {effectiveTier === 'WHOLESALE'
                ? 'Wholesale commercial pricing unlocked. Orders are batch-allocated in real-time via FIFO/FEFO directly from central inventory.'
                : 'Browse products by category at standard retail pricing. Apply for an enterprise wholesale tier to unlock discounted volume rates.'}
            </p>
          </div>

          {/* Wholesale Status or Register CTA */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {effectiveTier === 'WHOLESALE' ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                <span style={{ color: '#FFD700', fontSize: '15px' }}>★</span>
                <span>Verified Wholesale Partner Active</span>
              </div>
            ) : wholesaleApplication?.status === 'PENDING' ? (
              <button
                onClick={() => navigate('/wholesale-apply')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 159, 10, 0.12)',
                  border: '1px solid rgba(255, 159, 10, 0.4)',
                  color: '#FF9F0A',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Clock size={15} />
                <span>Wholesale Pending Approval (Retail Active)</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/wholesale-apply')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 16px rgba(255, 255, 255, 0.2)'
                }}
                className="ios-glow-hover"
              >
                <Building2 size={16} />
                <span>Apply for Wholesale Pricing →</span>
              </button>
            )}
          </div>
        </div>
      </IosCardGlass>

      {/* Pending Wholesale Review Banner */}
      {wholesaleApplication?.status === 'PENDING' && effectiveTier !== 'WHOLESALE' && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 159, 10, 0.08)',
            border: '1px solid rgba(255, 159, 10, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={18} color="#FF9F0A" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: '#FFFFFF', lineHeight: 1.4 }}>
              <strong style={{ color: '#FF9F0A' }}>Wholesale Application Under Review:</strong> You are currently shopping on <strong>Standard Retail Pricing</strong>. Bulk wholesale prices unlock automatically once an Administrator approves your business application.
            </span>
          </div>
          <button
            onClick={() => navigate('/wholesale-apply')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Check Status
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Category Pills */}
        <div
          className="ios-glass-capsule"
          style={{
            display: 'flex',
            gap: '4px',
            padding: '4px',
            overflowX: 'auto',
            maxWidth: '100%'
          }}
        >
          {CATEGORIES_LIST.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                backgroundColor: selectedCategory === cat.id ? '#FFFFFF' : 'transparent',
                color: selectedCategory === cat.id ? '#000000' : 'rgba(255, 255, 255, 0.7)'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ minWidth: '280px', flex: '1 1 300px', maxWidth: '420px' }}>
          <IosInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products or SKU..."
            icon={<Search size={16} />}
          />
        </div>
      </div>

      {/* Product Loading State */}
      {isLoading ? (
        <IosCardGlass style={{ textAlign: 'center', padding: '80px 20px' }}>
          <Loader2 size={36} color="#FFFFFF" className="animate-spin" style={{ margin: '0 auto 16px auto', animation: 'spin 1s linear infinite' }} />
          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px 0', color: '#FFFFFF' }}>
            Loading Categories & Products...
          </h3>
          <p style={{ color: 'var(--ios-text-muted, #A1A1AA)', fontSize: '13px', margin: 0 }}>
            Querying active batches from Spring Boot inventory.
          </p>
        </IosCardGlass>
      ) : filteredProducts.length === 0 ? (
        <IosCardGlass style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Package size={48} color="#71717A" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#FFFFFF' }}>
            No products found
          </h3>
          <p style={{ color: 'var(--ios-text-muted, #A1A1AA)', fontSize: '14px', margin: '0 0 20px 0' }}>
            No items matched "{searchQuery}". Try selecting another category or clearing your search.
          </p>
          <IosButton
            variant="glass"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(0);
            }}
          >
            Reset Filters
          </IosButton>
        </IosCardGlass>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}
        >
          {filteredProducts.map((product) => {
            const existingCartItem = items.find((i) => i.productId === product.id);
            const inCartQty = existingCartItem ? existingCartItem.quantity : 0;
            const isJustAdded = addedAnimationId === product.id;

            // Compute savings percent for retail view hint
            const savingsPercent = Math.round(
              ((product.retailPrice - product.wholesalePrice) / product.retailPrice) * 100
            );

            // Simulated stock count based on threshold or seed
            const availableStockCount = (product.minStockThreshold || 10) * 3;

            return (
              <IosCardGlass
                key={product.id}
                glow
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '24px',
                  minHeight: '390px'
                }}
              >
                <div>
                  {/* Card Header: Category & Perishable Indicator */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--ios-text-subtle, #71717A)',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {CATEGORIES_LIST.find((c) => c.id === product.categoryId)?.name || 'General'}
                    </span>

                    {product.isPerishable ? (
                      <IosBadge variant="warning" style={{ fontSize: '9px', padding: '2px 8px' }}>
                        <Clock size={10} /> Perishable (FEFO)
                      </IosBadge>
                    ) : (
                      <IosBadge variant="default" style={{ fontSize: '9px', padding: '2px 8px' }}>
                        Non-Perishable
                      </IosBadge>
                    )}
                  </div>

                  {/* Product Image / Visual Placeholder Capsule */}
                  <div
                    style={{
                      height: '110px',
                      borderRadius: 'var(--ios-radius-button, 16px)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: '8px',
                      marginBottom: '18px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF'
                      }}
                    >
                      {renderCategoryIcon(product.categoryId)}
                    </div>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        letterSpacing: '0.08em',
                        color: 'var(--ios-text-subtle, #71717A)'
                      }}
                    >
                      {product.sku}
                    </span>
                  </div>

                  {/* Stock Availability Indicator */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      color: '#30D158',
                      marginBottom: '10px'
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#30D158',
                        boxShadow: '0 0 6px #30D158'
                      }}
                    />
                    <span>In Stock ({availableStockCount} units)</span>
                  </div>

                  {/* Title & Description */}
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      lineHeight: 1.35,
                      color: '#FFFFFF',
                      margin: '0 0 8px 0'
                    }}
                  >
                    {product.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--ios-text-muted, #A1A1AA)',
                      lineHeight: 1.5,
                      margin: '0 0 16px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {product.description}
                  </p>
                </div>

                {/* Bottom Section: Dual Pricing & Add to Cart */}
                <div style={{ borderTop: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))', paddingTop: '16px' }}>
                  {effectiveTier === 'WHOLESALE' ? (
                    // WHOLESALE DUAL PRICING DISPLAY WITH MOQ THRESHOLD
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF' }}>
                          ${product.wholesalePrice.toFixed(2)}
                        </span>
                        <span
                          style={{
                            fontSize: '14px',
                            color: 'var(--ios-text-subtle, #71717A)',
                            textDecoration: 'line-through'
                          }}
                        >
                          ${product.retailPrice.toFixed(2)}
                        </span>
                        <IosBadge variant="wholesale" glow style={{ fontSize: '10px' }}>
                          WHOLESALE TIER
                        </IosBadge>
                      </div>

                      {/* Threshold Explanation */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#30D158' }}>
                          <Sparkles size={12} />
                          <span>Wholesale Rate for <strong>{product.wholesaleMinQty || 10}+</strong> units (Save ${(product.retailPrice - product.wholesalePrice).toFixed(2)} · {savingsPercent}% off)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ios-text-subtle, #71717A)' }}>
                          <Info size={12} />
                          <span>Orders &lt; {product.wholesaleMinQty || 10} units charged at retail: <strong>${product.retailPrice.toFixed(2)}</strong></span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // RETAIL PRICING WITH BULK TIER & WHOLESALE PREVIEWS
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF' }}>
                          ${product.retailPrice.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--ios-text-subtle, #71717A)' }}>
                          Standard Retail Price
                        </span>
                      </div>

                      {/* Bulk Retail & Wholesale Preview */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#0A84FF' }}>
                          <TrendingDown size={12} />
                          <span>Bulk Tier: <strong>${(product.retailPrice * 0.95).toFixed(2)}</strong> (5% off on 10+ units)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ios-text-subtle, #71717A)' }}>
                          <Building2 size={12} />
                          <span>B2B Wholesale: <strong>${product.wholesalePrice.toFixed(2)}</strong> (Upon Admin Approval)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <IosButton
                    variant={isJustAdded ? 'primary' : inCartQty > 0 ? 'glass' : 'glass'}
                    onClick={() => handleAddToCart(product)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: isJustAdded ? '#30D158' : undefined,
                      color: isJustAdded ? '#000000' : undefined
                    }}
                  >
                    {isJustAdded ? (
                      <>
                        <Check size={16} /> Added to Cart!
                      </>
                    ) : inCartQty > 0 ? (
                      <>
                        <ShoppingBag size={16} /> In Cart ({inCartQty}) +
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} /> Add to Cart
                      </>
                    )}
                  </IosButton>
                </div>
              </IosCardGlass>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Cart Capsule Trigger */}
      {cartItemCount > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000
          }}
        >
          <button
            onClick={handleGoToCart}
            className="ios-glass-capsule ios-glow-hover"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 24px',
              backgroundColor: '#FFFFFF',
              color: '#000000',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 35px rgba(0,0,0,0.7), 0 0 20px rgba(255,255,255,0.25)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <ShoppingBag size={18} />
            <span style={{ fontSize: '14px', fontWeight: 700 }}>
              Review Cart ({cartItemCount})
            </span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Wholesale Modal */}
      <WholesaleApplyModal
        isOpen={isWholesaleModalOpen}
        onClose={() => setIsWholesaleModalOpen(false)}
      />
    </div>
  );
};

export default ShopPage;
