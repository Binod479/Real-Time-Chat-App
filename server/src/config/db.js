import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server root or parent root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const { Pool } = pg;

// Detect if SSL should be enabled (typical for Neon, Supabase, Render, Railway, AWS RDS)
const isProduction = process.env.NODE_ENV === 'production';
const hasSslInUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require');
const explicitlySsl = process.env.DB_SSL === 'true';

const sslConfig = (isProduction || hasSslInUrl || explicitlySsl)
  ? { rejectUnauthorized: false }
  : false;

let poolConfig = {};

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    max: 20, // Max concurrent connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'chatapp_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: sslConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

export const pool = new Pool(poolConfig);

// Helper query function with logging in development
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      // debug log
      // console.log(`[SQL Query] Executed query in ${duration}ms, rows: ${res.rowCount}`);
    }
    return res;
  } catch (err) {
    console.error('[SQL Error]', { text, error: err.message });
    throw err;
  }
};

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export default {
  pool,
  query,
};
