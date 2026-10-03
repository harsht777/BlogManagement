import fs from 'fs';
import path from 'path';

async function testDockerE2E() {
  console.log('🚀 Running Docker End-to-End Acceptance Test Suite...\n');

  // 1. Verify Web endpoints
  const pages = [
    'http://localhost:3000',
    'http://localhost:3000/admin/dashboard',
    'http://localhost:3000/admin/blogs',
    'http://localhost:3000/admin/upload',
  ];
  for (const page of pages) {
    const res = await fetch(page);
    console.log(`✅ Page HTTP ${res.status}: ${page}`);
    if (res.status !== 200) throw new Error(`Failed to fetch ${page}`);
  }

  // 2. Upload document via GraphQL
  const sampleDocPath = path.resolve(process.cwd(), 'sample-documents', 'parser-tests', '08-combined-blog.docx');
  const fileBuffer = fs.readFileSync(sampleDocPath);
  const base64Data = fileBuffer.toString('base64');

  const uploadMutation = `
    mutation UploadBlogDocument($fileName: String!, $fileBufferBase64: String!) {
      uploadBlogDocument(fileName: $fileName, fileBufferBase64: $fileBufferBase64) {
        id
        title
        status
        sourceFilename
        featuredImage
        extractedImageCount
        contentJson
      }
    }
  `;

  const uploadRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: uploadMutation,
      variables: {
        fileName: '08-combined-blog.docx',
        fileBufferBase64: base64Data,
      },
    }),
  });

  const uploadJson = (await uploadRes.json()) as any;
  if (uploadJson.errors) {
    console.error('Upload errors:', uploadJson.errors);
    throw new Error('Upload mutation failed');
  }

  const blog = uploadJson.data.uploadBlogDocument;
  console.log('✅ Upload & DOCX Parsing Succeeded:');
  console.log('   Blog ID:', blog.id);
  console.log('   Title:', blog.title);
  console.log('   Status:', blog.status);
  console.log('   Featured Image:', blog.featuredImage);
  console.log('   Image Count:', blog.extractedImageCount);

  // 3. Verify Image Serving
  if (blog.featuredImage) {
    const apiImgRes = await fetch(`http://localhost:4000${blog.featuredImage}`);
    console.log(`✅ Image Serving from API (HTTP ${apiImgRes.status}): http://localhost:4000${blog.featuredImage}`);
    if (apiImgRes.status !== 200) throw new Error('API Image serving failed');

    const webImgRes = await fetch(`http://localhost:3000${blog.featuredImage}`);
    console.log(`✅ Image Serving from Web (HTTP ${webImgRes.status}): http://localhost:3000${blog.featuredImage}`);
    if (webImgRes.status !== 200) throw new Error('Web Image serving failed');
  }

  // 4. Update Blog (Structured Editor Save)
  const updateMutation = `
    mutation UpdateBlog($id: ID!, $title: String, $contentJson: String) {
      updateBlog(id: $id, title: $title, contentJson: $contentJson) {
        id
        title
        contentJson
      }
    }
  `;

  const ast = JSON.parse(blog.contentJson);
  ast.title = 'Docker E2E Verified Title';

  const updateRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: updateMutation,
      variables: {
        id: blog.id,
        title: 'Docker E2E Verified Title',
        contentJson: JSON.stringify(ast),
      },
    }),
  });

  const updateJson = (await updateRes.json()) as any;
  if (updateJson.errors) {
    console.error('Update errors:', updateJson.errors);
    throw new Error('Update mutation failed');
  }
  console.log('✅ Structured Editor Update Succeeded:', updateJson.data.updateBlog.title);

  // 5. Publish Blog
  const publishMutation = `
    mutation PublishBlog($id: ID!) {
      publishBlog(id: $id) {
        id
        status
      }
    }
  `;

  const pubRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: publishMutation, variables: { id: blog.id } }),
  });

  const pubJson = (await pubRes.json()) as any;
  console.log('✅ Publish Blog Succeeded:', pubJson.data.publishBlog.status);

  // 6. Verify Public Blog Page
  const publicPageRes = await fetch(`http://localhost:3000/blog/${blog.id}`);
  console.log(`✅ Public Blog Page (HTTP ${publicPageRes.status}): http://localhost:3000/blog/${blog.id}`);
  if (publicPageRes.status !== 200) throw new Error('Public blog page failed');

  // 7. Unpublish Blog
  const unpublishMutation = `
    mutation UnpublishBlog($id: ID!) {
      unpublishBlog(id: $id) {
        id
        status
      }
    }
  `;

  const unpubRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: unpublishMutation, variables: { id: blog.id } }),
  });

  const unpubJson = (await unpubRes.json()) as any;
  console.log('✅ Unpublish Blog Succeeded:', unpubJson.data.unpublishBlog.status);

  // 8. Delete Blog
  const deleteMutation = `
    mutation DeleteBlog($id: ID!) {
      deleteBlog(id: $id)
    }
  `;

  const delRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: deleteMutation, variables: { id: blog.id } }),
  });

  const delJson = (await delRes.json()) as any;
  console.log('✅ Delete Blog Succeeded:', delJson.data.deleteBlog);

  console.log('\n🎉 Docker E2E Verification Complete!');
}

testDockerE2E().catch((err) => {
  console.error('❌ E2E Failed:', err);
  process.exit(1);
});
