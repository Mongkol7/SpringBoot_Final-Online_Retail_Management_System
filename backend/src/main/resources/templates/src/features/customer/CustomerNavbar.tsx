import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useCustomerCartStore } from '../../store/customerCartStore';
import { WholesaleApplyModal, WholesaleStatusBanner } from './WholesaleApplyModal';
import {
  ShoppingBag,
  ShoppingCart,
  ClipboardList,
  LogOut,
  User as UserIcon,
  LogIn,
  UserPlus,
  Building2
} from 'lucide-react';

export const CustomerNavbar: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    logout,
    getItemCount,
    getEffectiveTier,
    notification
  } = useCustomerCartStore();

  const [isWholesaleModalOpen, setIsWholesaleModalOpen] = useState(false);
  const cartCount = getItemCount();
  const effectiveTier = getEffectiveTier();
  const topOffset = notification?.message ? '68px' : '16px';

  const navLinks = [
    { to: '/shop', label: 'Category', icon: <ShoppingBag size={15} /> },
    {
      to: '/cart',
      label: 'Cart',
      icon: <ShoppingCart size={15} />,
      badge: cartCount > 0 ? cartCount : undefined
    },
    { to: '/orders', label: 'My Orders', icon: <ClipboardList size={15} /> }
  ];

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: topOffset,
          zIndex: 900,
          marginBottom: '32px',
          transition: 'top 0.25s ease'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 24px',
            gap: '16px',
            borderRadius: 'var(--ios-radius-capsule, 9999px)',
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.06)'
          }}
        >
          {/* Brand Logo */}
          <NavLink
            to="/shop"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: '#111827'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                backgroundColor: '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}
            >
              <ShoppingBag size={18} />
            </div>
            <div>
              <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', display: 'block', color: '#111827' }}>
                AURA STORE
              </span>
              <span style={{ fontSize: '10px', color: '#6B7280', display: 'block', letterSpacing: '0.04em', fontWeight: 600 }}>
                ARTISANAL CRUNCH
              </span>
            </div>
          </NavLink>

          {/* Nav Links */}
          <nav style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  backgroundColor: isActive ? '#111827' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#4B5563'
                })}
              >
                {link.icon}
                <span>{link.label}</span>
                {link.badge !== undefined && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      backgroundColor: '#FA3E54',
                      color: '#FFFFFF'
                    }}
                  >
                    {link.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Account State */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isAuthenticated ? (
              <>
                {/* Wholesale Status Banner / Action */}
                <WholesaleStatusBanner onOpenModal={() => navigate('/wholesale-register')} />

                {/* User Profile Capsule */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <UserIcon size={14} color="#4B5563" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                    {user.fullName}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: effectiveTier === 'WHOLESALE' ? '#FA3E54' : '#111827',
                      color: '#FFFFFF'
                    }}
                  >
                    {effectiveTier}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  title="Sign out of customer account"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--ios-text-subtle, #71717A)',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s ease'
                  }}
                  className="ios-glow-hover"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <NavLink
                  to="/wholesale-register"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '9999px',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#FA3E54',
                    backgroundColor: 'rgba(250, 62, 84, 0.08)',
                    border: '1px solid rgba(250, 62, 84, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(250, 62, 84, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(250, 62, 84, 0.08)')}
                >
                  <Building2 size={13} />
                  <span>Apply for Wholesale</span>
                </NavLink>

                <NavLink
                  to="/login"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#111827',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)')}
                >
                  <LogIn size={14} />
                  <span>Sign In</span>
                </NavLink>

                <NavLink
                  to="/signup"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: '9999px',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    backgroundColor: '#111827',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(17, 24, 39, 0.18)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <UserPlus size={14} />
                  <span>Sign Up</span>
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Wholesale Modal */}
      <WholesaleApplyModal
        isOpen={isWholesaleModalOpen}
        onClose={() => setIsWholesaleModalOpen(false)}
      />
    </>
  );
};
