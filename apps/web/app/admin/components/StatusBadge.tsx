import React from 'react';
import { BlogStatus } from '../types';

interface StatusBadgeProps {
  status: BlogStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps): React.JSX.Element {
  const isPublished = status === 'PUBLISHED';
  
  const padding = size === 'sm' ? '2px 8px' : '4px 12px';
  const fontSize = size === 'sm' ? '11px' : '12px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding,
        borderRadius: '9999px',
        fontSize,
        fontWeight: '700',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        backgroundColor: isPublished ? 'rgba(22, 101, 52, 0.4)' : 'rgba(133, 77, 14, 0.4)',
        color: isPublished ? '#4ade80' : '#facc15',
        border: `1px solid ${isPublished ? '#15803d' : '#a16207'}`,
        lineHeight: 1,
      }}
      aria-label={`Status: ${status}`}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: isPublished ? '#4ade80' : '#facc15',
          boxShadow: `0 0 6px ${isPublished ? '#4ade80' : '#facc15'}`,
        }}
      />
      {status}
    </span>
  );
}
