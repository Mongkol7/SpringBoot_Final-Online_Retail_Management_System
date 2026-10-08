import React, { useState } from 'react';

interface DynamicIslandProps {
  statusText?: string;
  badge?: string;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  statusText = 'AURA Retail Active',
  badge = 'iOS 27'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        className="ios-glass-capsule ios-glow-hover"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: isExpanded ? '12px 28px' : '8px 20px',
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(0,0,0,0.7), 0 0 15px rgba(255,255,255,0.08)'
        }}
      >
        {/* Pulsing Monochrome Dot */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 0 8px #FFFFFF'
          }}
        />

        <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          {statusText}
        </span>

        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF'
          }}
        >
          {badge}
        </span>
      </div>
    </div>
  );
};
