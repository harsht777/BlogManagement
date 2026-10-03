export const typeDefs = `#graphql
  enum BlogStatus {
    DRAFT
    PUBLISHED
  }

  type Blog {
    id: ID!
    title: String!
    status: BlogStatus!
    contentJson: String
    featuredImage: String
    sourceFilename: String
    extractedImageCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    """
    Health check endpoint returning API operational status.
    """
    health: String!

    """
    Retrieves all blog entries from PostgreSQL via Prisma.
    """
    blogs: [Blog!]!

    """
    Retrieves a single blog entry by ID.
    """
    blog(id: ID!): Blog
  }

  type Mutation {
    """
    Creates a basic blog entry.
    """
    createBlog(title: String!, status: BlogStatus): Blog!

    """
    Ingests a DOCX document from local file path (development CLI test runner).
    """
    ingestDocument(filePath: String!): Blog!

    """
    Uploads a DOCX document via base64 encoded buffer from browser UI, parses content into AST, extracts images, and persists blog record.
    """
    uploadBlogDocument(fileName: String!, fileBufferBase64: String!): Blog!

    """
    Updates an existing blog entry's title and/or AST contentJson.
    """
    updateBlog(id: ID!, title: String, contentJson: String): Blog!

    """
    Publishes a draft blog entry by setting status to PUBLISHED.
    """
    publishBlog(id: ID!): Blog!

    """
    Unpublishes a published blog entry back to DRAFT status.
    """
    unpublishBlog(id: ID!): Blog!

    """
    Deletes a blog record from PostgreSQL and cleans up unshared image assets.
    """
    deleteBlog(id: ID!): Boolean!
  }
`;
