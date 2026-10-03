import { blogService } from '../../services/blog.service.js';
import { ingestService } from '../../services/ingest.service.js';
import { BlogStatus } from '@prisma/client';

export const resolvers = {
  Query: {
    health: (): string => {
      return 'Blog Management API is healthy';
    },
    blogs: async () => {
      const blogs = await blogService.getAllBlogs();
      return blogs.map((blog) => ({
        id: blog.id,
        title: blog.title,
        status: blog.status,
        contentJson: blog.contentJson ? JSON.stringify(blog.contentJson) : null,
        featuredImage: blog.featuredImage,
        sourceFilename: blog.sourceFilename,
        extractedImageCount: blog.extractedImageCount,
        createdAt: blog.createdAt.toISOString(),
        updatedAt: blog.updatedAt.toISOString(),
      }));
    },
    blog: async (_: unknown, { id }: { id: string }) => {
      const blog = await blogService.getBlogById(id);
      if (!blog) return null;
      return {
        id: blog.id,
        title: blog.title,
        status: blog.status,
        contentJson: blog.contentJson ? JSON.stringify(blog.contentJson) : null,
        featuredImage: blog.featuredImage,
        sourceFilename: blog.sourceFilename,
        extractedImageCount: blog.extractedImageCount,
        createdAt: blog.createdAt.toISOString(),
        updatedAt: blog.updatedAt.toISOString(),
      };
    },
  },
  Mutation: {
    createBlog: async (_: unknown, { title, status }: { title: string; status?: BlogStatus }) => {
      const blog = await blogService.createBlog({ title, status });
      return {
        id: blog.id,
        title: blog.title,
        status: blog.status,
        contentJson: blog.contentJson ? JSON.stringify(blog.contentJson) : null,
        featuredImage: blog.featuredImage,
        sourceFilename: blog.sourceFilename,
        extractedImageCount: blog.extractedImageCount,
        createdAt: blog.createdAt.toISOString(),
        updatedAt: blog.updatedAt.toISOString(),
      };
    },
    ingestDocument: async (_: unknown, { filePath }: { filePath: string }) => {
      const blog = await ingestService.ingestDocument(filePath);
      return {
        id: blog.id,
        title: blog.title,
        status: blog.status,
        contentJson: blog.contentJson ? JSON.stringify(blog.contentJson) : null,
        featuredImage: blog.featuredImage,
        sourceFilename: blog.sourceFilename,
        extractedImageCount: blog.extractedImageCount,
        createdAt: blog.createdAt.toISOString(),
        updatedAt: blog.updatedAt.toISOString(),
      };
    },
    uploadBlogDocument: async (
      _: unknown,
      { fileName, fileBufferBase64 }: { fileName: string; fileBufferBase64: string }
    ) => {
      if (!fileName || !fileBufferBase64) {
        throw new Error('File name and base64 file buffer are required.');
      }
      const cleanBase64 = fileBufferBase64.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      const blog = await ingestService.ingestDocumentFromBuffer(fileName, buffer);
      return {
        id: blog.id,
        title: blog.title,
        status: blog.status,
        contentJson: blog.contentJson ? JSON.stringify(blog.contentJson) : null,
        featuredImage: blog.featuredImage,
        sourceFilename: blog.sourceFilename,
        extractedImageCount: blog.extractedImageCount,
        createdAt: blog.createdAt.toISOString(),
        updatedAt: blog.updatedAt.toISOString(),
      };
    },
    updateBlog: async (
      _: unknown,
      { id, title, contentJson }: { id: string; title?: string; contentJson?: string }
    ) => {
      let parsedAST: any = undefined;
      if (contentJson !== undefined && contentJson !== null) {
        try {
          parsedAST = JSON.parse(contentJson);
        } catch {
          throw new Error('Invalid JSON format for contentJson.');
        }

        // Server-Side AST Validation: must be an object with a blocks array
        if (!parsedAST || typeof parsedAST !== 'object' || !Array.isArray(parsedAST.blocks)) {
          throw new Error("Invalid AST structure: contentJson must be an object containing a 'blocks' array.");
        }

        for (const block of parsedAST.blocks) {
          if (!block || typeof block !== 'object' || typeof block.type !== 'string') {
            throw new Error("Invalid AST block: Each block in contentJson must be an object with a valid 'type' string property.");
          }
        }
      }

      const blog = await blogService.updateBlog(id, {
        title: title !== undefined ? title : undefined,
        contentJson: parsedAST,
      });

      return {
        id: blog.id,
        title: blog.title,
        status: blog.status,
        contentJson: blog.contentJson ? JSON.stringify(blog.contentJson) : null,
        featuredImage: blog.featuredImage,
        sourceFilename: blog.sourceFilename,
        extractedImageCount: blog.extractedImageCount,
        createdAt: blog.createdAt.toISOString(),
        updatedAt: blog.updatedAt.toISOString(),
      };
    },
    publishBlog: async (_: unknown, { id }: { id: string }) => {
      const blog = await blogService.publishBlog(id);
      return {
        id: blog.id,
        title: blog.title,
        status: blog.status,
        contentJson: blog.contentJson ? JSON.stringify(blog.contentJson) : null,
        featuredImage: blog.featuredImage,
        sourceFilename: blog.sourceFilename,
        extractedImageCount: blog.extractedImageCount,
        createdAt: blog.createdAt.toISOString(),
        updatedAt: blog.updatedAt.toISOString(),
      };
    },
    unpublishBlog: async (_: unknown, { id }: { id: string }) => {
      const blog = await blogService.unpublishBlog(id);
      return {
        id: blog.id,
        title: blog.title,
        status: blog.status,
        contentJson: blog.contentJson ? JSON.stringify(blog.contentJson) : null,
        featuredImage: blog.featuredImage,
        sourceFilename: blog.sourceFilename,
        extractedImageCount: blog.extractedImageCount,
        createdAt: blog.createdAt.toISOString(),
        updatedAt: blog.updatedAt.toISOString(),
      };
    },
    deleteBlog: async (_: unknown, { id }: { id: string }) => {
      return await blogService.deleteBlog(id);
    },
  },
};
