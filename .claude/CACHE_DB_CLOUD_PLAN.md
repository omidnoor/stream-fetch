# Cache, Database, and Cloud Infrastructure Plan

## Executive Summary

This document outlines the implementation plan for migrating StreamFetch from in-memory storage to a production-ready architecture with MongoDB, caching, and cloud deployment.

**Current State:**
- ✅ MongoDB Atlas configured (`streamfetch` database)
- ⚠️ Multiple in-memory Map stores (non-persistent)
- ⚠️ File-based job storage (incompatible with serverless)
- ✅ Cache interface exists (memory-only implementation)
- ❌ No cloud file storage (using local filesystem)

**Target Architecture:**
- MongoDB for all persistent data
- Redis/Upstash for caching (or enhanced in-memory for now)
- Cloud storage (S3/Vercel Blob) for uploaded files and outputs
- Vercel deployment-ready

---

## 1. MongoDB Database Schema

### 1.1 Collections Overview

```
streamfetch (database)
├── automation_jobs      // Automation pipeline jobs
├── video_projects       // Video editor projects
├── pdf_projects         // PDF editor projects
├── annotations          // PDF annotations (separate collection for queries)
├── download_history     // User download tracking
├── cache_metadata       // Cache metadata (optional)
└── user_settings        // User preferences (future)
```

### 1.2 Collection Schemas

#### `automation_jobs` Collection

**Purpose:** Store automation pipeline jobs (currently in `temp/automation/jobs/*.json`)

**Schema:**
```typescript
{
  _id: ObjectId,
  id: string,                    // UUID job ID (indexed)
  status: JobStatus,             // 'pending' | 'downloading' | 'dubbing' | etc.
  createdAt: Date,               // Indexed for sorting
  updatedAt: Date,

  // Input
  youtubeUrl: string,
  videoInfo: {
    title: string,
    duration: number,            // seconds
    thumbnail: string,
    resolution: string,
    codec: string,
    fileSize?: number
  },

  // Configuration
  config: {
    chunkDuration: number,       // 30, 60, 120, 300
    targetLanguage: string,      // 'es', 'fr', 'de'
    maxParallelJobs: number,     // 1-5
    videoQuality: string,        // '1080p', '720p'
    outputFormat: 'mp4' | 'webm',
    useWatermark: boolean,
    keepIntermediateFiles: boolean,
    chunkingStrategy: 'fixed' | 'scene' | 'silence'
  },

  // Progress tracking
  progress: {
    stage: 'download' | 'chunk' | 'dub' | 'merge' | 'finalize',
    overallPercent: number,
    startedAt: Date,
    estimatedCompletion?: Date,

    download?: {
      percent: number,
      bytesDownloaded: number,
      totalBytes: number,
      speed: string,
      eta: number
    },

    chunking?: {
      totalChunks: number,
      processed: number,
      currentChunk?: string
    },

    dubbing?: {
      chunks: [{
        index: number,
        filename: string,
        status: 'pending' | 'uploading' | 'processing' | 'complete' | 'failed' | 'retrying',
        dubbingJobId?: string,
        startedAt?: Date,
        completedAt?: Date,
        error?: string,
        retryCount: number
      }],
      activeJobs: number,
      completed: number,
      failed: number,
      pending: number
    },

    merging?: {
      percent: number,
      currentStep: 'replacing_audio' | 'concatenating' | 'finalizing',
      chunksProcessed: number,
      totalChunks: number
    },

    logs: [{
      timestamp: Date,
      level: 'info' | 'warn' | 'error' | 'debug',
      stage: string,
      message: string,
      metadata?: object
    }]
  },

  // File paths (will be cloud storage URLs)
  paths: {
    root: string,                // Cloud storage base path
    source: string,
    chunks: string,
    dubbed: string,
    output: string
  },

  // Output
  outputFile?: string,           // Cloud storage URL
  error?: {
    code: string,
    message: string,
    stage: string,
    recoverable: boolean,
    failedChunks?: number[],
    details?: object
  }
}
```

**Indexes:**
```javascript
db.automation_jobs.createIndex({ id: 1 }, { unique: true })
db.automation_jobs.createIndex({ status: 1, createdAt: -1 })
db.automation_jobs.createIndex({ createdAt: -1 })
db.automation_jobs.createIndex({ updatedAt: -1 })
```

