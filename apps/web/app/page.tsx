'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery, gql } from '@apollo/client';

const GET_SYSTEM_HEALTH = gql`
  query GetSystemHealth {
    health
    blogs {
      id
    }
  }
`;

export default function RootHomePage(): React.JSX.Element {
  const { data, loading, error } = useQuery<{ health: string; blogs: { id: string }[] }>(
    GET_SYSTEM_HEALTH
  );

  return (
    <main
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '60px 24px',
        textAlign: 'center',
      }}
    >
      <header style={{ marginBottom: '40px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '9999px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            color: '#38bdf8',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '20px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4ade80',
              boxShadow: '0 0 6px #4ade80',
            }}
          />
          Blog Management System Active
        </div>

        <h1
          style={{
            fontSize: '42px',
            fontWeight: '800',
            color: '#f8fafc',
            margin: '0 0 16px 0',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
          }}
        >
          Blog Management Admin Panel
        </h1>

        <p
          style={{
            fontSize: '18px',
            color: '#94a3b8',
            margin: '0 auto',
            maxWidth: '600px',
            lineHeight: 1.6,
          }}
        >
          Professional DOCX Document Ingestion, AST Structured Editing, and Blog Publishing Platform
        </p>
      </header>

      {/* Primary Call to Action */}
      <div style={{ marginBottom: '48px' }}>
        <Link
          href="/admin/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 32px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '16px',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
          }}
        >
          Launch Admin Dashboard →
        </Link>
      </div>

      {/* System Status Cards */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #334155',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
            GraphQL API Layer
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#4ade80', marginTop: '6px' }}>
            {loading ? 'Checking health...' : error ? 'Connection Failed' : data?.health}
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '8px 0 0 0' }}>
            Apollo Server on port 4000
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #334155',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
            PostgreSQL Database
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#38bdf8', marginTop: '6px' }}>
            {loading ? 'Querying...' : error ? 'Unavailable' : `${data?.blogs?.length || 0} Ingested Blogs`}
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '8px 0 0 0' }}>
            Prisma ORM on 127.0.0.1:5432
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #334155',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
            Document Parsing Engine
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#a855f7', marginTop: '6px' }}>
            Mammoth + AST Normalizer
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '8px 0 0 0' }}>
            SHA-256 local image storage
          </p>
        </div>
      </section>

      <footer style={{ marginTop: '60px', color: '#64748b', fontSize: '13px' }}>
        Blog Management Admin Panel &bull; Version 1.0 &bull; Editorial CMS
      </footer>
    </main>
  );
}
