'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@apollo/client';
import { UPLOAD_BLOG_DOCUMENT, GET_ADMIN_BLOGS } from '../queries';
import { Blog } from '../types';
import { AdminHeader } from '../components/AdminHeader';
import { StatusBadge } from '../components/StatusBadge';

export default function RealUploadPage(): React.JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createdBlog, setCreatedBlog] = useState<Blog | null>(null);

  const [uploadDocument, { loading: uploading, error: apiError, reset: resetMutation }] = useMutation<{
    uploadBlogDocument: Blog;
  }>(UPLOAD_BLOG_DOCUMENT, {
    refetchQueries: [{ query: GET_ADMIN_BLOGS }],
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const validateAndSetFile = (selectedFile: File | null) => {
    setValidationError(null);
    setCreatedBlog(null);
    resetMutation();

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const fileName = selectedFile.name;
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

    if (ext !== '.docx') {
      if (ext === '.doc') {
        setValidationError(
          'Legacy binary .doc files are not supported. Please convert and save your document as .docx in Microsoft Word.'
        );
      } else {
        setValidationError(`Unsupported file extension '${ext}'. Only .docx documents are supported.`);
      }
      setFile(null);
      return;
    }

    const MAX_SIZE_BYTES = 25 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE_BYTES) {
      setValidationError(
        `File size (${formatFileSize(selectedFile.size)}) exceeds the maximum allowed limit of 25 MB.`
      );
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const response = await uploadDocument({
          variables: {
            fileName: file.name,
            fileBufferBase64: base64Data,
          },
        });

        if (response.data?.uploadBlogDocument) {
          setCreatedBlog(response.data.uploadBlogDocument);
          setFile(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCreatedBlog(null);
    setValidationError(null);
    resetMutation();
  };

  return (
    <div>
      <AdminHeader
        title="Upload Blog Document"
        subtitle="Upload a Microsoft Word document (.docx) to ingest and create a draft blog post"
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

      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        {/* SUCCESS STATE */}
        {createdBlog && (
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              border: '1px solid #15803d',
              padding: '36px',
              textAlign: 'center',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(22, 101, 52, 0.3)',
                color: '#4ade80',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <svg style={{ width: '36px', height: '36px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', margin: '0 0 8px 0' }}>
              Document Uploaded Successfully!
            </h2>
            <p style={{ fontSize: '15px', color: '#94a3b8', margin: '0 0 24px 0' }}>
              Your document has been processed and saved as a draft blog post.
            </p>

            {/* Ingested Blog Summary Box */}
            <div
              style={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                border: '1px solid #334155',
                padding: '20px',
                textAlign: 'left',
                marginBottom: '28px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                  {createdBlog.title}
                </h3>
                <StatusBadge status={createdBlog.status} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Source Filename:</span>{' '}
                  <strong style={{ color: '#cbd5e1' }}>{createdBlog.sourceFilename}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Extracted Images:</span>{' '}
                  <strong style={{ color: '#38bdf8' }}>{createdBlog.extractedImageCount} images</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Blog ID:</span>{' '}
                  <code style={{ color: '#94a3b8' }}>{createdBlog.id}</code>
                </div>
              </div>
            </div>

            {/* Success Action CTAs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                href={`/admin/blogs/${createdBlog.id}`}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                View Blog Detail
              </Link>
              <Link
                href="/admin/blogs"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                View All Blogs
              </Link>
              <button
                onClick={handleReset}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#38bdf8',
                  border: '1px solid #0284c7',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Upload Another Document
              </button>
            </div>
          </div>
        )}

        {/* UPLOAD FORM STATE */}
        {!createdBlog && (
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              border: '1px solid #334155',
              padding: '36px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Client Validation Error */}
            {validationError && (
              <div
                style={{
                  backgroundColor: '#450a0a',
                  border: '1px solid #b91c1c',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  color: '#fecaca',
                  fontSize: '14px',
                  marginBottom: '24px',
                }}
              >
                <strong>Validation Error:</strong> {validationError}
              </div>
            )}

            {/* Server API Error */}
            {apiError && (
              <div
                style={{
                  backgroundColor: '#450a0a',
                  border: '1px solid #b91c1c',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  color: '#fecaca',
                  fontSize: '14px',
                  marginBottom: '24px',
                }}
              >
                <strong>Server Error:</strong> {apiError.message}
              </div>
            )}

            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? '#38bdf8' : file ? '#0284c7' : '#334155'}`,
                backgroundColor: dragActive ? 'rgba(56, 189, 248, 0.08)' : '#0f172a',
                borderRadius: '12px',
                padding: '40px 24px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              <input
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                id="file-upload-input"
                style={{ display: 'none' }}
              />

              {!file ? (
                <div>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#1e293b',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto',
                    }}
                  >
                    <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', margin: '0 0 8px 0' }}>
                    Drag & Drop your .docx file here
                  </h3>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 20px 0' }}>
                    or click to browse your local computer
                  </p>

                  <label
                    htmlFor="file-upload-input"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Browse Document File
                  </label>

                  <div style={{ marginTop: '20px', fontSize: '12px', color: '#64748b' }}>
                    Supported format: <strong>.docx</strong> (Microsoft Word) &bull; Max size: <strong>25 MB</strong>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '12px 20px',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', color: '#f8fafc', fontSize: '15px' }}>{file.name}</div>
                      <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '2px' }}>
                        Size: {formatFileSize(file.size)} &bull; Format: .docx
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      disabled={uploading}
                      aria-label="Remove selected file"
                      style={{
                        marginLeft: '16px',
                        background: 'none',
                        border: 'none',
                        color: '#f87171',
                        cursor: 'pointer',
                        fontSize: '18px',
                        fontWeight: '700',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Submit Button */}
            {file && (
              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{
                    padding: '12px 28px',
                    backgroundColor: uploading ? '#0369a1' : '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {uploading ? (
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
                      Ingesting Document...
                    </>
                  ) : (
                    'Upload & Parse Document'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
