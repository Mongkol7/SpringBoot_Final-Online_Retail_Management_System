import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginGuardProps {
  onSuccess?: () => void;
}

export const AdminLoginGuard: React.FC<AdminLoginGuardProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Both email and password are required for executive clearance.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await login(email.trim(), password);
      if (user.role !== 'ADMIN') {
        setError(`Access Denied: Account '${user.email}' possesses role '${user.role}', which lacks EXECUTIVE ADMIN clearance.`);
        return;
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify executive credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setError(null);
    try {
      const user = await login(demoEmail, demoPass);
      if (user.role !== 'ADMIN') {
        setError(`Access Denied: Role is ${user.role}`);
        return;
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Auto-login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="ios-glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px 32px',
          borderRadius: '28px',
          background: 'linear-gradient(135deg, rgba(28, 28, 34, 0.88) 0%, rgba(18, 18, 22, 0.94) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(36px)',
          WebkitBackdropFilter: 'blur(36px)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
          color: '#FFFFFF'
        }}
      >
        {/* Security Shield Badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 235, 0.4))',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60A5FA',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Shield size={32} />
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#93C5FD',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              marginBottom: '8px'
            }}
          >
            RESTRICTED • ROLE_ADMIN ONLY
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '6px 0 4px', letterSpacing: '-0.02em' }}>
            Executive Governance HUD
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.5 }}>
            Enterprise financial analytics, tax reporting, wholesale application queue, and user authorization directory.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              fontSize: '12px',
              lineHeight: 1.4,
              marginBottom: '20px'
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px', letterSpacing: '0.04em' }}>
              ADMINISTRATOR EMAIL
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@retailstore.com"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px', letterSpacing: '0.04em' }}>
              SECURITY PASSPHRASE
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 20px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s ease',
              marginTop: '4px'
            }}
          >
            {loading ? (
              <span>Authenticating Clearance...</span>
            ) : (
              <>
                <span>Enter Executive HUD</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '10px' }}>
            <Sparkles size={12} color="#60A5FA" />
            <span>1-Click Verified Demo Credentials:</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => handleQuickFill('admin@retailstore.com', 'admin123')}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span><strong>System Admin:</strong> admin@retailstore.com</span>
              <span style={{ color: '#60A5FA', fontWeight: 700 }}>Auto-Fill (admin123)</span>
            </button>
            <button
              onClick={() => handleQuickFill('mono@retailstore', '2026')}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                fontSize: '11px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span><strong>Executive Mono:</strong> mono@retailstore</span>
              <span style={{ color: '#60A5FA', fontWeight: 700 }}>Auto-Fill (2026)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
