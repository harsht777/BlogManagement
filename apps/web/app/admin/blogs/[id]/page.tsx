'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_BLOG_BY_ID,
  UPDATE_BLOG,
  PUBLISH_BLOG,
  UNPUBLISH_BLOG,
  DELETE_BLOG,
  GET_ADMIN_BLOGS,
} from '../../queries';
import { Blog } from '../../types';
import { BlogDocumentAST, BlogBlock } from '@blog-management/shared';
import { AdminHeader } from '../../components/AdminHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton, ErrorBanner } from '../../components/StateViews';
import { BlockEditor } from '../../components/BlockEditor';
import { AdminPreview } from '../../components/AdminPreview';

type ViewMode = 'split' | 'edit' | 'preview' | 'json';

export default function RealBlogDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  const [title, setTitle] = useState('');
  const [ast, setAst] = useState<BlogDocumentAST>({ blocks: [] });
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<{ blog: Blog | null }>(GET_BLOG_BY_ID, {
    variables: { id },
    skip: !id,
  });

  const [updateBlog, { loading: saving }] = useMutation<{ updateBlog: Blog }>(UPDATE_BLOG, {
    refetchQueries: [{ query: GET_ADMIN_BLOGS }, { query: GET_BLOG_BY_ID, variables: { id } }],
  });

  const [publishBlog, { loading: publishing }] = useMutation<{ publishBlog: Blog }>(PUBLISH_BLOG, {
    refetchQueries: [{ query: GET_ADMIN_BLOGS }, { query: GET_BLOG_BY_ID, variables: { id } }],
  });

  const [unpublishBlog, { loading: unpublishing }] = useMutation<{ unpublishBlog: Blog }>(UNPUBLISH_BLOG, {
    refetchQueries: [{ query: GET_ADMIN_BLOGS }, { query: GET_BLOG_BY_ID, variables: { id } }],
  });

  const [deleteBlog, { loading: deleting }] = useMutation<{ deleteBlog: boolean }>(DELETE_BLOG, {
    refetchQueries: [{ query: GET_ADMIN_BLOGS }],
  });

  const blog = data?.blog;

  // Sync loaded blog into local editable state
  useEffect(() => {
    if (blog) {
      setTitle(blog.title);
      if (blog.contentJson) {
        try {
          const parsed =
            typeof blog.contentJson === 'string'
              ? JSON.parse(blog.contentJson)
              : blog.contentJson;
          if (parsed && Array.isArray(parsed.blocks)) {
            setAst(parsed);
          } else {
            setAst({ blocks: [] });
          }
        } catch {
          setAst({ blocks: [] });
        }
      }
      setIsDirty(false);
    }
  }, [blog]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handleBlocksChange = (newBlocks: BlogBlock[]) => {
    setAst((prev) => ({ ...prev, blocks: newBlocks }));
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsDirty(true);
    setSaveSuccess(false);
    try {
      const parsed = JSON.parse(e.target.value);
      if (parsed && Array.isArray(parsed.blocks)) {
        setAst(parsed);
        setSaveError(null);
      }
    } catch {
      setSaveError('Invalid JSON format.');
    }
  };

  const handleSaveChanges = async () => {
    if (!id) return;
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await updateBlog({
        variables: {
          id,
          title,
          contentJson: JSON.stringify(ast),
        },
      });

      if (response.data?.updateBlog) {
        setIsDirty(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    try {
      await publishBlog({ variables: { id } });
      setActionFeedback('Blog status updated to PUBLISHED!');
      setTimeout(() => setActionFeedback(null), 4000);
      refetch();
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  const handleUnpublish = async () => {
    if (!id) return;
    try {
      await unpublishBlog({ variables: { id } });
      setActionFeedback('Blog status reverted to DRAFT!');
      setTimeout(() => setActionFeedback(null), 4000);
      refetch();
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    try {
      await deleteBlog({ variables: { id } });
      setShowDeleteModal(false);
      router.push('/admin/blogs');
    } catch (err) {
      setSaveError((err as Error).message);
      setShowDeleteModal(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <AdminHeader
        title={blog ? blog.title : 'Blog Detail & Editor'}
        subtitle="Edit blog title, content blocks, and live article preview"
        action={
          <Link
            href="/admin/blogs"
            style={{
              padding: '8px 16px',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            ← Back to Blogs
          </Link>
        }
      />

      {error && <ErrorBanner message={error.message} onRetry={() => refetch()} />}
      {loading && <LoadingSkeleton />}

      {!loading && !error && !blog && (
        <div style={{ backgroundColor: '#1e293b', padding: '32px', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ color: '#f8fafc', margin: 0 }}>Blog Record Not Found</h3>
          <p style={{ color: '#94a3b8', marginTop: '8px' }}>No blog post found with ID: {id}</p>
        </div>
      )}

      {!loading && !error && blog && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sticky Professional Top Action Header */}
          <div
            style={{
              position: 'sticky',
              top: '0',
              zIndex: 100,
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              border: '1px solid #334155',
              padding: '16px 20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <StatusBadge status={blog.status} />
              <span style={{ fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>
                ID: {blog.id}
              </span>
              {isDirty && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#facc15',
                    backgroundColor: 'rgba(250, 204, 21, 0.15)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #a16207',
                  }}
                >
                  ● Unsaved Changes
                </span>
              )}
            </div>

            {/* Top Action Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Primary Save Button */}
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={saving || !isDirty}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isDirty ? '#0284c7' : '#334155',
                  color: isDirty ? '#ffffff' : '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

              {/* Publish / Unpublish Lifecycle Button */}
              {blog.status === 'DRAFT' ? (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#166534',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: publishing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {publishing ? 'Publishing...' : 'Publish Blog'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUnpublish}
                  disabled={unpublishing}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#854d0e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: unpublishing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {unpublishing ? 'Unpublishing...' : 'Unpublish to Draft'}
                </button>
              )}

              {/* Delete Destructive Button */}
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#450a0a',
                  color: '#f87171',
                  border: '1px solid #991b1b',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>

              {/* Public Page External Link */}
              <a
                href={`/blog/${blog.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#1e293b',
                  color: '#38bdf8',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                }}
              >
                Public Page
              </a>
            </div>
          </div>

          {/* Feedback Banners */}
          {saveSuccess && (
            <div style={{ backgroundColor: 'rgba(22, 101, 52, 0.3)', border: '1px solid #15803d', borderRadius: '8px', padding: '12px 16px', color: '#4ade80', fontSize: '14px' }}>
              <strong>Success:</strong> Blog title and content blocks saved successfully.
            </div>
          )}

          {actionFeedback && (
            <div style={{ backgroundColor: 'rgba(2, 132, 199, 0.2)', border: '1px solid #0284c7', borderRadius: '8px', padding: '12px 16px', color: '#38bdf8', fontSize: '14px' }}>
              <strong>Status Update:</strong> {actionFeedback}
            </div>
          )}

          {saveError && (
            <div style={{ backgroundColor: '#450a0a', border: '1px solid #b91c1c', borderRadius: '8px', padding: '12px 16px', color: '#fecaca', fontSize: '14px' }}>
              <strong>Error:</strong> {saveError}
            </div>
          )}

          {/* View Mode Segmented Switcher Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#1e293b',
              padding: '6px',
              borderRadius: '8px',
              border: '1px solid #334155',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '4px' }}>
              {(
                [
                  { id: 'split', label: 'Split Preview' },
                  { id: 'edit', label: 'Edit Only' },
                  { id: 'preview', label: 'Preview Only' },
                  { id: 'json', label: 'Raw AST' },
                ] as const
              ).map((tab) => {
                const isSelected = viewMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setViewMode(tab.id)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid #0284c7' : 'none',
                      backgroundColor: isSelected ? '#0284c7' : 'transparent',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: '12px', color: '#64748b', paddingRight: '8px' }}>
              Mode: {viewMode.toUpperCase()}
            </div>
          </div>

          {/* SPLIT PREVIEW MODE (Side-by-Side Editor & Live Preview) */}
          {viewMode === 'split' && (
            <>
              <style>{`
                .split-workspace-grid {
                  display: flex;
                  flex-direction: column;
                  gap: 24px;
                  align-items: flex-start;
                  width: 100%;
                }
                .split-editor-column {
                  width: 100%;
                  display: flex;
                  flex-direction: column;
                  gap: 16px;
                }
                .split-preview-column {
                  width: 100%;
                }
                @media (min-width: 1024px) {
                  .split-workspace-grid {
                    flex-direction: row;
                  }
                  .split-editor-column {
                    flex: 0 0 40%;
                    width: 40%;
                    max-width: 40%;
                    min-width: 0;
                  }
                  .split-preview-column {
                    flex: 0 0 calc(60% - 24px);
                    width: calc(60% - 24px);
                    max-width: calc(60% - 24px);
                    min-width: 0;
                    position: sticky;
                    top: 80px;
                    max-height: calc(100vh - 100px);
                    overflow-y: auto;
                  }
                  .split-preview-column::-webkit-scrollbar {
                    width: 6px;
                  }
                  .split-preview-column::-webkit-scrollbar-track {
                    background: #0f172a;
                  }
                  .split-preview-column::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 3px;
                  }
                }
              `}</style>
              <div className="split-workspace-grid">
                {/* Left Panel: Editor & Title (~40% desktop width) */}
                <div className="split-editor-column">
                  <div style={{ backgroundColor: '#1e293b', padding: '16px 20px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Blog Article Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={handleTitleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '16px',
                        fontWeight: '700',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <BlockEditor blocks={ast.blocks} onChange={handleBlocksChange} />
                </div>

                {/* Right Panel: Live Synchronized Preview (~60% desktop width) */}
                <div className="split-preview-column">
                  <AdminPreview
                    blocks={ast.blocks}
                    title={title}
                    featuredImage={blog.featuredImage}
                    status={blog.status}
                    createdAt={blog.createdAt}
                    sourceFilename={blog.sourceFilename}
                    blogId={blog.id}
                  />
                </div>
              </div>
            </>
          )}

          {/* EDIT ONLY MODE */}
          {viewMode === 'edit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Blog Article Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '18px',
                    fontWeight: '700',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
              <BlockEditor blocks={ast.blocks} onChange={handleBlocksChange} />
            </div>
          )}

          {/* PREVIEW ONLY MODE */}
          {viewMode === 'preview' && (
            <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
              <AdminPreview
                blocks={ast.blocks}
                title={title}
                featuredImage={blog.featuredImage}
                status={blog.status}
                createdAt={blog.createdAt}
                sourceFilename={blog.sourceFilename}
                blogId={blog.id}
              />
            </div>
          )}

          {/* RAW AST JSON MODE */}
          {viewMode === 'json' && (
            <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                Raw BlogDocumentAST JSON Inspector &amp; Direct Editor
              </label>
              <textarea
                rows={22}
                value={JSON.stringify(ast, null, 2)}
                onChange={handleJsonChange}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#38bdf8',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  lineHeight: 1.5,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '24px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #991b1b',
              borderRadius: '12px',
              padding: '28px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', color: '#f87171', fontSize: '20px', fontWeight: '800' }}>
              Delete this blog?
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.6 }}>
              This action cannot be undone. Deleting <strong>&quot;{title}&quot;</strong> will permanently remove the database record from PostgreSQL and delete unshared extracted image files from disk.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#b91c1c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '700',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
