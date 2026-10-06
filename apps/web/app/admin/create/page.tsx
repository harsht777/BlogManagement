'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { CREATE_BLOG, GET_ADMIN_BLOGS } from '../queries';
import { Blog } from '../types';
import { BlogDocumentAST, BlogBlock } from '@blog-management/shared';
import { AdminHeader } from '../components/AdminHeader';
import { BlockEditor } from '../components/BlockEditor';

export default function CreateManualBlogPage(): React.JSX.Element {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<BlogBlock[]>([
    {
      type: 'paragraph',
      text: 'Start typing your blog article content here...',
      children: [{ type: 'text', text: 'Start typing your blog article content here...' }],
    },
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [createBlog, { loading: creating, error: apiError }] = useMutation<{
    createBlog: Blog;
  }>(CREATE_BLOG, {
    refetchQueries: [{ query: GET_ADMIN_BLOGS }],
  });

  const handleCreate = async () => {
    setValidationError(null);
    if (!title.trim()) {
      setValidationError('Please enter a blog title before saving.');
      return;
    }

    const ast: BlogDocumentAST = { blocks };

    try {
      const response = await createBlog({
        variables: {
          title: title.trim(),
          contentJson: JSON.stringify(ast),
        },
      });

      if (response.data?.createBlog) {
        const newId = response.data.createBlog.id;
        router.push(`/admin/blogs/${newId}`);
      }
    } catch (err) {
      console.error('Failed to create manual blog:', err);
    }
  };

  return (
    <div>
      <AdminHeader
        title="Create Blog Manually"
        subtitle="Compose a new blog post with fully dynamic sections (Headings, Paragraphs, Lists, Images, Quotes, Callouts, Tables)"
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

      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Creation Mode Switcher Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#1e293b',
            padding: '6px',
            borderRadius: '8px',
            border: '1px solid #334155',
          }}
        >
          <Link
            href="/admin/upload"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '700',
              borderRadius: '6px',
              color: '#94a3b8',
              textDecoration: 'none',
            }}
          >
            Upload DOCX Document
          </Link>
          <span
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '700',
              borderRadius: '6px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: '1px solid #0284c7',
            }}
          >
            Create Blog Manually
          </span>
        </div>

        {/* Error Banners */}
        {validationError && (
          <div
            style={{
              backgroundColor: '#450a0a',
              border: '1px solid #b91c1c',
              borderRadius: '8px',
              padding: '14px 18px',
              color: '#fecaca',
              fontSize: '14px',
            }}
          >
            <strong>Validation Error:</strong> {validationError}
          </div>
        )}

        {apiError && (
          <div
            style={{
              backgroundColor: '#450a0a',
              border: '1px solid #b91c1c',
              borderRadius: '8px',
              padding: '14px 18px',
              color: '#fecaca',
              fontSize: '14px',
            }}
          >
            <strong>Server Error:</strong> {apiError.message}
          </div>
        )}

        {/* Title Input Card */}
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #334155',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
          }}
        >
          <label
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#94a3b8',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            Blog Article Title <span style={{ color: '#f87171' }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Architectural Patterns in Modern Web Development"
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

        {/* Dynamic AST Block Builder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
              Dynamic Content Sections ({blocks.length})
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Add, reorder, or edit sections freely
            </span>
          </div>

          <BlockEditor blocks={blocks} onChange={setBlocks} />
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <Link
            href="/admin/blogs"
            style={{
              padding: '12px 24px',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '15px',
              textDecoration: 'none',
            }}
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            style={{
              padding: '12px 28px',
              backgroundColor: creating ? '#0369a1' : '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: creating ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {creating ? (
              <>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Creating Blog...
              </>
            ) : (
              'Save & Open Editor Workspace →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
