'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { GET_ADMIN_BLOGS } from '../queries';
import { GetAdminBlogsData } from '../types';
import { AdminHeader } from '../components/AdminHeader';
import { MetricCard } from '../components/MetricCard';
import { BlogTable } from '../components/BlogTable';
import { LoadingSkeleton, ErrorBanner, EmptyState } from '../components/StateViews';

export default function DashboardPage(): React.JSX.Element {
  const { data, loading, error, refetch } = useQuery<GetAdminBlogsData>(GET_ADMIN_BLOGS, {
    fetchPolicy: 'cache-and-network',
  });

  const blogs = data?.blogs || [];
  const totalBlogs = blogs.length;
  const draftBlogs = blogs.filter((b) => b.status === 'DRAFT').length;
  const publishedBlogs = blogs.filter((b) => b.status === 'PUBLISHED').length;
  const totalImages = blogs.reduce((acc, b) => acc + b.extractedImageCount, 0);

  const recentBlogs = blogs.slice(0, 5);

  return (
    <div>
      <AdminHeader
        title="Admin Dashboard"
        subtitle="Overview of blog posts, publishing status, and content metrics"
        healthStatus={loading ? 'Querying API...' : error ? 'API Disconnected' : data?.health}
        action={
          <Link
            href="/admin/upload"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Blog
          </Link>
        }
      />

      {/* Error state */}
      {error && <ErrorBanner message={error.message} onRetry={() => refetch()} />}

      {/* Loading state */}
      {loading && !data && <LoadingSkeleton />}

      {/* Metrics Overview Grid */}
      {!loading && !error && (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '36px',
          }}
        >
          <MetricCard
            title="Total Blogs"
            value={totalBlogs}
            subtitle="All ingested blog records"
            accentColor="#38bdf8"
            icon={
              <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
              </svg>
            }
          />

          <MetricCard
            title="Drafts"
            value={draftBlogs}
            subtitle="Awaiting preview & publish"
            accentColor="#facc15"
            icon={
              <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          />

          <MetricCard
            title="Published"
            value={publishedBlogs}
            subtitle="Live public articles"
            accentColor="#4ade80"
            icon={
              <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <MetricCard
            title="Extracted Images"
            value={totalImages}
            subtitle="Stored in local disk"
            accentColor="#a855f7"
            icon={
              <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </section>
      )}

      {/* Recent Blogs Section */}
      {!loading && !error && (
        <section>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                Recent Blogs
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Latest document posts ingested into PostgreSQL
              </p>
            </div>

            {totalBlogs > 0 && (
              <Link
                href="/admin/blogs"
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#38bdf8',
                  textDecoration: 'none',
                }}
              >
                View All ({totalBlogs}) →
              </Link>
            )}
          </div>

          {totalBlogs === 0 ? (
            <EmptyState />
          ) : (
            <BlogTable blogs={recentBlogs} />
          )}
        </section>
      )}
    </div>
  );
}
