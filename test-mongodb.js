import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'streamfetch';

console.log('Testing MongoDB connection...');
console.log('URI:', uri?.substring(0, 30) + '...');
console.log('DB Name:', dbName);
console.log('\nAttempting connection...');

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
});

try {
  await client.connect();
  console.log('✓ Connected to MongoDB');

  const db = client.db(dbName);
  await db.admin().ping();
  console.log('✓ Ping successful');

  const collections = await db.listCollections().toArray();
  console.log('✓ Collections:', collections.map(c => c.name));

  await client.close();
  console.log('✓ Connection closed');
  process.exit(0);
} catch (error) {
  console.error('✗ Connection failed:', error.message);
  console.error('\nPossible causes:');
  console.error('1. MongoDB Atlas cluster is paused');
  console.error('2. IP address not whitelisted (allow 0.0.0.0/0 for testing)');
  console.error('3. Invalid credentials');
  console.error('4. Network/firewall blocking connection');
  process.exit(1);
}
