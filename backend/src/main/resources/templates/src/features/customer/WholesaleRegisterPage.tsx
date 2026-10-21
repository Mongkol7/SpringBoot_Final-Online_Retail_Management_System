import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IosCardGlass } from '../../components/ui/IosCardGlass';
import { IosButton } from '../../components/ui/IosButton';
import { IosInput } from '../../components/ui/IosInput';
import { IosBadge } from '../../components/ui/IosBadge';
import { useCustomerCartStore } from '../../store/customerCartStore';
import {
  Building2,
  FileText,
  Phone,
  Mail,
  Lock,
  User as UserIcon,
  CheckCircle2,
  ArrowRight,
  Clock,
  ShoppingBag,
  Info
} from 'lucide-react';

export const WholesaleRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    wholesaleApplication,
    register,
    login,
    submitWholesaleApplication,
    getEffectiveTier
  } = useCustomerCartStore();

  const currentStatus =
    user.customerType === 'WHOLESALE' || getEffectiveTier() === 'WHOLESALE' || wholesaleApplication?.status === 'APPROVED'
      ? 'APPROVED'
      : (wholesaleApplication?.status || 'NONE');

  const [showForm, setShowForm] = useState(false);

  // Registration form states
  const [fullName, setFullName] = useState(isAuthenticated ? user.fullName : '');
  const [email, setEmail] = useState(isAuthenticated ? user.email : '');
  const [phone, setPhone] = useState(isAuthenticated ? user.phone || '' : '');
  const [companyName, setCompanyName] = useState(
    wholesaleApplication?.businessName || wholesaleApplication?.companyName || ''
  );
  const [taxId, setTaxId] = useState(
    wholesaleApplication?.taxIdOrLicense || ''
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim() || !taxId.trim()) {
      setError('Please provide your Company / Business Name and Tax ID.');
      return;
    }

    if (!isAuthenticated) {
      if (!fullName.trim() || !email.trim() || !password.trim()) {
        setError('Please fill in your name, email, and password.');
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
    }

    try {
      setIsLoading(true);
      setError(null);

      if (!isAuthenticated) {
        // Step 1: Register fresh account
        await register(email, password, fullName, phone);

        // Step 2: Log in
        try {
          await login(email, password);
        } catch {
          // Fallback offline login
        }
      }

      // Step 3: Submit wholesale registration
      await submitWholesaleApplication(
        companyName,
        taxId,
        phone || email,
        'Commercial Wholesale Account'
      );

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Wholesale registration failed. Please check your information.');
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
      {/* Top Simple Brand & Back Bar (NO Catalog or Cart Tabs) */}
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
            <Building2 size={18} />
          </div>
          <div>
            <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', display: 'block' }}>
              AURA STORE
            </span>
            <span style={{ fontSize: '10px', color: 'var(--ios-text-subtle, #71717A)', display: 'block', letterSpacing: '0.04em' }}>
              WHOLESALE REGISTRATION
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

      {/* Centered Wholesale Register Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ maxWidth: '520px', width: '100%' }}>
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
              <Building2 size={26} />
            </div>

            <div style={{ display: 'inline-flex', marginBottom: '8px' }}>
              <IosBadge variant="wholesale">B2B WHOLESALE REGISTRATION</IosBadge>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 8px 0', color: '#FFFFFF' }}>
              Register for Wholesale
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--ios-text-muted, #A1A1AA)', margin: 0, lineHeight: 1.5 }}>
              Register your business to unlock wholesale volume discounts and bulk batch ordering.
            </p>
          </div>

          {/* 3-Step Process Flow Visual Indicator */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '24px'
            }}
          >
            {/* Step 1 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#30D158',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}>
                <span>✓ Step 1</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Customer Sign Up</div>
              <div style={{ fontSize: '10px', color: '#A1A1AA' }}>Retail Account Active</div>
            </div>

            {/* Step 2 */}
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', borderRight: '1px solid rgba(255, 255, 255, 0.08)', padding: '0 4px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                color: currentStatus === 'PENDING' ? '#FF9F0A' : currentStatus === 'APPROVED' ? '#30D158' : '#0A84FF',
                marginBottom: '2px'
              }}>
                {currentStatus === 'APPROVED' ? '✓ Step 2' : 'Step 2'}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Apply Wholesale</div>
              <div style={{ fontSize: '10px', color: '#A1A1AA' }}>
                {currentStatus === 'PENDING' ? 'Pending Review' : 'Company & Tax ID'}
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                color: currentStatus === 'APPROVED' ? '#30D158' : '#A1A1AA',
                marginBottom: '2px'
              }}>
                {currentStatus === 'APPROVED' ? '✓ Step 3' : 'Step 3'}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: currentStatus === 'APPROVED' ? '#30D158' : '#FFFFFF' }}>
                Admin Approval
              </div>
              <div style={{ fontSize: '10px', color: '#A1A1AA' }}>
                {currentStatus === 'APPROVED' ? 'Wholesale Unlocked' : 'Required for Bulk'}
              </div>
            </div>
          </div>

          {/* State A: Success confirmation */}
          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(48, 209, 88, 0.14)',
                  border: '1px solid rgba(48, 209, 88, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}
              >
                <CheckCircle2 size={36} color="#30D158" />
              </div>
              <div style={{ display: 'inline-flex', marginBottom: '10px' }}>
                <IosBadge variant="info">CURRENT STATUS: RETAIL CUSTOMER</IosBadge>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#30D158', margin: '0 0 8px 0' }}>
                Wholesale Application Submitted!
              </h3>
              <p style={{ fontSize: '13px', color: '#FFFFFF', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Your business <strong>{companyName}</strong> (Tax ID: {taxId}) is now under administrator review.
              </p>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(10, 132, 255, 0.08)',
                  border: '1px solid rgba(10, 132, 255, 0.22)',
                  marginBottom: '20px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <Info size={18} color="#0A84FF" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.45 }}>
                  <strong style={{ color: '#0A84FF' }}>Active on Retail:</strong> While your application is pending Admin verification, you can shop at standard retail prices immediately. Wholesale bulk pricing unlocks as soon as an Administrator approves your account.
                </div>
              </div>

              <IosButton variant="glass" onClick={() => navigate('/shop')} style={{ width: '100%' }}>
                Continue Shopping as Retail
              </IosButton>
            </div>
          ) : currentStatus === 'APPROVED' && !showForm ? (
            /* State B: Already an Approved Wholesale Partner */
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(48, 209, 88, 0.14)',
                  border: '1px solid rgba(48, 209, 88, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}
              >
                <CheckCircle2 size={36} color="#30D158" />
              </div>
              <div style={{ display: 'inline-flex', marginBottom: '8px' }}>
                <IosBadge variant="wholesale" glow>WHOLESALE APPROVED</IosBadge>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#30D158', margin: '0 0 6px 0' }}>
                Verified Wholesale Partner Active
              </h3>
              <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '0 0 20px 0' }}>
                Your enterprise account <strong>{wholesaleApplication?.businessName || companyName}</strong> is verified. Wholesale pricing is active across all categories.
              </p>
              <IosButton variant="primary" onClick={() => navigate('/shop')} style={{ width: '100%', padding: '14px', marginBottom: '10px' }}>
                <ShoppingBag size={16} /> Open Wholesale Categories
              </IosButton>
              <IosButton variant="glass" onClick={() => setShowForm(true)} style={{ width: '100%' }}>
                ✏️ Update Company / Business Details
              </IosButton>
            </div>
          ) : currentStatus === 'PENDING' && !showForm ? (
            /* State C: Currently Pending Review */
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 159, 10, 0.14)',
                  border: '1px solid rgba(255, 159, 10, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto'
                }}
              >
                <Clock size={36} color="#FF9F0A" />
              </div>
              <div style={{ display: 'inline-flex', marginBottom: '8px' }}>
                <IosBadge variant="warning">STATUS: PENDING REVIEW (CURRENTLY RETAIL)</IosBadge>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FF9F0A', margin: '0 0 6px 0' }}>
                Wholesale Application Under Review
              </h3>
              <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Your application for <strong>{wholesaleApplication?.businessName || companyName}</strong> (Tax ID: {wholesaleApplication?.taxIdOrLicense || taxId}) is in the administrator queue.
              </p>

              {/* Status Comparison breakdown */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 159, 10, 0.08)',
                  border: '1px solid rgba(255, 159, 10, 0.25)',
                  textAlign: 'left',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#A1A1AA' }}>Current Account Tier:</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>🛒 Standard Retail</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#A1A1AA' }}>Wholesale Status:</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF9F0A' }}>⏳ Pending Admin Approval</span>
                </div>
                <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: 1.45 }}>
                  Until an Administrator verifies and approves your application, your catalog and cart remain on <strong>Retail Pricing</strong>. Wholesale bulk pricing activates automatically once approved.
                </p>
              </div>

              <IosButton variant="glass" onClick={() => navigate('/shop')} style={{ width: '100%', marginBottom: '10px' }}>
                Browse Storefront as Retail
              </IosButton>

              <IosButton variant="glass" onClick={() => setShowForm(true)} style={{ width: '100%' }}>
                ✏️ Re-submit / Edit Business Registration Form
              </IosButton>
            </div>
          ) : (
            /* State D: Registration Form (Clean: NO categories, NO industry dropdowns!) */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {showForm && currentStatus !== 'NONE' && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'none',
                    border: 'none',
                    color: '#0A84FF',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '0 0 4px 0'
                  }}
                >
                  ← Back to Status Overview
                </button>
              )}
              {/* Explanatory Approval Notice */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(10, 132, 255, 0.08)',
                  border: '1px solid rgba(10, 132, 255, 0.22)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  textAlign: 'left'
                }}
              >
                <Info size={18} color="#0A84FF" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.45 }}>
                  <strong style={{ color: '#0A84FF' }}>Admin Approval Required:</strong> You will be registered as a <strong>Retail Customer</strong> immediately so you can start browsing. Once the Administrator reviews and approves your business tax ID, your tier automatically upgrades to <strong>Wholesale Pricing</strong>.
                </div>
              </div>
              {/* Full Name */}
              <IosInput
                label="Full Name (Representative) *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Customer Name"
                icon={<UserIcon size={16} />}
                required
              />

              {/* Official Business Email */}
              <IosInput
                label="Official Business Email *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sales@company.com"
                icon={<Mail size={16} />}
                required
              />

              {/* Phone Number */}
              <IosInput
                label="Business Phone Number *"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+855 12 849 201"
                icon={<Phone size={16} />}
                required
              />

              {/* Company / Business Name */}
              <IosInput
                label="Company / Business Name *"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Wholesale Trading Co."
                icon={<Building2 size={16} />}
                required
              />

              {/* Business Registration / Tax ID */}
              <IosInput
                label="Business Registration / Tax ID *"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="e.g. KH-VAT-90284192"
                icon={<FileText size={16} />}
                required
              />

              {/* Passwords (only required for new unauthenticated visitors) */}
              {!isAuthenticated && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <IosInput
                    label="Password *"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={<Lock size={16} />}
                    required
                  />

                  <IosInput
                    label="Confirm Password *"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={<Lock size={16} />}
                    required
                  />
                </div>
              )}

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
                {isLoading ? 'Registering Wholesale...' : 'Register Wholesale Account'} <ArrowRight size={16} />
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
              <Link to="/login" style={{ color: '#FFFFFF', fontWeight: 600, textDecoration: 'underline' }}>
                Sign In
              </Link>
            </div>
            <div>
              Want regular consumer purchases?{' '}
              <Link to="/signup" style={{ color: '#A1A1AA', textDecoration: 'underline' }}>
                Customer Sign Up
              </Link>
              {' · '}
              <Link to="/shop" style={{ color: '#A1A1AA', textDecoration: 'underline' }}>
                Browse Categories
              </Link>
            </div>
          </div>
        </IosCardGlass>
        </div>
      </div>
    </div>
  );
};

export default WholesaleRegisterPage;
