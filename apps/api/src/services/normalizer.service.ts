import sanitizeHtml from 'sanitize-html';
import * as cheerio from 'cheerio';
import { Element, Node, Text } from 'domhandler';
import {
  BlogDocumentAST,
  BlogBlock,
  InlineNode,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  ListItemNode,
  ImageBlock,
  QuoteBlock,
  CalloutBlock,
  TableBlock,
  TableCell,
} from '../types/blog-document.js';

export class NormalizerService {
  /**
   * Sanitizes raw HTML using a strict semantic whitelist policy.
   */
  sanitize(rawHtml: string): string {
    return sanitizeHtml(rawHtml, {
      allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'span', 'strong', 'b', 'em', 'i',
        'a', 'ul', 'ol', 'li',
        'blockquote', 'div',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'img',
      ],
      allowedAttributes: {
        a: ['href', 'title', 'target'],
        img: ['src', 'alt', 'title'],
        div: ['class'],
        h1: ['class'],
        h2: ['class'],
        h3: ['class'],
        p: ['class'],
        blockquote: ['class'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      transformTags: {
        b: 'strong',
        i: 'em',
      },
    });
  }

  /**
   * Parses sanitized HTML and converts it into a structured BlogDocumentAST.
   */
  normalize(html: string): BlogDocumentAST {
    const sanitizedHtml = this.sanitize(html);
    const $ = cheerio.load(sanitizedHtml);
    const blocks: BlogBlock[] = [];
    let extractedTitle: string | undefined = undefined;

    const rootChildren = $('body').children().toArray();

    for (const node of rootChildren) {
      if (node.type !== 'tag') continue;
      const el = node as Element;
      const tagName = el.tagName.toLowerCase();

      // Heading
      if (/^h[1-6]$/.test(tagName)) {
        const level = parseInt(tagName.replace('h', ''), 10) as 1 | 2 | 3 | 4 | 5 | 6;
        const text = $(el).text().trim();
        if (text) {
          if (!extractedTitle && level === 1) {
            extractedTitle = text;
          }
          const children = this.extractInlineNodes($(el), $);
          blocks.push({
            type: 'heading',
            level,
            text,
            children: children.length > 0 ? children : [{ type: 'text', text }],
          } as HeadingBlock);
        }
        continue;
      }

      // Paragraph / Callout / Image
      if (tagName === 'p') {
        const text = $(el).text().trim();

        // Check if paragraph contains an embedded image
        const img = $(el).find('img').first();
        if (img.length > 0) {
          const src = img.attr('src') || '';
          const alt = img.attr('alt') || '';
          if (src) {
            blocks.push({
              type: 'image',
              url: src,
              alt,
            } as ImageBlock);
          }
          // If there is also text beside the image
          const remainingText = $(el).text().replace(alt, '').trim();
          if (remainingText) {
            blocks.push({
              type: 'paragraph',
              text: remainingText,
              children: [{ type: 'text', text: remainingText }],
            } as ParagraphBlock);
          }
          continue;
        }

        // Check for Callout pattern
        const isCallout =
          $(el).hasClass('callout') ||
          /^(IMPORTANT|NOTE|WARNING|CALLOUT)/i.test(text);

        if (isCallout && text) {
          const children = this.extractInlineNodes($(el), $);
          blocks.push({
            type: 'callout',
            text,
            children,
          } as CalloutBlock);
          continue;
        }

        if (text) {
          const children = this.extractInlineNodes($(el), $);
          blocks.push({
            type: 'paragraph',
            text,
            children,
          } as ParagraphBlock);
        }
        continue;
      }

      // Standalone Image
      if (tagName === 'img') {
        const src = $(el).attr('src') || '';
        const alt = $(el).attr('alt') || '';
        if (src) {
          blocks.push({
            type: 'image',
            url: src,
            alt,
          } as ImageBlock);
        }
        continue;
      }

      // List (ul / ol)
      if (tagName === 'ul' || tagName === 'ol') {
        const ordered = tagName === 'ol';
        const items: ListItemNode[] = [];

        $(el).children('li').each((_, li) => {
          const itemText = $(li).text().trim();
          if (itemText) {
            const inlineChildren = this.extractInlineNodes($(li), $);
            items.push({
              text: itemText,
              children: inlineChildren,
            });
          }
        });

        if (items.length > 0) {
          blocks.push({
            type: 'list',
            ordered,
            items,
          } as ListBlock);
        }
        continue;
      }

      // Blockquote
      if (tagName === 'blockquote') {
        const text = $(el).text().trim();
        if (text) {
          const children = this.extractInlineNodes($(el), $);
          blocks.push({
            type: 'quote',
            text,
            children,
          } as QuoteBlock);
        }
        continue;
      }

      // Callout Div
      if (tagName === 'div' && $(el).hasClass('callout')) {
        const text = $(el).text().trim();
        if (text) {
          const children = this.extractInlineNodes($(el), $);
          blocks.push({
            type: 'callout',
            text,
            children,
          } as CalloutBlock);
        }
        continue;
      }

      // Table
      if (tagName === 'table') {
        const headers: string[] = [];
        const rows: TableCell[][] = [];

        // Header rows
        $(el).find('tr').each((rowIdx, tr) => {
          const rowCells: TableCell[] = [];
          const isHeaderRow = rowIdx === 0 && $(tr).find('th').length > 0;

          $(tr).find('th, td').each((_, cell) => {
            const cellText = $(cell).text().trim();
            const isTh = (cell as Element).tagName.toLowerCase() === 'th';
            if (isHeaderRow || isTh) {
              headers.push(cellText);
            }
            rowCells.push({
              text: cellText,
              isHeader: isHeaderRow || isTh,
              children: this.extractInlineNodes($(cell), $),
            });
          });

          if (rowCells.length > 0) {
            rows.push(rowCells);
          }
        });

        if (rows.length > 0) {
          blocks.push({
            type: 'table',
            headers: headers.length > 0 ? headers : rows[0].map((c) => c.text),
            rows,
          } as TableBlock);
        }
        continue;
      }
    }

    return {
      title: extractedTitle,
      blocks,
    };
  }

  /**
   * Helper to extract rich inline formatting (bold, italic, links) from DOM container
   * while preserving natural word boundaries and whitespace between formatted nodes.
   */
  private extractInlineNodes(
    $el: cheerio.Cheerio<Element>,
    $: cheerio.CheerioAPI
  ): InlineNode[] {
    const inlineNodes: InlineNode[] = [];

    const traverse = (node: Node, parentBold = false, parentItalic = false, parentUrl?: string) => {
      if (node.type === 'text') {
        const rawText = (node as Text).data;
        if (!rawText) return;

        // Replace newlines/tabs and multiple consecutive spaces with a single space
        let text = rawText.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');

        // Strip leading space ONLY for the very first inline node of the container element
        if (inlineNodes.length === 0) {
          text = text.trimStart();
        }

        // Avoid double spaces at boundary with previous inline node
        if (text === ' ' && inlineNodes.length > 0 && inlineNodes[inlineNodes.length - 1].text.endsWith(' ')) {
          return;
        }

        if (text && text.length > 0) {
          inlineNodes.push({
            type: parentUrl ? 'link' : 'text',
            text,
            bold: parentBold || undefined,
            italic: parentItalic || undefined,
            url: parentUrl,
          });
        }
        return;
      }

      if (node.type === 'tag') {
        const el = node as Element;
        const tag = el.tagName.toLowerCase();

        let isBold = parentBold || tag === 'strong' || tag === 'b';
        let isItalic = parentItalic || tag === 'em' || tag === 'i';
        let url = parentUrl;

        if (tag === 'a') {
          const href = $(el).attr('href');
          if (href && !href.startsWith('javascript:')) {
            url = href;
          }
        }

        const children = $(el).contents().toArray();
        for (const child of children) {
          traverse(child, isBold, isItalic, url);
        }
      }
    };

    const contents = $el.contents().toArray();
    for (const child of contents) {
      traverse(child);
    }

    // Strip trailing whitespace from the last inline node if present
    if (inlineNodes.length > 0) {
      const lastNode = inlineNodes[inlineNodes.length - 1];
      if (lastNode.text && lastNode.text.length > 1) {
        lastNode.text = lastNode.text.trimEnd();
      }
    }

    // Fallback if empty inline traversal
    if (inlineNodes.length === 0) {
      const text = $el.text().trim();
      if (text) {
        inlineNodes.push({ type: 'text', text });
      }
    }

    return inlineNodes;
  }
}

export const normalizerService = new NormalizerService();
