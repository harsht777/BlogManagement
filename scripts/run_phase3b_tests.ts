import path from 'path';
import fs from 'fs';
import { ingestService } from '../apps/api/src/services/ingest.service.js';
import { blogService } from '../apps/api/src/services/blog.service.js';
import { resolvers } from '../apps/api/src/graphql/resolvers/index.js';
import { BlogDocumentAST } from '../apps/api/src/types/blog-document.js';

async function runPhase3bTests() {
  console.log('==============================================================================');
  console.log('PHASE 3B — BLOG PERSISTENCE & GRAPHQL INTEGRATION VERIFICATION TEST HARNESS');
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
  const fixture01 = path.join(baseDir, 'sample-documents', 'parser-tests', '01-basic-structure.docx');
  const fixture08 = path.join(baseDir, 'sample-documents', 'parser-tests', '08-combined-blog.docx');

  // Test 1: Ingest 01-basic-structure.docx via IngestService
  try {
    console.log('\n--- Test 1: Ingestion of 01-basic-structure.docx ---');
    const blog01 = await ingestService.ingestDocument(fixture01);
    assert(!!blog01.id, 'Blog record created with UUID', `ID: ${blog01.id}`);
    assert(blog01.status === 'DRAFT', 'Blog status defaults to DRAFT', `Status: ${blog01.status}`);
    assert(blog01.sourceFilename === '01-basic-structure.docx', 'Source filename recorded', `Filename: ${blog01.sourceFilename}`);
    
    const ast01 = blog01.contentJson as unknown as BlogDocumentAST;
    assert(!!ast01 && Array.isArray(ast01.blocks), 'Content JSON contains valid BlogDocumentAST structure', `Block count: ${ast01.blocks.length}`);
  } catch (err) {
    assert(false, 'Ingestion of 01-basic-structure.docx', (err as Error).message);
  }

  // Test 2: Ingest 08-combined-blog.docx (Composite document with images)
  let blog08Id = '';
  try {
    console.log('\n--- Test 2: Ingestion of 08-combined-blog.docx ---');
    const blog08 = await ingestService.ingestDocument(fixture08);
    blog08Id = blog08.id;
    assert(!!blog08.id, 'Blog record created with UUID', `ID: ${blog08.id}`);
    assert(blog08.title === 'Comprehensive Guide to Modern Web Architecture', 'Extracted document H1 title correctly', `Title: "${blog08.title}"`);
    assert(blog08.status === 'DRAFT', 'Blog status defaults to DRAFT', `Status: ${blog08.status}`);
    assert(!!blog08.featuredImage, 'Featured image URL extracted', `Featured Image: ${blog08.featuredImage}`);
    assert(blog08.extractedImageCount > 0, 'Extracted image count recorded', `Count: ${blog08.extractedImageCount}`);

    const ast08 = blog08.contentJson as unknown as BlogDocumentAST;
    const hasHeadings = ast08.blocks.some(b => b.type === 'heading');
    const hasParagraphs = ast08.blocks.some(b => b.type === 'paragraph');
    const hasLists = ast08.blocks.some(b => b.type === 'list');
    const hasImages = ast08.blocks.some(b => b.type === 'image');
    const hasQuotes = ast08.blocks.some(b => b.type === 'quote');
    const hasTables = ast08.blocks.some(b => b.type === 'table');

    assert(hasHeadings && hasParagraphs && hasLists && hasImages && hasQuotes && hasTables,
      'AST contains composite elements (headings, paragraphs, lists, images, quotes, tables)',
      `Total AST Blocks: ${ast08.blocks.length}`
    );
  } catch (err) {
    assert(false, 'Ingestion of 08-combined-blog.docx', (err as Error).message);
  }

  // Test 3: GraphQL Query Resolution (`blogs` and `blog(id)`)
  try {
    console.log('\n--- Test 3: GraphQL Query Resolvers ---');
    const blogsResult = await resolvers.Query.blogs();
    assert(Array.isArray(blogsResult) && blogsResult.length >= 2, 'GraphQL `blogs` query returns array of blogs', `Count: ${blogsResult.length}`);

    if (blog08Id) {
      const singleBlogResult = await resolvers.Query.blog({}, { id: blog08Id });
      assert(!!singleBlogResult && singleBlogResult.id === blog08Id, 'GraphQL `blog(id)` query returns specific blog', `Retrieved ID: ${singleBlogResult?.id}`);
      assert(typeof singleBlogResult?.contentJson === 'string', 'GraphQL returns contentJson as stringified JSON', 'contentJson parsed as stringified AST');
    }
  } catch (err) {
    assert(false, 'GraphQL Query Resolvers', (err as Error).message);
  }

  // Test 4: GraphQL Mutation Resolution (`ingestDocument`)
  try {
    console.log('\n--- Test 4: GraphQL Mutation Resolver (`ingestDocument`) ---');
    const mutationResult = await resolvers.Mutation.ingestDocument({}, { filePath: fixture01 });
    assert(!!mutationResult.id, 'GraphQL `ingestDocument` mutation executed successfully', `New Blog ID: ${mutationResult.id}`);
    assert(mutationResult.status === 'DRAFT', 'Mutation returns blog with DRAFT status', `Status: ${mutationResult.status}`);
  } catch (err) {
    assert(false, 'GraphQL Mutation Resolver (`ingestDocument`)', (err as Error).message);
  }

  // Test 5: Error Handling (Non-existent file)
  try {
    console.log('\n--- Test 5: Error Handling (Non-existent file) ---');
    let errorCaught = false;
    try {
      await ingestService.ingestDocument(path.join(baseDir, 'sample-documents', 'non-existent.docx'));
    } catch {
      errorCaught = true;
    }
    assert(errorCaught, 'Non-existent file ingestion rejected cleanly with Error');
  } catch (err) {
    assert(false, 'Error Handling for non-existent file', (err as Error).message);
  }

  console.log('\n==============================================================================');
  console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('==============================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase3bTests().catch((err) => {
  console.error('Fatal error running Phase 3B test suite:', err);
  process.exit(1);
});
