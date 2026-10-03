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
  BlockType,
  InlineNode,
} from '@blog-management/shared';

interface BlockEditorProps {
  blocks: BlogBlock[];
  onChange: (newBlocks: BlogBlock[]) => void;
}

function preserveChildrenOnTextUpdate(existingChildren: InlineNode[] | undefined, newText: string): InlineNode[] {
  if (!existingChildren || existingChildren.length === 0) {
    return [{ type: 'text', text: newText }];
  }
  if (existingChildren.length === 1) {
    return [{ ...existingChildren[0], text: newText }];
  }
  return [{ type: 'text', text: newText }];
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps): React.JSX.Element {
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const [movedBlock] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, movedBlock);
    onChange(newBlocks);
  };

  const handleDeleteBlock = (index: number) => {
    const newBlocks = blocks.filter((_, idx) => idx !== index);
    onChange(newBlocks);
  };

  const handleUpdateBlock = (index: number, updatedBlock: BlogBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    onChange(newBlocks);
  };

  const handleAddBlock = (type: BlockType) => {
    let newBlock: BlogBlock;
    switch (type) {
      case 'heading':
        newBlock = { type: 'heading', level: 2, text: 'New Heading', children: [{ type: 'text', text: 'New Heading' }] };
        break;
      case 'paragraph':
        newBlock = { type: 'paragraph', text: 'New paragraph text.', children: [{ type: 'text', text: 'New paragraph text.' }] };
        break;
      case 'list':
        newBlock = {
          type: 'list',
          ordered: false,
          items: [{ text: 'First list item', children: [{ type: 'text', text: 'First list item' }] }],
        };
        break;
      case 'image':
        newBlock = { type: 'image', url: '/storage/images/placeholder.png', alt: 'Image description' };
        break;
      case 'quote':
        newBlock = { type: 'quote', text: 'Quotable statement text.', children: [{ type: 'text', text: 'Quotable statement text.' }] };
        break;
      case 'callout':
        newBlock = { type: 'callout', text: 'Important callout note.', children: [{ type: 'text', text: 'Important callout note.' }] };
        break;
      case 'table':
        newBlock = {
          type: 'table',
          headers: ['Column 1', 'Column 2'],
          rows: [[{ text: 'Cell 1' }, { text: 'Cell 2' }]],
        };
        break;
      default:
        return;
    }
    onChange([...blocks, newBlock]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {blocks.map((block, index) => (
        <div
          key={index}
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            border: '1px solid #334155',
            padding: '20px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Block Header Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #334155',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  backgroundColor: '#0f172a',
                  color: '#38bdf8',
                  border: '1px solid #0284c7',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Block #{index + 1} &bull; {block.type}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleMoveBlock(index, 'up')}
                disabled={index === 0}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#0f172a',
                  color: index === 0 ? '#475569' : '#94a3b8',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                Move Up
              </button>
              <button
                type="button"
                onClick={() => handleMoveBlock(index, 'down')}
                disabled={index === blocks.length - 1}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#0f172a',
                  color: index === blocks.length - 1 ? '#475569' : '#94a3b8',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  cursor: index === blocks.length - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                Move Down
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBlock(index)}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#450a0a',
                  color: '#f87171',
                  border: '1px solid #991b1b',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Block Specific Form Inputs */}
          {block.type === 'heading' && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ width: '120px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Level</label>
                <select
                  value={(block as HeadingBlock).level}
                  onChange={(e) =>
                    handleUpdateBlock(index, {
                      ...block,
                      level: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6,
                    } as HeadingBlock)
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                  }}
                >
                  <option value={1}>H1 (Title)</option>
                  <option value={2}>H2 (Section)</option>
                  <option value={3}>H3 (Subhead)</option>
                  <option value={4}>H4</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: '240px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Heading Text</label>
                <input
                  type="text"
                  value={(block as HeadingBlock).text}
                  onChange={(e) => {
                    const val = e.target.value;
                    const b = block as HeadingBlock;
                    handleUpdateBlock(index, {
                      ...b,
                      text: val,
                      children: preserveChildrenOnTextUpdate(b.children, val),
                    } as HeadingBlock);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}

          {block.type === 'paragraph' && (
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Paragraph Text</label>
              <textarea
                rows={3}
                value={(block as ParagraphBlock).text}
                onChange={(e) => {
                  const val = e.target.value;
                  const b = block as ParagraphBlock;
                  handleUpdateBlock(index, {
                    ...b,
                    text: val,
                    children: preserveChildrenOnTextUpdate(b.children, val),
                  } as ParagraphBlock);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          {block.type === 'list' && (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={(block as ListBlock).ordered}
                    onChange={(e) =>
                      handleUpdateBlock(index, {
                        ...block,
                        ordered: e.target.checked,
                      } as ListBlock)
                    }
                  />
                  Ordered (Numbered) List
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(block as ListBlock).items.map((item: ListItemNode, iIdx: number) => (
                  <div key={iIdx} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newItems = [...(block as ListBlock).items];
                        newItems[iIdx] = { text: val, children: preserveChildrenOnTextUpdate(item.children, val) };
                        handleUpdateBlock(index, { ...block, items: newItems } as ListBlock);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = (block as ListBlock).items.filter((_, idx) => idx !== iIdx);
                        handleUpdateBlock(index, { ...block, items: newItems } as ListBlock);
                      }}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#0f172a',
                        color: '#f87171',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const newItems = [
                    ...(block as ListBlock).items,
                    { text: 'New Item', children: [{ type: 'text', text: 'New Item' }] },
                  ];
                  handleUpdateBlock(index, { ...block, items: newItems } as ListBlock);
                }}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  backgroundColor: '#0f172a',
                  color: '#38bdf8',
                  border: '1px solid #0284c7',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + Add List Item
              </button>
            </div>
          )}

          {block.type === 'image' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Image URL / Path</label>
                <input
                  type="text"
                  value={(block as ImageBlock).url}
                  onChange={(e) =>
                    handleUpdateBlock(index, { ...block, url: e.target.value } as ImageBlock)
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Alt Text</label>
                  <input
                    type="text"
                    value={(block as ImageBlock).alt}
                    onChange={(e) =>
                      handleUpdateBlock(index, { ...block, alt: e.target.value } as ImageBlock)
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Caption</label>
                  <input
                    type="text"
                    value={(block as ImageBlock).caption || ''}
                    onChange={(e) =>
                      handleUpdateBlock(index, { ...block, caption: e.target.value } as ImageBlock)
                    }
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {(block.type === 'quote' || block.type === 'callout') && (
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                {block.type === 'quote' ? 'Quote Text' : 'Callout Text'}
              </label>
              <textarea
                rows={2}
                value={(block as QuoteBlock | CalloutBlock).text}
                onChange={(e) => {
                  const val = e.target.value;
                  const b = block as QuoteBlock | CalloutBlock;
                  handleUpdateBlock(index, {
                    ...b,
                    text: val,
                    children: preserveChildrenOnTextUpdate(b.children, val),
                  } as QuoteBlock | CalloutBlock);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          {block.type === 'table' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Table Headers (comma separated)
                </label>
                <input
                  type="text"
                  value={((block as TableBlock).headers || []).join(', ')}
                  onChange={(e) => {
                    const headers = e.target.value.split(',').map((h) => h.trim());
                    handleUpdateBlock(index, { ...block, headers } as TableBlock);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Editable Table Grid Cells */}
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Table Grid Rows &amp; Cells
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {((block as TableBlock).rows || []).map((row, rIdx) => {
                    const cells: TableCell[] = Array.isArray(row)
                      ? (row as TableCell[])
                      : (row as TableRow).cells || [];

                    return (
                      <div key={rIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', width: '48px' }}>Row #{rIdx + 1}</span>
                        <div style={{ display: 'flex', gap: '6px', flex: 1, overflowX: 'auto' }}>
                          {cells.map((cell, cIdx) => {
                            const cellText = typeof cell === 'string' ? cell : cell.text || '';
                            return (
                              <input
                                key={cIdx}
                                type="text"
                                value={cellText}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newRows = [...(block as TableBlock).rows];
                                  const rowCopy: TableCell[] = [...cells];
                                  rowCopy[cIdx] = {
                                    text: val,
                                    children: preserveChildrenOnTextUpdate(typeof cell === 'object' ? cell.children : undefined, val),
                                  };
                                  newRows[rIdx] = rowCopy;
                                  handleUpdateBlock(index, { ...block, rows: newRows } as TableBlock);
                                }}
                                placeholder={`Col ${cIdx + 1}`}
                                style={{
                                  flex: 1,
                                  minWidth: '100px',
                                  padding: '6px 10px',
                                  backgroundColor: '#0f172a',
                                  border: '1px solid #334155',
                                  borderRadius: '6px',
                                  color: '#f8fafc',
                                  fontSize: '13px',
                                }}
                              />
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newRows = (block as TableBlock).rows.filter((_, idx) => idx !== rIdx);
                            handleUpdateBlock(index, { ...block, rows: newRows } as TableBlock);
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#0f172a',
                            color: '#f87171',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const colCount = Math.max(1, (block as TableBlock).headers?.length || 2);
                    const newRow: TableCell[] = Array.from({ length: colCount }, (_, idx) => ({
                      text: `Cell ${idx + 1}`,
                      children: [{ type: 'text', text: `Cell ${idx + 1}` }],
                    }));
                    const newRows = [...((block as TableBlock).rows || []), newRow];
                    handleUpdateBlock(index, { ...block, rows: newRows } as TableBlock);
                  }}
                  style={{
                    marginTop: '10px',
                    padding: '6px 12px',
                    backgroundColor: '#0f172a',
                    color: '#38bdf8',
                    border: '1px solid #0284c7',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  + Add Grid Row
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add New Block Toolbar */}
      <div
        style={{
          backgroundColor: '#0f172a',
          borderRadius: '12px',
          border: '1px dashed #0284c7',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', marginRight: '12px' }}>
          Add New AST Block:
        </span>
        <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['heading', 'paragraph', 'list', 'quote', 'callout', 'image', 'table'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleAddBlock(t)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              + {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
