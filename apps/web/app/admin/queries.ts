import { gql } from '@apollo/client';

export const GET_ADMIN_BLOGS = gql`
  query GetAdminBlogs {
    health
    blogs {
      id
      title
      status
      contentJson
      featuredImage
      sourceFilename
      extractedImageCount
      createdAt
      updatedAt
    }
  }
`;

export const GET_BLOG_BY_ID = gql`
  query GetBlogById($id: ID!) {
    blog(id: $id) {
      id
      title
      status
      contentJson
      featuredImage
      sourceFilename
      extractedImageCount
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_BLOG = gql`
  mutation CreateBlog($title: String!, $contentJson: String) {
    createBlog(title: $title, contentJson: $contentJson) {
      id
      title
      status
      contentJson
      featuredImage
      sourceFilename
      extractedImageCount
      createdAt
      updatedAt
    }
  }
`;

export const UPLOAD_BLOG_DOCUMENT = gql`
  mutation UploadBlogDocument($fileName: String!, $fileBufferBase64: String!) {
    uploadBlogDocument(fileName: $fileName, fileBufferBase64: $fileBufferBase64) {
      id
      title
      status
      featuredImage
      sourceFilename
      extractedImageCount
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_BLOG = gql`
  mutation UpdateBlog($id: ID!, $title: String, $contentJson: String) {
    updateBlog(id: $id, title: $title, contentJson: $contentJson) {
      id
      title
      status
      contentJson
      featuredImage
      sourceFilename
      extractedImageCount
      createdAt
      updatedAt
    }
  }
`;

export const PUBLISH_BLOG = gql`
  mutation PublishBlog($id: ID!) {
    publishBlog(id: $id) {
      id
      title
      status
      updatedAt
    }
  }
`;

export const UNPUBLISH_BLOG = gql`
  mutation UnpublishBlog($id: ID!) {
    unpublishBlog(id: $id) {
      id
      title
      status
      updatedAt
    }
  }
`;

export const DELETE_BLOG = gql`
  mutation DeleteBlog($id: ID!) {
    deleteBlog(id: $id)
  }
`;
