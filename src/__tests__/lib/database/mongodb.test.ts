/**
 * MongoDB Connection Tests
 *
 * Tests the MongoDB connection utility and basic operations
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  connectToDatabase,
  getDatabase,
  getCollection,
  isDatabaseHealthy,
  closeConnection,
  Collections,
} from '@/lib/database/mongodb';

describe('MongoDB Connection', () => {
  beforeAll(async () => {
    // Ensure we have environment variables
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set in environment');
    }
  });

  afterAll(async () => {
    await closeConnection();
  });

  it('should connect to MongoDB successfully', async () => {
    const { client, db } = await connectToDatabase();
    expect(client).toBeDefined();
    expect(db).toBeDefined();
  });

  it('should return cached connection on second call', async () => {
    const first = await connectToDatabase();
    const second = await connectToDatabase();
    expect(first.client).toBe(second.client);
    expect(first.db).toBe(second.db);
  });

  it('should get database instance', async () => {
    const db = await getDatabase();
    expect(db).toBeDefined();
    expect(db.databaseName).toBe(process.env.MONGODB_DB_NAME || 'streamfetch');
  });

  it('should get a collection', async () => {
    const collection = await getCollection(Collections.AUTOMATION_JOBS);
    expect(collection).toBeDefined();
    expect(collection.collectionName).toBe('automation_jobs');
  });

  it('should perform health check', async () => {
    const isHealthy = await isDatabaseHealthy();
    expect(isHealthy).toBe(true);
  });

  it('should ping database successfully', async () => {
    const db = await getDatabase();
    const result = await db.admin().ping();
    expect(result).toHaveProperty('ok', 1);
  });

  it('should list all collections', async () => {
    const db = await getDatabase();
    const collections = await db.listCollections().toArray();
    expect(Array.isArray(collections)).toBe(true);
  });

  it('should verify all expected collections exist or can be created', async () => {
    const db = await getDatabase();
    const expectedCollections = [
      Collections.AUTOMATION_JOBS,
      Collections.VIDEO_PROJECTS,
      Collections.PDF_PROJECTS,
      Collections.ANNOTATIONS,
      Collections.DOWNLOAD_HISTORY,
    ];

    for (const collectionName of expectedCollections) {
      const collection = db.collection(collectionName);
      expect(collection).toBeDefined();
    }
  });
});

describe('MongoDB Error Handling', () => {
  it('should throw error when MONGODB_URI is missing', async () => {
    const originalUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;

    await expect(async () => {
      await closeConnection(); // Clear cached connection
      await connectToDatabase();
    }).rejects.toThrow('MONGODB_URI is not set');

    process.env.MONGODB_URI = originalUri;
  });
});
