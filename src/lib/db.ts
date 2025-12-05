import Database from 'better-sqlite3';
import { dev } from '$app/environment';

// Initialize database
const db = new Database(dev ? 'app.db' : 'app_prod.db', { verbose: dev ? console.log : undefined });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// User table schema
const createUserTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT,
    is_guest BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

// Guest sessions table (for guest users)
const createGuestSessionTable = `
  CREATE TABLE IF NOT EXISTS guest_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
  )
`;

// Initialize tables
db.exec(createUserTable);
db.exec(createGuestSessionTable);

// Pantry items per user
const createPantryItemsTable = `
  CREATE TABLE IF NOT EXISTS pantry_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ingredient TEXT NOT NULL,
    thumb TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`;
db.exec(createPantryItemsTable);

// Prepared statements for better performance
export const statements = {
  // User operations
  createUser: db.prepare(`
    INSERT INTO users (email, password_hash, username)
    VALUES (?, ?, ?)
  `),
  
  getUserByEmail: db.prepare(`
    SELECT * FROM users WHERE email = ?
  `),
  
  getUserById: db.prepare(`
    SELECT * FROM users WHERE id = ?
  `),
  
  updateUser: db.prepare(`
    UPDATE users 
    SET email = ?, username = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),

  updatePassword: db.prepare(`
    UPDATE users
    SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `),
  
  deleteUser: db.prepare(`
    DELETE FROM users WHERE id = ?
  `),
  
  // Guest session operations
  createGuestSession: db.prepare(`
    INSERT INTO guest_sessions (session_id, expires_at)
    VALUES (?, ?)
  `),
  
  getGuestSession: db.prepare(`
    SELECT * FROM guest_sessions 
    WHERE session_id = ? AND expires_at > CURRENT_TIMESTAMP
  `),
  
  deleteExpiredGuestSessions: db.prepare(`
    DELETE FROM guest_sessions 
    WHERE expires_at <= CURRENT_TIMESTAMP
  `),
  
  deleteGuestSession: db.prepare(`
    DELETE FROM guest_sessions WHERE session_id = ?
  `)
  ,
  // Pantry operations
  addPantryItem: db.prepare(`
    INSERT INTO pantry_items (user_id, ingredient, thumb)
    VALUES (?, ?, ?)
  `),
  getPantryItemsByUser: db.prepare(`
    SELECT id, ingredient, thumb, created_at FROM pantry_items WHERE user_id = ? ORDER BY ingredient ASC
  `),
  removePantryItem: db.prepare(`
    DELETE FROM pantry_items WHERE id = ? AND user_id = ?
  `)
};

// Types
export interface User {
  id: number;
  email: string;
  password_hash: string;
  username?: string;
  is_guest: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuestSession {
  id: number;
  session_id: string;
  created_at: string;
  expires_at: string;
}

export interface PantryItem {
  id: number;
  user_id?: number;
  ingredient: string;
  thumb?: string | null;
  created_at: string;
}

export default db;