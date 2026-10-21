import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { IosCardGlass } from '../../components/ui/IosCardGlass';
import { IosButton } from '../../components/ui/IosButton';
import { IosInput } from '../../components/ui/IosInput';
import { IosBadge } from '../../components/ui/IosBadge';
import { useCustomerCartStore } from '../../store/customerCartStore';
import { UserPlus, Mail, Lock, Phone, User as UserIcon, ArrowRight, CheckCircle2 } from 'lucide-react';

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
            <UserPlus size={18} />
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
                <UserPlus size={26} />
              </div>

              <div style={{ display: 'inline-flex', marginBottom: '8px' }}>
                <IosBadge variant="default">CUSTOMER SIGN UP</IosBadge>
              </div>

              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 8px 0', color: '#FFFFFF' }}>
                Customer Sign Up
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--ios-text-muted, #A1A1AA)', margin: 0, lineHeight: 1.5 }}>
                Sign up for an account to save orders, track delivery, and checkout easily.
              </p>
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '16px',
                textAlign: 'left',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: 1.45
              }}
            >
              <span>🛒 <strong>Standard Retail Account:</strong> New accounts start on Retail Pricing. If you represent a business, you can apply for wholesale; your account upgrades to <strong>Wholesale Pricing</strong> once approved by an Administrator.</span>
            </div>

            {isSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(48, 209, 88, 0.12)',
                    border: '1px solid rgba(48, 209, 88, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto'
                  }}
                >
                  <CheckCircle2 size={36} color="#30D158" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#30D158', margin: '0 0 8px 0' }}>
                  Sign Up Successful!
                </h3>
                <p style={{ fontSize: '13px', color: '#FFFFFF', margin: 0 }}>
                  Account created and signed in! Redirecting you now...
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <IosInput
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Customer Name"
                  icon={<UserIcon size={16} />}
                  required
                />

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
                  label="Phone Number"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+855 12 345 678"
                  icon={<Phone size={16} />}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <IosInput
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={<Lock size={16} />}
                    required
                  />

                  <IosInput
                    label="Confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={<Lock size={16} />}
                    required
                  />
                </div>

                {error && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#FF453A',
                      backgroundColor: 'rgba(255, 69, 58, 0.1)',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 69, 58, 0.2)'
                    }}
                  >
                    {error}
                  </div>
                )}

                <IosButton
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '6px' }}
                >
                  {isLoading ? 'Signing Up...' : 'Sign Up'} <ArrowRight size={16} />
                </IosButton>
              </form>
            )}

            {/* Links */}
            <div
              style={{
                marginTop: '24px',
                textAlign: 'center',
                fontSize: '13px',
                color: 'var(--ios-text-muted, #A1A1AA)',
                borderTop: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
                paddingTop: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div>
                Already have an account?{' '}
                <Link to={`/login${location.search}`} style={{ color: '#FFFFFF', fontWeight: 600, textDecoration: 'underline' }}>
                  Sign In
                </Link>
              </div>
              <div>
                Looking to buy bulk wholesale?{' '}
                <Link to="/wholesale-apply" style={{ color: '#FFFFFF', fontWeight: 600, textDecoration: 'underline' }}>
                  Apply for Wholesale
                </Link>
              </div>
            </div>
          </IosCardGlass>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegisterPage;
