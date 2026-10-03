import React, { useState } from 'react';
import { BlogBlock } from '@blog-management/shared';
import { BlogRenderer } from '../../../components/blog/BlogRenderer';

interface AdminPreviewProps {
  blocks: BlogBlock[];
  title: string;
  featuredImage?: string | null;
  status?: string;
  createdAt?: string;
  sourceFilename?: string | null;
  blogId?: string;
}

export function AdminPreview({
  blocks,
  title,
  featuredImage,
  status,
  createdAt,
  sourceFilename,
  blogId,
}: AdminPreviewProps): React.JSX.Element {
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div
      style={{
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        border: '1px solid #334155',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        width: '100%',
      }}
    >
      {/* Live Preview Control Toolbar */}
      <div
        style={{
          padding: '12px 20px',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#38bdf8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Live Article Preview
          </span>
        </div>

        {/* Viewport Switcher & External Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', backgroundColor: '#1e293b', padding: '2px', borderRadius: '6px', border: '1px solid #334155' }}>
            <button
              type="button"
              onClick={() => setViewportMode('desktop')}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: viewportMode === 'desktop' ? '#0284c7' : 'transparent',
                color: viewportMode === 'desktop' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
              }}
            >
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('mobile')}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: viewportMode === 'mobile' ? '#0284c7' : 'transparent',
                color: viewportMode === 'mobile' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
              }}
            >
              Mobile
            </button>
          </div>

          {blogId && (
            <a
              href={`/blog/${blogId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#38bdf8',
                textDecoration: 'none',
                border: '1px solid #334155',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
              }}
            >
              Public Page
            </a>
          )}
        </div>
      </div>

      {/* Article Render Container */}
      <div
        style={{
          padding: viewportMode === 'mobile' ? '24px 12px' : '0',
          backgroundColor: viewportMode === 'mobile' ? '#0b0f19' : 'transparent',
          transition: 'all 0.2s ease',
        }}
      >
        <div
          style={{
            maxWidth: viewportMode === 'mobile' ? '375px' : '100%',
            margin: '0 auto',
            border: viewportMode === 'mobile' ? '1px solid #334155' : 'none',
            borderRadius: viewportMode === 'mobile' ? '12px' : '0',
            backgroundColor: '#0f172a',
            overflow: 'hidden',
          }}
        >
          <BlogRenderer
            blocks={blocks}
            title={title}
            featuredImage={featuredImage}
            status={status}
            createdAt={createdAt}
            sourceFilename={sourceFilename}
          />
        </div>
      </div>
    </div>
  );
}
