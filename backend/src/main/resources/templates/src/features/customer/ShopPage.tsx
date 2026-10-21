import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IosCardGlass } from '../../components/ui/IosCardGlass';
import { IosButton } from '../../components/ui/IosButton';
import { IosBadge } from '../../components/ui/IosBadge';
import { useCustomerCartStore } from '../../store/customerCartStore';
import { customerApi, DEFAULT_CUSTOMER_PRODUCTS, CATEGORIES_LIST } from './customerApi';
import { WholesaleApplyModal } from './WholesaleApplyModal';
import { SnackStorefrontBento } from './SnackStorefrontBento';
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
  AlertCircle,
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
  const [toastAlert, setToastAlert] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastAlert) {
      const timer = setTimeout(() => setToastAlert(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastAlert]);

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

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const realStock = product.stockQuantity !== undefined
      ? Number(product.stockQuantity)
      : (product.availableStock !== undefined ? Number(product.availableStock) : 0);

    const existingCartItem = items.find((i) => i.productId === product.id);
    const inCartQty = existingCartItem ? existingCartItem.quantity : 0;

    if (realStock <= 0) {
      setToastAlert({
        message: `⚠️ '${product.name}' is currently OUT OF STOCK in warehouse.`,
        type: 'warning'
      });
      return;
    }

    if (inCartQty + 1 > realStock) {
      setToastAlert({
        message: `⚠️ Stock Limit Warning: Cannot order more than ${realStock} units for '${product.name}'. You have ${inCartQty} in cart.`,
        type: 'warning'
      });
      return;
    }

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
    setToastAlert({
      message: `✓ Added '${product.name}' to cart! (${inCartQty + 1} total)`,
      type: 'success'
    });
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

      {/* Flagship Snack Storefront Bento & Hero Showcase */}
      <SnackStorefrontBento
        products={products}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          const el = document.getElementById('catalog-grid');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Curated Wholesale & Retail Banner - Option 1: Clean White Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '28px',
          padding: '36px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.06)',
          position: 'relative'
        }}
      >
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
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: effectiveTier === 'WHOLESALE' ? 'rgba(251, 192, 45, 0.15)' : 'rgba(0, 0, 0, 0.06)',
                  color: effectiveTier === 'WHOLESALE' ? '#B45309' : '#374151',
                  border: effectiveTier === 'WHOLESALE' ? '1px solid rgba(251, 192, 45, 0.4)' : '1px solid rgba(0, 0, 0, 0.08)'
                }}
              >
                {effectiveTier === 'WHOLESALE' ? '⭐ WHOLESALE ACCOUNT ACTIVE' : 'RETAIL STOREFRONT'}
              </span>

              {isAuthenticated && (
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  Customer: <strong>{user.fullName}</strong>
                </span>
              )}
            </div>

            <h2
              style={{
                fontSize: '28px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: '0 0 10px 0',
                color: '#111827'
              }}
            >
              Curated Retail & Wholesale Categories
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#6B7280',
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
                  padding: '10px 20px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(251, 192, 45, 0.12)',
                  border: '1px solid rgba(251, 192, 45, 0.35)',
                  color: '#B45309',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                <span style={{ color: '#D97706', fontSize: '15px' }}>★</span>
                <span>Verified Wholesale Partner Active</span>
              </div>
            ) : wholesaleApplication?.status === 'PENDING' ? (
              <button
                onClick={() => navigate('/wholesale-apply')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(251, 192, 45, 0.12)',
                  border: '1px solid rgba(251, 192, 45, 0.4)',
                  color: '#B45309',
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
                  padding: '12px 24px',
                  borderRadius: '9999px',
                  backgroundColor: '#111827',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
                }}
              >
                <Building2 size={16} />
                <span>Apply for Wholesale Pricing →</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pending Wholesale Review Banner */}
      {wholesaleApplication?.status === 'PENDING' && effectiveTier !== 'WHOLESALE' && (
        <div
          style={{
            padding: '16px 22px',
            borderRadius: '20px',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FCD34D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={20} color="#D97706" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: '#78350F', lineHeight: 1.5 }}>
              <strong style={{ color: '#92400E' }}>Wholesale Application Under Review:</strong> You are currently shopping on <strong>Standard Retail Pricing</strong>. Bulk wholesale prices unlock automatically once an Administrator approves your business application.
            </span>
          </div>
          <button
            onClick={() => navigate('/wholesale-apply')}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #FCD34D',
              color: '#92400E',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
            }}
          >
            Check Status
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        id="catalog-grid"
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
          style={{
            display: 'flex',
            gap: '6px',
            padding: '6px',
            overflowX: 'auto',
            maxWidth: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            borderRadius: '9999px',
            border: '1px solid rgba(0, 0, 0, 0.06)'
          }}
        >
          {CATEGORIES_LIST.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                backgroundColor: selectedCategory === cat.id ? '#111827' : 'transparent',
                color: selectedCategory === cat.id ? '#FFFFFF' : '#4B5563',
                boxShadow: selectedCategory === cat.id ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Input - Clean Apple Minimal Style */}
        <div style={{ minWidth: '280px', flex: '1 1 300px', maxWidth: '420px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '9999px',
              padding: '10px 18px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
          >
            <Search size={16} color="#9CA3AF" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search snacks, chips, SKU..."
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '13px',
                color: '#111827'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
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

            // Real-time stock count directly from DB
            const availableStockCount = product.stockQuantity !== undefined
              ? Number(product.stockQuantity)
              : (product.availableStock !== undefined ? Number(product.availableStock) : 0);

            return (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '24px',
                  minHeight: '440px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '24px',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.25s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 20px 36px -8px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(0, 0, 0, 0.06)';
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
                        color: '#9CA3AF',
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
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(0, 0, 0, 0.05)',
                          color: '#6B7280'
                        }}
                      >
                        Non-Perishable
                      </span>
                    )}
                  </div>

                  {/* Product Image Capsule from Database */}
                  <div
                    onClick={() => navigate(`/product/${product.id}`)}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      borderRadius: '18px',
                      backgroundColor: '#F5F5F7',
                      border: '1px solid rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      marginBottom: '18px',
                      padding: 0,
                      cursor: 'pointer'
                    }}
                    title="Click to view product details on dedicated page"
                  >
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          display: 'block',
                          transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)'
                        }}
                        className="catalog-product-img"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    )}
                    <div
                      className="img-fallback"
                      style={{
                        display: product.imageUrl ? 'none' : 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        height: '100%'
                      }}
                    >
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0, 0, 0, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#111827'
                        }}
                      >
                        {renderCategoryIcon(product.categoryId)}
                      </div>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '10px',
                          letterSpacing: '0.08em',
                          color: '#9CA3AF'
                        }}
                      >
                        {product.sku}
                      </span>
                    </div>
                  </div>

                  {/* Stock Availability Indicator from real DB */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      marginBottom: '10px',
                      color: availableStockCount > 10 ? '#059669' : availableStockCount > 0 ? '#D97706' : '#DC2626'
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: availableStockCount > 10 ? '#10B981' : availableStockCount > 0 ? '#F59E0B' : '#EF4444',
                        boxShadow: availableStockCount > 0 ? '0 0 6px currentColor' : 'none'
                      }}
                    />
                    <span>
                      {availableStockCount > 10
                        ? `In Stock (${availableStockCount} units)`
                        : availableStockCount > 0
                        ? `Low Stock (${availableStockCount} units left)`
                        : 'Out of Stock (0 units)'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3
                    onClick={() => navigate(`/product/${product.id}`)}
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      lineHeight: 1.35,
                      color: '#111827',
                      margin: '0 0 8px 0',
                      cursor: 'pointer'
                    }}
                  >
                    {product.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#6B7280',
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
                <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)', paddingTop: '16px' }}>
                  {effectiveTier === 'WHOLESALE' ? (
                    // WHOLESALE DUAL PRICING DISPLAY WITH MOQ THRESHOLD
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>
                          ${product.wholesalePrice.toFixed(2)}
                        </span>
                        <span
                          style={{
                            fontSize: '14px',
                            color: '#9CA3AF',
                            textDecoration: 'line-through'
                          }}
                        >
                          ${product.retailPrice.toFixed(2)}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(251, 192, 45, 0.15)',
                            color: '#B45309',
                            border: '1px solid rgba(251, 192, 45, 0.35)'
                          }}
                        >
                          WHOLESALE TIER
                        </span>
                      </div>

                      {/* Threshold Explanation */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#059669' }}>
                          <Sparkles size={12} />
                          <span>Wholesale Rate for <strong>{product.wholesaleMinQty || 10}+</strong> units (Save ${(product.retailPrice - product.wholesalePrice).toFixed(2)} · {savingsPercent}% off)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6B7280' }}>
                          <Info size={12} />
                          <span>Orders &lt; {product.wholesaleMinQty || 10} units charged at retail: <strong>${product.retailPrice.toFixed(2)}</strong></span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // RETAIL PRICING WITH BULK TIER & WHOLESALE PREVIEWS
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>
                          ${product.retailPrice.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                          Standard Retail Price
                        </span>
                      </div>

                      {/* Bulk Retail & Wholesale Preview */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#2563EB' }}>
                          <TrendingDown size={12} />
                          <span>Bulk Tier: <strong>${(product.retailPrice * 0.95).toFixed(2)}</strong> (5% off on 10+ units)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6B7280' }}>
                          <Building2 size={12} />
                          <span>B2B Wholesale: <strong>${product.wholesalePrice.toFixed(2)}</strong> (Upon Admin Approval)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card Actions: Quick Details & Add to Cart */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/product/${product.id}`)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '9999px',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        backgroundColor: '#FFFFFF',
                        color: '#111827',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F5F7')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                    >
                      Details
                    </button>

                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={availableStockCount <= 0}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '12px 16px',
                        borderRadius: '9999px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: availableStockCount <= 0 ? 'not-allowed' : 'pointer',
                        backgroundColor: availableStockCount <= 0
                          ? '#9CA3AF'
                          : isJustAdded
                          ? '#10B981'
                          : inCartQty > 0
                          ? '#111827'
                          : '#FA3E54',
                        color: '#FFFFFF',
                        boxShadow: availableStockCount <= 0
                          ? 'none'
                          : isJustAdded
                          ? '0 4px 14px rgba(16, 185, 129, 0.3)'
                          : inCartQty > 0
                          ? '0 4px 14px rgba(0, 0, 0, 0.15)'
                          : '0 4px 14px rgba(250, 62, 84, 0.35)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (availableStockCount > 0) e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        if (availableStockCount > 0) e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {availableStockCount <= 0 ? (
                        'Out of Stock'
                      ) : isJustAdded ? (
                        <>
                          <Check size={15} /> Added!
                        </>
                      ) : inCartQty > 0 ? (
                        <>
                          <ShoppingBag size={15} /> In Cart ({inCartQty}) +
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={15} /> Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
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

      {/* Real-time Floating Toast Alert */}
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
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
