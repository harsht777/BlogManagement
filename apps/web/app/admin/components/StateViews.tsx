import React from 'react';
import Link from 'next/link';

export function LoadingSkeleton(): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px 0' }}>
      {[1, 2, 3, 4].map((idx) => (
        <div
          key={idx}
          style={{
            height: '72px',
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            border: '1px solid #334155',
            animation: 'pulse 1.5s infinite ease-in-out',
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps): React.JSX.Element {
  return (
    <div
      role="alert"
      style={{
        backgroundColor: '#450a0a',
        border: '1px solid #b91c1c',
        borderRadius: '12px',
        padding: '24px',
        color: '#fecaca',
        margin: '16px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <svg
          style={{ width: '24px', height: '24px', flexShrink: 0, color: '#f87171' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#f87171' }}>
            GraphQL API Error
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#fca5a5' }}>{message}</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#f87171' }}>
            Ensure backend Apollo Server is running on <code>http://localhost:4000/graphql</code> and PostgreSQL is active.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#991b1b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export function EmptyState({
  title = 'No Blogs Found',
  description = 'No document blogs have been ingested into the database yet.',
  actionUrl = '/admin/upload',
  actionLabel = 'Upload First Blog',
}: EmptyStateProps): React.JSX.Element {
  return (
    <div
      style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        border: '1px border-dashed #334155',
        padding: '64px 32px',
        textAlign: 'center',
        margin: '24px 0',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#0f172a',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
        }}
      >
        <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', margin: '0 0 8px 0' }}>
        {title}
      </h3>
      <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 24px 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
        {description}
      </p>

      {actionUrl && (
        <Link
          href={actionUrl}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
