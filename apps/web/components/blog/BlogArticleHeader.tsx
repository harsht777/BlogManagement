import React from 'react';

interface BlogArticleHeaderProps {
  title: string;
  featuredImage?: string | null;
  status?: string;
  createdAt?: string;
  sourceFilename?: string | null;
}

export function BlogArticleHeader({
  title,
  featuredImage,
  status = 'DRAFT',
  createdAt,
  sourceFilename,
}: BlogArticleHeaderProps): React.JSX.Element {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'September 2026';

  return (
    <header style={{ marginBottom: '40px' }}>
      {/* Category Pill & Draft Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: '800',
            color: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid #0284c7',
            padding: '4px 10px',
            borderRadius: '9999px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Featured Journal Article
        </span>

        {status === 'DRAFT' && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#facc15',
              backgroundColor: 'rgba(250, 204, 21, 0.15)',
              border: '1px solid #a16207',
              padding: '4px 10px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
            }}
          >
            ● Draft Preview Mode
          </span>
        )}
      </div>

      {/* Main H1 Title */}
      <h1
        style={{
          fontSize: '36px',
          fontWeight: '800',
          color: '#f8fafc',
          lineHeight: 1.2,
          margin: '0 0 16px 0',
          letterSpacing: '-0.03em',
        }}
      >
        {title}
      </h1>

      {/* Metadata Line */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '14px',
          color: '#94a3b8',
          paddingBottom: '20px',
          borderBottom: '1px solid #334155',
          marginBottom: '28px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '12px',
            }}
          >
            K
          </div>
          <span style={{ color: '#f8fafc', fontWeight: '600' }}>Kofuku Editorial Team</span>
        </div>

        <span>•</span>
        <span>Published {formattedDate}</span>

        {sourceFilename && (
          <>
            <span>•</span>
            <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#cbd5e1' }}>
              Source: {sourceFilename}
            </span>
          </>
        )}
      </div>

      {/* Featured Hero Banner Image */}
      {featuredImage && (
        <div
          style={{
            margin: '0 0 32px 0',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #334155',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featuredImage}
            alt={title || 'Featured Article Banner'}
            style={{
              width: '100%',
              maxHeight: '440px',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
      )}
    </header>
  );
}
