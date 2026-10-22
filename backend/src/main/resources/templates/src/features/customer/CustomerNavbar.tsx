import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useCustomerCartStore } from '../../store/customerCartStore';
import { WholesaleApplyModal, WholesaleStatusBanner } from './WholesaleApplyModal';
import { LogoutConfirmModal } from '../../components/ui/LogoutConfirmModal';
import { UserProfileModal } from '../../components/ui/UserProfileModal';
import {
  ShoppingBag,
  ShoppingCart,
  ClipboardList,
  LogOut,
  LogIn,
  UserPlus,
  Building2,
  Edit3
} from 'lucide-react';

export const CustomerNavbar: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    updateProfile,
    refreshProfile,
    logout,
    getItemCount,
    getEffectiveTier,
    notification
  } = useCustomerCartStore();

  const [isWholesaleModalOpen, setIsWholesaleModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>('');

  const cartCount = getItemCount();
  const effectiveTier = getEffectiveTier();
  const topOffset = notification?.message ? '68px' : '16px';

  // Automatically sync profile with DB on mount, refresh, tab focus, or storage events
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

  // Load avatar from user state (DB) or localStorage caches
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
          zIndex: 1000,
          margin: '0 auto 28px',
          maxWidth: '1240px',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 24px',
            gap: '16px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)'
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

                {/* User Profile Capsule (Click to edit profile & avatar) */}
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  title="Click to edit profile and avatar"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 12px 4px 6px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.09)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)')}
                >
                  {/* Avatar Circle */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      backgroundColor: '#111827',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
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
                      <span>
                        {(user.fullName || 'User')
                          .split(' ')
                          .filter(Boolean)
                          .map((w) => w[0]?.toUpperCase())
                          .slice(0, 2)
                          .join('')}
                      </span>
                    )}
                  </div>

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

                  <Edit3 size={12} color="#9CA3AF" />
                </button>

                {/* Logout Button */}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
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

      {/* Redesigned Logout Confirmation Modal */}
      {/* User Profile & Avatar Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        user={user}
        roleLabel={effectiveTier === 'WHOLESALE' ? 'Wholesale Partner' : 'Retail Customer'}
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
          navigate('/login');
        }}
      />
    </>
  );
};
