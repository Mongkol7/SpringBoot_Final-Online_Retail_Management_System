import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCustomerCartStore } from '../../store/customerCartStore';
import { Lock, Mail, ArrowRight, AlertCircle, ShoppingBag } from 'lucide-react';

export const CustomerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useCustomerCartStore();

  // Extract redirect query parameter if present
  const queryParams = new URLSearchParams(location.search);
  const redirectTo = queryParams.get('redirect') || '/shop';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !password.trim()) {
      setError('Email address and password are required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await login(email.trim(), password);
      navigate(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your account details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F7',
        color: '#111827',
        padding: '30px 24px 60px',
        maxWidth: '1240px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top Header (Brand & Back Button) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px'
        }}
      >
        <Link
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
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              backgroundColor: '#FA3E54',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(250, 62, 84, 0.3)'
            }}
          >
            <ShoppingBag size={20} />
          </div>
          <div>
            <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '-0.02em', display: 'block', color: '#111827' }}>
              AURA STORE
            </span>
            <span style={{ fontSize: '11px', color: '#6B7280', display: 'block', letterSpacing: '0.04em' }}>
              CUSTOMER PORTAL
            </span>
          </div>
        </Link>

        <Link
          to="/shop"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 700,
            color: '#111827',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            textDecoration: 'none'
          }}
        >
          ← Back to Storefront
        </Link>
      </div>

      {/* Main Centered Sign In Card */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ maxWidth: '440px', width: '100%' }}>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '28px',
              padding: '40px 36px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '18px',
                  backgroundColor: 'rgba(250, 62, 84, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: '#FA3E54'
                }}
              >
                <Lock size={26} />
              </div>

              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(250, 62, 84, 0.08)',
                  color: '#FA3E54',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  marginBottom: '10px'
                }}
              >
                CUSTOMER AUTHENTICATION
              </div>

              <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 8px 0', color: '#111827', letterSpacing: '-0.02em' }}>
                Customer Sign In
              </h1>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                Sign in to access your cart, live order tracking, and account profile.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@retailstore.com"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 40px',
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      fontSize: '14px',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 40px',
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      fontSize: '14px',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {error && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#DC2626',
                    backgroundColor: '#FEE2E2',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #FCA5A5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '9999px',
                  backgroundColor: '#FA3E54',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 20px rgba(250, 62, 84, 0.35)',
                  marginTop: '8px',
                  transition: 'all 0.2s ease',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'} <ArrowRight size={16} />
              </button>
            </form>

            {/* Links */}
            <div
              style={{
                marginTop: '28px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                textAlign: 'center',
                fontSize: '13px',
                color: '#6B7280',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div>
                Don't have an account?{' '}
                <Link to={`/signup${location.search}`} style={{ color: '#FA3E54', fontWeight: 700, textDecoration: 'none' }}>
                  Sign Up
                </Link>
              </div>

              <Link
                to="/shop"
                style={{
                  color: '#9CA3AF',
                  fontSize: '12px',
                  textDecoration: 'none'
                }}
              >
                Continue browsing as guest
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLoginPage;
