import React from 'react';
import Link from 'next/link';

interface KofukuHeaderProps {
  category?: string;
  articleTitle?: string;
}

export function KofukuHeader({ category = 'Health & Wellness', articleTitle }: KofukuHeaderProps): React.JSX.Element {
  return (
    <header
      style={{
        backgroundColor: '#0f172a',
        borderBottom: '1px solid #334155',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Top Banner Navigation */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Brand Logo */}
        <Link
          href="/admin/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '18px',
            }}
          >
            K
          </div>
          <div>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.02em', display: 'block' }}>
              KOFUKU
            </span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#38bdf8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Blog Journal
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '14px', fontWeight: '600' }}>
          <span style={{ color: '#f8fafc' }}>Articles</span>
          <span style={{ color: '#94a3b8' }}>Wellness Guides</span>
          <span style={{ color: '#94a3b8' }}>Research</span>
          <span style={{ color: '#94a3b8' }}>About Us</span>
        </nav>

        {/* Action Button to Admin */}
        <Link
          href="/admin/dashboard"
          style={{
            padding: '8px 16px',
            backgroundColor: '#1e293b',
            color: '#38bdf8',
            border: '1px solid #0284c7',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            textDecoration: 'none',
          }}
        >
          Admin Panel →
        </Link>
      </div>

      {/* Breadcrumb Context Bar */}
      <div
        style={{
          backgroundColor: '#1e293b',
          borderTop: '1px solid #334155',
          padding: '8px 24px',
          fontSize: '13px',
          color: '#94a3b8',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/admin/blogs" style={{ color: '#94a3b8', textDecoration: 'none' }}>
            Home
          </Link>
          <span>›</span>
          <span style={{ color: '#38bdf8' }}>{category}</span>
          {articleTitle && (
            <>
              <span>›</span>
              <span style={{ color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                {articleTitle}
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
