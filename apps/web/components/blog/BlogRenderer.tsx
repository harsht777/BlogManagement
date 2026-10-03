import React from 'react';
import { BlogBlock } from '@blog-management/shared';
import { BlogArticleHeader } from './BlogArticleHeader';
import { BlogBlockRenderer } from './BlogBlockRenderer';

interface BlogRendererProps {
  blocks: BlogBlock[];
  title: string;
  featuredImage?: string | null;
  status?: string;
  createdAt?: string;
  sourceFilename?: string | null;
}

export function BlogRenderer({
  blocks,
  title,
  featuredImage,
  status,
  createdAt,
  sourceFilename,
}: BlogRendererProps): React.JSX.Element {
  return (
    <article
      style={{
        maxWidth: '820px',
        margin: '0 auto',
        padding: '40px 24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Kofuku Article Header */}
      <BlogArticleHeader
        title={title}
        featuredImage={featuredImage}
        status={status}
        createdAt={createdAt}
        sourceFilename={sourceFilename}
      />

      {/* Main Content Body */}
      <div style={{ marginTop: '16px' }}>
        {blocks.length === 0 ? (
          <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '32px 0' }}>
            No document blocks present in AST content.
          </p>
        ) : (
          blocks.map((block, idx) => <BlogBlockRenderer key={idx} block={block} index={idx} />)
        )}
      </div>

      {/* Article Disclaimer Footer */}
      <div
        style={{
          marginTop: '48px',
          padding: '20px 24px',
          backgroundColor: '#0f172a',
          borderRadius: '12px',
          border: '1px solid #334155',
          fontSize: '13px',
          color: '#94a3b8',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '4px' }}>
          Educational & Administrative Information Notice
        </strong>
        This article was rendered dynamically from normalized <code>BlogDocumentAST</code> stored in PostgreSQL. Rendered via the Kofuku Blog Renderer.
      </div>
    </article>
  );
}