---

#### `video_projects` Collection

**Purpose:** Store video editor projects (currently in-memory Map)

**Schema:**
```typescript
{
  _id: ObjectId,
  id: string,                    // UUID project ID (indexed)
  name: string,
  description?: string,
  userId?: string,               // For future multi-user support (indexed)
  thumbnail?: string,            // Cloud storage URL

  timeline: {
    clips: [{
      id: string,
      sourceUrl: string,         // Cloud storage URL or YouTube URL
      startTime: number,
      endTime: number,
      duration: number,
      position: number,
      layer: number,
      volume: number,
      muted: boolean,
      effects: [{
        id: string,
        type: 'brightness' | 'contrast' | 'blur' | etc.,
        parameters: object,
        startTime?: number,
        endTime?: number
      }]
    }],

    audioTracks: [{
      id: string,
      sourceUrl: string,         // Cloud storage URL
      startTime: number,
      endTime: number,
      duration: number,
      position: number,
      volume: number,
      muted: boolean,
      fadeIn?: number,
      fadeOut?: number
    }],

    textOverlays: [{
      id: string,
      text: string,
      startTime: number,
      endTime: number,
      position: { x: number, y: number },
      style: {
        fontFamily: string,
        fontSize: number,
        color: string,
        backgroundColor?: string,
        opacity: number,
        bold: boolean,
        italic: boolean,
        underline: boolean
      },
      animation?: {
        fadeIn?: number,
        fadeOut?: number
      }
    }],

    transitions: [{
      id: string,
      type: 'fade' | 'dissolve' | 'wipe' | 'slide' | 'none',
      duration: number,
      position: number
    }],

    duration: number             // Total timeline duration
  },

  settings: {
    resolution: {
      width: number,
      height: number
    },
    frameRate: number,
    backgroundColor?: string,
    audioSampleRate?: number
  },

  status: 'draft' | 'processing' | 'completed' | 'failed',
  progress?: number,             // 0-100
  error?: string,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.video_projects.createIndex({ id: 1 }, { unique: true })
db.video_projects.createIndex({ userId: 1, createdAt: -1 })
db.video_projects.createIndex({ status: 1 })
db.video_projects.createIndex({ createdAt: -1 })
```

---

#### `pdf_projects` Collection

**Purpose:** Store PDF editor projects (currently in-memory Map)

**Schema:**
```typescript
{
  _id: ObjectId,
  id: string,                    // UUID project ID (indexed)
  name: string,
  status: 'draft' | 'processing' | 'completed' | 'failed',

  originalFile: string,          // Cloud storage URL
  currentFile?: string,          // Cloud storage URL
  fileData?: string,             // Base64 PDF data (consider moving to cloud storage)

  metadata: {
    title?: string,
    author?: string,
    subject?: string,
    keywords?: string,
    creator?: string,
    producer?: string,
    creationDate?: Date,
    modificationDate?: Date,
    pageCount: number,
    fileSize: number,
    version?: string
  },

  pages: [{
    pageNumber: number,
    width: number,
    height: number,
    rotation: number,
    thumbnail?: string,          // Cloud storage URL
    annotations: string[]        // Array of annotation IDs
  }],

  settings: {
    defaultFontFamily: string,
    defaultFontSize: number,
    defaultColor: string,
    defaultStrokeWidth: number,
    autoSave: boolean,
    autoSaveInterval: number
  },

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.pdf_projects.createIndex({ id: 1 }, { unique: true })
db.pdf_projects.createIndex({ status: 1 })
db.pdf_projects.createIndex({ createdAt: -1 })
```

---

#### `annotations` Collection

**Purpose:** Store PDF annotations separately for efficient querying

**Why Separate Collection?**
- Annotations can be queried independently (get all annotations for a page)
- Better performance for large PDFs with many annotations
- Easier to manage annotation updates without loading entire project

