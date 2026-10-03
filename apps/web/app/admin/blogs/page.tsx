'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { GET_ADMIN_BLOGS } from '../queries';
import { GetAdminBlogsData, BlogStatus } from '../types';
import { AdminHeader } from '../components/AdminHeader';
import { BlogTable } from '../components/BlogTable';
import { LoadingSkeleton, ErrorBanner, EmptyState } from '../components/StateViews';

export default function BlogsPage(): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | BlogStatus>('ALL');

  const { data, loading, error, refetch } = useQuery<GetAdminBlogsData>(GET_ADMIN_BLOGS, {
    fetchPolicy: 'cache-and-network',
  });

  const blogs = data?.blogs || [];

  // Filter blogs based on search query and status selector
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const matchesSearch =
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (blog.sourceFilename && blog.sourceFilename.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = selectedStatus === 'ALL' || blog.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [blogs, searchTerm, selectedStatus]);

  const draftCount = blogs.filter((b) => b.status === 'DRAFT').length;
  const publishedCount = blogs.filter((b) => b.status === 'PUBLISHED').length;

  return (
    <div>
      <AdminHeader
        title="Blog Management"
        subtitle="View, inspect, and manage ingested document blogs"
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

      {/* Main Content Area */}
      {!loading && !error && (
        <div>
          {/* Toolbar: Search & Status Filters */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '24px',
              backgroundColor: '#1e293b',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #334155',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Search blogs by title or filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px 10px 40px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <svg
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: '#64748b',
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {(
                [
                  { label: `All (${blogs.length})`, value: 'ALL' },
                  { label: `Drafts (${draftCount})`, value: 'DRAFT' },
                  { label: `Published (${publishedCount})`, value: 'PUBLISHED' },
                ] as const
              ).map((tab) => {
                const isSelected = selectedStatus === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setSelectedStatus(tab.value)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #0284c7' : '1px solid #334155',
                      backgroundColor: isSelected ? '#0284c7' : '#0f172a',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Blog Table or Empty State */}
          {filteredBlogs.length > 0 ? (
            <BlogTable blogs={filteredBlogs} />
          ) : (
            <EmptyState
              title={searchTerm ? 'No Matching Blogs Found' : 'No Blogs Available'}
              description={
                searchTerm
                  ? `No blogs match the query "${searchTerm}". Try clearing your search.`
                  : 'Get started by uploading a DOCX document.'
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
