/**
 * MongoDB Connection Utility
 *
 * Manages MongoDB connections with connection pooling and caching.
 * Optimized for Next.js serverless environment.
 */

import { MongoClient, Db, Collection, Document } from 'mongodb';

// Global connection cache for serverless environments
// This prevents creating new connections on every request
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

interface ConnectionOptions {
  maxPoolSize?: number;
  minPoolSize?: number;
  serverSelectionTimeoutMS?: number;
}

/**
 * Connect to MongoDB with connection pooling
 *
 * In serverless environments (like Vercel), connections are cached
 * to avoid creating new connections on every invocation.
 */
export async function connectToDatabase(options: ConnectionOptions = {}) {
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    try {
      // Ping to verify connection is still alive
      await cachedDb.admin().ping();
      return { client: cachedClient, db: cachedDb };
    } catch (error) {
      console.log('[MongoDB] Cached connection failed, reconnecting...');
      cachedClient = null;
      cachedDb = null;
    }
  }

  // Get connection details from environment
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'streamfetch';

  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  console.log('[MongoDB] Creating new connection...');

  // Create new connection
  const client = new MongoClient(uri, {
    maxPoolSize: options.maxPoolSize || 10,
    minPoolSize: options.minPoolSize || 2,
    serverSelectionTimeoutMS: options.serverSelectionTimeoutMS || 30000, // Increased from 5000ms to 30000ms
  });

  try {
    await client.connect();
    const db = client.db(dbName);

    // Test connection
    await db.admin().ping();
    console.log(`[MongoDB] Connected to database: ${dbName}`);

    // Cache the connection
    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    throw error;
  }
}

/**
 * Get the database instance
 *
 * Use this for most operations. It will use cached connection if available.
 */
export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

/**
 * Get a collection from the database
 *
 * @param collectionName Name of the collection
 * @returns MongoDB collection
 */
export async function getCollection<T extends Document = Document>(collectionName: string): Promise<Collection<T>> {
  const db = await getDatabase();
  return db.collection<T>(collectionName);
}

/**
 * Close database connection
 *
 * Mainly used for testing or graceful shutdown
 */
export async function closeConnection(): Promise<void> {
  if (cachedClient) {
    console.log('[MongoDB] Closing connection...');
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('[MongoDB] Connection closed');
  }
}

/**
 * Health check for database connection
 */
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.admin().ping();
    return true;
  } catch (error) {
    console.error('[MongoDB] Health check failed:', error);
    return false;
  }
}

/**
 * Collection names enum for type safety
 */
export const Collections = {
  AUTOMATION_JOBS: 'automation_jobs',
  VIDEO_PROJECTS: 'video_projects',
  PDF_PROJECTS: 'pdf_projects',
  ANNOTATIONS: 'annotations',
  DOWNLOAD_HISTORY: 'download_history',
} as const;

export type CollectionName = typeof Collections[keyof typeof Collections];