**Schema:**
```typescript
{
  _id: ObjectId,
  id: string,                    // UUID annotation ID (indexed)
  projectId: string,             // Reference to pdf_projects (indexed)
  type: 'text' | 'highlight' | 'drawing' | 'shape' | 'image',
  pageNumber: number,            // Indexed for page queries

  // Position and dimensions
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  opacity: number,

  // Type-specific properties (discriminated union)
  // Text annotation
  content?: string,
  fontFamily?: string,
  fontSize?: number,
  fontWeight?: 'normal' | 'bold',
  fontStyle?: 'normal' | 'italic',
  textAlign?: 'left' | 'center' | 'right',
  color?: string,
  backgroundColor?: string,

  // Drawing annotation
  points?: [{ x: number, y: number }],
  strokeColor?: string,
  strokeWidth?: number,
  fillColor?: string,

  // Shape annotation
  shapeType?: 'rectangle' | 'circle' | 'line' | 'arrow' | 'polygon',

  // Image annotation
  imageData?: string,            // Base64 or cloud storage URL
  imageType?: 'png' | 'jpg' | 'jpeg',

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.annotations.createIndex({ id: 1 }, { unique: true })
db.annotations.createIndex({ projectId: 1, pageNumber: 1 })
db.annotations.createIndex({ projectId: 1, createdAt: -1 })
db.annotations.createIndex({ type: 1 })
```

---

#### `download_history` Collection

**Purpose:** Track download history and analytics (new feature)

**Schema:**
```typescript
{
  _id: ObjectId,
  id: string,                    // UUID

  videoId: string,               // YouTube video ID (indexed)
  videoTitle: string,
  videoUrl: string,

  format: {
    itag: number,
    quality: string,
    container: string,
    filesize: number
  },

  timestamp: Date,               // Indexed for time-based queries
  userId?: string,               // For future multi-user support

  // Analytics
  downloadDuration?: number,     // milliseconds
  success: boolean,
  error?: string
}
```

**Indexes:**
```javascript
db.download_history.createIndex({ id: 1 }, { unique: true })
db.download_history.createIndex({ videoId: 1, timestamp: -1 })
db.download_history.createIndex({ userId: 1, timestamp: -1 })
db.download_history.createIndex({ timestamp: -1 })
```

---

## 2. Cache Strategy

### 2.1 Cache Architecture

**Current State:**
- ✅ Cache interface defined (`CacheService`)
- ✅ In-memory implementation (`MemoryCache`)
- ❌ No Redis implementation yet

**Recommended Approach:**

#### Option A: Keep In-Memory Cache (Short Term)
**Pros:**
- Already working
- Zero additional cost
- No external dependencies
- Good for development

**Cons:**
- Lost on server restart
- Not shared across serverless instances
- Limited memory on Vercel (512MB-1GB)

#### Option B: Add Redis/Upstash (Production)
**Pros:**
- Persistent across restarts
- Shared cache across instances
- Better performance at scale
- Pattern invalidation support

**Cons:**
- Additional service to manage
- Cost (Upstash free tier: 10k requests/day)
- Slightly increased latency

**Recommendation:** Start with in-memory, migrate to Redis/Upstash when deploying to production.

### 2.2 What to Cache

| Data Type | Cache? | TTL | Why |
|-----------|--------|-----|-----|
| YouTube video metadata | ✅ Yes | 1 hour | Expensive API calls, data rarely changes |
| YouTube format URLs | ✅ Yes | 15 min | URLs expire, but short cache helps |
| Automation job status | ❌ No | - | Real-time updates needed |
| Video projects | ❌ No | - | Always fetch from DB for consistency |
| PDF projects | ❌ No | - | Always fetch from DB for consistency |
| Download history | ❌ No | - | Not queried frequently enough |

### 2.3 Cache Implementation

**Current Cache Keys:**
```
video:{videoId}            // Video metadata (1 hour TTL)
format:{videoId}:{itag}    // Format URLs (15 min TTL)
```

**Enhanced Cache Keys (future):**
```
video:{videoId}            // Video info
video:{videoId}:thumbnail  // Video thumbnail
stats:downloads:daily      // Daily download count
stats:popular:videos       // Most downloaded videos (1 hour TTL)
```

### 2.4 Upstash Redis Setup (When Ready)

**Dependencies:**
```bash
npm install @upstash/redis
```

