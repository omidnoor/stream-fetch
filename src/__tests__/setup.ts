/**
 * Jest Test Setup
 *
 * This file is run before each test file.
 */

import { jest, expect } from '@jest/globals';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local for testing
config({ path: resolve(process.cwd(), '.env.local') });

// Verify required environment variables
if (!process.env.MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI not set - MongoDB tests may fail');
}

// Extend Jest matchers if needed
expect.extend({});

// Global test timeout (30 seconds for database operations)
jest.setTimeout(30000);

// Make jest available globally for mocks
(globalThis as any).jest = jest;

console.log('🔧 Test environment configured');
console.log(`   MongoDB URI: ${process.env.MONGODB_URI ? '✓ Set' : '✗ Not set'}`);
console.log(`   MongoDB DB: ${process.env.MONGODB_DB_NAME || 'streamfetch (default)'}`);

