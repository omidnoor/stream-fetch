/**
 * Create MongoDB Indexes Script
 *
 * Creates all necessary indexes for optimal query performance.
 * Run this after setting up MongoDB connection.
 *
 * Usage:
 *   npx tsx scripts/create-indexes.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { getDatabase, Collections } from '../src/lib/database/mongodb';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function createIndexes() {
  console.log('🔧 Creating MongoDB indexes...\n');

  try {
    const db = await getDatabase();

    // ============================================================================
    // Automation Jobs Collection Indexes
    // ============================================================================
    console.log('📦 Creating indexes for automation_jobs...');

    const automationJobs = db.collection(Collections.AUTOMATION_JOBS);

    await automationJobs.createIndex({ id: 1 }, { unique: true });
    console.log('  ✓ Created unique index on id');

    await automationJobs.createIndex({ status: 1, createdAt: -1 });
    console.log('  ✓ Created compound index on status + createdAt');

    await automationJobs.createIndex({ createdAt: -1 });
    console.log('  ✓ Created index on createdAt');

    await automationJobs.createIndex({ updatedAt: -1 });
    console.log('  ✓ Created index on updatedAt');

    // ============================================================================
    // Video Projects Collection Indexes
    // ============================================================================
    console.log('\n📹 Creating indexes for video_projects...');

    const videoProjects = db.collection(Collections.VIDEO_PROJECTS);

    await videoProjects.createIndex({ id: 1 }, { unique: true });
    console.log('  ✓ Created unique index on id');

    await videoProjects.createIndex({ userId: 1, createdAt: -1 });
    console.log('  ✓ Created compound index on userId + createdAt');

    await videoProjects.createIndex({ status: 1 });
    console.log('  ✓ Created index on status');

    await videoProjects.createIndex({ createdAt: -1 });
    console.log('  ✓ Created index on createdAt');

    await videoProjects.createIndex({ name: 'text' });
    console.log('  ✓ Created text index on name for search');

    // ============================================================================
    // PDF Projects Collection Indexes
    // ============================================================================
    console.log('\n📄 Creating indexes for pdf_projects...');

    const pdfProjects = db.collection(Collections.PDF_PROJECTS);

    await pdfProjects.createIndex({ id: 1 }, { unique: true });
    console.log('  ✓ Created unique index on id');

    await pdfProjects.createIndex({ status: 1 });
    console.log('  ✓ Created index on status');

    await pdfProjects.createIndex({ createdAt: -1 });
    console.log('  ✓ Created index on createdAt');

    await pdfProjects.createIndex({ name: 'text' });
    console.log('  ✓ Created text index on name for search');

    // ============================================================================
    // Annotations Collection Indexes
    // ============================================================================
    console.log('\n✏️  Creating indexes for annotations...');

    const annotations = db.collection(Collections.ANNOTATIONS);

    await annotations.createIndex({ id: 1 }, { unique: true });
    console.log('  ✓ Created unique index on id');

    await annotations.createIndex({ projectId: 1, pageNumber: 1 });
    console.log('  ✓ Created compound index on projectId + pageNumber');

    await annotations.createIndex({ projectId: 1, createdAt: -1 });
    console.log('  ✓ Created compound index on projectId + createdAt');

    await annotations.createIndex({ type: 1 });
    console.log('  ✓ Created index on type');

    // ============================================================================
    // Download History Collection Indexes (Optional)
    // ============================================================================
    console.log('\n⬇️  Creating indexes for download_history...');

    const downloadHistory = db.collection(Collections.DOWNLOAD_HISTORY);

    await downloadHistory.createIndex({ id: 1 }, { unique: true });
    console.log('  ✓ Created unique index on id');

    await downloadHistory.createIndex({ videoId: 1, timestamp: -1 });
    console.log('  ✓ Created compound index on videoId + timestamp');

    await downloadHistory.createIndex({ timestamp: -1 });
    console.log('  ✓ Created index on timestamp');

    // ============================================================================
    // Verify Indexes
    // ============================================================================
    console.log('\n🔍 Verifying indexes...');

    const collections = [
      { name: 'automation_jobs', collection: automationJobs },
      { name: 'video_projects', collection: videoProjects },
      { name: 'pdf_projects', collection: pdfProjects },
      { name: 'annotations', collection: annotations },
      { name: 'download_history', collection: downloadHistory },
    ];

    for (const { name, collection } of collections) {
      const indexes = await collection.indexes();
      console.log(`  ${name}: ${indexes.length} indexes`);
    }

    console.log('\n✅ All indexes created successfully!');
    console.log('\n📊 Index Summary:');
    console.log('  • automation_jobs: 4 indexes');
    console.log('  • video_projects: 5 indexes');
    console.log('  • pdf_projects: 4 indexes');
    console.log('  • annotations: 4 indexes');
    console.log('  • download_history: 3 indexes');
    console.log('  • Total: 20 indexes');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating indexes:', error);
    process.exit(1);
  }
}

// Run the script
createIndexes();
