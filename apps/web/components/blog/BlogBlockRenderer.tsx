import React from 'react';
import {
  BlogBlock,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  ListItemNode,
  ImageBlock,
  QuoteBlock,
  CalloutBlock,
  TableBlock,
  TableCell,
  TableRow,
  InlineNode,
} from '@blog-management/shared';

interface BlogBlockRendererProps {
  block: BlogBlock;
  index?: number;
}

export function renderInlineNodes(children?: InlineNode[], fallbackText?: string): React.ReactNode {
  if (!children || children.length === 0) {
    return fallbackText || null;
  }

  return children.map((node, idx) => {
    let element: React.ReactNode = node.text;

    if (node.bold) {
      element = <strong key={idx} style={{ color: '#f8fafc', fontWeight: '700' }}>{element}</strong>;
    }
    if (node.italic) {
      element = <em key={idx} style={{ fontStyle: 'italic' }}>{element}</em>;
    }
    if (node.type === 'link' && node.url) {
      element = (
        <a
          key={idx}
          href={node.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#38bdf8', textDecoration: 'underline', textUnderlineOffset: '3px' }}
        >
          {element}
        </a>
      );
    }

    return <React.Fragment key={idx}>{element}</React.Fragment>;
  });
}

export function BlogBlockRenderer({ block, index = 0 }: BlogBlockRendererProps): React.JSX.Element | null {
  switch (block.type) {
    case 'heading': {
      const b = block as HeadingBlock;
      const Tag = (`h${b.level}` as keyof React.JSX.IntrinsicElements) || 'h2';
      const fontSize =
        b.level === 1 ? '32px' : b.level === 2 ? '24px' : b.level === 3 ? '20px' : '17px';
      const marginTop = b.level === 1 ? '36px' : b.level === 2 ? '32px' : '24px';

      return (
        <Tag
          key={index}
          style={{
            fontSize,
            fontWeight: '800',
            color: '#f8fafc',
            marginTop,
            marginBottom: '14px',
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            borderBottom: b.level <= 2 ? '1px solid #334155' : 'none',
            paddingBottom: b.level <= 2 ? '10px' : '0',
          }}
        >
          {renderInlineNodes(b.children, b.text)}
        </Tag>
      );
    }

    case 'paragraph': {
      const b = block as ParagraphBlock;
      return (
        <p
          key={index}
          style={{
            fontSize: '16px',
            lineHeight: 1.75,
            color: '#cbd5e1',
            marginBottom: '20px',
            letterSpacing: '0.01em',
          }}
        >
          {renderInlineNodes(b.children, b.text)}
        </p>
      );
    }

    case 'list': {
      const b = block as ListBlock;
      const ListTag = b.ordered ? 'ol' : 'ul';
      return (
        <ListTag
          key={index}
          style={{
            paddingLeft: '28px',
            marginBottom: '20px',
            color: '#cbd5e1',
            fontSize: '16px',
            lineHeight: 1.7,
          }}
        >
          {b.items.map((item: ListItemNode, iIdx: number) => (
            <li key={iIdx} style={{ marginBottom: '8px' }}>
              {renderInlineNodes(item.children, item.text)}
            </li>
          ))}
        </ListTag>
      );
    }

    case 'image': {
      const b = block as ImageBlock;
      return (
        <figure
          key={index}
          style={{
            margin: '32px 0',
            textAlign: 'center',
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #334155',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.url}
            alt={b.alt || 'Kofuku Blog Article Image'}
            style={{
              maxWidth: '100%',
              maxHeight: '480px',
              borderRadius: '8px',
              objectFit: 'contain',
            }}
          />
          {b.caption && (
            <figcaption style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', marginTop: '10px' }}>
              {b.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'quote': {
      const b = block as QuoteBlock;
      return (
        <blockquote
          key={index}
          style={{
            borderLeft: '4px solid #38bdf8',
            backgroundColor: '#0f172a',
            padding: '20px 24px',
            borderRadius: '0 12px 12px 0',
            margin: '28px 0',
            color: '#f1f5f9',
            fontStyle: 'italic',
            fontSize: '17px',
            lineHeight: 1.6,
          }}
        >
          {renderInlineNodes(b.children, b.text)}
        </blockquote>
      );
    }

    case 'callout': {
      const b = block as CalloutBlock;
      return (
        <div
          key={index}
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid #0284c7',
            borderRadius: '12px',
            padding: '20px 24px',
            margin: '28px 0',
            color: '#e0f2fe',
            fontSize: '15px',
            lineHeight: 1.6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>📌</span>
            <div>{renderInlineNodes(b.children, b.text)}</div>
          </div>
        </div>
      );
    }

    case 'table': {
      const b = block as TableBlock;
      return (
        <div key={index} style={{ overflowX: 'auto', margin: '32px 0' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
              textAlign: 'left',
              border: '1px solid #334155',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {b.headers && b.headers.length > 0 && (
              <thead>
                <tr style={{ backgroundColor: '#0f172a', borderBottom: '2px solid #334155', color: '#38bdf8' }}>
                  {b.headers.map((h: string, hIdx: number) => (
                    <th key={hIdx} style={{ padding: '12px 16px', fontWeight: '700' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {b.rows.map((row: TableRow | TableCell[] | string[], rIdx: number) => {
                const cells: TableCell[] = Array.isArray(row) ? (row as TableCell[]) : (row as TableRow).cells || [];
                return (
                  <tr
                    key={rIdx}
                    style={{
                      borderBottom: '1px solid #334155',
                      backgroundColor: rIdx % 2 === 0 ? '#1e293b' : '#0f172a',
                    }}
                  >
                    {cells.map((cell: TableCell | string, cIdx: number) => {
                      const cellText = typeof cell === 'string' ? cell : cell.text || '';
                      return (
                        <td key={cIdx} style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                          {cellText}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    default:
      return null;
  }
}
