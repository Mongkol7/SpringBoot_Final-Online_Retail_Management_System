import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  React.useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevColor = document.body.style.color;
    document.body.style.backgroundColor = '#F5F5F7';
    document.body.style.color = '#111827';
    return () => {
      document.body.style.backgroundColor = prevBg;
      document.body.style.color = prevColor;
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#F5F5F7',
        color: '#111827',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '30px 24px 60px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}
      >
        {/* Top Simple Brand & Back Bar */}
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
            <Building2 size={20} />
          </div>
          <div>
            <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '-0.02em', display: 'block', color: '#111827' }}>
              AURA STORE
            </span>
            <span style={{ fontSize: '11px', color: '#6B7280', display: 'block', letterSpacing: '0.04em' }}>
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
            padding: '10px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 700,
            color: '#111827',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          }}
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
        <div
          style={{
            maxWidth: '540px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '30px 30px 24px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: 'rgba(250, 62, 84, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto',
                color: '#FA3E54'
              }}
            >
              <Building2 size={24} />
            </div>

            <div
              style={{
                display: 'inline-block',
                padding: '3px 12px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(250, 62, 84, 0.08)',
                color: '#FA3E54',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                marginBottom: '6px'
              }}
            >
              B2B WHOLESALE REGISTRATION
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: 900, margin: '2px 0 6px 0', color: '#111827', letterSpacing: '-0.02em' }}>
              Register for Wholesale
            </h1>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.45 }}>
              Register your business to unlock wholesale volume discounts and bulk batch ordering.
            </p>
          </div>

          {/* 3-Step Process Flow Visual Indicator */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              padding: '10px 10px',
              borderRadius: '16px',
              backgroundColor: '#F5F5F7',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              marginBottom: '18px'
            }}
          >
            {/* Step 1 */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#059669',
                  marginBottom: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <span>✓ Step 1</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#111827' }}>Customer Sign Up</div>
              <div style={{ fontSize: '9px', color: '#6B7280' }}>Retail Account Active</div>
            </div>

            {/* Step 2 */}
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(0, 0, 0, 0.08)', borderRight: '1px solid rgba(0, 0, 0, 0.08)', padding: '0 4px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: currentStatus === 'PENDING' ? '#D97706' : currentStatus === 'APPROVED' ? '#059669' : '#2563EB',
                  marginBottom: '2px'
                }}
              >
                {currentStatus === 'APPROVED' ? '✓ Step 2' : 'Step 2'}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#111827' }}>Apply Wholesale</div>
              <div style={{ fontSize: '9px', color: '#6B7280' }}>
                {currentStatus === 'PENDING' ? 'Pending Review' : 'Company & Tax ID'}
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: currentStatus === 'APPROVED' ? '#059669' : '#9CA3AF',
                  marginBottom: '2px'
                }}
              >
                {currentStatus === 'APPROVED' ? '✓ Step 3' : 'Step 3'}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: currentStatus === 'APPROVED' ? '#059669' : '#111827' }}>
                Admin Approval
              </div>
              <div style={{ fontSize: '9px', color: '#6B7280' }}>
                {currentStatus === 'APPROVED' ? 'Wholesale Unlocked' : 'Required for Bulk'}
              </div>
            </div>
          </div>

          {/* State A: Success confirmation */}
          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
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
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  fontSize: '11px',
                  fontWeight: 800,
                  marginBottom: '10px'
                }}
              >
                CURRENT STATUS: RETAIL CUSTOMER
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#059669', margin: '0 0 8px 0' }}>
                Wholesale Application Submitted!
              </h3>
              <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Your business <strong>{companyName}</strong> (Tax ID: {taxId}) is now under administrator review.
              </p>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  marginBottom: '20px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <Info size={18} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: '#1E40AF', lineHeight: 1.5 }}>
                  <strong style={{ color: '#1D4ED8' }}>Active on Retail:</strong> While your application is pending Admin verification, you can shop at standard retail prices immediately. Wholesale bulk pricing unlocks as soon as an Administrator approves your account.
                </div>
              </div>

              <button
                onClick={() => navigate('/shop')}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '9999px',
                  backgroundColor: '#FA3E54',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(250, 62, 84, 0.35)'
                }}
              >
                Continue Shopping as Retail
              </button>
            </div>
          ) : currentStatus === 'APPROVED' && !showForm ? (
            /* State B: Already an Approved Wholesale Partner */
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
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
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  fontSize: '11px',
                  fontWeight: 800,
                  marginBottom: '8px'
                }}
              >
                WHOLESALE APPROVED
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#059669', margin: '0 0 6px 0' }}>
                Verified Wholesale Partner Active
              </h3>
              <p style={{ fontSize: '13px', color: '#4B5563', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                Your enterprise account <strong>{wholesaleApplication?.businessName || companyName}</strong> is verified. Wholesale pricing is active across all categories.
              </p>
              <button
                onClick={() => navigate('/shop')}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '9999px',
                  backgroundColor: '#FA3E54',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(250, 62, 84, 0.35)',
                  marginBottom: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <ShoppingBag size={16} /> Open Wholesale Categories
              </button>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '9999px',
                  backgroundColor: '#F5F5F7',
                  color: '#111827',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ✏️ Update Company / Business Details
              </button>
            </div>
          ) : currentStatus === 'PENDING' && !showForm ? (
            /* State C: Currently Pending Review */
            <div style={{ textAlign: 'center', padding: '4px 0 0 0' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}
              >
                <Clock size={28} color="#D97706" />
              </div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  fontSize: '11px',
                  fontWeight: 800,
                  marginBottom: '8px'
                }}
              >
                STATUS: PENDING REVIEW (CURRENTLY RETAIL)
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#D97706', margin: '0 0 6px 0' }}>
                Wholesale Application Under Review
              </h3>
              <p style={{ fontSize: '13px', color: '#4B5563', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Your application for <strong>{wholesaleApplication?.businessName || companyName}</strong> (Tax ID: {wholesaleApplication?.taxIdOrLicense || taxId}) is in the administrator queue.
              </p>

              {/* Status Comparison breakdown */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  textAlign: 'left',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(0, 0, 0, 0.06)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Current Account Tier:</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#111827' }}>🛒 Standard Retail</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(0, 0, 0, 0.06)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>Wholesale Status:</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#D97706' }}>⏳ Pending Admin Approval</span>
                </div>
                <p style={{ fontSize: '12px', color: '#78350F', margin: 0, lineHeight: 1.45 }}>
                  Until an Administrator verifies and approves your application, your catalog and cart remain on <strong>Retail Pricing</strong>. Wholesale bulk pricing activates automatically once approved.
                </p>
              </div>

              <button
                onClick={() => navigate('/shop')}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '9999px',
                  backgroundColor: '#FA3E54',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(250, 62, 84, 0.35)',
                  marginBottom: '10px'
                }}
              >
                Browse Storefront as Retail
              </button>

              <button
                onClick={() => setShowForm(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '9999px',
                  backgroundColor: '#F5F5F7',
                  color: '#111827',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ✏️ Re-submit / Edit Business Registration Form
              </button>
            </div>
          ) : (
            /* State D: Registration Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {showForm && currentStatus !== 'NONE' && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'none',
                    border: 'none',
                    color: '#FA3E54',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    padding: '0 0 4px 0'
                  }}
                >
                  ← Back to Status Overview
                </button>
              )}
              {/* Explanatory Approval Notice */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '16px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  textAlign: 'left'
                }}
              >
                <Info size={18} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: '#1E40AF', lineHeight: 1.5 }}>
                  <strong style={{ color: '#1D4ED8' }}>Admin Approval Required:</strong> You will be registered as a <strong>Retail Customer</strong> immediately so you can start browsing. Once the Administrator reviews and approves your business tax ID, your tier automatically upgrades to <strong>Wholesale Pricing</strong>.
                </div>
              </div>

              {/* Name & Phone Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>
                    Full Name (Representative) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Customer Name"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        borderRadius: '10px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        fontSize: '13px',
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>
                    Business Phone Number *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+855 12 849 201"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        borderRadius: '10px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        fontSize: '13px',
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Official Business Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>
                  Official Business Email *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@company.com"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: '10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      fontSize: '13px',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Company & Tax ID Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>
                    Company / Business Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Trading Co."
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        borderRadius: '10px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        fontSize: '13px',
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>
                    Business Tax ID / License *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FileText size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="e.g. KH-VAT-90284"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        borderRadius: '10px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        fontSize: '13px',
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Passwords (only required for new unauthenticated visitors) */}
              {!isAuthenticated && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>
                      Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 36px',
                          borderRadius: '10px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid rgba(0, 0, 0, 0.12)',
                          fontSize: '13px',
                          color: '#111827',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>
                      Confirm Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 36px',
                          borderRadius: '10px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid rgba(0, 0, 0, 0.12)',
                          fontSize: '13px',
                          color: '#111827',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

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
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(250, 62, 84, 0.35)',
                  marginTop: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                {isLoading ? 'Registering Wholesale...' : 'Register Wholesale Account'} <ArrowRight size={16} />
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
              <Link to="/login" style={{ color: '#111827', fontWeight: 700, textDecoration: 'underline' }}>
                Sign In
              </Link>
            </div>
            <div>
              Want regular consumer purchases?{' '}
              <Link to="/signup" style={{ color: '#FA3E54', fontWeight: 600, textDecoration: 'none' }}>
                Customer Sign Up
              </Link>
              {' · '}
              <Link to="/shop" style={{ color: '#6B7280', textDecoration: 'none' }}>
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default WholesaleRegisterPage;
