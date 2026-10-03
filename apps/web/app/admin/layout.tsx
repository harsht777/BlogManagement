import React from 'react';
import { AdminSidebar } from './components/AdminSidebar';

export const metadata = {
  title: 'Blog Management Admin Panel',
  description: 'Admin Control Panel for Blog Management System',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
      }}
    >
      <AdminSidebar />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <main
          style={{
            flex: 1,
            padding: '32px 40px',
            maxWidth: '1800px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
