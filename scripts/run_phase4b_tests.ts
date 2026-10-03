import path from 'path';
import fs from 'fs';
import { ingestService } from '../apps/api/src/services/ingest.service.js';
import { resolvers } from '../apps/api/src/graphql/resolvers/index.js';
import { BlogDocumentAST } from '../apps/api/src/types/blog-document.js';

async function runPhase4bTests() {
  console.log('==============================================================================');
  console.log('PHASE 4B — REAL DOCUMENT UPLOAD & BLOG INGESTION TEST HARNESS');
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
  const fixture01Path = path.join(baseDir, 'sample-documents', 'parser-tests', '01-basic-structure.docx');
  const tempDir = path.join(baseDir, 'storage', 'temp');

  // Test 1: Buffer Ingestion via IngestService (08-combined-blog.docx)
  let blog08Id = '';
  try {
    console.log('\n--- Test 1: Buffer Ingestion via IngestService ---');
    const fileBuffer = fs.readFileSync(fixture08Path);
    const blog08 = await ingestService.ingestDocumentFromBuffer('08-combined-blog.docx', fileBuffer);
    blog08Id = blog08.id;

    assert(!!blog08.id, 'Blog record created with UUID', `ID: ${blog08.id}`);
    assert(blog08.title === 'Comprehensive Guide to Modern Web Architecture', 'Extracted document H1 title', `Title: "${blog08.title}"`);
    assert(blog08.status === 'DRAFT', 'Blog status defaults to DRAFT', `Status: ${blog08.status}`);
    assert(!!blog08.featuredImage, 'Featured image URL populated', `Featured Image: ${blog08.featuredImage}`);
    assert(blog08.extractedImageCount > 0, 'Extracted image count recorded', `Count: ${blog08.extractedImageCount}`);
    assert(blog08.sourceFilename === '08-combined-blog.docx', 'Source filename persisted', `Filename: ${blog08.sourceFilename}`);

    const ast = blog08.contentJson as unknown as BlogDocumentAST;
    assert(!!ast && Array.isArray(ast.blocks) && ast.blocks.length > 0, 'Valid BlogDocumentAST JSONB persisted', `AST Blocks: ${ast.blocks.length}`);
  } catch (err) {
    assert(false, 'Buffer Ingestion via IngestService', (err as Error).message);
  }

  // Test 2: GraphQL Mutation uploadBlogDocument Resolution (01-basic-structure.docx)
  try {
    console.log('\n--- Test 2: GraphQL Mutation uploadBlogDocument Resolution ---');
    const fileBuffer = fs.readFileSync(fixture01Path);
    const base64Str = fileBuffer.toString('base64');

    const result = await resolvers.Mutation.uploadBlogDocument({}, {
      fileName: '01-basic-structure.docx',
      fileBufferBase64: base64Str,
    });

    assert(!!result.id, 'GraphQL uploadBlogDocument mutation returned Blog', `New ID: ${result.id}`);
    assert(result.status === 'DRAFT', 'GraphQL mutation blog status is DRAFT', `Status: ${result.status}`);
    assert(result.sourceFilename === '01-basic-structure.docx', 'GraphQL mutation sourceFilename persisted', `Filename: ${result.sourceFilename}`);
  } catch (err) {
    assert(false, 'GraphQL Mutation uploadBlogDocument Resolution', (err as Error).message);
  }

  // Test 3: Temporary Upload File Cleanup Verification
  try {
    console.log('\n--- Test 3: Temporary File Cleanup Verification ---');
    let tempFiles: string[] = [];
    if (fs.existsSync(tempDir)) {
      tempFiles = fs.readdirSync(tempDir);
    }
    assert(tempFiles.length === 0, 'Temporary storage directory cleaned up automatically', `Remaining temp files: ${tempFiles.length}`);
  } catch (err) {
    assert(false, 'Temporary File Cleanup Verification', (err as Error).message);
  }

  // Test 4: Server Validation (Unsupported Extension .txt)
  try {
    console.log('\n--- Test 4: Server Validation (Unsupported Extension .txt) ---');
    let errorCaught = false;
    try {
      await ingestService.ingestDocumentFromBuffer('test.txt', Buffer.from('plain text content'));
    } catch (err) {
      errorCaught = (err as Error).message.includes('Unsupported file extension');
    }
    assert(errorCaught, 'Server rejected non-.docx file extension');
  } catch (err) {
    assert(false, 'Server Validation for unsupported extension', (err as Error).message);
  }

  // Test 5: Server Validation (Legacy .doc file)
  try {
    console.log('\n--- Test 5: Server Validation (Legacy .doc file) ---');
    let errorCaught = false;
    try {
      await ingestService.ingestDocumentFromBuffer('legacy.doc', Buffer.from('binary doc content'));
    } catch (err) {
      errorCaught = (err as Error).message.includes('Legacy binary .doc files are not supported');
    }
    assert(errorCaught, 'Server rejected legacy .doc file with clear error message');
  } catch (err) {
    assert(false, 'Server Validation for legacy .doc file', (err as Error).message);
  }

  // Test 6: Server Validation (Oversized File > 25MB)
  try {
    console.log('\n--- Test 6: Server Validation (Oversized File > 25MB) ---');
    let errorCaught = false;
    const oversizedBuffer = Buffer.alloc(26 * 1024 * 1024);
    try {
      await ingestService.ingestDocumentFromBuffer('huge.docx', oversizedBuffer);
    } catch (err) {
      errorCaught = (err as Error).message.includes('exceeds the maximum allowed limit');
    }
    assert(errorCaught, 'Server rejected oversized file > 25MB');
  } catch (err) {
    assert(false, 'Server Validation for oversized file', (err as Error).message);
  }

  // Test 7: Server Validation (Malformed DOCX / Non-ZIP Buffer)
  try {
    console.log('\n--- Test 7: Server Validation (Malformed DOCX Buffer) ---');
    let errorCaught = false;
    try {
      await ingestService.ingestDocumentFromBuffer('corrupt.docx', Buffer.from('NOT A ZIP MAGIC HEADER'));
    } catch (err) {
      errorCaught = true;
    }
    assert(errorCaught, 'Server rejected malformed DOCX buffer header check');

    // Also verify temp file cleanup after failure
    let tempFilesAfterFail: string[] = [];
    if (fs.existsSync(tempDir)) {
      tempFilesAfterFail = fs.readdirSync(tempDir);
    }
    assert(tempFilesAfterFail.length === 0, 'Temporary file cleaned up even after ingestion failure');
  } catch (err) {
    assert(false, 'Server Validation for malformed DOCX buffer', (err as Error).message);
  }

  // Test 8: GraphQL Query Integration Regression
  try {
    console.log('\n--- Test 8: GraphQL Query Integration Regression ---');
    const blogs = await resolvers.Query.blogs();
    assert(Array.isArray(blogs) && blogs.length > 0, 'GraphQL `blogs` query lists newly created uploaded blogs', `Total Blogs: ${blogs.length}`);

    if (blog08Id) {
      const singleBlog = await resolvers.Query.blog({}, { id: blog08Id });
      assert(!!singleBlog && singleBlog.id === blog08Id, 'GraphQL `blog(id)` query retrieves uploaded blog', `Retrieved ID: ${singleBlog?.id}`);
    }
  } catch (err) {
    assert(false, 'GraphQL Query Integration Regression', (err as Error).message);
  }

  console.log('\n==============================================================================');
  console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('==============================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase4bTests().catch((err) => {
  console.error('Fatal error running Phase 4B test suite:', err);
  process.exit(1);
});
