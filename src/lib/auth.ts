import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { statements, type User } from './db.js';

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create a new user
export async function createUser(email: string, password: string, username?: string): Promise<User> {
  const passwordHash = await hashPassword(password);
  
  try {
    const result = statements.createUser.run(email, passwordHash, username || null);
    const newUser = statements.getUserById.get(result.lastInsertRowid as number) as User;
    return newUser;
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new Error('User with this email already exists');
    }
    throw error;
  }
}

// Authenticate user
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = statements.getUserByEmail.get(email) as User | undefined;
  
  if (!user) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.password_hash);
  return isValid ? user : null;
}

// Generate guest session
export function createGuestSession(): string {
  const sessionId = randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days
  
  statements.createGuestSession.run(sessionId, expiresAt.toISOString());
  return sessionId;
}

// Validate guest session
export function validateGuestSession(sessionId: string): boolean {
  const session = statements.getGuestSession.get(sessionId);
  return !!session;
}

// Clean up expired guest sessions (should be run periodically)
export function cleanupExpiredGuestSessions(): void {
  statements.deleteExpiredGuestSessions.run();
}

// Get user by ID
export function getUserById(id: number): User | null {
  return statements.getUserById.get(id) as User | null;
}

// Update user
export function updateUser(id: number, email: string, username?: string): void {
  statements.updateUser.run(email, username || null, id);
}

// Delete user
export function deleteUser(id: number): void {
  statements.deleteUser.run(id);
}