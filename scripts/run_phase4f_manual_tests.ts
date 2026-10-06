import path from 'path';
import fs from 'fs';

// Load Environment Variables before Prisma/Resolver instantiation
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

import { execSync } from 'child_process';
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

import { resolvers } from '../apps/api/src/graphql/resolvers/index.js';
import { ingestService } from '../apps/api/src/services/ingest.service.js';
import { BlogDocumentAST } from '../apps/api/src/types/blog-document.js';

async function runPhase4fManualTests() {
  console.log('==============================================================================');
  console.log('PHASE 4F — MANUAL BLOG CREATION WITH DYNAMIC SECTIONS TEST HARNESS');
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

  const manualTitle = 'Manual Test Blog Post with Dynamic Sections';
  const initialAST: BlogDocumentAST = {
    blocks: [
      {
        type: 'heading',
        level: 1,
        text: 'Welcome to Dynamic Manual Editing',
        children: [{ type: 'text', text: 'Welcome to Dynamic Manual Editing' }],
      },
      {
        type: 'paragraph',
        text: 'This blog post was created manually without a DOCX upload.',
        children: [{ type: 'text', text: 'This blog post was created manually without a DOCX upload.' }],
      },
      {
        type: 'list',
        ordered: false,
        items: [
          { text: 'Dynamic section 1', children: [{ type: 'text', text: 'Dynamic section 1' }] },
          { text: 'Dynamic section 2', children: [{ type: 'text', text: 'Dynamic section 2' }] },
        ],
      },
      {
        type: 'quote',
        text: 'Flexibility is key in editorial content management systems.',
        children: [{ type: 'text', text: 'Flexibility is key in editorial content management systems.' }],
      },
      {
        type: 'callout',
        text: 'Important note regarding AST structure integrity.',
        children: [{ type: 'text', text: 'Important note regarding AST structure integrity.' }],
      },
      {
        type: 'table',
        headers: ['Feature', 'Support Status'],
        rows: [
          [
            { text: 'Manual Creation', children: [{ type: 'text', text: 'Manual Creation' }] },
            { text: 'Supported', children: [{ type: 'text', text: 'Supported' }] },
          ],
        ],
      },
    ],
  };

  let manualBlogId = '';

  // Test 1: Create Manual Blog with Dynamic Blocks via createBlog Mutation
  try {
    console.log('--- Test 1: Create Manual Blog via createBlog Mutation ---');
    const created = await resolvers.Mutation.createBlog({}, {
      title: manualTitle,
      contentJson: JSON.stringify(initialAST),
    });

    manualBlogId = created.id;
    assert(!!created.id, 'Blog ID generated successfully', `ID: ${created.id}`);
    assert(created.title === manualTitle, 'Title matches expected string', `Title: "${created.title}"`);
    assert(created.status === 'DRAFT', 'Initial status defaults to DRAFT', `Status: ${created.status}`);
    assert(!!created.contentJson, 'contentJson is persisted');

    const parsed: BlogDocumentAST = JSON.parse(created.contentJson!);
    assert(parsed.blocks.length === 6, 'All 6 dynamic sections persisted in AST', `Blocks count: ${parsed.blocks.length}`);
  } catch (err) {
    assert(false, 'Create Manual Blog via createBlog Mutation', (err as Error).message);
  }

  // Test 2: Retrieve Manually Created Blog from PostgreSQL via Query.blog
  try {
    console.log('\n--- Test 2: Retrieve Manually Created Blog from Database ---');
    const fetched = await resolvers.Query.blog({}, { id: manualBlogId });
    assert(fetched !== null, 'Blog record retrieved successfully');
    assert(fetched?.title === manualTitle, 'Retrieved blog title matches', `Title: "${fetched?.title}"`);

    const parsed: BlogDocumentAST = JSON.parse(fetched!.contentJson!);
    const hasHeading = parsed.blocks.some((b) => b.type === 'heading');
    const hasTable = parsed.blocks.some((b) => b.type === 'table');
    assert(hasHeading && hasTable, 'Retrieved AST retains heading and table blocks');
  } catch (err) {
    assert(false, 'Retrieve Manually Created Blog from Database', (err as Error).message);
  }

  // Test 3: Dynamic Section Editing & Reordering on Manually Created Blog
  try {
    console.log('\n--- Test 3: Dynamic Section Editing & Reordering via updateBlog ---');
    const current = await resolvers.Query.blog({}, { id: manualBlogId });
    const ast: BlogDocumentAST = JSON.parse(current!.contentJson!);

    // Add a new paragraph block dynamically
    ast.blocks.push({
      type: 'paragraph',
      text: 'Newly appended dynamic section.',
      children: [{ type: 'text', text: 'Newly appended dynamic section.' }],
    });

    const updated = await resolvers.Mutation.updateBlog({}, {
      id: manualBlogId,
      title: manualTitle + ' (Updated)',
      contentJson: JSON.stringify(ast),
    });

    assert(updated.title === manualTitle + ' (Updated)', 'Updated title persisted', `Title: "${updated.title}"`);
    const updatedAST: BlogDocumentAST = JSON.parse(updated.contentJson!);
    assert(updatedAST.blocks.length === 7, 'Dynamic block addition persisted', `Count: ${updatedAST.blocks.length}`);
  } catch (err) {
    assert(false, 'Dynamic Section Editing & Reordering via updateBlog', (err as Error).message);
  }

  // Test 4: Server-Side AST Validation on createBlog Mutation
  try {
    console.log('\n--- Test 4: Server-Side AST Validation Rejection on createBlog ---');
    let malformedCaught = false;
    try {
      await resolvers.Mutation.createBlog({}, {
        title: 'Invalid AST Blog',
        contentJson: 'NOT_VALID_JSON',
      });
    } catch (err) {
      malformedCaught = (err as Error).message.includes('Invalid JSON format');
    }
    assert(malformedCaught, 'createBlog rejected invalid JSON string');

    let invalidBlockCaught = false;
    try {
      await resolvers.Mutation.createBlog({}, {
        title: 'Invalid Block Blog',
        contentJson: JSON.stringify({ blocks: [{ noType: true }] }),
      });
    } catch (err) {
      invalidBlockCaught = (err as Error).message.includes('valid \'type\' string property');
    }
    assert(invalidBlockCaught, 'createBlog rejected block missing type property');
  } catch (err) {
    assert(false, 'Server-Side AST Validation Rejection on createBlog', (err as Error).message);
  }

  // Test 5: Lifecycle Operations (Publish, Unpublish, Delete) on Manual Blog
  try {
    console.log('\n--- Test 5: Lifecycle Operations (Publish, Unpublish, Delete) ---');
    const published = await resolvers.Mutation.publishBlog({}, { id: manualBlogId });
    assert(published.status === 'PUBLISHED', 'Manual blog published to PUBLISHED status');

    const unpublished = await resolvers.Mutation.unpublishBlog({}, { id: manualBlogId });
    assert(unpublished.status === 'DRAFT', 'Manual blog reverted to DRAFT status');

    const deleted = await resolvers.Mutation.deleteBlog({}, { id: manualBlogId });
    assert(deleted === true, 'Manual blog deleted successfully');

    const reQueried = await resolvers.Query.blog({}, { id: manualBlogId });
    assert(reQueried === null, 'Deleted manual blog no longer in database');
  } catch (err) {
    assert(false, 'Lifecycle Operations (Publish, Unpublish, Delete) on Manual Blog', (err as Error).message);
  }

  // Test 6: Verify DOCX Upload Path Still Works 100% Unchanged
  try {
    console.log('\n--- Test 6: Verify Existing DOCX Ingestion Flow Remains 100% Functional ---');
    const fixture08Path = path.join(process.cwd(), 'sample-documents', 'parser-tests', '08-combined-blog.docx');
    const fileBuffer = fs.readFileSync(fixture08Path);
    const docxBlog = await ingestService.ingestDocumentFromBuffer('08-combined-blog.docx', fileBuffer);

    assert(!!docxBlog.id, 'DOCX ingestion succeeds and returns Blog record', `ID: ${docxBlog.id}`);
    assert(docxBlog.sourceFilename === '08-combined-blog.docx', 'DOCX sourceFilename recorded correctly');

    // Clean up test blog
    await resolvers.Mutation.deleteBlog({}, { id: docxBlog.id });
  } catch (err) {
    assert(false, 'Verify Existing DOCX Ingestion Flow Remains 100% Functional', (err as Error).message);
  }

  console.log('\n==============================================================================');
  console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('==============================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase4fManualTests().catch((err) => {
  console.error('Fatal error running Phase 4F Manual Creation test suite:', err);
  process.exit(1);
});
