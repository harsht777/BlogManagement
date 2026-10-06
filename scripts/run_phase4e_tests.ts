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

async function runPhase4eTests() {
  console.log('==============================================================================');
  console.log('PHASE 4E — BLOG LIFECYCLE & FINAL POLISH TEST HARNESS');
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

  // Test 1: Publish DRAFT Blog via GraphQL Mutation publishBlog
  try {
    console.log('\n--- Test 1: Publish DRAFT Blog via publishBlog Mutation ---');
    const publishedBlog = await resolvers.Mutation.publishBlog({}, { id: targetBlogId });
    assert(publishedBlog.status === 'PUBLISHED', 'Blog status transitions to PUBLISHED', `Status: ${publishedBlog.status}`);

    const reQueried = await resolvers.Query.blog({}, { id: targetBlogId });
    assert(reQueried?.status === 'PUBLISHED', 'Database reflects PUBLISHED status after query', `DB Status: ${reQueried?.status}`);
  } catch (err) {
    assert(false, 'Publish DRAFT Blog via publishBlog Mutation', (err as Error).message);
  }

  // Test 2: Unpublish PUBLISHED Blog via GraphQL Mutation unpublishBlog
  try {
    console.log('\n--- Test 2: Unpublish PUBLISHED Blog via unpublishBlog Mutation ---');
    const unpublishedBlog = await resolvers.Mutation.unpublishBlog({}, { id: targetBlogId });
    assert(unpublishedBlog.status === 'DRAFT', 'Blog status reverts to DRAFT', `Status: ${unpublishedBlog.status}`);

    const reQueried = await resolvers.Query.blog({}, { id: targetBlogId });
    assert(reQueried?.status === 'DRAFT', 'Database reflects DRAFT status after query', `DB Status: ${reQueried?.status}`);
  } catch (err) {
    assert(false, 'Unpublish PUBLISHED Blog via unpublishBlog Mutation', (err as Error).message);
  }

  // Test 3: AST Table Grid Cell Editing Support Verification
  try {
    console.log('\n--- Test 3: Table Grid Cell Editing Support Verification ---');
    const blogDetail = await resolvers.Query.blog({}, { id: targetBlogId });
    const ast: BlogDocumentAST = JSON.parse(blogDetail!.contentJson!);

    const tableBlockIdx = ast.blocks.findIndex((b) => b.type === 'table');
    assert(tableBlockIdx >= 0, 'Table block present in ingested AST');

    if (tableBlockIdx >= 0) {
      const tableBlock = ast.blocks[tableBlockIdx] as any;
      tableBlock.rows[0][0] = { text: 'Edited Grid Cell 1', children: [{ type: 'text', text: 'Edited Grid Cell 1' }] };

      const updatedBlog = await resolvers.Mutation.updateBlog({}, {
        id: targetBlogId,
        contentJson: JSON.stringify(ast),
      });

      const updatedAST: BlogDocumentAST = JSON.parse(updatedBlog.contentJson!);
      const updatedTable = updatedAST.blocks[tableBlockIdx] as any;
      const cellText = typeof updatedTable.rows[0][0] === 'string' ? updatedTable.rows[0][0] : updatedTable.rows[0][0].text;
      assert(cellText === 'Edited Grid Cell 1', 'Table cell modification persisted to database', `Value: "${cellText}"`);
    }
  } catch (err) {
    assert(false, 'Table Grid Cell Editing Support Verification', (err as Error).message);
  }

  // Test 4: Server-Side Invalid Block Item AST Validation Rejection
  try {
    console.log('\n--- Test 4: Server-Side Invalid Block Item AST Validation Rejection ---');
    let errorCaught = false;
    try {
      await resolvers.Mutation.updateBlog({}, {
        id: targetBlogId,
        contentJson: JSON.stringify({ blocks: [{ foo: 'bar without type property' }] }),
      });
    } catch (err) {
      errorCaught = (err as Error).message.includes("Each block in contentJson must be an object with a valid 'type' string property");
    }
    assert(errorCaught, 'Server rejected AST block lacking valid type string property');
  } catch (err) {
    assert(false, 'Server-Side Invalid Block Item AST Validation Rejection', (err as Error).message);
  }

  // Test 5: Delete Blog & Image Asset Cleanup Verification
  try {
    console.log('\n--- Test 5: Delete Blog & Image Asset Cleanup Verification ---');
    const deleteResult = await resolvers.Mutation.deleteBlog({}, { id: targetBlogId });
    assert(deleteResult === true, 'deleteBlog mutation returned boolean true');

    const deletedQuery = await resolvers.Query.blog({}, { id: targetBlogId });
    assert(deletedQuery === null, 'Deleted blog record no longer exists in PostgreSQL database query');
  } catch (err) {
    assert(false, 'Delete Blog & Image Asset Cleanup Verification', (err as Error).message);
  }

  // Test 6: Non-Existent Blog ID Lifecycle Handling
  try {
    console.log('\n--- Test 6: Non-Existent Blog ID Lifecycle Handling ---');
    let publishError = false;
    try {
      await resolvers.Mutation.publishBlog({}, { id: '00000000-0000-0000-0000-000000000000' });
    } catch (err) {
      publishError = (err as Error).message.includes('not found');
    }
    assert(publishError, 'publishBlog with non-existent ID throws clear Error');

    let deleteError = false;
    try {
      await resolvers.Mutation.deleteBlog({}, { id: '00000000-0000-0000-0000-000000000000' });
    } catch (err) {
      deleteError = (err as Error).message.includes('not found');
    }
    assert(deleteError, 'deleteBlog with non-existent ID throws clear Error');
  } catch (err) {
    assert(false, 'Non-Existent Blog ID Lifecycle Handling', (err as Error).message);
  }

  // Test 7: Inline Word Boundary Whitespace Preservation Verification
  try {
    console.log('\n--- Test 7: Inline Word Boundary Whitespace Preservation Verification ---');
    const ingested = await ingestService.ingestDocument(fixture08Path);
    const ast: BlogDocumentAST = typeof ingested.contentJson === 'string' ? JSON.parse(ingested.contentJson) : (ingested.contentJson as any);
    const introParagraph = ast.blocks.find((b) => b.type === 'paragraph' && b.text.includes('requires strong architectural decoupling'));
    assert(!!introParagraph, 'Found intro paragraph containing formatted inline nodes');
    if (introParagraph && 'children' in introParagraph && introParagraph.children) {
      const children = introParagraph.children;
      const hasTrailingSpace = children[0]?.text.endsWith(' ');
      const hasLeadingSpace = children[2]?.text.startsWith(' ');
      assert(hasTrailingSpace, 'First inline node retains trailing word boundary space', `Node 0 text: "${children[0]?.text}"`);
      assert(hasLeadingSpace, 'Third inline node retains leading word boundary space', `Node 2 text: "${children[2]?.text}"`);
    }
  } catch (err) {
    assert(false, 'Inline Word Boundary Whitespace Preservation Verification', (err as Error).message);
  }

  console.log('\n==============================================================================');
  console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('==============================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase4eTests().catch((err) => {
  console.error('Fatal error running Phase 4E test suite:', err);
  process.exit(1);
});
