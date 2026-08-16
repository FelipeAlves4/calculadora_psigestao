import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { normalizeEmail, normalizeName, normalizePhone } from './validation.mjs';

const { Pool, types: pgTypes } = pg;

// Keep PostgreSQL timestamps as ISO-compatible strings, matching SQLite.
pgTypes.setTypeParser(1114, (value) => value);
pgTypes.setTypeParser(1184, (value) => value);

const sqliteSchema = `
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'agent')) DEFAULT 'agent',
    status TEXT NOT NULL CHECK (status IN ('active', 'blocked')) DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login_at TEXT
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
  CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT
  );
  CREATE INDEX IF NOT EXISTS password_resets_user_id_idx ON password_resets(user_id);
  CREATE TABLE IF NOT EXISTS rate_limits (
    id TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL,
    window_started_at INTEGER NOT NULL
  );
`;

const postgresSchema = `
  CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
  );
  CREATE TABLE IF NOT EXISTS public.sessions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON public.sessions(user_id);
  CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON public.sessions(expires_at);
  CREATE TABLE IF NOT EXISTS public.password_resets (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
  );
  CREATE INDEX IF NOT EXISTS password_resets_user_id_idx ON public.password_resets(user_id);
  CREATE TABLE IF NOT EXISTS public.rate_limits (
    id TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL,
    window_started_at BIGINT NOT NULL
  );
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
`;

const postgresSql = (sql) => {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
};

class SqliteAdapter {
  constructor(databasePath) {
    if (databasePath !== ':memory:') mkdirSync(path.dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec('PRAGMA journal_mode = WAL;');
    this.database.exec(sqliteSchema);
  }

  async get(sql, ...parameters) {
    return this.database.prepare(sql).get(...parameters) || null;
  }

  async all(sql, ...parameters) {
    return this.database.prepare(sql).all(...parameters);
  }

  async run(sql, ...parameters) {
    return this.database.prepare(sql).run(...parameters);
  }

  async exec(sql) {
    this.database.exec(sql);
  }

  async transaction(callback) {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      const result = await callback(this);
      this.database.exec('COMMIT');
      return result;
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  async close() {
    this.database.close();
  }
}

class PostgresAdapter {
  constructor(connectionString, client = null) {
    this.client = client;
    this.pool = client
      ? null
      : new Pool({
          connectionString,
          max: 3,
          idleTimeoutMillis: 10_000,
          connectionTimeoutMillis: 10_000,
          ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
        });
  }

  query(sql, parameters = []) {
    return (this.client || this.pool).query(postgresSql(sql), parameters);
  }

  async get(sql, ...parameters) {
    const result = await this.query(sql, parameters);
    return result.rows[0] || null;
  }

  async all(sql, ...parameters) {
    const result = await this.query(sql, parameters);
    return result.rows;
  }

  async run(sql, ...parameters) {
    return this.query(sql, parameters);
  }

  async exec(sql) {
    return (this.client || this.pool).query(sql);
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    const transactionAdapter = new PostgresAdapter('', client);
    try {
      await client.query('BEGIN');
      const result = await callback(transactionAdapter);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    if (this.pool) await this.pool.end();
  }
}

export const publicUser = (row) => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  role: row.role,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastLoginAt: row.last_login_at || null,
});

export const createDatabase = async (databaseUrl) => {
  if (/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    const database = new PostgresAdapter(databaseUrl);
    await database.exec(postgresSchema);
    return database;
  }
  return new SqliteAdapter(databaseUrl);
};

export const bootstrapAdmin = async (db) => {
  const email = normalizeEmail(process.env.BOOTSTRAP_ADMIN_EMAIL);
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
  if (!email || !password) return;
  const existingAdmin = await db.get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (existingAdmin) return;

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 12);
  await db.run(`
    INSERT INTO users (id, name, phone, email, password_hash, role, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'admin', 'active', ?, ?)
  `,
    randomUUID(),
    normalizeName(process.env.BOOTSTRAP_ADMIN_NAME || 'Administrador ASEX'),
    normalizePhone(process.env.BOOTSTRAP_ADMIN_PHONE || '11999999999'),
    email,
    passwordHash,
    now,
    now,
  );
};

export const cleanupExpiredRecords = async (db) => {
  const now = new Date().toISOString();
  await db.run('DELETE FROM sessions WHERE expires_at <= ?', now);
  await db.run('DELETE FROM password_resets WHERE expires_at <= ? OR used_at IS NOT NULL', now);
  await db.run('DELETE FROM rate_limits WHERE window_started_at < ?', Date.now() - 24 * 60 * 60 * 1000);
};