**Environment Variables:**
```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

**Implementation:**
```typescript
// src/lib/cache/redis.cache.ts
import { Redis } from '@upstash/redis'
import { CacheService } from './cache.interface'

export class RedisCache implements CacheService {
  private redis: Redis

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }

  async get<T>(key: string): Promise<T | null> {
    return await this.redis.get<T>(key)
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value))
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async has(key: string): Promise<boolean> {
    const exists = await this.redis.exists(key)
    return exists === 1
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Upstash doesn't support SCAN, use key prefix list
    // Implement based on your key naming strategy
  }
}
```

**Factory Update:**
```typescript
// src/lib/cache/cache.factory.ts
export function getCacheService(): CacheService {
  const useRedis = process.env.UPSTASH_REDIS_REST_URL &&
                   process.env.UPSTASH_REDIS_REST_TOKEN

  if (useRedis) {
    return new RedisCache()
  }

  return new MemoryCache()
}
```

---

## 3. Cloud File Storage Strategy

### 3.1 Files Requiring Storage

| File Type | Current Location | Size | Retention |
|-----------|-----------------|------|-----------|
| Uploaded videos | `.cache/editor/temp/` | Up to 500MB | Until project deleted |
| Rendered videos | `.cache/editor/output/` | Up to 1GB | 30 days |
| Uploaded PDFs | In-memory base64 | Up to 50MB | Until project deleted |
| Automation chunks | `temp/automation/{jobId}/chunks/` | 10-100MB each | Until job complete |
| Automation output | `temp/automation/{jobId}/output/` | Up to 2GB | 30 days |
| Video thumbnails | Embedded in response | < 100KB | Cache only |

**Total Storage Needs:** ~10-50GB per month (estimated)

### 3.2 Cloud Storage Options

#### Option A: Vercel Blob Storage
**Pricing:**
- Free: 500MB storage, 1GB bandwidth
- Pro: 100GB storage ($0.15/GB), unlimited bandwidth

**Pros:**
- Native Vercel integration
- Simple API
- CDN-backed
- Automatic HTTPS

**Cons:**
- Vercel lock-in
- More expensive at scale
- Limited to Vercel deployments

**Setup:**
```bash
npm install @vercel/blob
```

```typescript
import { put, del, list } from '@vercel/blob'

// Upload file
const blob = await put('automation/job123/output.mp4', file, {
  access: 'public',
  contentType: 'video/mp4',
})
// blob.url = 'https://...'

// Delete file
await del(blob.url)
```

#### Option B: AWS S3
**Pricing:**
- Free tier: 5GB storage, 20k GET, 2k PUT
- After: $0.023/GB storage, $0.09/GB transfer

**Pros:**
- Industry standard
- Cheapest at scale
- Extremely reliable
- Works with any deployment

**Cons:**
- More complex setup
- Requires AWS account
- IAM permissions needed

**Setup:**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({ region: 'us-east-1' })

// Upload file
await s3.send(new PutObjectCommand({
  Bucket: 'streamfetch-storage',
  Key: 'automation/job123/output.mp4',
  Body: fileBuffer,
  ContentType: 'video/mp4',
}))
```

#### Option C: Cloudflare R2
**Pricing:**
- Free: 10GB storage, 1M reads, 1M writes
- After: $0.015/GB storage, NO egress fees

**Pros:**
- Zero egress costs (huge savings)
- S3-compatible API
- CDN integration
- Better free tier than S3

**Cons:**
- Relatively new service
- Requires Cloudflare account

**Recommendation:**
- **Development:** Local filesystem or Vercel Blob
- **Production:** Cloudflare R2 (best pricing) or AWS S3 (most reliable)

### 3.3 File Storage Service Implementation

**Interface:**
```typescript
// src/lib/storage/storage.interface.ts
export interface StorageService {
  upload(path: string, file: Buffer, contentType: string): Promise<string>
  download(url: string): Promise<Buffer>
  delete(url: string): Promise<void>
  exists(url: string): Promise<boolean>
  getSignedUrl(url: string, expiresIn: number): Promise<string>
}
```

