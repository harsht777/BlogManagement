import React from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accentColor = '#38bdf8',
}: MetricCardProps): React.JSX.Element {
  return (
    <div
      style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '20px 24px',
        border: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          backgroundColor: accentColor,
        }}
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </span>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#f8fafc', marginTop: '6px', lineHeight: 1.1 }}>
            {value}
          </div>
        </div>
        {icon && (
          <div
            style={{
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: `${accentColor}15`,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '16px' }}>
        {subtitle}
      </div>
    </div>
  );
}
