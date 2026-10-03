'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GET_BLOG_BY_ID } from '../../admin/queries';
import { Blog } from '../../admin/types';
import { BlogDocumentAST } from '@blog-management/shared';
import { KofukuHeader } from '../../../components/blog/KofukuHeader';
import { KofukuFooter } from '../../../components/blog/KofukuFooter';
import { BlogRenderer } from '../../../components/blog/BlogRenderer';
import { LoadingSkeleton, ErrorBanner } from '../../admin/components/StateViews';

export default function PublicBlogPage(): React.JSX.Element {
  const params = useParams();
  const id = (params?.id as string) || '';

  const { data, loading, error, refetch } = useQuery<{ blog: Blog | null }>(GET_BLOG_BY_ID, {
    variables: { id },
    skip: !id,
  });

  const blog = data?.blog;

  let ast: BlogDocumentAST = { blocks: [] };
  if (blog && blog.contentJson) {
    try {
      const parsed =
        typeof blog.contentJson === 'string'
          ? JSON.parse(blog.contentJson)
          : blog.contentJson;
      if (parsed && Array.isArray(parsed.blocks)) {
        ast = parsed;
      }
    } catch {
      ast = { blocks: [] };
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc' }}>
      <KofukuHeader articleTitle={blog?.title} />

      <main style={{ minHeight: 'calc(100vh - 280px)' }}>
        {loading && (
          <div style={{ maxWidth: '820px', margin: '40px auto', padding: '0 24px' }}>
            <LoadingSkeleton />
          </div>
        )}

        {error && (
          <div style={{ maxWidth: '820px', margin: '40px auto', padding: '0 24px' }}>
            <ErrorBanner message={error.message} onRetry={() => refetch()} />
          </div>
        )}

        {!loading && !error && !blog && (
          <div
            style={{
              maxWidth: '600px',
              margin: '80px auto',
              backgroundColor: '#1e293b',
              padding: '48px 32px',
              borderRadius: '16px',
              border: '1px solid #334155',
              textAlign: 'center',
            }}
          >
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', margin: '0 0 8px 0' }}>
              Blog Article Not Found
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '15px', margin: '0 0 24px 0' }}>
              The requested blog article with ID <code>{id}</code> does not exist or has been removed.
            </p>
          </div>
        )}

        {!loading && !error && blog && (
          <BlogRenderer
            blocks={ast.blocks}
            title={blog.title}
            featuredImage={blog.featuredImage}
            status={blog.status}
            createdAt={blog.createdAt}
            sourceFilename={blog.sourceFilename}
          />
        )}
      </main>

      <KofukuFooter />
    </div>
  );
}
