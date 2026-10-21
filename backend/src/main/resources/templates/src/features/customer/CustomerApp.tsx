import React, { useState } from 'react';
import { ShopPage } from './ShopPage';
import { CartPage } from './CartPage';
import { CheckoutPage } from './CheckoutPage';
import { OrdersPage } from './OrdersPage';
import { WholesaleApplyModal } from './WholesaleApplyModal';
import { WholesaleRegisterPage } from './WholesaleRegisterPage';
import { useCustomerCartStore } from '../../store/customerCartStore';
import {
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  ClipboardList,
  Building2
} from 'lucide-react';

export type CustomerRoute = 'shop' | 'cart' | 'checkout' | 'orders' | 'wholesale';

export const CustomerApp: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<CustomerRoute>('shop');
  const [isWholesaleModalOpen, setIsWholesaleModalOpen] = useState(false);

  const {
    user,
    getItemCount,
    getEffectiveTier
  } = useCustomerCartStore();

  const cartCount = getItemCount();
  const effectiveTier = getEffectiveTier();

  const navItems = [
    { id: 'shop' as CustomerRoute, label: 'Storefront', icon: <ShoppingBag size={16} /> },
    {
      id: 'cart' as CustomerRoute,
      label: 'Cart',
      icon: <ShoppingCart size={16} />,
      badge: cartCount > 0 ? cartCount : undefined
    },
    { id: 'checkout' as CustomerRoute, label: 'Checkout', icon: <CreditCard size={16} /> },
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
        {/* Customer Identity Capsule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
            {user.fullName}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: effectiveTier === 'WHOLESALE' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              letterSpacing: '0.04em'
            }}
          >
            {effectiveTier}
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

        {/* Quick Wholesale Page Trigger Button */}
        <button
          onClick={() => setCurrentRoute('wholesale')}
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
          <span>Wholesale Portal</span>
        </button>
      </div>

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
        <WholesaleRegisterPage />
      )}

      {/* Wholesale Modal */}
      <WholesaleApplyModal
        isOpen={isWholesaleModalOpen}
        onClose={() => setIsWholesaleModalOpen(false)}
      />
    </div>
  );
};
