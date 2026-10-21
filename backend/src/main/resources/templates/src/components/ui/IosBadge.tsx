import React from 'react';

export type IosBadgeVariant = 'default' | 'wholesale' | 'success' | 'warning' | 'danger' | 'info';

interface IosBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: IosBadgeVariant;
  children: React.ReactNode;
  glow?: boolean;
}

export const IosBadge: React.FC<IosBadgeProps> = ({
  variant = 'default',
  children,
  className = '',
  glow = false,
  style,
  ...props
}) => {
  const getBadgeStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      padding: '4px 10px',
      borderRadius: 'var(--ios-radius-capsule, 9999px)',
      backdropFilter: 'var(--ios-blur-subtle, blur(16px))',
      transition: 'all 0.2s ease',
      border: '1px solid transparent'
    };

    switch (variant) {
      case 'wholesale':
        return {
          ...base,
          backgroundColor: 'rgba(255, 255, 255, 0.16)',
          color: '#FFFFFF',
          borderColor: 'rgba(255, 255, 255, 0.35)',
          boxShadow: glow ? '0 0 15px rgba(255, 255, 255, 0.25)' : 'none'
        };
      case 'success':
        return {
          ...base,
          backgroundColor: 'rgba(48, 209, 88, 0.15)',
          color: '#30D158',
          borderColor: 'rgba(48, 209, 88, 0.35)',
          boxShadow: glow ? '0 0 15px rgba(48, 209, 88, 0.25)' : 'none'
        };
      case 'warning':
        return {
          ...base,
          backgroundColor: 'rgba(255, 159, 10, 0.15)',
          color: '#FF9F0A',
          borderColor: 'rgba(255, 159, 10, 0.35)',
          boxShadow: glow ? '0 0 15px rgba(255, 159, 10, 0.25)' : 'none'
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: 'rgba(255, 69, 58, 0.15)',
          color: '#FF453A',
          borderColor: 'rgba(255, 69, 58, 0.35)',
          boxShadow: glow ? '0 0 15px rgba(255, 69, 58, 0.25)' : 'none'
        };
      case 'info':
        return {
          ...base,
          backgroundColor: 'rgba(10, 132, 255, 0.15)',
          color: '#0A84FF',
          borderColor: 'rgba(10, 132, 255, 0.35)',
          boxShadow: glow ? '0 0 15px rgba(10, 132, 255, 0.25)' : 'none'
        };
      default:
        return {
          ...base,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          color: 'var(--ios-text-muted, #A1A1AA)',
          borderColor: 'var(--ios-glass-border, rgba(255, 255, 255, 0.12))'
        };
    }
  };

  return (
    <span style={{ ...getBadgeStyles(), ...style }} className={className} {...props}>
      {children}
    </span>
  );
};
