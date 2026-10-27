import React from 'react';

interface IosInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const IosInput: React.FC<IosInputProps> = ({
  label,
  error,
  icon,
  className = '',
  style,
  ...props
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--ios-text-muted, #A1A1AA)',
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}
        >
          {label}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%'
        }}
      >
        {icon && (
          <div
            style={{
              position: 'absolute',
              left: '14px',
              color: 'var(--ios-text-subtle, #71717A)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none'
            }}
          >
            {icon}
          </div>
        )}

        <input
          style={{
            width: '100%',
            padding: icon ? '12px 14px 12px 42px' : '12px 16px',
            backgroundColor: 'var(--ios-surface-glass-2, rgba(28, 28, 32, 0.60))',
            backdropFilter: 'var(--ios-blur-subtle, blur(16px))',
            WebkitBackdropFilter: 'var(--ios-blur-subtle, blur(16px))',
            border: error
              ? '1px solid rgba(255, 69, 58, 0.5)'
              : '1px solid var(--ios-glass-border, rgba(255, 255, 255, 0.12))',
            borderRadius: 'var(--ios-radius-input, 14px)',
            color: 'var(--ios-text-white, #FFFFFF)',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            ...style
          }}
          className={`ios-glow-hover ${className}`}
          {...props}
        />
      </div>

      {error && (
        <span style={{ fontSize: '11px', color: '#FF453A', marginTop: '2px' }}>
          {error}
        </span>
      )}
    </div>
  );
};
