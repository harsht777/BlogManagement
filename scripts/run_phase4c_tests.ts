import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const apiEnvPath = path.join(rootDir, 'apps', 'api', '.env');
if (fs.existsSync(apiEnvPath)) {
  const content = fs.readFileSync(apiEnvPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      const val = vals.join('=').replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:5432/blog_management_dev?schema=public';
}

try {
  const pgCtl = 'C:\\PostgreSQL\\17\\bin\\pg_ctl.exe';
  if (fs.existsSync(pgCtl)) {
    try {
      execSync(`"${pgCtl}" -D "C:\\PostgreSQL\\17\\data" status`, { stdio: 'ignore' });
    } catch {
      execSync(`"${pgCtl}" -D "C:\\PostgreSQL\\17\\data" -l "C:\\PostgreSQL\\17\\data\\server.log" start`, { stdio: 'ignore' });
    }
  }
} catch {
  // Ignore
}

import { ingestService } from '../apps/api/src/services/ingest.service.js';
import { resolvers } from '../apps/api/src/graphql/resolvers/index.js';
import { BlogDocumentAST } from '../apps/api/src/types/blog-document.js';

async function runPhase4cTests() {
  console.log('==============================================================================');
  console.log('PHASE 4C — BLOG DETAIL, STRUCTURED CONTENT EDITING & PREVIEW TEST HARNESS');
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

  // Test 1: Query Blog Detail by ID via GraphQL
  try {
    console.log('\n--- Test 1: GraphQL Query blog(id) Resolution ---');
    const blogDetail = await resolvers.Query.blog({}, { id: targetBlogId });
    assert(!!blogDetail, 'Retrieved blog record by ID', `ID: ${targetBlogId}`);
    assert(blogDetail?.status === 'DRAFT', 'Blog status is DRAFT', `Status: ${blogDetail?.status}`);
    assert(blogDetail?.sourceFilename === '08-combined-blog.docx', 'Source filename matches', `Filename: ${blogDetail?.sourceFilename}`);
    assert(!!blogDetail?.contentJson, 'Blog contentJson AST is populated', 'contentJson string present');
  } catch (err) {
    assert(false, 'GraphQL Query blog(id) Resolution', (err as Error).message);
  }

  // Test 2: Query Unknown Blog ID
  try {
    console.log('\n--- Test 2: Query Unknown Blog ID ---');
    const unknownResult = await resolvers.Query.blog({}, { id: '00000000-0000-0000-0000-000000000000' });
    assert(unknownResult === null, 'Unknown blog ID query returns null cleanly');
  } catch (err) {
    assert(false, 'Query Unknown Blog ID', (err as Error).message);
  }

  // Test 3: Title Update via GraphQL Mutation updateBlog
  const newTitle = 'Updated Architecture Blueprint 2026';
  try {
    console.log('\n--- Test 3: Title Update via updateBlog Mutation ---');
    const updatedBlog = await resolvers.Mutation.updateBlog({}, {
      id: targetBlogId,
      title: newTitle,
    });
    assert(updatedBlog.title === newTitle, 'Updated title returned in GraphQL response', `Title: "${updatedBlog.title}"`);
  } catch (err) {
    assert(false, 'Title Update via updateBlog Mutation', (err as Error).message);
  }

  // Test 4: Structured Content AST Block Update via updateBlog Mutation
  try {
    console.log('\n--- Test 4: Structured Content AST Block Update ---');
    const blogDetail = await resolvers.Query.blog({}, { id: targetBlogId });
    const currentAST: BlogDocumentAST = JSON.parse(blogDetail!.contentJson!);

    // Modify first heading text and append a new Callout block
    currentAST.blocks[0] = {
      type: 'heading',
      level: 1,
      text: newTitle,
      children: [{ type: 'text', text: newTitle }],
    };

    currentAST.blocks.push({
      type: 'callout',
      text: 'Phase 4C Verification Callout Block Added',
      children: [{ type: 'text', text: 'Phase 4C Verification Callout Block Added', bold: true }],
    });

    const updatedBlog = await resolvers.Mutation.updateBlog({}, {
      id: targetBlogId,
      contentJson: JSON.stringify(currentAST),
    });

    const updatedAST: BlogDocumentAST = JSON.parse(updatedBlog.contentJson!);
    const hasCallout = updatedAST.blocks.some(b => b.type === 'callout' && b.text.includes('Phase 4C Verification'));

    assert(hasCallout, 'New Callout block appended to AST successfully', `Total AST Blocks: ${updatedAST.blocks.length}`);
  } catch (err) {
    assert(false, 'Structured Content AST Block Update', (err as Error).message);
  }

  // Test 5: Re-query Database Persistence Verification
  try {
    console.log('\n--- Test 5: Re-query Database Persistence Verification ---');
    const reQueriedBlog = await resolvers.Query.blog({}, { id: targetBlogId });
    assert(reQueriedBlog?.title === newTitle, 'Persisted title matches updated title in PostgreSQL', `Title: "${reQueriedBlog?.title}"`);

    const persistedAST: BlogDocumentAST = JSON.parse(reQueriedBlog!.contentJson!);
    assert(persistedAST.blocks.length > 16, 'Persisted AST blocks count verified in PostgreSQL', `Count: ${persistedAST.blocks.length}`);
  } catch (err) {
    assert(false, 'Re-query Database Persistence Verification', (err as Error).message);
  }

  // Test 6: Server-Side Invalid AST JSON Rejection
  try {
    console.log('\n--- Test 6: Server-Side Invalid AST JSON Rejection ---');
    let errorCaught = false;
    try {
      await resolvers.Mutation.updateBlog({}, {
        id: targetBlogId,
        contentJson: '{ invalid json format }',
      });
    } catch (err) {
      errorCaught = (err as Error).message.includes('Invalid JSON format');
    }
    assert(errorCaught, 'Server rejected invalid JSON string');
  } catch (err) {
    assert(false, 'Server-Side Invalid AST JSON Rejection', (err as Error).message);
  }

  // Test 7: Server-Side Malformed AST Structure Rejection (Missing blocks array)
  try {
    console.log('\n--- Test 7: Server-Side Malformed AST Structure Rejection ---');
    let errorCaught = false;
    try {
      await resolvers.Mutation.updateBlog({}, {
        id: targetBlogId,
        contentJson: JSON.stringify({ foo: 'bar' }),
      });
    } catch (err) {
      errorCaught = (err as Error).message.includes("contentJson must be an object containing a 'blocks' array");
    }
    assert(errorCaught, 'Server rejected malformed AST lacking blocks array');
  } catch (err) {
    assert(false, 'Server-Side Malformed AST Structure Rejection', (err as Error).message);
  }

  // Test 8: Image Reference Integrity
  try {
    console.log('\n--- Test 8: Image Reference Integrity Verification ---');
    const blogDetail = await resolvers.Query.blog({}, { id: targetBlogId });
    assert(!!blogDetail?.featuredImage, 'Featured image reference preserved after AST edit', `Featured Image: ${blogDetail?.featuredImage}`);
    assert(blogDetail?.extractedImageCount! > 0, 'Extracted image count preserved', `Count: ${blogDetail?.extractedImageCount}`);
  } catch (err) {
    assert(false, 'Image Reference Integrity Verification', (err as Error).message);
  }

  console.log('\n==============================================================================');
  console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('==============================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase4cTests().catch((err) => {
  console.error('Fatal error running Phase 4C test suite:', err);
  process.exit(1);
});