**Factory:**
```typescript
// src/lib/storage/storage.factory.ts
export function getStorageService(): StorageService {
  const provider = process.env.STORAGE_PROVIDER || 'local'

  switch (provider) {
    case 'vercel':
      return new VercelBlobStorage()
    case 's3':
      return new S3Storage()
    case 'r2':
      return new CloudflareR2Storage()
    default:
      return new LocalFileStorage()
  }
}
```

---

## 4. MongoDB Integration Plan

### 4.1 Install Dependencies

```bash
npm install mongodb
npm install -D @types/mongodb
```

### 4.2 Database Connection

**Create:** `src/lib/database/mongodb.ts`

```typescript
import { MongoClient, Db } from 'mongodb'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const uri = process.env.MONGODB_URI!
  const dbName = process.env.MONGODB_DB_NAME || 'streamfetch'

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
  })

  await client.connect()
  const db = client.db(dbName)

  cachedClient = client
  cachedDb = db

  return { client, db }
}

export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase()
  return db
}
```

### 4.3 Repository Pattern Updates

Each repository needs to be updated from in-memory Map to MongoDB.

**Example: Automation Job Repository**

**Create:** `src/lib/database/repositories/automation-job.repository.ts`

```typescript
import { Collection, ObjectId } from 'mongodb'
import { getDatabase } from '../mongodb'
import { AutomationJob } from '@/services/automation/automation.types'

export class AutomationJobRepository {
  private async getCollection(): Promise<Collection<AutomationJob>> {
    const db = await getDatabase()
    return db.collection<AutomationJob>('automation_jobs')
  }

  async create(job: AutomationJob): Promise<void> {
    const collection = await this.getCollection()
    await collection.insertOne(job as any)
  }

  async get(jobId: string): Promise<AutomationJob | null> {
    const collection = await this.getCollection()
    return await collection.findOne({ id: jobId } as any) as AutomationJob | null
  }

  async update(jobId: string, updates: Partial<AutomationJob>): Promise<void> {
    const collection = await this.getCollection()
    await collection.updateOne(
      { id: jobId } as any,
      { $set: { ...updates, updatedAt: new Date() } }
    )
  }

  async delete(jobId: string): Promise<void> {
    const collection = await this.getCollection()
    await collection.deleteOne({ id: jobId } as any)
  }

  async list(filter?: { status?: string; limit?: number; offset?: number }): Promise<AutomationJob[]> {
    const collection = await this.getCollection()

    let query: any = {}
    if (filter?.status) {
      query.status = filter.status
    }

    const cursor = collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(filter?.offset || 0)
      .limit(filter?.limit || 10)

    return await cursor.toArray() as AutomationJob[]
  }

  async count(filter?: { status?: string }): Promise<number> {
    const collection = await this.getCollection()

    let query: any = {}
    if (filter?.status) {
      query.status = filter.status
    }

    return await collection.countDocuments(query)
  }

  async updateProgress(jobId: string, progress: any): Promise<void> {
    await this.update(jobId, { progress })
  }

  async addLog(jobId: string, log: any): Promise<void> {
    const collection = await this.getCollection()

    // Use $push to append to logs array
    await collection.updateOne(
      { id: jobId } as any,
      {
        $push: {
          'progress.logs': {
            $each: [log],
            $slice: -1000  // Keep only last 1000 logs
          }
        },
        $set: { updatedAt: new Date() }
      }
    )
  }
}

// Singleton export
let instance: AutomationJobRepository | null = null

export function getAutomationJobRepository(): AutomationJobRepository {
  if (!instance) {
    instance = new AutomationJobRepository()
  }
  return instance
}
```

### 4.4 Migration Script

**Create:** `scripts/migrate-to-mongodb.ts`

