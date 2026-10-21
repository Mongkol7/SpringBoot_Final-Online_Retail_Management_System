import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerCartStore } from '../../store/customerCartStore';
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  CreditCard,
  Building2,
  ArrowRight,
  Check,
  Heart
} from 'lucide-react';

export const CustomerFooter: React.FC = () => {
  const { isAuthenticated, user } = useCustomerCartStore();

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim() && newsletterEmail.includes('@')) {
      setSubscribed(true);
      setTimeout(() => {
        setNewsletterEmail('');
        setSubscribed(false);
      }, 4000);
    }
  };

  const trustPillars = [
    {
      icon: <Truck size={22} color="#111827" />,
      title: 'Climate-Controlled Dispatch',
      description: 'Perishable snacks & crisps dispatched fresh at peak quality.'
    },
    {
      icon: <ShieldCheck size={22} color="#059669" />,
      title: 'FIFO & FEFO Certified Fresh',
      description: 'Strict batch expiration radar guarantees zero stale items.'
    },
    {
      icon: <CreditCard size={22} color="#111827" />,
      title: 'Seamless Dual Settlement',
      description: 'Instant Card, Bank Transfer, or Cash upon delivery.'
    },
    {
      icon: <Building2 size={22} color="#FA3E54" />,
      title: 'Dual Pricing Direct Access',
      description: 'Consumer retail pricing or bulk wholesale tier discounts.'
    }
  ];

  const categoryLinks = [
    { label: 'Artisanal Potato Crisps', query: 'Artisanal Crisps' },
    { label: 'Organic Energy Bars', query: 'Healthy Snacks' },
    { label: 'Cheesy Cheddar Puffs', query: 'Artisanal Crisps' },
    { label: 'Single-Origin Dark Chocolate', query: 'Healthy Snacks' },
    { label: 'Sparkling Mineral Beverages', query: 'Beverages' }
  ];

  const accountLinks = [
    { label: 'Shopping Bag', to: '/cart' },
    { label: 'My Orders & Live Stepper', to: '/orders' },
    { label: 'Wholesale Application Portal', to: '/wholesale-register' },
    { label: isAuthenticated ? `Signed in as ${user.fullName}` : 'Customer Sign In', to: isAuthenticated ? '/orders' : '/login' }
  ];



  return (
    <footer
      style={{
        marginTop: '60px',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        color: '#111827',
        width: '100%',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.02)'
      }}
    >
      {/* 1. TRUST PILLARS STRIP */}
      <div
        style={{
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          backgroundColor: 'rgba(245, 245, 247, 0.6)'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '36px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px'
          }}
        >
          {trustPillars.map((pillar, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '16px 20px',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.03)';
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: '#F5F5F7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {pillar.icon}
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    margin: '0 0 4px 0',
                    color: '#111827',
                    lineHeight: 1.3
                  }}
                >
                  {pillar.title}
                </h4>
                <p
                  style={{
                    fontSize: '12px',
                    color: '#6B7280',
                    margin: 0,
                    lineHeight: 1.45
                  }}
                >
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MAIN FOOTER CONTENT GRID */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '60px 24px 40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '40px'
        }}
      >
        {/* Brand & Vision Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '260px' }}>
          <Link
            to="/shop"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              color: '#111827'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(17, 24, 39, 0.25)'
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  display: 'block',
                  color: '#111827'
                }}
              >
                AURA STORE
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: '#6B7280',
                  display: 'block',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                ARTISANAL CRUNCH & REFRESHMENTS
              </span>
            </div>
          </Link>

          <p
            style={{
              fontSize: '13px',
              color: '#4B5563',
              lineHeight: 1.6,
              margin: 0
            }}
          >
            Elevating everyday snacking through curated, single-origin ingredients, artisanal small batches, and automated FIFO/FEFO freshness allocation.
          </p>
        </div>

        {/* Categories Column */}
        <div>
          <h4
            style={{
              fontSize: '14px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#111827',
              marginBottom: '18px'
            }}
          >
            Curated Bites
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categoryLinks.map((item, idx) => (
              <li key={idx}>
                <Link
                  to="/shop"
                  style={{
                    fontSize: '13px',
                    color: '#4B5563',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#4B5563')}
                >
                  <span style={{ color: '#D1D5DB' }}>›</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Wholesale & Account Column */}
        <div>
          <h4
            style={{
              fontSize: '14px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#111827',
              marginBottom: '18px'
            }}
          >
            Store Journey
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {accountLinks.map((link, idx) => (
              <li key={idx}>
                <Link
                  to={link.to}
                  style={{
                    fontSize: '13px',
                    color: '#4B5563',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FA3E54')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#4B5563')}
                >
                  <span style={{ color: '#D1D5DB' }}>›</span>
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* VIP Newsletter & Enterprise Dock Column */}
        <div>
          <h4
            style={{
              fontSize: '14px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#111827',
              marginBottom: '18px'
            }}
          >
            VIP Crunch Club
          </h4>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Subscribe for limited artisanal seasonal batches, private tasting boxes, and bulk discount notifications.
          </p>

          <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email"
              style={{
                flex: 1,
                padding: '10px 14px',
                fontSize: '13px',
                borderRadius: '9999px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                backgroundColor: '#F9FAFB',
                color: '#111827',
                outline: 'none',
                minWidth: '0'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#111827')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)')}
            />
            <button
              type="submit"
              style={{
                backgroundColor: subscribed ? '#10B981' : '#FA3E54',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '9999px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: subscribed
                  ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                  : '0 4px 12px rgba(250, 62, 84, 0.35)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              {subscribed ? (
                <>
                  <Check size={14} /> Joined
                </>
              ) : (
                <>
                  <span>Join</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
            🔒 Exclusive drops and batch availability alerts. Unsubscribe at any time.
          </p>
        </div>
      </div>

      {/* 3. LEGAL & COPYRIGHT BAR */}
      <div
        style={{
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          backgroundColor: '#FAFAFA',
          padding: '20px 24px'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            fontSize: '12px',
            color: '#6B7280'
          }}
        >
          <div>
            © 2026 <strong>AURA Retail Management System</strong>. Designed with iOS 27 Vision Glass aesthetics.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Crafted with <Heart size={12} color="#FA3E54" fill="#FA3E54" /> for Artisanal Goods
            </span>
            <span>·</span>
            <Link to="/shop" style={{ color: '#6B7280', textDecoration: 'none' }}>
              Catalog
            </Link>
            <span>·</span>
            <Link to="/wholesale-register" style={{ color: '#6B7280', textDecoration: 'none' }}>
              Wholesale Terms
            </Link>
            <span>·</span>
            <Link to="/orders" style={{ color: '#6B7280', textDecoration: 'none' }}>
              Fulfillment Tracking
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
