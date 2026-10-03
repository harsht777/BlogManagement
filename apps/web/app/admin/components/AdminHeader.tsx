import React from 'react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  healthStatus?: string;
  action?: React.ReactNode;
}

export function AdminHeader({
  title,
  subtitle,
  healthStatus = 'API Connected',
  action,
}: AdminHeaderProps): React.JSX.Element {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '24px',
        marginBottom: '28px',
        borderBottom: '1px solid #334155',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#f8fafc', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Health status badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '9999px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            fontSize: '13px',
            color: '#94a3b8',
            fontWeight: '500',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4ade80',
              boxShadow: '0 0 6px #4ade80',
            }}
          />
          {healthStatus}
        </div>

        {action && <div>{action}</div>}
      </div>
    </header>
  );
}
