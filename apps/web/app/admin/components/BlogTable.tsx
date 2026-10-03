import React from 'react';
import Link from 'next/link';
import { Blog } from '../types';
import { StatusBadge } from './StatusBadge';

interface BlogTableProps {
  blogs: Blog[];
}

export function BlogTable({ blogs }: BlogTableProps): React.JSX.Element {
  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        border: '1px solid #334155',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: '#0f172a',
              borderBottom: '1px solid #334155',
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <th scope="col" style={{ padding: '16px 20px' }}>
              Blog Title
            </th>
            <th scope="col" style={{ padding: '16px 20px' }}>
              Status
            </th>
            <th scope="col" style={{ padding: '16px 20px' }}>
              Source Filename
            </th>
            <th scope="col" style={{ padding: '16px 20px', textAlign: 'center' }}>
              Extracted Images
            </th>
            <th scope="col" style={{ padding: '16px 20px' }}>
              Created At
            </th>
            <th scope="col" style={{ padding: '16px 20px', textAlign: 'right' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody style={{ color: '#f8fafc' }}>
          {blogs.map((blog) => (
            <tr
              key={blog.id}
              style={{
                borderBottom: '1px solid #334155',
                transition: 'background-color 0.15s ease',
              }}
            >
              {/* Title & ID */}
              <td style={{ padding: '16px 20px', maxWidth: '320px' }}>
                <div style={{ fontWeight: '600', color: '#f1f5f9', fontSize: '15px' }}>
                  {blog.title}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                  ID: {blog.id}
                </div>
              </td>

              {/* Status */}
              <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                <StatusBadge status={blog.status} />
              </td>

              {/* Source Filename */}
              <td style={{ padding: '16px 20px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                {blog.sourceFilename ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#0f172a',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #334155',
                      fontSize: '12px',
                    }}
                  >
                    {blog.sourceFilename}
                  </span>
                ) : (
                  <span style={{ color: '#64748b', fontStyle: 'italic' }}>Direct Record</span>
                )}
              </td>

              {/* Extracted Images */}
              <td style={{ padding: '16px 20px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: blog.extractedImageCount > 0 ? '#0f172a' : 'transparent',
                    color: blog.extractedImageCount > 0 ? '#38bdf8' : '#64748b',
                    fontWeight: '600',
                  }}
                >
                  {blog.extractedImageCount} {blog.extractedImageCount === 1 ? 'image' : 'images'}
                </span>
              </td>

              {/* Created At */}
              <td style={{ padding: '16px 20px', color: '#94a3b8', whiteSpace: 'nowrap', fontSize: '13px' }}>
                {formatDate(blog.createdAt)}
              </td>

              {/* Actions */}
              <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Link
                    href={`/admin/blogs/${blog.id}`}
                    aria-label={`View blog ${blog.title}`}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#0f172a',
                      color: '#38bdf8',
                      border: '1px solid #0284c7',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      textDecoration: 'none',
                    }}
                  >
                    View
                  </Link>

                  <Link
                    href={`/admin/blogs/${blog.id}?mode=edit`}
                    aria-label={`Edit blog ${blog.title}`}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#0f172a',
                      color: '#94a3b8',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      textDecoration: 'none',
                    }}
                  >
                    Edit
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
