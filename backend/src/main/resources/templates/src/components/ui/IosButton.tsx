import React from 'react';

interface IosButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'glass' | 'danger';
  children: React.ReactNode;
}

export const IosButton: React.FC<IosButtonProps> = ({
  variant = 'glass',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const getStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: '12px 22px',
      borderRadius: 'var(--ios-radius-button)',
      fontSize: '14px',
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      outline: 'none',
      border: 'none'
    };

    if (variant === 'primary') {
      return {
        ...base,
        backgroundColor: '#FFFFFF',
        color: '#000000',
        boxShadow: '0 4px 16px rgba(255, 255, 255, 0.2)'
      };
    }

    if (variant === 'danger') {
      return {
        ...base,
        backgroundColor: 'rgba(255, 59, 48, 0.12)',
        color: '#FF453A',
        border: '1px solid rgba(255, 69, 58, 0.3)'
      };
    }

    // Default: 'glass'
    return {
      ...base,
      backgroundColor: 'var(--ios-surface-glass-2)',
      color: '#FFFFFF',
      backdropFilter: 'var(--ios-blur-deep)',
      border: '1px solid var(--ios-glass-border)'
    };
  };

  return (
    <button
      style={getStyles()}
      className={`ios-glow-hover ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
