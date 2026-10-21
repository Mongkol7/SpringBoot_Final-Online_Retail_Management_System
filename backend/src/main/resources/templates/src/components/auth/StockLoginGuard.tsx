import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertTriangle, Sparkles, Warehouse } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StockLoginGuardProps {
  onSuccess?: () => void;
}

export const StockLoginGuard: React.FC<StockLoginGuardProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide warehouse personnel credentials.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await login(email.trim(), password);
      if (user.role !== 'STOCK_CONTROLLER' && user.role !== 'ADMIN') {
        setError(`Access Denied: Account '${user.email}' possesses role '${user.role}', which lacks Warehouse Stock Controller clearance.`);
        return;
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify warehouse credentials.');
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
      if (user.role !== 'STOCK_CONTROLLER' && user.role !== 'ADMIN') {
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
        {/* Warehouse Badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.4))',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FBBF24',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)'
            }}
          >
            <Warehouse size={32} />
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#FDE68A',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              marginBottom: '8px'
            }}
          >
            RESTRICTED • WAREHOUSE INVENTORY ONLY
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '6px 0 4px', letterSpacing: '-0.02em' }}>
            Stock Controller Workspace
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.5 }}>
            Product master cataloging, FIFO/FEFO expiration radar, inbound batch delivery ingestion, and stock write-offs.
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px', letterSpacing: '0.04em' }}>
              STAFF EMAIL
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="stock@retailstore.com"
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
              STAFF PASSWORD
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
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#000000',
              fontSize: '13px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
              transition: 'all 0.2s ease',
              marginTop: '4px'
            }}
          >
            {loading ? (
              <span>Connecting Inventory Suite...</span>
            ) : (
              <>
                <span>Enter Warehouse Workspace</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '10px' }}>
            <Sparkles size={12} color="#FBBF24" />
            <span>1-Click Verified Demo Credentials:</span>
          </div>
          <button
            onClick={() => handleQuickFill('stock@retailstore.com', 'cashier123')}
            type="button"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              fontSize: '11px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span><strong>Warehouse Controller:</strong> stock@retailstore.com</span>
            <span style={{ color: '#FBBF24', fontWeight: 700 }}>Auto-Fill (cashier123)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
