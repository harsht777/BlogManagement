import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { imageService } from './image.service.js';
import { normalizerService } from './normalizer.service.js';
import {
  ParserResult,
  ParserWarning,
  ExtractedImageMetadata,
} from '../types/blog-document.js';

export interface ParseOptions {
  originalFilename?: string;
}

export class ParserService {
  /**
   * Validates if buffer is a valid DOCX file (PK Zip header 50 4B 03 04).
   */
  private validateDocxHeader(buffer: Buffer): void {
    if (buffer.length < 4) {
      throw new Error('Invalid file: File size is too small to be a valid DOCX document.');
    }
    const isPkZip =
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
      (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08);

    if (!isPkZip) {
      throw new Error(
        'Invalid document format: Uploaded file is not a valid DOCX OpenXML archive. Legacy .doc files must be converted to .docx first.'
      );
    }
  }

  /**
   * Parses a DOCX buffer or file path into a structured Blog Document AST.
   */
  async parseDocument(
    input: Buffer | string,
    options: ParseOptions = {}
  ): Promise<ParserResult> {
    let buffer: Buffer;
    let originalFilename = options.originalFilename;

    if (typeof input === 'string') {
      if (!fs.existsSync(input)) {
        throw new Error(`File not found: ${input}`);
      }
      buffer = await fs.promises.readFile(input);
      if (!originalFilename) {
        originalFilename = path.basename(input);
      }
    } else {
      buffer = input;
    }

    // 1. Validate DOCX Magic Header
    this.validateDocxHeader(buffer);

    const extractedImages: ExtractedImageMetadata[] = [];
    let imageCounter = 0;

    // 2. Configure Mammoth Style Maps & Image Extraction
    const mammothOptions = {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
        "p[style-name='Blockquote'] => blockquote:fresh",
        "p[style-name='Callout'] => div.callout:fresh",
        "r[style-name='Hyperlink'] => a",
      ],
      convertImage: mammoth.images.imgElement((element) => {
        const index = imageCounter++;
        return element.read().then(async (imageBuffer) => {
          try {
            const savedImage = await imageService.saveImage(
              imageBuffer,
              element.contentType,
              index
            );
            extractedImages.push(savedImage);
            return {
              src: savedImage.url,
              alt: `Extracted Image ${index + 1}`,
            };
          } catch (err: unknown) {
            console.error(`⚠️ Failed to save image #${index}:`, err);
            return {
              src: '',
              alt: `Image Extraction Error: ${(err as Error).message}`,
            };
          }
        });
      }),
    };

    // 3. Execute Mammoth Parsing
    const res = await mammoth.convertToHtml({ buffer }, mammothOptions);
    const rawHtml = res.value;

    // Map warnings
    const warnings: ParserWarning[] = res.messages.map((m) => ({
      type: m.type,
      message: m.message,
    }));

    // 4. Sanitize and Normalize HTML into Blog Document AST
    const sanitizedHtml = normalizerService.sanitize(rawHtml);
    const documentAST = normalizerService.normalize(sanitizedHtml);

    // If filename is present and title is missing, fallback to filename without extension
    if (!documentAST.title && originalFilename) {
      documentAST.title = path.basename(originalFilename, path.extname(originalFilename));
    }

    return {
      document: documentAST,
      rawHtml,
      sanitizedHtml,
      warnings,
      metadata: {
        originalFilename,
        parser: 'Mammoth.js',
        parserVersion: '1.13.0',
        extractedImageCount: extractedImages.length,
        warningCount: warnings.length,
        parsedAt: new Date().toISOString(),
      },
      images: extractedImages,
    };
  }
}

export const parserService = new ParserService();
