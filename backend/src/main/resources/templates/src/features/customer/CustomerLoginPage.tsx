import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { IosCardGlass } from '../../components/ui/IosCardGlass';
import { IosButton } from '../../components/ui/IosButton';
import { IosInput } from '../../components/ui/IosInput';
import { IosBadge } from '../../components/ui/IosBadge';
import { useCustomerCartStore } from '../../store/customerCartStore';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

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
        padding: '30px 24px 60px',
        maxWidth: '1240px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top Header Capsule (Brand & Back Button) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}
      >
        <Link
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
            <Lock size={18} />
          </div>
          <div>
            <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', display: 'block' }}>
              AURA STORE
            </span>
            <span style={{ fontSize: '10px', color: 'var(--ios-text-subtle, #71717A)', display: 'block', letterSpacing: '0.04em' }}>
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
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#FFFFFF',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
            textDecoration: 'none'
          }}
          className="ios-glow-hover"
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
        <div style={{ maxWidth: '460px', width: '100%' }}>
          <IosCardGlass glow style={{ padding: '36px 32px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: '#FFFFFF'
                }}
              >
                <Lock size={26} />
              </div>

              <div style={{ display: 'inline-flex', marginBottom: '8px' }}>
                <IosBadge variant="default">
                  CUSTOMER AUTHENTICATION
                </IosBadge>
              </div>

              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 8px 0', color: '#FFFFFF' }}>
                Customer Sign In
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--ios-text-muted, #A1A1AA)', margin: 0, lineHeight: 1.5 }}>
                Sign in to access your cart, live order tracking, and account profile.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <IosInput
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@retailstore.com"
                icon={<Mail size={16} />}
                required
              />

              <IosInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                icon={<Lock size={16} />}
                required
              />

              {error && (
                <div
                  style={{
                    fontSize: '13px',
                    color: '#FF453A',
                    backgroundColor: 'rgba(255, 69, 58, 0.12)',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 69, 58, 0.3)',
                    lineHeight: 1.4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <IosButton
                type="submit"
                variant="primary"
                disabled={isLoading}
                style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '6px' }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'} <ArrowRight size={16} />
              </IosButton>
            </form>

            {/* Links */}
            <div
              style={{
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
                textAlign: 'center',
                fontSize: '13px',
                color: 'var(--ios-text-muted, #A1A1AA)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div>
                Don't have an account?{' '}
                <Link to={`/signup${location.search}`} style={{ color: '#FFFFFF', fontWeight: 600, textDecoration: 'underline' }}>
                  Sign Up
                </Link>
              </div>

              <Link
                to="/shop"
                style={{
                  color: 'var(--ios-text-subtle, #71717A)',
                  fontSize: '12px',
                  textDecoration: 'none'
                }}
              >
                Continue browsing as guest
              </Link>
            </div>
          </IosCardGlass>
        </div>
      </div>
    </div>
  );
};

export default CustomerLoginPage;
