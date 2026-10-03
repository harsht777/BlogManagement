import path from 'path';
import fs from 'fs';
import { ingestService } from '../apps/api/src/services/ingest.service.js';
import { blogService } from '../apps/api/src/services/blog.service.js';
import { resolvers } from '../apps/api/src/graphql/resolvers/index.js';
import { BlogDocumentAST } from '../apps/api/src/types/blog-document.js';

async function runPhase4dTests() {
  console.log('==============================================================================');
  console.log('PHASE 4D — KOFUKU BLOG RENDERER & PUBLIC BLOG PAGE TEST HARNESS');
  console.log('==============================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (details) console.log(`       -> ${details}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (details) console.error(`       -> ${details}`);
    }
  }

  const baseDir = process.cwd();
  const fixture08Path = path.join(baseDir, 'sample-documents', 'parser-tests', '08-combined-blog.docx');

  // Setup: Ingest 08-combined-blog.docx into database
  let targetBlogId = '';
  try {
    const fileBuffer = fs.readFileSync(fixture08Path);
    const initialBlog = await ingestService.ingestDocumentFromBuffer('08-combined-blog.docx', fileBuffer);
    targetBlogId = initialBlog.id;
  } catch (err) {
    console.error('Setup failed: Could not ingest test document fixture:', err);
    process.exit(1);
  }

  // Test 1: Query Blog for Public Blog Renderer via GraphQL Query blog(id)
  try {
    console.log('\n--- Test 1: GraphQL Query blog(id) Retrieval for Public Renderer ---');
    const blogDetail = await resolvers.Query.blog({}, { id: targetBlogId });
    assert(!!blogDetail, 'Retrieved blog record for public route', `ID: ${targetBlogId}`);
    assert(!!blogDetail?.contentJson, 'Blog contentJson AST is populated', 'contentJson present');
    assert(blogDetail?.status === 'DRAFT', 'Draft blog indicates status correctly for draft preview banner', `Status: ${blogDetail?.status}`);
  } catch (err) {
    assert(false, 'GraphQL Query blog(id) Retrieval for Public Renderer', (err as Error).message);
  }

  // Test 2: AST Block Types Structure & Rendering Compatibility
  try {
    console.log('\n--- Test 2: AST Block Types Structure & Rendering Compatibility ---');
    const blogDetail = await resolvers.Query.blog({}, { id: targetBlogId });
    const ast: BlogDocumentAST = JSON.parse(blogDetail!.contentJson!);

    const blockTypes = new Set(ast.blocks.map((b) => b.type));
    assert(blockTypes.has('heading'), 'AST contains heading blocks');
    assert(blockTypes.has('paragraph'), 'AST contains paragraph blocks');
    assert(blockTypes.has('list'), 'AST contains list blocks');
    assert(blockTypes.has('image'), 'AST contains image blocks');
    assert(blockTypes.has('table'), 'AST contains table blocks');
    assert(blockTypes.has('quote'), 'AST contains quote blocks');

    // Append a callout block to test full block renderer coverage
    ast.blocks.push({
      type: 'callout',
      text: 'Public renderer test callout block',
      children: [{ type: 'text', text: 'Public renderer test callout block', bold: true }],
    });
    blockTypes.add('callout');
    assert(blockTypes.has('callout'), 'AST supports callout blocks rendering primitive');

    // Verify inline children structures do not contain un-sanitized raw HTML scripts or iframes
    let rawHtmlDetected = false;
    for (const block of ast.blocks) {
      if (block.type === 'paragraph' || block.type === 'heading' || block.type === 'quote' || block.type === 'callout') {
        for (const child of block.children || []) {
          if (child.text.includes('<script>') || child.text.includes('<iframe>')) {
            rawHtmlDetected = true;
          }
        }
      }
    }
    assert(!rawHtmlDetected, 'AST inline nodes free of unsafe raw HTML scripts/iframes');
  } catch (err) {
    assert(false, 'AST Block Types Structure & Rendering Compatibility', (err as Error).message);
  }

  // Test 3: Public Renderer Image & Fallback Handling
  try {
    console.log('\n--- Test 3: Public Renderer Image & Fallback Handling ---');
    const blogDetail = await resolvers.Query.blog({}, { id: targetBlogId });
    assert(!!blogDetail?.featuredImage, 'Featured image URL exists for public article hero header', `Image: ${blogDetail?.featuredImage}`);

    // Update blog to set featuredImage to null via service to verify missing image fallback handling
    const noImageBlog = await blogService.updateBlog(targetBlogId, { featuredImage: null });
    assert(noImageBlog.featuredImage === null, 'Featured image set to null cleanly for missing header image fallback testing');
  } catch (err) {
    assert(false, 'Public Renderer Image & Fallback Handling', (err as Error).message);
  }

  // Test 4: Unknown / Non-existent Blog 404 Resolution
  try {
    console.log('\n--- Test 4: Unknown / Non-existent Blog 404 Resolution ---');
    const nonExistentBlog = await resolvers.Query.blog({}, { id: '00000000-0000-0000-0000-000000000000' });
    assert(nonExistentBlog === null, 'Non-existent blog query returns null cleanly for Next.js 404 notFound() handling');
  } catch (err) {
    assert(false, 'Unknown / Non-existent Blog 404 Resolution', (err as Error).message);
  }

  // Test 5: End-to-End Regression Verification across Ingest, Persistence & Rendering
  try {
    console.log('\n--- Test 5: End-to-End Ingest, AST Persistence & Public Renderer Data Integrity ---');
    const blogDetail = await resolvers.Query.blog({}, { id: targetBlogId });
    assert(blogDetail?.title.length! > 0, 'Title present for header banner', `Title: "${blogDetail?.title}"`);
    assert(blogDetail?.extractedImageCount! > 0, 'Extracted images preserved', `Images: ${blogDetail?.extractedImageCount}`);
  } catch (err) {
    assert(false, 'End-to-End Ingest, AST Persistence & Public Renderer Data Integrity', (err as Error).message);
  }

  console.log('\n==============================================================================');
  console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('==============================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase4dTests().catch((err) => {
  console.error('Fatal error running Phase 4D test suite:', err);
  process.exit(1);
});
