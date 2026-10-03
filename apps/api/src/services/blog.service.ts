import fs from 'fs';
import path from 'path';
import { Blog, BlogStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { BlogDocumentAST, ImageBlock } from '../types/blog-document.js';

export interface CreateBlogDTO {
  title: string;
  status?: BlogStatus;
  contentJson?: BlogDocumentAST | Prisma.InputJsonValue;
  featuredImage?: string | null;
  sourceFilename?: string | null;
  extractedImageCount?: number;
}

export interface UpdateBlogDTO {
  title?: string;
  status?: BlogStatus;
  contentJson?: BlogDocumentAST | Prisma.InputJsonValue;
  featuredImage?: string | null;
}

export class BlogService {
  /**
   * Retrieves all blogs ordered by creation date descending.
   */
  async getAllBlogs(): Promise<Blog[]> {
    try {
      return await prisma.blog.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error in BlogService.getAllBlogs:', error);
      throw new Error('Failed to retrieve blogs from the database.');
    }
  }

  /**
   * Retrieves a single blog by ID.
   */
  async getBlogById(id: string): Promise<Blog | null> {
    try {
      return await prisma.blog.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error(`Error in BlogService.getBlogById(${id}):`, error);
      throw new Error(`Failed to retrieve blog with ID ${id}.`);
    }
  }

  /**
   * Creates a new blog entry (Development/Testing/Ingestion).
   */
  async createBlog(data: CreateBlogDTO): Promise<Blog> {
    try {
      return await prisma.blog.create({
        data: {
          title: data.title,
          status: data.status || BlogStatus.DRAFT,
          contentJson: (data.contentJson as unknown as Prisma.InputJsonValue) ?? undefined,
          featuredImage: data.featuredImage ?? null,
          sourceFilename: data.sourceFilename ?? null,
          extractedImageCount: data.extractedImageCount ?? 0,
        },
      });
    } catch (error) {
      console.error('Error in BlogService.createBlog:', error);
      throw new Error('Failed to create blog entry in database.');
    }
  }

  /**
   * Updates an existing blog record (Title, Content JSON AST, Featured Image, Status).
   */
  async updateBlog(id: string, data: UpdateBlogDTO): Promise<Blog> {
    try {
      const existing = await prisma.blog.findUnique({ where: { id } });
      if (!existing) {
        throw new Error(`Blog with ID '${id}' not found.`);
      }

      return await prisma.blog.update({
        where: { id },
        data: {
          title: data.title !== undefined ? data.title : undefined,
          status: data.status !== undefined ? data.status : undefined,
          contentJson: data.contentJson !== undefined ? (data.contentJson as unknown as Prisma.InputJsonValue) : undefined,
          featuredImage: data.featuredImage !== undefined ? data.featuredImage : undefined,
        },
      });
    } catch (error) {
      console.error(`Error in BlogService.updateBlog(${id}):`, error);
      throw new Error(`Failed to update blog with ID ${id}: ${(error as Error).message}`);
    }
  }

  /**
   * Publishes a draft blog entry by updating status to PUBLISHED.
   */
  async publishBlog(id: string): Promise<Blog> {
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Blog with ID '${id}' not found.`);
    }

    return await prisma.blog.update({
      where: { id },
      data: { status: BlogStatus.PUBLISHED },
    });
  }

  /**
   * Unpublishes a published blog entry back to DRAFT.
   */
  async unpublishBlog(id: string): Promise<Blog> {
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Blog with ID '${id}' not found.`);
    }

    return await prisma.blog.update({
      where: { id },
      data: { status: BlogStatus.DRAFT },
    });
  }

  /**
   * Deletes a blog record from PostgreSQL and cleans up referenced image files safely.
   */
  async deleteBlog(id: string): Promise<boolean> {
    const target = await prisma.blog.findUnique({ where: { id } });
    if (!target) {
      throw new Error(`Blog with ID '${id}' not found.`);
    }

    // 1. Identify image URLs referenced by this blog
    const referencedImages = new Set<string>();
    if (target.featuredImage && target.featuredImage.startsWith('/storage/images/')) {
      referencedImages.add(target.featuredImage);
    }

    if (target.contentJson) {
      try {
        const ast: BlogDocumentAST =
          typeof target.contentJson === 'string'
            ? JSON.parse(target.contentJson)
            : (target.contentJson as unknown as BlogDocumentAST);
        if (ast && Array.isArray(ast.blocks)) {
          for (const block of ast.blocks) {
            if (block.type === 'image' && (block as ImageBlock).url?.startsWith('/storage/images/')) {
              referencedImages.add((block as ImageBlock).url);
            }
          }
        }
      } catch {
        // Ignore AST parse errors for cleanup
      }
    }

    // 2. Query all OTHER blogs to prevent deleting shared images
    const otherBlogs = await prisma.blog.findMany({
      where: { id: { not: id } },
    });

    const otherImages = new Set<string>();
    for (const b of otherBlogs) {
      if (b.featuredImage && b.featuredImage.startsWith('/storage/images/')) {
        otherImages.add(b.featuredImage);
      }
      if (b.contentJson) {
        try {
          const ast: BlogDocumentAST =
            typeof b.contentJson === 'string'
              ? JSON.parse(b.contentJson)
              : (b.contentJson as unknown as BlogDocumentAST);
          if (ast && Array.isArray(ast.blocks)) {
            for (const block of ast.blocks) {
              if (block.type === 'image' && (block as ImageBlock).url?.startsWith('/storage/images/')) {
                otherImages.add((block as ImageBlock).url);
              }
            }
          }
        } catch {
          // Ignore
        }
      }
    }

    // 3. Delete unshared image files from storage/images
    for (const imgUrl of referencedImages) {
      if (!otherImages.has(imgUrl)) {
        const filename = path.basename(imgUrl);
        const imagePath = path.resolve(process.cwd(), 'storage', 'images', filename);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
          } catch (err) {
            console.warn(`Warning: Could not remove image file ${imagePath}:`, err);
          }
        }
      }
    }

    // 4. Delete database record
    await prisma.blog.delete({ where: { id } });
    return true;
  }
}

export const blogService = new BlogService();
