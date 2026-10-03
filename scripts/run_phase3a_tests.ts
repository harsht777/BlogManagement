import path from 'path';
import fs from 'fs';
import { parserService } from '../apps/api/src/services/parser.service.js';
import {
  BlogDocumentAST,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  ImageBlock,
  QuoteBlock,
  CalloutBlock,
  TableBlock,
} from '../apps/api/src/types/blog-document.js';

const TEST_DOCS_DIR = path.join(process.cwd(), 'sample-documents', 'parser-tests');
const RESULTS_DIR = path.join(process.cwd(), 'sample-documents', 'parser-results');

const FIXTURES = [
  '01-basic-structure.docx',
  '02-formatting.docx',
  '03-lists.docx',
  '04-links.docx',
  '05-images.docx',
  '06-blockquotes-callouts.docx',
  '07-tables.docx',
  '08-combined-blog.docx',
];

interface TestAssertion {
  name: string;
  passed: boolean;
  message: string;
}

async function runPhase3aTests(): Promise<void> {
  console.log('🚀 Phase 3A: Testing Core Document Parsing Engine & Normalizer...\n');

  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  let totalTests = 0;
  let passedTests = 0;
  const summaryReport: { file: string; status: string; details: string }[] = [];

  for (const file of FIXTURES) {
    totalTests++;
    const filePath = path.join(TEST_DOCS_DIR, file);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Fixture missing: ${filePath}`);
      summaryReport.push({ file, status: 'FAIL', details: 'File missing' });
      continue;
    }

    try {
      // 1. Execute Parser Service
      const result = await parserService.parseDocument(filePath, {
        originalFilename: file,
      });

      const ast: BlogDocumentAST = result.document;
      const assertions: TestAssertion[] = [];

      // 2. Perform File-Specific Semantic Assertions
      if (file === '01-basic-structure.docx') {
        const headings = ast.blocks.filter((b) => b.type === 'heading') as HeadingBlock[];
        const hasH1 = headings.some((h) => h.level === 1);
        const hasH2 = headings.some((h) => h.level === 2);
        const hasH3 = headings.some((h) => h.level === 3);

        assertions.push({
          name: 'Extract Headings (H1, H2, H3)',
          passed: hasH1 && hasH2 && hasH3,
          message: `Found ${headings.length} headings (H1: ${hasH1}, H2: ${hasH2}, H3: ${hasH3})`,
        });
      } else if (file === '02-formatting.docx') {
        const paragraphs = ast.blocks.filter((b) => b.type === 'paragraph') as ParagraphBlock[];
        const allChildren = paragraphs.flatMap((p) => p.children);
        const hasBold = allChildren.some((c) => c.bold);
        const hasItalic = allChildren.some((c) => c.italic);

        assertions.push({
          name: 'Preserve Bold & Italic Inline Styling',
          passed: hasBold && hasItalic,
          message: `Bold inline nodes: ${hasBold}, Italic inline nodes: ${hasItalic}`,
        });
      } else if (file === '03-lists.docx') {
        const lists = ast.blocks.filter((b) => b.type === 'list') as ListBlock[];
        const hasUnordered = lists.some((l) => !l.ordered);
        const hasOrdered = lists.some((l) => l.ordered);

        assertions.push({
          name: 'Preserve Unordered & Ordered Lists',
          passed: hasUnordered && hasOrdered,
          message: `Unordered lists: ${hasUnordered}, Ordered lists: ${hasOrdered}`,
        });
      } else if (file === '04-links.docx') {
        const paragraphs = ast.blocks.filter((b) => b.type === 'paragraph') as ParagraphBlock[];
        const links = paragraphs.flatMap((p) => p.children).filter((c) => c.type === 'link');
        const hasPostgresLink = links.some((l) => l.url?.includes('postgresql.org'));

        assertions.push({
          name: 'Extract Hyperlinks & Valid Protocols',
          passed: hasPostgresLink,
          message: `Extracted ${links.length} hyperlinks (PostgreSQL URL: ${hasPostgresLink})`,
        });
      } else if (file === '05-images.docx') {
        const images = ast.blocks.filter((b) => b.type === 'image') as ImageBlock[];
        const savedCount = result.images.length;

        assertions.push({
          name: 'Extract & Save Embedded Images',
          passed: images.length === 2 && savedCount === 2,
          message: `AST Image blocks: ${images.length}, Saved to disk: ${savedCount}`,
        });
      } else if (file === '06-blockquotes-callouts.docx') {
        const quotes = ast.blocks.filter((b) => b.type === 'quote') as QuoteBlock[];
        const callouts = ast.blocks.filter((b) => b.type === 'callout') as CalloutBlock[];

        assertions.push({
          name: 'Extract Blockquotes & Callouts',
          passed: quotes.length > 0 && callouts.length > 0,
          message: `Quotes extracted: ${quotes.length}, Callouts extracted: ${callouts.length}`,
        });
      } else if (file === '07-tables.docx') {
        const tables = ast.blocks.filter((b) => b.type === 'table') as TableBlock[];
        const validTable = tables.length > 0 && tables[0].rows.length === 4;

        assertions.push({
          name: 'Normalize Grid Tables & Headers',
          passed: validTable,
          message: `Extracted ${tables.length} tables (Rows count: ${tables[0]?.rows.length || 0})`,
        });
      } else if (file === '08-combined-blog.docx') {
        const blockTypes = new Set(ast.blocks.map((b) => b.type));
        const hasAllCore =
          blockTypes.has('heading') &&
          blockTypes.has('paragraph') &&
          blockTypes.has('list') &&
          blockTypes.has('image') &&
          blockTypes.has('quote') &&
          blockTypes.has('table');

        assertions.push({
          name: 'Composite Blog AST Transformation',
          passed: hasAllCore,
          message: `Preserved block types: ${Array.from(blockTypes).join(', ')}`,
        });
      }

      const allPassed = assertions.every((a) => a.passed);
      if (allPassed) {
        passedTests++;
      }

      summaryReport.push({
        file,
        status: allPassed ? 'PASS' : 'PARTIAL',
        details: assertions.map((a) => `${a.name}: ${a.message}`).join(' | '),
      });

      // 3. Save JSON Snapshot to sample-documents/parser-results/
      const snapshotFilename = file.replace('.docx', '.json');
      const snapshotPath = path.join(RESULTS_DIR, snapshotFilename);
      fs.writeFileSync(snapshotPath, JSON.stringify(result, null, 2));

      console.log(`✅ ${file}: ${allPassed ? 'PASS' : 'PARTIAL'}`);
      assertions.forEach((a) => console.log(`   - ${a.name}: ${a.message}`));
      console.log(`   Snapshot saved to: sample-documents/parser-results/${snapshotFilename}\n`);
    } catch (err: unknown) {
      console.error(`❌ Error parsing ${file}:`, err);
      summaryReport.push({
        file,
        status: 'FAIL',
        details: `Exception: ${(err as Error).message}`,
      });
    }
  }

  console.log('=============================================================');
  console.log(`        PHASE 3A ENGINE VERIFICATION SUMMARY (${passedTests}/${totalTests} PASSED)`);
  console.log('=============================================================');
  console.table(summaryReport);

  if (passedTests === totalTests) {
    console.log('\n✨ All Phase 3A parser engine tests executed successfully with 100% PASS rate!');
  } else {
    console.error('\n⚠️ Some parser engine tests failed or yielded partial results.');
    process.exit(1);
  }
}

runPhase3aTests().catch((err) => {
  console.error('Fatal error in Phase 3A test harness:', err);
  process.exit(1);
});
