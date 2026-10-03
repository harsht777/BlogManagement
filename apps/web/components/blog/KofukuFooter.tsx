import React from 'react';
import Link from 'next/link';

export function KofukuFooter(): React.JSX.Element {
  return (
    <footer
      style={{
        backgroundColor: '#0f172a',
        borderTop: '1px solid #334155',
        color: '#94a3b8',
        padding: '48px 24px',
        marginTop: '64px',
        fontSize: '14px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '32px',
          paddingBottom: '32px',
          borderBottom: '1px solid #334155',
        }}
      >
        {/* Brand Summary */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '14px',
              }}
            >
              K
            </div>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.02em' }}>
              KOFUKU
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#64748b' }}>
            Dedicated to publishing evidence-based wellness insights, modern tech architecture standards, and research-backed guides.
          </p>
        </div>

        {/* Categories */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Explore Topics
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <li>Health & Nutrition</li>
            <li>Software Architecture</li>
            <li>Mental Wellness</li>
            <li>Productivity & Habits</li>
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            System Links
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <li>
              <Link href="/admin/dashboard" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                Admin Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/blogs" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                Blog Management
              </Link>
            </li>
            <li>
              <Link href="/admin/upload" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                Document Upload
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright & Disclaimer */}
      <div style={{ maxWidth: '1200px', margin: '24px auto 0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: '#64748b' }}>
        <div>
          &copy; 2026 Kofuku Blog Management. All rights reserved.
        </div>
        <div>
          Information & Medical Disclaimer: Content is provided for educational and administrative verification purposes.
        </div>
      </div>
    </footer>
  );
}
