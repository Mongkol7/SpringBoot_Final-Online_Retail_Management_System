import React, { useState } from 'react';
import { ShoppingBag, ArrowRight, Sparkles, Flame, Check, ChevronLeft, ChevronRight, Truck, ShieldCheck, Headphones, CreditCard } from 'lucide-react';
import { useCustomerCartStore } from '../../store/customerCartStore';
import { Product } from '../../types/schema';

interface SnackStorefrontBentoProps {
  onSelectCategory?: (categoryId: number) => void;
  products?: Product[];
}

export const SnackStorefrontBento: React.FC<SnackStorefrontBentoProps> = ({
  onSelectCategory,
  products = []
}) => {
  const { addToCart, setNotification, getEffectiveTier } = useCustomerCartStore();
  const effectiveTier = getEffectiveTier();
  const [addedId, setAddedId] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const findProduct = (skuOrId: string | number) => {
    return products.find((p) => p.sku === skuOrId || p.id === skuOrId);
  };

  const getProductImage = (skuOrId: string | number, fallback: string) => {
    const prod = findProduct(skuOrId);
    return prod?.imageUrl || fallback;
  };

  const getProductPrice = (skuOrId: string | number, fallbackRetail: number, fallbackWholesale: number) => {
    const prod = findProduct(skuOrId);
    if (!prod) return effectiveTier === 'WHOLESALE' ? fallbackWholesale : fallbackRetail;
    return effectiveTier === 'WHOLESALE' ? prod.wholesalePrice : prod.retailPrice;
  };

  // Best Sellers featured snack list dynamically mapped to database products
  const bestSellers = [
    {
      id: 1,
      name: findProduct('SKU-ENERGY-BAR')?.name || 'Organic Energy Bar (Almond & Honey)',
      weight: '65g / 2.3 oz',
      flavor: 'Wildflower Honey & Sprouted Quinoa',
      price: getProductPrice('SKU-ENERGY-BAR', 3.50, 2.50),
      image: getProductImage('SKU-ENERGY-BAR', '/products/energy-bar.jpg'),
      badge: 'TOP SELLER',
      badgeColor: '#FA3E54',
      productId: findProduct('SKU-ENERGY-BAR')?.id || 1
    },
    {
      id: 4,
      name: findProduct('SKU-CHIP-TRUFFLE')?.name || 'Handcrafted Truffle Potato Crisps',
      weight: '150g / 5.3 oz',
      flavor: 'Black Summer Truffle & Sea Salt',
      price: getProductPrice('SKU-CHIP-TRUFFLE', 5.50, 3.80),
      image: getProductImage('SKU-CHIP-TRUFFLE', '/products/truffle-chips.jpg'),
      badge: 'ARTISANAL',
      badgeColor: '#FBC02D',
      productId: findProduct('SKU-CHIP-TRUFFLE')?.id || 4
    },
    {
      id: 9,
      name: findProduct('SKU-CHEDDAR-PUFFS')?.name || 'Cheesy Explosion Baked Cheddar Puffs',
      weight: '120g / 4.2 oz',
      flavor: 'Aged Wisconsin Cheddar Crunch',
      price: getProductPrice('SKU-CHEDDAR-PUFFS', 4.50, 3.20),
      image: getProductImage('SKU-CHEDDAR-PUFFS', '/products/cheddar-puffs.jpg'),
      badge: 'CRUNCH FEST',
      badgeColor: '#FBC02D',
      productId: findProduct('SKU-CHEDDAR-PUFFS')?.id || 9
    },
    {
      id: 10,
      name: findProduct('SKU-SPICY-LIME')?.name || 'Spicy Chili Lime Artisanal Crisps',
      weight: '140g / 4.9 oz',
      flavor: 'Roasted Habanero & Mexican Lime',
      price: getProductPrice('SKU-SPICY-LIME', 5.25, 3.50),
      image: getProductImage('SKU-SPICY-LIME', '/products/spicy-crisps.jpg'),
      badge: 'HOT & FIERY',
      badgeColor: '#FA3E54',
      productId: findProduct('SKU-SPICY-LIME')?.id || 10
    },
    {
      id: 6,
      name: findProduct('SKU-DARK-CHOC')?.name || 'Single Origin 85% Dark Chocolate',
      weight: '100g / 3.5 oz',
      flavor: 'Ecuadorian Cacao & Caramel Crisp',
      price: getProductPrice('SKU-DARK-CHOC', 6.00, 4.20),
      image: getProductImage('SKU-DARK-CHOC', '/products/dark-chocolate.jpg'),
      badge: 'AWARD WINNING',
      badgeColor: '#2ECC71',
      productId: findProduct('SKU-DARK-CHOC')?.id || 6
    },
    {
      id: 3,
      name: findProduct('SKU-SPARKLING-H2O')?.name || 'Sparkling Mineral Water 500ml',
      weight: '500ml / 16.9 fl oz',
      flavor: 'Naturally Carbonated Spring Water',
      price: getProductPrice('SKU-SPARKLING-H2O', 2.25, 1.40),
      image: getProductImage('SKU-SPARKLING-H2O', '/products/sparkling-water.jpg'),
      badge: 'REFRESHING',
      badgeColor: '#1E88E5',
      productId: findProduct('SKU-SPARKLING-H2O')?.id || 3
    }
  ];

  const handleQuickAdd = (productId: number, name: string) => {
    const targetProduct = products.find((p) => p.id === productId) || {
      id: productId,
      name,
      sku: `SKU-${productId}`,
      categoryId: 2,
      costPrice: 2.0,
      retailPrice: 3.5,
      wholesalePrice: 2.5,
      minStockThreshold: 10,
      isPerishable: false,
      isDeleted: false,
      createdAt: '',
      updatedAt: ''
    };

    addToCart(targetProduct, 1);
    setAddedId(productId);
    setNotification({
      message: `Added ${name} to your cart!`,
      badge: 'CART ADDED'
    });
    setTimeout(() => setAddedId(null), 1200);
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', width: '100%' }}>
      {/* 1. HERO SECTION */}
      <section
        style={{
          position: 'relative',
          backgroundColor: '#F5F5F7',
          borderRadius: '28px',
          padding: '48px 40px',
          overflow: 'hidden',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '440px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
          border: '1px solid rgba(255, 255, 255, 0.4)'
        }}
      >
        {/* Giant Oversized Semi-Transparent Background Typography */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(80px, 18vw, 220px)',
            fontWeight: 900,
            letterSpacing: '0.04em',
            color: 'rgba(0, 0, 0, 0.045)',
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 1,
            whiteSpace: 'nowrap',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          CRUNCH
        </div>

        {/* Hero Left Content */}
        <div style={{ maxWidth: '520px', zIndex: 2, position: 'relative' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(250, 62, 84, 0.1)',
              color: '#FA3E54',
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '16px'
            }}
          >
            <Sparkles size={14} /> Artisanal Crunch Collection
          </div>

          <h1
            style={{
              fontSize: 'clamp(32px, 4.2vw, 54px)',
              fontWeight: 900,
              lineHeight: 1.08,
              color: '#111827',
              margin: '0 0 16px 0',
              letterSpacing: '-0.03em'
            }}
          >
            Flavor Exploding <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #FA3E54 0%, #FF6B4A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Every Single Bite.
            </span>
          </h1>

          <p
            style={{
              fontSize: '15px',
              color: '#6B7280',
              lineHeight: 1.6,
              margin: '0 0 28px 0',
              maxWidth: '460px'
            }}
          >
            Slow-cooked batch kettle chips, dark chocolate infused caramel crisp, and gourmet salted wafers crafted with zero artificial preservatives.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Bright Red Pill Button */}
            <button
              onClick={scrollToCatalog}
              style={{
                backgroundColor: '#FA3E54',
                color: '#FFFFFF',
                border: 'none',
                padding: '16px 36px',
                borderRadius: '9999px',
                fontSize: '16px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 8px 24px rgba(250, 62, 84, 0.4)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <span>Shop Now</span>
              <ArrowRight size={18} />
            </button>

            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>
              ⚡ Real-Time FIFO/FEFO Warehouse Batch Deduction
            </span>
          </div>
        </div>

        {/* Hero Right Floating 3D Snack Bag */}
        <div
          style={{
            zIndex: 2,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            minWidth: '280px',
            padding: '10px'
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '380px',
              display: 'flex',
              justifyContent: 'center',
              filter: 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.22))',
              animation: 'float 4s ease-in-out infinite'
            }}
          >
            <img
              src={getProductImage('SKU-CHIP-TRUFFLE', '/products/truffle-chips.jpg')}
              alt="Floating 3D Artisanal Chips Bag"
              style={{
                width: '100%',
                maxHeight: '380px',
                objectFit: 'contain',
                borderRadius: '24px',
                mixBlendMode: 'multiply'
              }}
            />
          </div>
        </div>
      </section>

      {/* 2. COLORFUL BENTO CATEGORY GRID */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#111827', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Explore Snack Bento Categories
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
              Curated flavor worlds designed for instant craving satisfaction.
            </p>
          </div>
          <button
            onClick={scrollToCatalog}
            style={{
              background: 'none',
              border: 'none',
              color: '#FA3E54',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>View All Categories</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '24px'
          }}
        >
          {/* 1. Dark Charcoal Card - Asymmetrical Span 7 */}
          <div
            onClick={() => onSelectCategory && onSelectCategory(2)}
            style={{
              gridColumn: 'span 7',
              backgroundColor: '#18181B',
              borderRadius: '28px',
              padding: '34px 32px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '290px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.38), 0 0 1px rgba(0, 0, 0, 0.2)',
              position: 'relative',
              overflow: 'visible',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-6px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {/* 3D Floating Snack Pack Render from DB popping out */}
            <div
              style={{
                position: 'absolute',
                right: '-18px',
                top: '-20px',
                width: '185px',
                height: '185px',
                zIndex: 3,
                pointerEvents: 'none',
                filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.45))'
              }}
            >
              <img
                src={getProductImage('SKU-DARK-CHOC', '/products/dark-chocolate.jpg')}
                alt="Smoky BBQ & Dark Cacao"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '20px',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  transform: 'rotate(-8deg) scale(1.08)'
                }}
              />
            </div>

            <div style={{ zIndex: 2, maxWidth: '280px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#A1A1AA',
                  display: 'block',
                  marginBottom: '8px'
                }}
              >
                Charcoal Roasted
              </span>
              <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                Smoky BBQ & Dark Cacao
              </h3>
              <p style={{ fontSize: '13px', color: '#A1A1AA', lineHeight: 1.5, margin: 0 }}>
                Roasted barbecue almonds, salted cacao nibs, and single-origin dark chocolate pretzels.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', zIndex: 2 }}>
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Browse Roasted</span>
                <ArrowRight size={12} />
              </span>
            </div>
          </div>

          {/* 2. Vivid Mustard Yellow Card (#FBC02D) - Asymmetrical Span 5 */}
          <div
            onClick={() => onSelectCategory && onSelectCategory(2)}
            style={{
              gridColumn: 'span 5',
              backgroundColor: '#FBC02D',
              borderRadius: '28px',
              padding: '34px 30px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '290px',
              boxShadow: '0 25px 50px -10px rgba(251, 192, 45, 0.45), 0 0 1px rgba(0, 0, 0, 0.08)',
              position: 'relative',
              overflow: 'visible',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-6px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {/* 3D Floating Cheddar Puffs Pack breaking out of card border */}
            <div
              style={{
                position: 'absolute',
                right: '-22px',
                top: '-18px',
                width: '180px',
                height: '180px',
                zIndex: 3,
                pointerEvents: 'none',
                filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.35))'
              }}
            >
              <img
                src={getProductImage('SKU-CHEDDAR-PUFFS', '/products/cheddar-puffs.jpg')}
                alt="Cheesy Explosion Baked Cheddar Puffs"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '20px',
                  mixBlendMode: 'multiply',
                  transform: 'rotate(10deg) scale(1.15)'
                }}
              />
            </div>

            <div style={{ zIndex: 2, maxWidth: '220px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#78350F',
                  display: 'block',
                  marginBottom: '8px'
                }}
              >
                Golden Crunch
              </span>
              <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                Cheesy Explosion
              </h3>
              <p style={{ fontSize: '13px', color: '#451A03', lineHeight: 1.5, margin: 0 }}>
                Wisconsin cheddar baked puffs and crispy nacho triangles overflowing with cheese.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', zIndex: 2 }}>
              <span
                style={{
                  backgroundColor: '#1E293B',
                  color: '#FFFFFF',
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Browse Cheesy</span>
                <ArrowRight size={12} />
              </span>
            </div>
          </div>

          {/* 3. Vivid Coral/Red Card (#FA3E54) - Asymmetrical Span 4 */}
          <div
            onClick={() => onSelectCategory && onSelectCategory(2)}
            style={{
              gridColumn: 'span 4',
              backgroundColor: '#FA3E54',
              borderRadius: '28px',
              padding: '32px 28px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '280px',
              boxShadow: '0 25px 50px -10px rgba(250, 62, 84, 0.48), 0 0 1px rgba(0, 0, 0, 0.08)',
              position: 'relative',
              overflow: 'visible',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-6px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {/* 3D Floating Spicy Crisps Pack breaking out of container */}
            <div
              style={{
                position: 'absolute',
                right: '-24px',
                top: '-18px',
                width: '175px',
                height: '175px',
                zIndex: 3,
                pointerEvents: 'none',
                filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.42))'
              }}
            >
              <img
                src={getProductImage('SKU-SPICY-LIME', '/products/spicy-crisps.jpg')}
                alt="Spicy Chili Lime Artisanal Crisps"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '20px',
                  mixBlendMode: 'multiply',
                  transform: 'rotate(-12deg) scale(1.18)'
                }}
              />
            </div>

            <div style={{ zIndex: 2, maxWidth: '200px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#FFE4E6',
                  display: 'block',
                  marginBottom: '8px'
                }}
              >
                Fiery Heat
              </span>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                Spicy Chili Lime
              </h3>
              <p style={{ fontSize: '13px', color: '#FFF1F2', lineHeight: 1.5, margin: 0 }}>
                Tangy Mexican lime zest paired with roasted habanero chili crunches.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', zIndex: 2 }}>
              <span
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#FA3E54',
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Feel The Heat</span>
                <ArrowRight size={12} />
              </span>
            </div>
          </div>

          {/* 4. Minimalist Clean White Card - Asymmetrical Span 4 */}
          <div
            onClick={() => onSelectCategory && onSelectCategory(2)}
            style={{
              gridColumn: 'span 4',
              backgroundColor: '#FFFFFF',
              borderRadius: '28px',
              padding: '32px 28px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '280px',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.07), 0 0 1px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'visible',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-6px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {/* 3D Floating Truffle Chips Pack popping out */}
            <div
              style={{
                position: 'absolute',
                right: '-20px',
                top: '-18px',
                width: '175px',
                height: '175px',
                zIndex: 3,
                pointerEvents: 'none',
                filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.25))'
              }}
            >
              <img
                src={getProductImage('SKU-CHIP-TRUFFLE', '/products/truffle-chips.jpg')}
                alt="Handcrafted Truffle Crisps"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '20px',
                  mixBlendMode: 'multiply',
                  transform: 'rotate(8deg) scale(1.15)'
                }}
              />
            </div>

            <div style={{ zIndex: 2, maxWidth: '200px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#64748B',
                  display: 'block',
                  marginBottom: '8px'
                }}
              >
                Minimalist Confectionery
              </span>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                Handcrafted Truffle Crisps
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Delicate kettle-cooked crisps dusted with black summer truffle & sea salt.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', zIndex: 2 }}>
              <span
                style={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Discover Crisps</span>
                <ArrowRight size={12} />
              </span>
            </div>
          </div>

          {/* 5. Mint Green Card (#2ECC71) - Asymmetrical Span 4 */}
          <div
            onClick={() => onSelectCategory && onSelectCategory(1)}
            style={{
              gridColumn: 'span 4',
              backgroundColor: '#2ECC71',
              borderRadius: '28px',
              padding: '32px 28px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '280px',
              boxShadow: '0 25px 50px -10px rgba(46, 204, 113, 0.45), 0 0 1px rgba(0, 0, 0, 0.08)',
              position: 'relative',
              overflow: 'visible',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-6px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {/* 3D Floating Matcha Can popping out */}
            <div
              style={{
                position: 'absolute',
                right: '-18px',
                top: '-16px',
                width: '175px',
                height: '175px',
                zIndex: 3,
                pointerEvents: 'none',
                filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.32))'
              }}
            >
              <img
                src={getProductImage('SKU-MATCHA-LATTE', '/products/matcha-latte.jpg')}
                alt="Ceremonial Grade Matcha Can"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '20px',
                  mixBlendMode: 'multiply',
                  transform: 'rotate(-8deg) scale(1.12)'
                }}
              />
            </div>

            <div style={{ zIndex: 2, maxWidth: '200px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#064E3B',
                  display: 'block',
                  marginBottom: '8px'
                }}
              >
                Organic Plant Energy
              </span>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#064E3B', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                Organic Matcha Bites
              </h3>
              <p style={{ fontSize: '13px', color: '#065F46', lineHeight: 1.5, margin: 0 }}>
                Japanese Uji ceremonial matcha blended with cold-pressed almond milk & seeds.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', zIndex: 2 }}>
              <span
                style={{
                  backgroundColor: '#064E3B',
                  color: '#FFFFFF',
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Go Organic</span>
                <ArrowRight size={12} />
              </span>
            </div>
          </div>

          {/* 6. Electric Sky Blue Card (#1E88E5) - Asymmetrical Span 12 Banner */}
          <div
            onClick={() => onSelectCategory && onSelectCategory(1)}
            style={{
              gridColumn: 'span 12',
              backgroundColor: '#1E88E5',
              borderRadius: '28px',
              padding: '38px 44px',
              cursor: 'pointer',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: '230px',
              boxShadow: '0 25px 50px -10px rgba(30, 136, 229, 0.45), 0 0 1px rgba(0, 0, 0, 0.08)',
              position: 'relative',
              overflow: 'visible',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-6px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ zIndex: 2, maxWidth: '540px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#E0F2FE',
                  display: 'block',
                  marginBottom: '8px'
                }}
              >
                Refreshing Drinks & Chews
              </span>
              <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                Electric Sky Fizz & Natural Bubbles
              </h3>
              <p style={{ fontSize: '14px', color: '#F0F9FF', lineHeight: 1.6, margin: 0 }}>
                Naturally carbonated spring water bottled at the source in recycled glass. Refreshing crisp bubbles that elevate every snack experience.
              </p>
              <div style={{ marginTop: '22px' }}>
                <span
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#1E88E5',
                    padding: '10px 24px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <span>Explore Drinks Collection</span>
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>

            {/* 3D Floating Sparkling Water bottle popping out */}
            <div
              style={{
                position: 'relative',
                zIndex: 3,
                pointerEvents: 'none',
                filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.38))',
                marginRight: '20px'
              }}
            >
              <img
                src={getProductImage('SKU-SPARKLING-H2O', '/products/sparkling-water.jpg')}
                alt="Sparkling Mineral Water"
                style={{
                  width: '230px',
                  height: '230px',
                  objectFit: 'contain',
                  borderRadius: '24px',
                  mixBlendMode: 'multiply',
                  transform: 'rotate(8deg) scale(1.15)'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2.5. TRUST FEATURES BAR (Directly matching PHLOX Reference Design) */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          padding: '28px 24px',
          borderRadius: '24px',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(250, 62, 84, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FA3E54',
              flexShrink: 0
            }}
          >
            <Truck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>
              Free Shipping
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              Free Shipping On All Orders
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(250, 62, 84, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FA3E54',
              flexShrink: 0
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>
              Batch Freshness
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              100% FEFO/FIFO Quality Guarantee
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(250, 62, 84, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FA3E54',
              flexShrink: 0
            }}
          >
            <Headphones size={22} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>
              Online Support 24/7
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              Dedicated B2B & Retail Support
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(250, 62, 84, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FA3E54',
              flexShrink: 0
            }}
          >
            <CreditCard size={22} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>
              Secure Payment
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              Real-Time Batch Allocation
            </div>
          </div>
        </div>
      </section>

      {/* 3. WIDE PROMO BANNER */}
      <section
        style={{
          borderRadius: '28px',
          background: 'linear-gradient(135deg, #FA3E54 0%, #D90429 60%, #9B0014 100%)',
          padding: '40px 44px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          boxShadow: '0 20px 40px rgba(250, 62, 84, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Background ambient decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ maxWidth: '600px', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '14px'
            }}
          >
            <Flame size={14} /> Limited-Time Event
          </div>

          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              margin: '0 0 12px 0'
            }}
          >
            SUMMER CRUNCH SALE — 20% OFF
          </h2>

          <p
            style={{
              fontSize: '15px',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.6,
              margin: '0 0 24px 0',
              maxWidth: '520px'
            }}
          >
            Unlock volume discounts on our bestselling artisanal chocolate bars, kettle crisps, and cold brews. Applies automatically across retail and wholesale tiers.
          </p>

          <button
            onClick={scrollToCatalog}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#D90429',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '9999px',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span>Claim 20% Off Now</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Promo Hero Chocolate Bar Graphic */}
        <div
          style={{
            zIndex: 2,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <img
            src={getProductImage('SKU-DARK-CHOC', '/products/dark-chocolate.jpg')}
            alt="Hero Artisanal Chocolate Pack"
            style={{
              width: '260px',
              height: '260px',
              objectFit: 'contain',
              borderRadius: '24px',
              border: '2px solid rgba(255, 255, 255, 0.25)',
              filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.35))'
            }}
          />
        </div>
      </section>

      {/* 4. CAROUSEL / BEST SELLERS GRID - Option 1: Clean White Cards with Bright Red Buttons */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', margin: '0 0 6px 0' }}>
              Best Sellers Showcase
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
              Crowd favorite artisanal snacks and cold drinks, rated 4.9/5 by snack lovers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCarouselIndex((prev) => Math.max(0, prev - 1))}
              disabled={carouselIndex === 0}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: carouselIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: carouselIndex === 0 ? 0.35 : 1
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCarouselIndex((prev) => Math.min(bestSellers.length - 1, prev + 1))}
              disabled={carouselIndex === bestSellers.length - 1}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: carouselIndex === bestSellers.length - 1 ? 'not-allowed' : 'pointer',
                opacity: carouselIndex === bestSellers.length - 1 ? 0.35 : 1
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Horizontal Row of Four Minimalist White Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px'
          }}
        >
          {bestSellers.map((item) => {
            const isJustAdded = addedId === item.productId;
            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '24px',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
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
                {/* Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: `${item.badgeColor}15`,
                      border: `1px solid ${item.badgeColor}40`,
                      color: item.badgeColor
                    }}
                  >
                    {item.badge}
                  </span>
                  <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>
                    {item.weight}
                  </span>
                </div>

                {/* Product Thumbnail */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    backgroundColor: '#F5F5F7',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    padding: 0
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      transition: 'transform 0.35s ease'
                    }}
                  />
                </div>

                {/* Info */}
                <div>
                  <h4
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#111827',
                      margin: '0 0 4px 0',
                      lineHeight: 1.3
                    }}
                  >
                    {item.name}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 16px 0' }}>
                    {item.flavor}
                  </p>
                </div>

                {/* Bottom Row: Price & Bright Red Cart Button */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                    paddingTop: '14px'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                      {effectiveTier} Price
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#111827' }}>
                      ${item.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Bright Red Pill Cart Button */}
                  <button
                    onClick={() => handleQuickAdd(item.productId, item.name)}
                    style={{
                      backgroundColor: isJustAdded ? '#10B981' : '#FA3E54',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isJustAdded
                        ? '0 4px 14px rgba(16, 185, 129, 0.3)'
                        : '0 4px 14px rgba(250, 62, 84, 0.35)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {isJustAdded ? (
                      <>
                        <Check size={14} /> Added
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={14} /> Add
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
