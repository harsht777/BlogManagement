export type BlogStatus = 'DRAFT' | 'PUBLISHED';

export interface Blog {
  id: string;
  title: string;
  status: BlogStatus;
  contentJson?: string | null;
  featuredImage?: string | null;
  sourceFilename?: string | null;
  extractedImageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetAdminBlogsData {
  health: string;
  blogs: Blog[];
}

export interface DashboardStats {
  totalBlogs: number;
  draftBlogs: number;
  publishedBlogs: number;
  totalImagesExtracted: number;
}
