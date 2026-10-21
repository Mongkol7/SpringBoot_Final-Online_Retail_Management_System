import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCustomerCartStore } from '../../store/customerCartStore';
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface UnifiedLoginFormProps {
  onSuccess?: () => void;
  defaultMode?: 'login' | 'register';
}

export const UnifiedLoginForm: React.FC<UnifiedLoginFormProps> = ({
  onSuccess,
  defaultMode = 'login'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const customerStore = useCustomerCartStore();

  // Mode: 'login' or 'register'
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Determine redirection destination
  const getRedirectDestination = (role: string): string => {
    const params = new URLSearchParams(location.search);
    const redirectParam = params.get('redirect');

    if (redirectParam) {
      // If customer requested a customer route (/checkout, /orders, /cart, /shop)
      if (role === 'USER') return redirectParam;
      // If staff/admin requested an admin route
      if (role === 'ADMIN' && redirectParam.startsWith('/admin')) return redirectParam;
      if (role === 'CASHIER' && redirectParam.startsWith('/pos')) return redirectParam;
      if (role === 'STOCK_CONTROLLER' && redirectParam.startsWith('/stock')) return redirectParam;
    }

    // Role default landings
    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'CASHIER':
        return '/pos';
      case 'STOCK_CONTROLLER':
        return '/stock';
      case 'USER':
      default:
        return '/shop';
    }
  };

  // Handle Sign In submission
  const handleLoginSubmit = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();

    const targetEmail = (customEmail || email).trim();
    const targetPassword = customPass || password;

    if (!targetEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!targetPassword) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Authenticate via backend JWT endpoint /api/v1/auth/login
      const sessionUser = await login(targetEmail, targetPassword);

      // 2. Sync customerCartStore for customer session consistency
      if (sessionUser.role === 'USER') {
        await customerStore.login(targetEmail, targetPassword).catch(() => {});
      }

      setSuccessMsg(`Welcome, ${sessionUser.fullName}! Directing to your workspace...`);

      if (onSuccess) {
        onSuccess();
      }

      // 3. Navigate according to role
      const dest = getRedirectDestination(sessionUser.role);
      setTimeout(() => {
        navigate(dest, { replace: true });
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up (Register) submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await customerStore.register(email.trim(), password, fullName.trim(), phone.trim());
      setSuccessMsg('Account registered successfully! Redirecting to storefront...');
      setTimeout(() => {
        navigate('/shop', { replace: true });
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Registration failed. An account with this email may already exist.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-click test fill helper
  const handleQuickFill = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError(null);
    handleLoginSubmit(undefined, fillEmail, fillPass);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F7',
        color: '#111827',
        padding: '24px 16px 60px',
        maxWidth: '1240px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Header Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '480px',
          width: '100%',
          margin: '0 auto 20px auto'
        }}
      >
        <Link
          to="/shop"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: '#111827',
            fontWeight: 800,
            fontSize: '15px'
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
          <span>AURA STORE</span>
        </Link>

        <Link
          to="/shop"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#4B5563',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            textDecoration: 'none',
            transition: 'all 0.15s ease'
          }}
        >
          ← Back to Shop
        </Link>
      </div>

      {/* Main Centered Auth Card */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%'
        }}
      >
        <div style={{ maxWidth: '480px', width: '100%' }}>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '32px',
              padding: '40px 36px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* Header Icon & Title */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '18px',
                  backgroundColor: 'rgba(17, 24, 39, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px auto',
                  color: '#111827'
                }}
              >
                <Lock size={26} />
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(17, 24, 39, 0.05)',
                  color: '#374151',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  marginBottom: '10px'
                }}
              >
                <ShieldCheck size={13} color="#059669" />
                <span>UNIFIED SECURE ACCESS</span>
              </div>

              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  margin: '2px 0 6px 0',
                  color: '#111827',
                  letterSpacing: '-0.02em'
                }}
              >
                {mode === 'login' ? 'Sign In to Your Account' : 'Create Customer Account'}
              </h1>
              <p
                style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  margin: 0,
                  lineHeight: 1.5
                }}
              >
                {mode === 'login'
                  ? 'Access your shopping orders, POS cashier register, warehouse inventory, or admin console.'
                  : 'Register a new customer account to start ordering snacks and track deliveries.'}
              </p>
            </div>

            {/* Toggle Tabs: Sign In / Create Account */}
            <div
              style={{
                display: 'flex',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '9999px',
                padding: '4px',
                marginBottom: '24px'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                style={{
                  flex: 1,
                  padding: '9px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: mode === 'login' ? '#FFFFFF' : 'transparent',
                  color: mode === 'login' ? '#111827' : '#6B7280',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: mode === 'login' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                style={{
                  flex: 1,
                  padding: '9px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: mode === 'register' ? '#FFFFFF' : 'transparent',
                  color: mode === 'register' ? '#111827' : '#6B7280',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: mode === 'register' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#DC2626',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '18px'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#059669',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '18px'
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Email Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={16}
                      color="#9CA3AF"
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@retailstore.com"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        borderRadius: '14px',
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

                {/* Password Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                      Password
                    </label>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      color="#9CA3AF"
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 42px 12px 42px',
                        borderRadius: '14px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        fontSize: '14px',
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#9CA3AF',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '9999px',
                    backgroundColor: '#111827',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                    marginTop: '8px',
                    transition: 'all 0.15s ease',
                    opacity: isLoading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {isLoading ? 'Verifying Credentials...' : 'Sign In'}
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Full Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon
                      size={16}
                      color="#9CA3AF"
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        borderRadius: '14px',
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

                {/* Email Address */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={16}
                      color="#9CA3AF"
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        borderRadius: '14px',
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

                {/* Phone Number */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                    Phone Number (Optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone
                      size={16}
                      color="#9CA3AF"
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+855 12 345 678"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        borderRadius: '14px',
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

                {/* Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                    Create Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      color="#9CA3AF"
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 4 characters"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 42px 12px 42px',
                        borderRadius: '14px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        fontSize: '14px',
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#9CA3AF',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Register Submit Button */}
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
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 20px rgba(250, 62, 84, 0.35)',
                    marginTop: '8px',
                    transition: 'all 0.15s ease',
                    opacity: isLoading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {isLoading ? 'Creating Account...' : 'Complete Registration'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* 1-Click Fast Fill Test Accounts */}
            <div
              style={{
                marginTop: '28px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#6B7280',
                  letterSpacing: '0.04em',
                  marginBottom: '10px'
                }}
              >
                <Sparkles size={13} color="#2563EB" />
                <span>FAST TEST CREDENTIALS (1-CLICK FILL):</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px'
                }}
              >
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@retailstore.com', 'admin123')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(37, 99, 235, 0.06)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.06)')}
                >
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#1D4ED8' }}>👑 Admin</span>
                  <span style={{ fontSize: '10px', color: '#6B7280' }}>admin@retailstore.com</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('cashier@retailstore.com', 'cashier123')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.06)')}
                >
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#047857' }}>💳 Cashier</span>
                  <span style={{ fontSize: '10px', color: '#6B7280' }}>cashier@retailstore.com</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('stock@retailstore.com', 'cashier123')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(245, 158, 11, 0.06)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.06)')}
                >
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#B45309' }}>📦 Stock</span>
                  <span style={{ fontSize: '10px', color: '#6B7280' }}>stock@retailstore.com</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('sarah.j@gmail.com', 'cashier123')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(236, 72, 153, 0.06)',
                    border: '1px solid rgba(236, 72, 153, 0.2)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.06)')}
                >
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#BE185D' }}>🛍️ Customer</span>
                  <span style={{ fontSize: '10px', color: '#6B7280' }}>sarah.j@gmail.com</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLoginForm;