```typescript
/**
 * One-time migration script to move file-based jobs to MongoDB
 */
import fs from 'fs/promises'
import path from 'path'
import { getAutomationJobRepository } from '@/lib/database/repositories/automation-job.repository'

async function migrateJobs() {
  const jobsDir = path.join(process.cwd(), 'temp', 'automation', 'jobs')
  const repository = getAutomationJobRepository()

  try {
    const files = await fs.readdir(jobsDir)
    const jobFiles = files.filter(f => f.endsWith('.json'))

    console.log(`Found ${jobFiles.length} jobs to migrate`)

    for (const file of jobFiles) {
      const filePath = path.join(jobsDir, file)
      const data = await fs.readFile(filePath, 'utf-8')
      const job = JSON.parse(data)

      // Convert date strings to Date objects
      job.createdAt = new Date(job.createdAt)
      job.updatedAt = new Date(job.updatedAt)
      job.progress.startedAt = new Date(job.progress.startedAt)
      if (job.progress.estimatedCompletion) {
        job.progress.estimatedCompletion = new Date(job.progress.estimatedCompletion)
      }
      job.progress.logs = job.progress.logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }))

      await repository.create(job)
      console.log(`✓ Migrated job: ${job.id}`)
    }

    console.log('Migration complete!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrateJobs()
```

**Run migration:**
```bash
npx tsx scripts/migrate-to-mongodb.ts
```

### 4.5 Create Indexes

**Create:** `scripts/create-indexes.ts`

```typescript
import { getDatabase } from '@/lib/database/mongodb'

async function createIndexes() {
  const db = await getDatabase()

  // Automation jobs indexes
  await db.collection('automation_jobs').createIndex({ id: 1 }, { unique: true })
  await db.collection('automation_jobs').createIndex({ status: 1, createdAt: -1 })
  await db.collection('automation_jobs').createIndex({ createdAt: -1 })
  await db.collection('automation_jobs').createIndex({ updatedAt: -1 })

  // Video projects indexes
  await db.collection('video_projects').createIndex({ id: 1 }, { unique: true })
  await db.collection('video_projects').createIndex({ userId: 1, createdAt: -1 })
  await db.collection('video_projects').createIndex({ status: 1 })
  await db.collection('video_projects').createIndex({ createdAt: -1 })

  // PDF projects indexes
  await db.collection('pdf_projects').createIndex({ id: 1 }, { unique: true })
  await db.collection('pdf_projects').createIndex({ status: 1 })
  await db.collection('pdf_projects').createIndex({ createdAt: -1 })

  // Annotations indexes
  await db.collection('annotations').createIndex({ id: 1 }, { unique: true })
  await db.collection('annotations').createIndex({ projectId: 1, pageNumber: 1 })
  await db.collection('annotations').createIndex({ projectId: 1, createdAt: -1 })
  await db.collection('annotations').createIndex({ type: 1 })

  // Download history indexes
  await db.collection('download_history').createIndex({ id: 1 }, { unique: true })
  await db.collection('download_history').createIndex({ videoId: 1, timestamp: -1 })
  await db.collection('download_history').createIndex({ timestamp: -1 })

  console.log('✓ All indexes created successfully')
}

createIndexes()
```

---

## 5. Deployment Strategy

### 5.1 Vercel Deployment

**Why Vercel?**
- Native Next.js support
- Zero-config deployments
- Edge functions
- Preview deployments
- Free tier generous

**Limitations:**
- Serverless functions (10s timeout on free tier, 60s on pro)
- Max request size: 4.5MB (can be issue for uploads)
- Max response size: 4.5MB body + 5MB streaming
- Cold starts

**Configuration:**

**Create:** `vercel.json`
```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 60
    },
    "src/app/api/download/route.ts": {
      "maxDuration": 300
    },
    "src/app/api/automation/stream/[jobId]/route.ts": {
      "maxDuration": 300
    }
  },
  "env": {
    "MONGODB_URI": "@mongodb-uri",
    "MONGODB_DB_NAME": "@mongodb-db-name",
    "ELEVENLABS_API_KEY": "@elevenlabs-api-key"
  }
}
```

**Environment Variables:**
```bash
vercel env add MONGODB_URI production
vercel env add MONGODB_DB_NAME production
vercel env add ELEVENLABS_API_KEY production
vercel env add STORAGE_PROVIDER production  # 'vercel' | 's3' | 'r2'
```

### 5.2 Alternative: Self-Hosted (VPS/Docker)

**When to Use:**
- Need longer execution times (automation can take 30+ minutes)
- Want full control
- Cost optimization at scale

**Docker Setup:**

**Create:** `Dockerfile`
```dockerfile
FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Create:** `docker-compose.yml`
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - MONGODB_DB_NAME=${MONGODB_DB_NAME}
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
      - STORAGE_PROVIDER=s3
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_REGION=us-east-1
      - AWS_S3_BUCKET=streamfetch-storage
    volumes:
      - ./temp:/app/temp
    restart: unless-stopped
```

