import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeDatabase = async () => {
  console.log('⚡ Initializing PostgreSQL database schema...');
  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Run the DDL statements
    await pool.query(schemaSql);
    console.log('✅ Database schema applied successfully (users, rooms, room_members, messages).');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize database schema:', error.message);
    throw error;
  }
};

// If run directly via CLI (node initDb.js)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database initialization complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
