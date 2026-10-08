import React from 'react';

interface IosCardGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const IosCardGlass: React.FC<IosCardGlassProps> = ({
  children,
  className = '',
  glow = false,
  ...props
}) => {
  return (
    <div
      className={`ios-glass-panel ${glow ? 'ios-glow-hover' : ''} ${className}`}
      style={{
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}
      {...props}
    >
      {/* Specular border reflection shimmer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
          pointerEvents: 'none'
        }}
      />
      {children}
    </div>
  );
};
