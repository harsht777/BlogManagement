import { PrismaClient, BlogStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database for Phase 1...');

  // Ensure test blog exists
  const existingTestBlog = await prisma.blog.findFirst({
    where: { title: 'Phase 1 Test Blog' },
  });

  if (!existingTestBlog) {
    const testBlog = await prisma.blog.create({
      data: {
        title: 'Phase 1 Test Blog',
        status: BlogStatus.DRAFT,
      },
    });
    console.log('✅ Created Phase 1 Test Blog (Development/Test Data):', testBlog);
  } else {
    console.log('ℹ️ Phase 1 Test Blog already exists:', existingTestBlog);
  }
}

main()
  .catch((e: unknown) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
