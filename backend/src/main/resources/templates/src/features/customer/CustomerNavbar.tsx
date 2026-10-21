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
    getEffectiveTier
  } = useCustomerCartStore();

  const [isWholesaleModalOpen, setIsWholesaleModalOpen] = useState(false);
  const cartCount = getItemCount();
  const effectiveTier = getEffectiveTier();

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
          top: '68px',
          zIndex: 900,
          marginBottom: '32px'
        }}
      >
        <div
          className="ios-glass-panel"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 24px',
            gap: '16px',
            borderRadius: 'var(--ios-radius-capsule, 9999px)'
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
              color: '#FFFFFF'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000'
              }}
            >
              <ShoppingBag size={18} />
            </div>
            <div>
              <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', display: 'block' }}>
                AURA STORE
              </span>
              <span style={{ fontSize: '10px', color: 'var(--ios-text-subtle, #71717A)', display: 'block', letterSpacing: '0.04em' }}>
                CUSTOMER PORTAL
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
                  backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.75)'
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
                      backgroundColor: '#000000',
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
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <UserIcon size={14} color="#A1A1AA" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                    {user.fullName}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: effectiveTier === 'WHOLESALE' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)',
                      color: effectiveTier === 'WHOLESALE' ? '#000000' : '#FFFFFF'
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
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.18)'
                  }}
                  className="ios-glow-hover"
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
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))'
                  }}
                  className="ios-glow-hover"
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
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#000000',
                    backgroundColor: '#FFFFFF',
                    border: 'none'
                  }}
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