---

## 6. Implementation Phases

### Phase 1: MongoDB Integration (Week 1)
**Goal:** Replace in-memory storage with MongoDB

**Tasks:**
1. ✅ Set up MongoDB connection utilities
2. ✅ Create repository classes for all collections
3. ✅ Update `JobStore` to use MongoDB instead of files
4. ✅ Update `EditorRepository` to use MongoDB
5. ✅ Update `PDFRepository` to use MongoDB
6. ✅ Create and run index creation script
7. ✅ Test all CRUD operations
8. ✅ Migrate existing file-based jobs (if any)

**Files to Create/Modify:**
- `src/lib/database/mongodb.ts` (NEW)
- `src/lib/database/repositories/automation-job.repository.ts` (NEW)
- `src/lib/database/repositories/video-project.repository.ts` (NEW)
- `src/lib/database/repositories/pdf-project.repository.ts` (NEW)
- `src/lib/database/repositories/annotation.repository.ts` (NEW)
- `src/lib/automation/job-store.ts` (MODIFY)
- `src/services/editor/editor.repository.ts` (MODIFY)
- `src/services/pdf/pdf.repository.ts` (MODIFY)
- `scripts/create-indexes.ts` (NEW)
- `scripts/migrate-to-mongodb.ts` (NEW)

**Success Criteria:**
- All data persists across server restarts
- No in-memory Maps remain (except cache)
- All tests pass

---

### Phase 2: Cloud File Storage (Week 2)
**Goal:** Move uploaded files and outputs to cloud storage

**Tasks:**
1. ✅ Choose storage provider (Vercel Blob, S3, or R2)
2. ✅ Create storage service interface and implementations
3. ✅ Update file upload handlers to use cloud storage
4. ✅ Update automation service to store files in cloud
5. ✅ Update editor service to store files in cloud
6. ✅ Update PDF service to store files in cloud
7. ✅ Add file cleanup jobs (delete old files after 30 days)
8. ✅ Update all file path references to use URLs

**Files to Create/Modify:**
- `src/lib/storage/storage.interface.ts` (NEW)
- `src/lib/storage/storage.factory.ts` (NEW)
- `src/lib/storage/vercel-blob.storage.ts` (NEW)
- `src/lib/storage/s3.storage.ts` (NEW)
- `src/lib/storage/local.storage.ts` (NEW)
- `src/services/automation/automation.service.ts` (MODIFY)
- `src/services/editor/editor.repository.ts` (MODIFY)
- `src/services/pdf/pdf.repository.ts` (MODIFY)
- All API routes handling file uploads (MODIFY)

**Success Criteria:**
- No files stored locally
- Files accessible via HTTPS URLs
- Uploads work seamlessly
- Downloads work from cloud storage

---

### Phase 3: Enhanced Caching (Week 3 - Optional)
**Goal:** Add Redis caching for production

**Tasks:**
1. ✅ Set up Upstash Redis account
2. ✅ Create Redis cache implementation
3. ✅ Update cache factory to support Redis
4. ✅ Add cache warming strategies
5. ✅ Implement cache invalidation patterns
6. ✅ Add cache hit/miss metrics

**Files to Create/Modify:**
- `src/lib/cache/redis.cache.ts` (NEW)
- `src/lib/cache/cache.factory.ts` (MODIFY)
- `src/services/youtube/youtube.service.ts` (MODIFY - add more caching)

**Success Criteria:**
- Redis working in production
- Cache hit rate > 80% for video metadata
- Response times improved

---

### Phase 4: Vercel Deployment (Week 4)
**Goal:** Deploy to Vercel with all integrations

**Tasks:**
1. ✅ Create Vercel project
2. ✅ Configure environment variables
3. ✅ Set up custom domain (optional)
4. ✅ Configure function timeouts
5. ✅ Test all features in production
6. ✅ Set up monitoring and error tracking
7. ✅ Create deployment documentation

**Files to Create/Modify:**
- `vercel.json` (NEW)
- `.env.production` (NEW)
- `README.md` (UPDATE deployment section)

