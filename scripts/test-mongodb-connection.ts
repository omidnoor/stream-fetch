/**
 * MongoDB Connection Diagnostic Script
 *
 * Tests MongoDB connection with detailed error reporting
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { MongoClient } from 'mongodb';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'streamfetch';

  console.log('\n🔍 MongoDB Connection Diagnostic');
  console.log('═'.repeat(50));

  // Check environment variables
  console.log('\n1. Environment Variables:');
  console.log(`   ✓ MONGODB_URI: ${uri ? 'Set' : '✗ NOT SET'}`);
  console.log(`   ✓ MONGODB_DB_NAME: ${dbName}`);

  if (!uri) {
    console.error('\n❌ MONGODB_URI is not set!');
    process.exit(1);
  }

  // Parse connection string
  console.log('\n2. Connection String Details:');
  try {
    const url = new URL(uri);
    console.log(`   • Protocol: ${url.protocol}`);
    console.log(`   • Username: ${url.username || '(not specified)'}`);
    console.log(`   • Password: ${url.password ? '***' + url.password.slice(-4) : '(not specified)'}`);
    console.log(`   • Host: ${url.host}`);
    console.log(`   • Database: ${url.pathname.slice(1) || '(default)'}`);
  } catch (error) {
    console.error(`   ✗ Invalid connection string format`);
  }

  // Test connection
  console.log('\n3. Testing Connection:');
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  try {
    console.log('   • Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('   ✓ Connected successfully!');

    console.log('\n4. Database Operations:');
    const db = client.db(dbName);

    // Ping
    console.log('   • Pinging database...');
    await db.admin().ping();
    console.log('   ✓ Ping successful!');

    // List collections
    console.log('   • Listing collections...');
    const collections = await db.listCollections().toArray();
    console.log(`   ✓ Found ${collections.length} collections`);
    collections.forEach((col) => {
      console.log(`     - ${col.name}`);
    });

    console.log('\n✅ All checks passed! MongoDB connection is working.');

  } catch (error: any) {
    console.error('\n❌ Connection failed!');
    console.error('\nError Details:');
    console.error(`   Type: ${error.name}`);
    console.error(`   Message: ${error.message}`);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    if (error.codeName) {
      console.error(`   Code Name: ${error.codeName}`);
    }

    console.log('\n📋 Troubleshooting Steps:');

    if (error.code === 8000 || error.message.includes('bad auth')) {
      console.log('   This is an AUTHENTICATION error. Possible causes:');
      console.log('   1. Incorrect username or password');
      console.log('   2. User does not exist in MongoDB Atlas');
      console.log('   3. User does not have permissions for this database');
      console.log('\n   Solutions:');
      console.log('   • Go to MongoDB Atlas → Database Access');
      console.log('   • Verify user "onoorshams_db_user" exists');
      console.log('   • Click "Edit" and reset the password');
      console.log('   • Ensure role is "Atlas Admin" or "Read and write to any database"');
    }

    if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
      console.log('   This is a NETWORK error. Possible causes:');
      console.log('   1. IP address not whitelisted in MongoDB Atlas');
      console.log('   2. Network connectivity issues');
      console.log('\n   Solutions:');
      console.log('   • Go to MongoDB Atlas → Network Access');
      console.log('   • Add current IP or use 0.0.0.0/0 for testing');
    }

    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed.');
  }
}

testConnection().catch(console.error);
