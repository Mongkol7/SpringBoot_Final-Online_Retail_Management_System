import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopPage } from './ShopPage';
import { CartPage } from './CartPage';
import { CheckoutPage } from './CheckoutPage';
import { OrdersPage } from './OrdersPage';
import { WholesaleApplyModal } from './WholesaleApplyModal';
import { ProductDetailPage } from './ProductDetailPage';
import { WholesaleRegisterPage } from './WholesaleRegisterPage';
import { CustomerFooter } from './CustomerFooter';
import { useCustomerCartStore } from '../../store/customerCartStore';
import { LogoutConfirmModal } from '../../components/ui/LogoutConfirmModal';
import { UserProfileModal } from '../../components/ui/UserProfileModal';
import {
  ShoppingBag,
  ShoppingCart,
  ClipboardList,
  Building2,
  LogIn,
  LogOut,
  User as UserIcon,
  Edit3
} from 'lucide-react';

export type CustomerRoute = 'shop' | 'cart' | 'checkout' | 'orders' | 'wholesale' | 'product-detail';

interface CustomerAppProps {
  initialRoute?: CustomerRoute;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({ initialRoute }) => {
  const navigate = useNavigate();
  const getInitial = (): CustomerRoute => {
    if (initialRoute) return initialRoute;
    const p = window.location.pathname.toLowerCase();
    if (p.startsWith('/cart')) return 'cart';
    if (p.startsWith('/checkout')) return 'checkout';
    if (p.startsWith('/orders')) return 'orders';
    if (p.startsWith('/wholesale')) return 'wholesale';
    if (p.startsWith('/product') || p.includes('/product/')) return 'product-detail';
    return 'shop';
  };

  const [currentRoute, setCurrentRouteState] = useState<CustomerRoute>(getInitial);
  const [isWholesaleModalOpen, setIsWholesaleModalOpen] = useState(false);

  useEffect(() => {
    if (initialRoute) {
      setCurrentRouteState(initialRoute);
    }
  }, [initialRoute]);

  const setCurrentRoute = (route: CustomerRoute) => {
    setCurrentRouteState(route);
    const path = route === 'shop' ? '/' : `/${route}`;
    if (window.location.pathname !== path) {
      // Use React Router so the URL, route match, and rendered view stay in sync.
      // Direct history.pushState does not notify BrowserRouter and can leave the
      // app showing the previous page until another navigation occurs.
      navigate(path);
    }
  };

  const {
    user,
    isAuthenticated,
    logout,
    updateProfile,
    refreshProfile,
    getItemCount,
    getDisplayTier,
    checkWholesaleStatus
  } = useCustomerCartStore();

  const cartCount = getItemCount();
  const displayTier = getDisplayTier();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>('');

  // Automatically refresh profile from DB on mount, refresh, tab focus, or storage sync
  useEffect(() => {
    refreshProfile();
    const handleSync = () => {
      refreshProfile();
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [refreshProfile]);

  // Protect wholesale route: if not signed in, user cannot access wholesale registration
  useEffect(() => {
    if (currentRoute === 'wholesale' && !isAuthenticated) {
      navigate('/login?redirect=/wholesale-register');
    }
  }, [currentRoute, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      const saved =
        user.avatarUrl ||
        (user.id ? localStorage.getItem(`aura_avatar_user_${user.id}`) : null) ||
        (user.id ? localStorage.getItem(`aura_avatar_${user.id}`) : null) ||
        (user.email ? localStorage.getItem(`aura_avatar_${user.email.toLowerCase()}`) : null) ||
        localStorage.getItem('aura_avatar_current') ||
        '';
      setUserAvatar(saved);
    }
  }, [user, user?.avatarUrl]);

  const userInitials = (user?.fullName || 'User')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || 'U';

  // Background polling to automatically catch Admin Wholesale Approval
  React.useEffect(() => {
    checkWholesaleStatus();
    const interval = setInterval(() => {
      checkWholesaleStatus();
    }, 3000);
    const handleSync = () => {
      checkWholesaleStatus();
    };
    window.addEventListener('wholesale-status-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('wholesale-status-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [checkWholesaleStatus]);

  const navItems = [
    { id: 'shop' as CustomerRoute, label: 'Storefront', icon: <ShoppingBag size={16} /> },
    {
      id: 'cart' as CustomerRoute,
      label: 'Cart',
      icon: <ShoppingCart size={16} />,
      badge: cartCount > 0 ? cartCount : undefined
    },
    { id: 'orders' as CustomerRoute, label: 'My Orders', icon: <ClipboardList size={16} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Customer Sticky Navigation Capsule */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          borderRadius: '9999px',
          backgroundColor: 'var(--ios-surface-glass-1, rgba(18, 18, 20, 0.75))',
          backdropFilter: 'var(--ios-blur-deep, blur(28px))',
          WebkitBackdropFilter: 'var(--ios-blur-deep, blur(28px))',
          border: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
        }}
      >
        {/* Customer Identity Capsule (Clickable Profile Preview) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              title="Click to edit profile, phone, address & avatar"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '9999px',
                padding: '3px 10px 3px 4px',
                color: '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#FFFFFF'
                }}
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={user.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setUserAvatar('')}
                  />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.fullName || 'Customer'}
              </span>
              <Edit3 size={11} style={{ opacity: 0.7 }} />
            </button>
          ) : (
            <span
              onClick={() => navigate('/login')}
              style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}
              title="Click to Sign In"
            >
              Store Guest · <span style={{ textDecoration: 'underline', color: '#93C5FD' }}>Sign In</span>
            </span>
          )}
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '9999px',
              backgroundColor:
                isAuthenticated && displayTier === 'WHOLESALE'
                  ? 'rgba(251, 192, 45, 0.25)'
                  : isAuthenticated && displayTier === 'PENDING_WHOLESALE'
                  ? 'rgba(245, 158, 11, 0.25)'
                  : 'rgba(255, 255, 255, 0.08)',
              color:
                isAuthenticated && displayTier === 'WHOLESALE'
                  ? '#FDE047'
                  : isAuthenticated && displayTier === 'PENDING_WHOLESALE'
                  ? '#FBBF24'
                  : '#FFFFFF',
              border:
                isAuthenticated && displayTier === 'WHOLESALE'
                  ? '1px solid rgba(251, 192, 45, 0.5)'
                  : isAuthenticated && displayTier === 'PENDING_WHOLESALE'
                  ? '1px solid rgba(245, 158, 11, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.12)',
              letterSpacing: '0.04em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isAuthenticated && displayTier === 'WHOLESALE' ? (
              <>
                <span>★</span>
                <span>VERIFIED WHOLESALE</span>
              </>
            ) : isAuthenticated && displayTier === 'PENDING_WHOLESALE' ? (
              <>
                <span>⏳</span>
                <span>WHOLESALE (PENDING CONFIRMATION)</span>
              </>
            ) : (
              'RETAIL'
            )}
          </span>
        </div>

        {/* Sub-Route Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentRoute(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                backgroundColor: currentRoute === item.id ? '#FFFFFF' : 'transparent',
                color: currentRoute === item.id ? '#000000' : 'rgba(255, 255, 255, 0.75)'
              }}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    backgroundColor: currentRoute === item.id ? '#000000' : '#FFFFFF',
                    color: currentRoute === item.id ? '#FFFFFF' : '#000000'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Quick Wholesale Page Trigger Button */}
          <button
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login?redirect=/wholesale-register');
                return;
              }
              setCurrentRoute('wholesale');
            }}
            title={isAuthenticated ? 'View Wholesale Partner Status & Registration' : 'Sign in to access Wholesale Registration'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: currentRoute === 'wholesale' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.06)',
              color: currentRoute === 'wholesale' ? '#000000' : '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            className="ios-glow-hover"
          >
            <Building2 size={13} />
            <span>Wholesale</span>
          </button>

          {/* Customer Auth & Profile Buttons */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                title="Edit customer profile and delivery address"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(59, 130, 246, 0.45)',
                  backgroundColor: 'rgba(59, 130, 246, 0.18)',
                  color: '#93C5FD',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                className="ios-glow-hover"
              >
                <UserIcon size={12} />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                title="Sign Out"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: '#FCA5A5',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <LogOut size={12} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <LogIn size={12} />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => navigate('/signup')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: '1px solid #2563EB',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <UserIcon size={12} />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Redesigned Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        roleLabel="Customer"
        userName={user?.fullName}
        title="Sign out of customer account?"
        description="Your customer session will be safely cleared. Any products saved in your cart will remain available when you return."
        confirmLabel="Sign Out"
        cancelLabel="Stay Signed In"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
      />

      {/* Main View Display */}
      {currentRoute === 'shop' && (
        <ShopPage onNavigateToCart={() => setCurrentRoute('cart')} />
      )}

      {currentRoute === 'cart' && (
        <CartPage
          onNavigateToShop={() => setCurrentRoute('shop')}
          onNavigateToCheckout={() => setCurrentRoute('checkout')}
        />
      )}

      {currentRoute === 'checkout' && (
        <CheckoutPage
          onNavigateToCart={() => setCurrentRoute('cart')}
          onNavigateToShop={() => setCurrentRoute('shop')}
          onOrderSuccess={() => setCurrentRoute('shop')}
        />
      )}

      {currentRoute === 'orders' && (
        <OrdersPage onNavigateToShop={() => setCurrentRoute('shop')} />
      )}

      {currentRoute === 'wholesale' && (
        isAuthenticated ? (
          <WholesaleRegisterPage />
        ) : null
      )}

      {currentRoute === 'product-detail' && (
        <ProductDetailPage
          onNavigateToShop={() => setCurrentRoute('shop')}
          onNavigateToCart={() => setCurrentRoute('cart')}
          onNavigateToCheckout={() => setCurrentRoute('checkout')}
        />
      )}

      {/* Wholesale Modal */}
      <WholesaleApplyModal
        isOpen={isWholesaleModalOpen}
        onClose={() => setIsWholesaleModalOpen(false)}
      />

      {/* User Profile & Avatar Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        user={user}
        roleLabel={displayTier === 'WHOLESALE' ? 'Wholesale Partner' : 'Retail Customer'}
        onClose={() => setShowProfileModal(false)}
        onSave={async (updated) => {
          if (updated.avatarUrl !== undefined) {
            setUserAvatar(updated.avatarUrl);
          }
          await updateProfile({
            fullName: updated.fullName,
            phone: updated.phone,
            avatarUrl: updated.avatarUrl,
            addresses: updated.addresses,
            companyName: updated.companyName
          });
        }}
      />

      {/* Customer Footer with Developer Credits */}
      <CustomerFooter />
    </div>
  );
};