**Success Criteria:**
- Application deployed and accessible
- All features working in production
- MongoDB connected
- File uploads working
- Automation pipeline functional

---

### Phase 5: Optimization & Monitoring (Ongoing)
**Goal:** Monitor and optimize performance

**Tasks:**
1. ✅ Add application metrics
2. ✅ Monitor database performance
3. ✅ Optimize slow queries
4. ✅ Add error tracking (Sentry)
5. ✅ Set up uptime monitoring
6. ✅ Create backup strategy
7. ✅ Document disaster recovery plan

**Success Criteria:**
- <200ms API response times
- >99% uptime
- All errors tracked and alerted
- Automated backups running

---

## 7. Environment Variables Checklist

**Required for Production:**

```env
# MongoDB
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=streamfetch

# ElevenLabs
ELEVENLABS_API_KEY=sk_...

# Storage (choose one)
STORAGE_PROVIDER=vercel|s3|r2

# Vercel Blob (if STORAGE_PROVIDER=vercel)
BLOB_READ_WRITE_TOKEN=...

# AWS S3 (if STORAGE_PROVIDER=s3)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=streamfetch-storage

# Cloudflare R2 (if STORAGE_PROVIDER=r2)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=streamfetch-storage

# Redis Cache (optional)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Node Environment
NODE_ENV=production
```

---

## 8. Cost Estimation

### Monthly Costs (Estimated)

**Free Tier (Development/Small Scale):**
- MongoDB Atlas: $0 (512MB free tier)
- Vercel Hosting: $0 (free tier)
- Vercel Blob: $0 (500MB storage, 1GB bandwidth)
- Upstash Redis: $0 (10k requests/day)
- **Total: $0/month**

**Paid Tier (Production/Medium Scale):**
- MongoDB Atlas M10: $57/month (2GB RAM, 10GB storage)
- Vercel Pro: $20/month (unlimited bandwidth)
- Cloudflare R2: ~$5/month (100GB storage, no egress)
- Upstash Redis: $10/month (pro tier)
- ElevenLabs API: Variable (based on dubbing usage)
- **Total: ~$92/month + ElevenLabs usage**

**Self-Hosted Alternative:**
- VPS (Hetzner): €4.51/month (2 vCPU, 4GB RAM)
- MongoDB Atlas M0: $0 (free tier)
- Cloudflare R2: ~$5/month
- **Total: ~$10/month + ElevenLabs usage**

---

## 9. Success Metrics

**Performance:**
- [ ] API response time < 200ms (95th percentile)
- [ ] Cache hit rate > 80%
- [ ] Database query time < 50ms (average)
- [ ] File upload success rate > 99%

**Reliability:**
- [ ] Uptime > 99.9%
- [ ] Zero data loss
- [ ] Backup recovery time < 1 hour
- [ ] Error rate < 0.1%

**Scale:**
- [ ] Support 1000+ concurrent users
- [ ] Handle 10k+ automation jobs/month
- [ ] Store 100GB+ files
- [ ] Process 1M+ API requests/month

---

## 10. Next Steps

1. **Review this plan** and confirm architecture decisions
2. **Set up MongoDB collections** and indexes
3. **Implement MongoDB repositories** (Phase 1)
4. **Choose cloud storage provider** and set up
5. **Test locally** with all integrations
6. **Deploy to Vercel** staging environment
7. **Load test** and optimize
8. **Go live** 🚀

---

## Appendix: Useful Commands

**MongoDB:**
```bash
# Connect to MongoDB
mongosh "mongodb+srv://cluster0.ojuwmvj.mongodb.net/" --username onoorshams_db_user

# List databases
show dbs

# Use database
use streamfetch

# List collections
show collections

# Query jobs
db.automation_jobs.find().limit(5)

# Create index
db.automation_jobs.createIndex({ id: 1 }, { unique: true })
```

**Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# View logs
vercel logs

# Environment variables
vercel env add MONGODB_URI production
```

**Docker:**
```bash
# Build image
docker build -t streamfetch .

# Run container
docker run -p 3000:3000 --env-file .env.local streamfetch

# Docker Compose
docker-compose up -d
docker-compose logs -f
docker-compose down
```
