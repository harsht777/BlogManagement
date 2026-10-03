import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ExtractedImageMetadata } from '../types/blog-document.js';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/pjpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

function resolveStorageImagesDir(): string {
  const cwd = process.cwd();
  if (cwd.endsWith('apps\\api') || cwd.endsWith('apps/api')) {
    return path.resolve(cwd, '..', '..', 'storage', 'images');
  }
  return path.resolve(cwd, 'storage', 'images');
}

export class ImageService {
  private targetDir: string;

  constructor(targetDir?: string) {
    this.targetDir = targetDir || resolveStorageImagesDir();
    this.ensureStorageDirectory();
  }

  /**
   * Ensures the storage/images directory exists safely.
   */
  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.targetDir)) {
      fs.mkdirSync(this.targetDir, { recursive: true });
    }
  }

  /**
   * Saves an image buffer to storage/images and returns metadata.
   */
  async saveImage(
    buffer: Buffer,
    contentType: string,
    originalIndex: number
  ): Promise<ExtractedImageMetadata> {
    const mime = contentType.toLowerCase().trim();
    const ext = ALLOWED_MIME_TYPES[mime];

    if (!ext) {
      throw new Error(`Unsupported or unsafe image MIME type: ${contentType}`);
    }

    // Maximum image size check (20MB limit)
    const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new Error(`Extracted image size (${buffer.length} bytes) exceeds maximum limit of 20MB`);
    }

    // Generate safe SHA-256 hash filename to avoid path traversal and collisions
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
    const filename = `img_${hash}${ext}`;
    const destinationPath = path.join(this.targetDir, filename);

    // Path traversal safety check
    const resolvedDest = path.resolve(destinationPath);
    const resolvedTarget = path.resolve(this.targetDir);
    if (!resolvedDest.startsWith(resolvedTarget)) {
      throw new Error('Security Error: Path traversal attempt detected in image destination path');
    }

    // Save image buffer to disk
    await fs.promises.writeFile(destinationPath, buffer);

    const relativeUrl = `/storage/images/${filename}`;

    return {
      originalIndex,
      filename,
      url: relativeUrl,
      mimeType: mime,
      sizeBytes: buffer.length,
    };
  }
}

export const imageService = new ImageService();
