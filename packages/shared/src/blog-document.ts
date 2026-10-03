// ==============================================================================
// Blog Document AST TypeScript Definitions (Shared Monorepo Specification)
// ==============================================================================

export interface InlineNode {
  type: 'text' | 'link';
  text: string;
  bold?: boolean;
  italic?: boolean;
  url?: string;
}

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'image'
  | 'quote'
  | 'callout'
  | 'table';

export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  children?: InlineNode[];
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
  children: InlineNode[];
}

export interface ListItemNode {
  text: string;
  children: InlineNode[];
}

export interface ListBlock {
  type: 'list';
  ordered: boolean;
  items: ListItemNode[];
}

export interface ImageBlock {
  type: 'image';
  url: string;
  alt: string;
  caption?: string;
  mimeType?: string;
}

export interface QuoteBlock {
  type: 'quote';
  text: string;
  children?: InlineNode[];
}

export interface CalloutBlock {
  type: 'callout';
  text: string;
  children?: InlineNode[];
}

export interface TableCell {
  text: string;
  children?: InlineNode[];
  isHeader?: boolean;
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableBlock {
  type: 'table';
  headers: string[];
  rows: TableCell[][];
}

export type BlogBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | ImageBlock
  | QuoteBlock
  | CalloutBlock
  | TableBlock;

export interface BlogDocumentAST {
  title?: string;
  blocks: BlogBlock[];
}

export interface ParserWarning {
  type: string;
  message: string;
}

export interface ExtractedImageMetadata {
  originalIndex: number;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ParserResult {
  document: BlogDocumentAST;
  rawHtml: string;
  sanitizedHtml: string;
  warnings: ParserWarning[];
  metadata: {
    originalFilename?: string;
    parser: string;
    parserVersion: string;
    extractedImageCount: number;
    warningCount: number;
    parsedAt: string;
  };
  images: ExtractedImageMetadata[];
}
