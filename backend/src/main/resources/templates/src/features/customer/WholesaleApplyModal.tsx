import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IosCardGlass } from '../../components/ui/IosCardGlass';
import { IosButton } from '../../components/ui/IosButton';
import { IosInput } from '../../components/ui/IosInput';
import { IosBadge } from '../../components/ui/IosBadge';
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
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'var(--ios-blur-deep, blur(28px))',
        WebkitBackdropFilter: 'var(--ios-blur-deep, blur(28px))',
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
      <div style={{ maxWidth: '600px', width: '100%', position: 'relative' }}>
        <IosCardGlass glow style={{ padding: '32px' }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            className="ios-glow-hover"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Building2 size={20} color="#FFFFFF" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                B2B Wholesale Account Upgrade
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ios-text-muted, #A1A1AA)', margin: 0, lineHeight: 1.5 }}>
              Standard retail customers can apply for wholesale pricing tiers. Applications are reviewed by system administrators.
            </p>
          </div>

          {/* Status Alert Panels */}
          {status === 'APPROVED' ? (
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--ios-radius-card, 24px)',
                backgroundColor: 'rgba(48, 209, 88, 0.08)',
                border: '1px solid rgba(48, 209, 88, 0.3)',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <CheckCircle2 size={22} color="#30D158" />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#30D158' }}>
                  Verified Wholesale Partner
                </span>
                <IosBadge variant="wholesale" glow>Active Partner</IosBadge>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: 1.5 }}>
                Your enterprise account is verified. Wholesale pricing tiers are automatically applied to all catalog items and cart transactions.
              </p>
            </div>
          ) : status === 'PENDING' ? (
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--ios-radius-card, 24px)',
                backgroundColor: 'rgba(255, 159, 10, 0.08)',
                border: '1px solid rgba(255, 159, 10, 0.3)',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Clock size={20} color="#FF9F0A" />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#FF9F0A' }}>
                  Wholesale Application Under Review
                </span>
                <IosBadge variant="warning">PENDING</IosBadge>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                Submitted for <strong>{wholesaleApplication?.companyName || wholesaleApplication?.businessName || companyName}</strong> (Tax ID: {wholesaleApplication?.taxIdOrLicense || taxId}).
              </p>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.85)',
                  lineHeight: 1.45,
                  marginBottom: '12px'
                }}
              >
                🔒 <strong>Currently on Retail Pricing:</strong> You can continue shopping at regular retail prices. As soon as an Admin approves your application, Wholesale bulk tier pricing will activate automatically.
              </div>
            </div>
          ) : status === 'REJECTED' ? (
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--ios-radius-card, 24px)',
                backgroundColor: 'rgba(255, 69, 58, 0.08)',
                border: '1px solid rgba(255, 69, 58, 0.3)',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <AlertCircle size={20} color="#FF453A" />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#FF453A' }}>
                  Application Declined
                </span>
                <IosBadge variant="danger">REJECTED</IosBadge>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: 1.5 }}>
                {wholesaleApplication?.adminNotes || 'Please ensure your commercial registration number and contact details are accurate and re-apply.'}
              </p>
            </div>
          ) : null}

          {/* Application Form */}
          {status !== 'APPROVED' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <IosInput
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Wholesale Retail Trading Ltd."
                icon={<Building2 size={16} />}
                required
              />

              <IosInput
                label="Business Registration Number / Tax ID"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="e.g. KH-VAT-90284192"
                icon={<FileText size={16} />}
                required
              />

              <IosInput
                label="Contact Details (Phone / Email)"
                value={contactDetails}
                onChange={(e) => setContactDetails(e.target.value)}
                placeholder="e.g. +855 12 345 678 / sales@company.com"
                icon={<Phone size={16} />}
                required
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--ios-text-muted, #A1A1AA)',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase'
                  }}
                >
                  Description / Reason for Wholesale Upgrade
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Describe your distribution channels, monthly purchase volumes, or store network..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: 'var(--ios-surface-glass-2, rgba(28, 28, 32, 0.60))',
                    backdropFilter: 'var(--ios-blur-subtle, blur(16px))',
                    WebkitBackdropFilter: 'var(--ios-blur-subtle, blur(16px))',
                    border: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
                    borderRadius: 'var(--ios-radius-input, 14px)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                  className="ios-glow-hover"
                  required
                />
              </div>

              {error && (
                <div style={{ fontSize: '12px', color: '#FF453A', marginTop: '4px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <IosButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
                >
                  {isSubmitting ? 'Submitting to /api/v1/customer/wholesale-request...' : status === 'REJECTED' ? 'Re-Submit Application' : 'Submit Wholesale Request'}
                </IosButton>

                <IosButton type="button" variant="glass" onClick={onClose}>
                  Cancel
                </IosButton>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#A1A1AA' }}>
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
                    color: '#FFFFFF',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  Open Wholesale Registration Form →
                </button>
              </div>
            </form>
          )}

          {status === 'APPROVED' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <IosButton variant="primary" onClick={onClose}>
                Done & Continue Shopping
              </IosButton>
            </div>
          )}
        </IosCardGlass>
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
        className="ios-glass-capsule ios-glow-hover"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: '#FFFFFF',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
        title="View Wholesale Partner Status & Benefits"
      >
        <span style={{ color: '#FFD700', fontSize: '14px' }}>★</span>
        <span>Verified Wholesale Partner</span>
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div
        onClick={handleClick}
        className="ios-glass-capsule ios-glow-hover"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          backgroundColor: 'rgba(255, 159, 10, 0.12)',
          border: '1px solid rgba(255, 159, 10, 0.4)',
          color: '#FF9F0A',
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
      className="ios-glass-capsule ios-glow-hover"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.18))',
        color: '#FFFFFF',
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      <Building2 size={13} />
      <span>Apply for Wholesale Pricing</span>
    </button>
  );
};

export default WholesaleApplyModal;
