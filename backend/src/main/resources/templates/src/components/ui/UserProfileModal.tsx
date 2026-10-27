import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Camera,
  Upload,
  Link as LinkIcon,
  Trash2,
  X,
  CheckCircle2,
  Shield,
  Phone,
  Mail,
  MapPin,
  Building,
  Save,
  AlertCircle,
  LogIn
} from 'lucide-react';
import { User } from '../../types/schema';

export interface UserProfileModalProps {
  isOpen: boolean;
  user: Partial<User> | null;
  onClose: () => void;
  onSave: (updated: {
    fullName: string;
    phone?: string;
    avatarUrl?: string;
    addresses?: string[];
    companyName?: string;
  }) => void;
  roleLabel?: string;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onSave,
  roleLabel
}) => {
  const navigate = useNavigate();
  const isGuest = !user?.id || user.id === 0 || !user.email;
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'LOCAL' | 'LINK'>('LOCAL');
  const [customLinkInput, setCustomLinkInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevOpenRef = useRef(false);

  // Initialize form strictly when modal opens (transition from closed to open)
  // This prevents background polling / store re-renders from wiping user input while typing
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setFullName(user?.fullName ?? '');
      setPhone(user?.phone ?? '');
      setEmail(user?.email ?? '');

      // Load avatar from user object (DB) or localStorage caches
      const savedAvatar =
        user?.avatarUrl ||
        (user?.id ? localStorage.getItem(`aura_avatar_user_${user.id}`) : null) ||
        (user?.id ? localStorage.getItem(`aura_avatar_${user.id}`) : null) ||
        (user?.email ? localStorage.getItem(`aura_avatar_${user.email.toLowerCase()}`) : null) ||
        localStorage.getItem('aura_avatar_current') ||
        '';
      setAvatarUrl(savedAvatar);
      setCustomLinkInput(savedAvatar.startsWith('data:') ? '' : savedAvatar);

      // Load address safely without the "[" string corruption bug
      let primaryAddr = '';
      const rawAddresses: any = user?.addresses;
      if (Array.isArray(rawAddresses) && rawAddresses.length > 0) {
        const first = rawAddresses[0];
        if (typeof first === 'string') {
          const trimmed = first.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              const parsed = JSON.parse(trimmed);
              primaryAddr = Array.isArray(parsed) && parsed.length > 0 ? String(parsed[0]) : trimmed;
            } catch {
              primaryAddr = trimmed;
            }
          } else {
            primaryAddr = trimmed;
          }
        } else {
          primaryAddr = String(first);
        }
      } else if (typeof rawAddresses === 'string' && rawAddresses.trim()) {
        const trimmed = rawAddresses.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            primaryAddr = Array.isArray(parsed) && parsed.length > 0 ? String(parsed[0]) : trimmed;
          } catch {
            primaryAddr = trimmed;
          }
        } else {
          primaryAddr = trimmed;
        }
      }

      // Check saved profile in localStorage for companyName or address fallback
      const profileKey = `aura_profile_${user?.id || user?.email || 'current'}`;
      const savedProfile = localStorage.getItem(profileKey);
      let savedCompany = '';
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (!primaryAddr && parsed.address) primaryAddr = String(parsed.address);
          if (parsed.companyName) savedCompany = String(parsed.companyName);
        } catch {}
      }

      setAddress(primaryAddr);
      setCompanyName(savedCompany);
      setIsSaved(false);
      setIsSubmitting(false);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, user]);

  // Handle local file selection and convert to optimized base64 data URI
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: warn if > 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Selected image is over 5MB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 400x400 using Canvas for lightweight localStorage storage
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomLink = () => {
    if (customLinkInput.trim()) {
      setAvatarUrl(customLinkInput.trim());
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    setCustomLinkInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      onClose();
      navigate('/login');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const trimmedName = fullName.trim();
      const trimmedPhone = phone.trim();
      const trimmedAddress = address.trim();
      const trimmedCompany = companyName.trim();

      // Persist avatar in localStorage across all keys
      if (avatarUrl) {
        if (user?.id) {
          localStorage.setItem(`aura_avatar_user_${user.id}`, avatarUrl);
          localStorage.setItem(`aura_avatar_${user.id}`, avatarUrl);
        }
        if (user?.email) {
          localStorage.setItem(`aura_avatar_${user.email.toLowerCase()}`, avatarUrl);
        }
        localStorage.setItem('aura_avatar_current', avatarUrl);
      } else {
        if (user?.id) {
          localStorage.removeItem(`aura_avatar_user_${user.id}`);
          localStorage.removeItem(`aura_avatar_${user.id}`);
        }
        if (user?.email) {
          localStorage.removeItem(`aura_avatar_${user.email.toLowerCase()}`);
        }
        localStorage.removeItem('aura_avatar_current');
      }

      const profileData = {
        fullName: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress,
        companyName: trimmedCompany,
        avatarUrl
      };
      const profileKey = `aura_profile_${user?.id || user?.email || 'current'}`;
      localStorage.setItem(profileKey, JSON.stringify(profileData));

      // Call onSave callback and await completion
      await onSave({
        fullName: trimmedName,
        phone: trimmedPhone,
        avatarUrl,
        addresses: trimmedAddress ? [trimmedAddress] : [],
        companyName: trimmedCompany
      });

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setIsSubmitting(false);
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Failed to save profile changes:', err);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Calculate initials for fallback avatar
  const initials = (fullName || user?.fullName || 'User')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || 'U';

  const displayTier = user?.customerType || 'RETAIL';
  const roleDisplay = roleLabel || (user?.customerType === 'WHOLESALE' ? 'Wholesale Partner' : 'Retail Customer');

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#1E1E24',
          borderRadius: '28px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
          color: '#FFFFFF',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}
            >
              <UserIcon size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
                Account Profile & Settings
              </h3>
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                Customize your profile avatar and account details
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#9CA3AF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Guest Warning Banner */}
        {isGuest && (
          <div
            style={{
              margin: '16px 24px 0',
              padding: '12px 16px',
              borderRadius: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} color="#EF4444" />
              <span style={{ fontSize: '13px', color: '#FCA5A5', fontWeight: 500 }}>
                You are browsing as an unauthenticated guest. Sign in to edit and save your profile.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/login');
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
          {/* Avatar Section */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '16px 20px',
              borderRadius: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {/* Avatar Circle Preview */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid #3B82F6',
                  boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
                  backgroundColor: '#27272A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName || 'Avatar'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setAvatarUrl('')}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: '28px',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      background: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {initials}
                  </span>
                )}
              </div>
              <span
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  border: '2px solid #1E1E24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}
              >
                <Camera size={12} />
              </span>
            </div>

            {/* Avatar Options */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setImageInputMode('LOCAL')}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: imageInputMode === 'LOCAL' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)',
                    color: imageInputMode === 'LOCAL' ? '#000000' : '#A1A1AA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Upload size={12} /> Local Upload
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('LINK')}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: imageInputMode === 'LINK' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)',
                    color: imageInputMode === 'LINK' ? '#000000' : '#A1A1AA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <LinkIcon size={12} /> Web Link URL
                </button>
              </div>

              {imageInputMode === 'LOCAL' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '9999px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        color: '#93C5FD',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Upload size={14} /> Choose File from Computer
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        title="Remove custom photo"
                        style={{
                          padding: '8px 10px',
                          borderRadius: '9999px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#FCA5A5',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                    Saved securely in browser local storage. Max 5MB.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={customLinkInput ?? ''}
                    onChange={(e) => setCustomLinkInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomLink}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#3B82F6',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Set
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      title="Clear photo"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#FCA5A5',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Role & Tier Info Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={14} color="#60A5FA" />
              <span style={{ fontSize: '12px', color: '#CBD5E1' }}>Account Tier / Role</span>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 10px',
                borderRadius: '9999px',
                backgroundColor: displayTier === 'WHOLESALE' ? '#FA3E54' : '#3B82F6',
                color: '#FFFFFF',
                letterSpacing: '0.04em'
              }}
            >
              {roleDisplay}
            </span>
          </div>

          {/* Form Fields Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  value={fullName ?? ''}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <UserIcon size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Email Address (Read-only or display) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  disabled
                  readOnly={true}
                  value={email ?? ''}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#9CA3AF',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'not-allowed'
                  }}
                />
                <Mail size={14} color="#6B7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  value={phone ?? ''}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+855 12 345 678"
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <Phone size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                Primary Delivery / Shipping Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={address ?? ''}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, Khan, Sangkat, Phnom Penh"
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <MapPin size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Business / Company Name (If Wholesale or Optional) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
                Business or Company Name (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={companyName ?? ''}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="E.g., Artisan Cafe Co., Ltd."
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <Building size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '12px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#CBD5E1',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            {isGuest ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/login');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                }}
              >
                <LogIn size={16} />
                <span>Sign In to Save Changes</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaved || isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  background: isSaved ? '#10B981' : isSubmitting ? '#2563EB' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isSaved || isSubmitting ? 'default' : 'pointer',
                  opacity: isSubmitting ? 0.8 : 1,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                <span>{isSaved ? 'Saved!' : isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
