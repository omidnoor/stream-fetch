/**
 * Authentication Helper Functions
 *
 * Handles user CRUD operations and password management
 * using the existing MongoDB connection.
 */

import bcrypt from 'bcryptjs';
import { getCollection } from './database/mongodb';
import { ObjectId } from 'mongodb';

// User interface
export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

// Collection name
const USERS_COLLECTION = 'users';

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const collection = await getCollection<User>(USERS_COLLECTION);
  return collection.findOne({ email: email.toLowerCase() });
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const collection = await getCollection<User>(USERS_COLLECTION);
  return collection.findOne({ _id: new ObjectId(id) });
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<User> {
  const collection = await getCollection<User>(USERS_COLLECTION);

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  const now = new Date();
  const user: Omit<User, '_id'> = {
    email: email.toLowerCase(),
    name,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(user as User);

  return {
    ...user,
    _id: result.insertedId,
  } as User;
}

/**
 * Update user password
 */
export async function updateUserPassword(
  userId: string,
  newPassword: string
): Promise<boolean> {
  const collection = await getCollection<User>(USERS_COLLECTION);
  const passwordHash = await hashPassword(newPassword);

  const result = await collection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        passwordHash,
        updatedAt: new Date(),
      },
    }
  );

  return result.modifiedCount > 0;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create indexes for the users collection
 */
export async function createUserIndexes(): Promise<void> {
  const collection = await getCollection<User>(USERS_COLLECTION);
  await collection.createIndex({ email: 1 }, { unique: true });
}
