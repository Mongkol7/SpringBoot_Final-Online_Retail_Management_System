import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerCartStore } from '../../store/customerCartStore';
import {
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Phone
} from 'lucide-react';

interface WholesaleApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WholesaleApplyModal: React.FC<WholesaleApplyModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    user,
    wholesaleApplication,
    submitWholesaleApplication
  } = useCustomerCartStore();

  const [companyName, setCompanyName] = useState('Rithysak Global Imports & Retail Co.');
  const [taxId, setTaxId] = useState('KH-VAT-90284192');
  const [contactDetails, setContactDetails] = useState('+855 12 849 201 · rithysak@retailstore.com');
  const [reason, setReason] = useState('Operating multi-location organic retail stores in Phnom Penh requiring weekly volume deliveries.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !taxId.trim()) {
      setError('Please provide your Company Name and Tax ID / Business Registration Number.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await submitWholesaleApplication(companyName, taxId, contactDetails, reason);
    } catch (err: any) {
      setError(err.message || 'Wholesale application submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const status =
    user.customerType === 'WHOLESALE' || wholesaleApplication?.status === 'APPROVED'
      ? 'APPROVED'
      : (wholesaleApplication?.status || 'NONE');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '28px',
          padding: '36px',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: '#F5F5F7',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#111827',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                backgroundColor: 'rgba(250, 62, 84, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FA3E54'
              }}
            >
              <Building2 size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, margin: 0, color: '#111827', letterSpacing: '-0.02em' }}>
                B2B Wholesale Account Upgrade
              </h2>
              <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>
                Direct Administrator Verification Required
              </span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
            Standard retail customers can apply for wholesale pricing tiers. Applications are reviewed by system administrators.
          </p>
        </div>

        {/* Status Alert Panels */}
        {status === 'APPROVED' ? (
          <div
            style={{
              padding: '20px',
              borderRadius: '20px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <CheckCircle2 size={22} color="#059669" />
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#059669' }}>
                Verified Wholesale Partner
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#059669',
                  color: '#FFFFFF'
                }}
              >
                Active
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#065F46', margin: 0, lineHeight: 1.5 }}>
              Your enterprise account is verified. Wholesale pricing tiers are automatically applied to all catalog items and cart transactions.
            </p>
          </div>
        ) : status === 'PENDING' ? (
          <div
            style={{
              padding: '20px',
              borderRadius: '20px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Clock size={20} color="#D97706" />
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#92400E' }}>
                Wholesale Application Under Review
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#D97706',
                  color: '#FFFFFF'
                }}
              >
                PENDING
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#78350F', margin: '0 0 10px 0', lineHeight: 1.5 }}>
              Submitted for <strong>{wholesaleApplication?.companyName || wholesaleApplication?.businessName || companyName}</strong> (Tax ID: {wholesaleApplication?.taxIdOrLicense || taxId}).
            </p>
            <div
              style={{
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #FDE68A',
                fontSize: '12px',
                color: '#92400E',
                lineHeight: 1.45
              }}
            >
              🔒 <strong>Currently on Retail Pricing:</strong> You can continue shopping at regular retail prices. As soon as an Admin approves your application, Wholesale bulk tier pricing will activate automatically.
            </div>
          </div>
        ) : status === 'REJECTED' ? (
          <div
            style={{
              padding: '20px',
              borderRadius: '20px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <AlertCircle size={20} color="#DC2626" />
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#DC2626' }}>
                Application Declined
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF'
                }}
              >
                REJECTED
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#991B1B', margin: 0, lineHeight: 1.5 }}>
              {wholesaleApplication?.adminNotes || 'Please ensure your commercial registration number and contact details are accurate and re-apply.'}
            </p>
          </div>
        ) : null}

        {/* Application Form */}
        {status !== 'APPROVED' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                Company Name *
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Wholesale Retail Trading Ltd."
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
                Business Registration Number / Tax ID *
              </label>
              <div style={{ position: 'relative' }}>
                <FileText size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="e.g. KH-VAT-90284192"
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
                Contact Details (Phone / Email) *
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={contactDetails}
                  onChange={(e) => setContactDetails(e.target.value)}
                  placeholder="e.g. +855 12 345 678 / sales@company.com"
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
                Description / Reason for Wholesale Upgrade *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Describe your distribution channels, monthly purchase volumes, or store network..."
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  fontSize: '13px',
                  color: '#111827',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
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

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '9999px',
                  backgroundColor: '#FA3E54',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 20px rgba(250, 62, 84, 0.35)',
                  transition: 'all 0.2s ease',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? 'Submitting...' : status === 'REJECTED' ? 'Re-Submit Application' : 'Submit Wholesale Request'}
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '14px 24px',
                  borderRadius: '9999px',
                  backgroundColor: '#F5F5F7',
                  color: '#111827',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>

            <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: '#6B7280' }}>
              Prefer dedicated full screen page?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/wholesale-register');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FA3E54',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '12px',
                  textDecoration: 'underline'
                }}
              >
                Open Wholesale Registration Form →
              </button>
            </div>
          </form>
        )}

        {status === 'APPROVED' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '14px 28px',
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
              Done & Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Wholesale Status Banner for Header and Profile
export const WholesaleStatusBanner: React.FC<{ onOpenModal?: () => void }> = ({ onOpenModal }) => {
  const navigate = useNavigate();
  const { user, wholesaleApplication, getEffectiveTier } = useCustomerCartStore();
  const effectiveTier = getEffectiveTier();
  const status =
    user.customerType === 'WHOLESALE' || effectiveTier === 'WHOLESALE' || wholesaleApplication?.status === 'APPROVED'
      ? 'APPROVED'
      : (wholesaleApplication?.status || 'NONE');

  const handleClick = onOpenModal || (() => navigate('/wholesale-register'));

  if (effectiveTier === 'WHOLESALE' || status === 'APPROVED') {
    return (
      <div
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          backgroundColor: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#059669',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
        title="View Wholesale Partner Status & Benefits"
      >
        <span style={{ color: '#059669', fontSize: '14px' }}>★</span>
        <span>Verified Wholesale Partner</span>
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          backgroundColor: '#FEF3C7',
          border: '1px solid #FCD34D',
          color: '#92400E',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        <Clock size={14} />
        <span>Wholesale Application Under Review</span>
      </div>
    );
  }

  // NONE
  return (
    <button
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        color: '#111827',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.2s ease'
      }}
    >
      <Building2 size={13} color="#FA3E54" />
      <span>Apply for Wholesale Pricing</span>
    </button>
  );
};

export default WholesaleApplyModal;
