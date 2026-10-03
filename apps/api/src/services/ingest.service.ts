import path from 'path';
import fs from 'fs';
import { Blog, BlogStatus } from '@prisma/client';
import { parserService } from './parser.service.js';
import { blogService } from './blog.service.js';
import { ImageBlock } from '../types/blog-document.js';

export class IngestService {
  /**
   * Ingests a DOCX document from disk, parses its semantic AST, extracts images,
   * identifies a featured image, and persists the blog record in PostgreSQL.
   */
  async ingestDocument(filePath: string, overrideFilename?: string): Promise<Blog> {
    try {
      const filename = overrideFilename || path.basename(filePath);
      const parseResult = await parserService.parseDocument(filePath);

      // 1. Determine Title (AST Title || Cleaned Filename)
      let title = parseResult.document.title?.trim();
      if (!title) {
        title = path.basename(filename, path.extname(filename))
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());
      }

      // 2. Determine Featured Image (First extracted image URL || First image block URL)
      let featuredImage: string | null = null;
      if (parseResult.images && parseResult.images.length > 0) {
        featuredImage = parseResult.images[0].url;
      } else {
        const firstImageBlock = parseResult.document.blocks.find(
          (block): block is ImageBlock => block.type === 'image'
        );
        if (firstImageBlock) {
          featuredImage = firstImageBlock.url;
        }
      }

      // 3. Persist Blog into Database
      const blog = await blogService.createBlog({
        title,
        status: BlogStatus.DRAFT,
        contentJson: parseResult.document,
        featuredImage,
        sourceFilename: filename,
        extractedImageCount: parseResult.images.length,
      });

      return blog;
    } catch (error) {
      console.error(`Error ingesting document ${filePath}:`, error);
      throw new Error(`Document ingestion failed: ${(error as Error).message}`);
    }
  }

  /**
   * Ingests a DOCX document from an in-memory buffer / base64 payload by writing
   * a temporary file, executing parsing & persistence, and guaranteeing temporary file cleanup.
   */
  async ingestDocumentFromBuffer(fileName: string, buffer: Buffer): Promise<Blog> {
    // Validate File Extension (.docx only)
    const ext = path.extname(fileName).toLowerCase();
    if (ext !== '.docx') {
      if (ext === '.doc') {
        throw new Error('Legacy binary .doc files are not supported. Please save the document as .docx format in Microsoft Word.');
      }
      throw new Error(`Unsupported file extension '${ext}'. Only .docx documents are supported.`);
    }

    // Validate Max File Size (25 MB)
    const MAX_SIZE_BYTES = 25 * 1024 * 1024;
    if (buffer.length > MAX_SIZE_BYTES) {
      throw new Error(`File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of 25 MB.`);
    }

    // Create Temporary Storage Directory
    const tempDir = path.resolve(process.cwd(), 'storage', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilename = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.docx`;
    const tempFilePath = path.join(tempDir, tempFilename);

    try {
      // Write Buffer to Temporary File
      fs.writeFileSync(tempFilePath, buffer);

      // Execute Ingestion Pipeline
      const blog = await this.ingestDocument(tempFilePath, fileName);
      return blog;
    } finally {
      // Guaranteed Temporary File Cleanup
      if (fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.warn(`Warning: Failed to clean up temporary file ${tempFilePath}:`, cleanupError);
        }
      }
    }
  }
}

export const ingestService = new IngestService();
