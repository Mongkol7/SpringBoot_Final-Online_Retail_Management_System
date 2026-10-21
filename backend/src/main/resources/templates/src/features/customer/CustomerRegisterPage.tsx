import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCustomerCartStore } from '../../store/customerCartStore';
import { UserPlus, Mail, Lock, Phone, User as UserIcon, ArrowRight, CheckCircle2, ShoppingBag } from 'lucide-react';

export const CustomerRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useCustomerCartStore();

  const queryParams = new URLSearchParams(location.search);
  const redirectTo = queryParams.get('redirect') || '/shop';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await register(email, password, fullName, phone);
      setIsSuccess(true);
      // Directly redirect to destination without asking for login again
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please check your information.');
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

      {/* Main Centered Sign Up Card */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ maxWidth: '480px', width: '100%' }}>
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
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
                <UserPlus size={26} />
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
                CUSTOMER SIGN UP
              </div>

              <h1 style={{ fontSize: '24px', fontWeight: 900, margin: '4px 0 8px 0', color: '#111827', letterSpacing: '-0.02em' }}>
                Customer Sign Up
              </h1>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                Sign up for an account to save orders, track delivery, and checkout easily.
              </p>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                marginBottom: '20px',
                textAlign: 'left',
                fontSize: '12px',
                color: '#1E40AF',
                lineHeight: 1.45
              }}
            >
              <span>🛒 <strong>Standard Retail Account:</strong> New accounts start on Retail Pricing. If you represent a business, you can apply for wholesale to unlock bulk pricing.</span>
            </div>

            {isSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto'
                  }}
                >
                  <CheckCircle2 size={36} color="#059669" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#059669', margin: '0 0 8px 0' }}>
                  Sign Up Successful!
                </h3>
                <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>
                  Account created and signed in! Redirecting you now...
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                    Full Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Customer Name"
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
                    Email Address *
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
                    Phone Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+855 12 345 678"
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                      Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
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
                      Confirm *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
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
                </div>

                {error && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#DC2626',
                      backgroundColor: '#FEE2E2',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1px solid #FCA5A5'
                    }}
                  >
                    {error}
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
                  {isLoading ? 'Signing Up...' : 'Sign Up'} <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* Links */}
            <div
              style={{
                marginTop: '28px',
                textAlign: 'center',
                fontSize: '13px',
                color: '#6B7280',
                borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                paddingTop: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div>
                Already have an account?{' '}
                <Link to={`/login${location.search}`} style={{ color: '#111827', fontWeight: 700, textDecoration: 'underline' }}>
                  Sign In
                </Link>
              </div>
              <div>
                Looking to buy bulk wholesale?{' '}
                <Link to="/wholesale-apply" style={{ color: '#FA3E54', fontWeight: 600, textDecoration: 'none' }}>
                  Apply for Wholesale
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegisterPage;
