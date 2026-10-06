import fs from 'fs';
import path from 'path';

async function testDockerE2E() {
  console.log('🚀 Running Docker End-to-End Acceptance Test Suite...\n');

  // 1. Verify Web endpoints accessibility
  const pages = [
    'http://localhost:3000',
    'http://localhost:3000/admin/dashboard',
    'http://localhost:3000/admin/blogs',
    'http://localhost:3000/admin/upload',
    'http://localhost:3000/admin/create',
  ];
  for (const page of pages) {
    const res = await fetch(page);
    console.log(`✅ Page HTTP ${res.status}: ${page}`);
    if (res.status !== 200) throw new Error(`Failed to fetch ${page}`);
  }

  // =========================================================================
  // WORKFLOW A — DOCX INGESTION FLOW
  // =========================================================================
  console.log('\n--- WORKFLOW A — DOCX Ingestion Flow ---');
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

  const docxBlog = uploadJson.data.uploadBlogDocument;
  console.log('✅ Upload & DOCX Parsing Succeeded:');
  console.log('   Blog ID:', docxBlog.id);
  console.log('   Title:', docxBlog.title);
  console.log('   Status:', docxBlog.status);
  console.log('   Featured Image:', docxBlog.featuredImage);
  console.log('   Image Count:', docxBlog.extractedImageCount);

  if (docxBlog.status !== 'DRAFT') throw new Error('DOCX blog must start in DRAFT status');

  // Verify Image Serving
  if (docxBlog.featuredImage) {
    const apiImgRes = await fetch(`http://localhost:4000${docxBlog.featuredImage}`);
    console.log(`✅ Image Serving from API (HTTP ${apiImgRes.status}): http://localhost:4000${docxBlog.featuredImage}`);
    if (apiImgRes.status !== 200) throw new Error('API Image serving failed');

    const webImgRes = await fetch(`http://localhost:3000${docxBlog.featuredImage}`);
    console.log(`✅ Image Serving from Web (HTTP ${webImgRes.status}): http://localhost:3000${docxBlog.featuredImage}`);
    if (webImgRes.status !== 200) throw new Error('Web Image serving failed');
  }

  // Update DOCX Blog (Structured Editor Save)
  const updateMutation = `
    mutation UpdateBlog($id: ID!, $title: String, $contentJson: String) {
      updateBlog(id: $id, title: $title, contentJson: $contentJson) {
        id
        title
        contentJson
      }
    }
  `;

  const docxAst = JSON.parse(docxBlog.contentJson);
  docxAst.title = 'Docker E2E Verified DOCX Title';

  const updateDocxRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: updateMutation,
      variables: {
        id: docxBlog.id,
        title: 'Docker E2E Verified DOCX Title',
        contentJson: JSON.stringify(docxAst),
      },
    }),
  });

  const updateDocxJson = (await updateDocxRes.json()) as any;
  if (updateDocxJson.errors) throw new Error('DOCX update mutation failed');
  console.log('✅ Structured Editor Update Succeeded:', updateDocxJson.data.updateBlog.title);

  // Publish DOCX Blog
  const publishMutation = `
    mutation PublishBlog($id: ID!) {
      publishBlog(id: $id) {
        id
        status
      }
    }
  `;

  const pubDocxRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: publishMutation, variables: { id: docxBlog.id } }),
  });
  const pubDocxJson = (await pubDocxRes.json()) as any;
  console.log('✅ Publish DOCX Blog Succeeded:', pubDocxJson.data.publishBlog.status);

  // Verify Public Page for DOCX Blog
  const publicDocxRes = await fetch(`http://localhost:3000/blog/${docxBlog.id}`);
  console.log(`✅ Public DOCX Page (HTTP ${publicDocxRes.status}): http://localhost:3000/blog/${docxBlog.id}`);
  if (publicDocxRes.status !== 200) throw new Error('Public DOCX blog page failed');

  // Clean up DOCX Blog
  const deleteMutation = `
    mutation DeleteBlog($id: ID!) {
      deleteBlog(id: $id)
    }
  `;
  await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: deleteMutation, variables: { id: docxBlog.id } }),
  });
  console.log('✅ Cleaned up DOCX Blog test entry');

  // =========================================================================
  // WORKFLOW B — MANUAL BLOG CREATION FLOW WITH DYNAMIC SECTIONS
  // =========================================================================
  console.log('\n--- WORKFLOW B — Manual Blog Creation with Dynamic Sections ---');

  const createBlogMutation = `
    mutation CreateBlog($title: String!, $contentJson: String) {
      createBlog(title: $title, contentJson: $contentJson) {
        id
        title
        status
        contentJson
      }
    }
  `;

  const manualInitialAST = {
    blocks: [
      {
        type: 'heading',
        level: 2,
        text: 'Dynamic Section 1: Overview',
        children: [{ type: 'text', text: 'Dynamic Section 1: Overview' }],
      },
      {
        type: 'paragraph',
        text: 'Manual creation paragraph text.',
        children: [{ type: 'text', text: 'Manual creation paragraph text.' }],
      },
      {
        type: 'list',
        ordered: true,
        items: [{ text: 'Item 1', children: [{ type: 'text', text: 'Item 1' }] }],
      },
      {
        type: 'quote',
        text: 'Editorial excellence quote.',
        children: [{ type: 'text', text: 'Editorial excellence quote.' }],
      },
      {
        type: 'callout',
        text: 'Important callout note.',
        children: [{ type: 'text', text: 'Important callout note.' }],
      },
      {
        type: 'table',
        headers: ['Col 1', 'Col 2'],
        rows: [[{ text: 'Val 1' }, { text: 'Val 2' }]],
      },
    ],
  };

  const createRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: createBlogMutation,
      variables: {
        title: 'Manual Docker E2E Blog Post',
        contentJson: JSON.stringify(manualInitialAST),
      },
    }),
  });

  const createJson = (await createRes.json()) as any;
  if (createJson.errors) {
    console.error('Manual create errors:', createJson.errors);
    throw new Error('Manual create mutation failed');
  }

  const manualBlog = createJson.data.createBlog;
  console.log('✅ Manual Blog Creation Succeeded:');
  console.log('   Blog ID:', manualBlog.id);
  console.log('   Title:', manualBlog.title);
  console.log('   Status:', manualBlog.status);

  if (manualBlog.status !== 'DRAFT') throw new Error('Manual blog MUST start as DRAFT status');

  // Verify dynamic section manipulation: Move, Delete, Add
  const manualAST = JSON.parse(manualBlog.contentJson);
  if (manualAST.blocks.length !== 6) throw new Error('Manual blog should contain 6 initial blocks');

  // Perform dynamic block manipulation (Reorder move down: swap block 0 and 1, add block, delete last block)
  const [movedHeading] = manualAST.blocks.splice(0, 1);
  manualAST.blocks.splice(1, 0, movedHeading); // Move Heading down after paragraph

  // Add new block
  manualAST.blocks.push({
    type: 'paragraph',
    text: 'Appended dynamic block section',
    children: [{ type: 'text', text: 'Appended dynamic block section' }],
  });

  // Delete table block (last item before append)
  manualAST.blocks = manualAST.blocks.filter((b: any) => b.type !== 'table');

  const updateManualRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: updateMutation,
      variables: {
        id: manualBlog.id,
        title: 'Manual Docker E2E Blog Post (Refined)',
        contentJson: JSON.stringify(manualAST),
      },
    }),
  });

  const updateManualJson = (await updateManualRes.json()) as any;
  if (updateManualJson.errors) throw new Error('Manual update mutation failed');

  const updatedManualAST = JSON.parse(updateManualJson.data.updateBlog.contentJson);
  console.log('✅ Dynamic Block Manipulation Succeeded:');
  console.log('   Block 0 Type after move:', updatedManualAST.blocks[0].type); // paragraph
  console.log('   Block 1 Type after move:', updatedManualAST.blocks[1].type); // heading
  console.log('   Total Block Count:', updatedManualAST.blocks.length);

  // Publish Manual Blog
  const pubManualRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: publishMutation, variables: { id: manualBlog.id } }),
  });
  const pubManualJson = (await pubManualRes.json()) as any;
  console.log('✅ Publish Manual Blog Succeeded:', pubManualJson.data.publishBlog.status);

  // Verify Public Page for Manual Blog
  const publicManualRes = await fetch(`http://localhost:3000/blog/${manualBlog.id}`);
  console.log(`✅ Public Manual Blog Page (HTTP ${publicManualRes.status}): http://localhost:3000/blog/${manualBlog.id}`);
  if (publicManualRes.status !== 200) throw new Error('Public manual blog page failed');

  // Clean up Manual Blog
  await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: deleteMutation, variables: { id: manualBlog.id } }),
  });
  console.log('✅ Cleaned up Manual Blog test entry');

  console.log('\n🎉 Docker E2E Verification Complete! Both Workflow A (DOCX) and Workflow B (Manual) verified end-to-end.');
}

testDockerE2E().catch((err) => {
  console.error('❌ E2E Failed:', err);
  process.exit(1);
});
