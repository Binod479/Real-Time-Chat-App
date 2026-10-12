import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { initializeDatabase } from './initDb.js';

export const seedDatabase = async () => {
  console.log('🌱 Starting database seeding...');
  await initializeDatabase();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create or ensure demo users
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const demoUsers = [
      {
        username: 'alice',
        email: 'alice@example.com',
        display_name: 'Alice Johnson',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
      {
        username: 'bob',
        email: 'bob@example.com',
        display_name: 'Bob Smith',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      },
      {
        username: 'charlie',
        email: 'charlie@example.com',
        display_name: 'Charlie Brown',
        avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      },
      {
        username: 'diana',
        email: 'diana@example.com',
        display_name: 'Diana Prince',
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      },
    ];

    const insertedUsers = [];

    for (const u of demoUsers) {
      const res = await client.query(
        `INSERT INTO users (username, email, password_hash, display_name, avatar_url, is_online)
         VALUES ($1, $2, $3, $4, $5, FALSE)
         ON CONFLICT (username) DO UPDATE
         SET display_name = EXCLUDED.display_name,
             avatar_url = EXCLUDED.avatar_url
         RETURNING id, username, display_name`,
        [u.username, u.email, passwordHash, u.display_name, u.avatar_url]
      );
      insertedUsers.push(res.rows[0]);
    }

    const alice = insertedUsers.find((u) => u.username === 'alice');
    const bob = insertedUsers.find((u) => u.username === 'bob');
    const charlie = insertedUsers.find((u) => u.username === 'charlie');
    const diana = insertedUsers.find((u) => u.username === 'diana');

    // 2. Create a demo Direct chat room between Alice and Bob if not exists
    const directCheck = await client.query(
      `SELECT r.id FROM rooms r
       JOIN room_members rm1 ON r.id = rm1.room_id AND rm1.user_id = $1
       JOIN room_members rm2 ON r.id = rm2.room_id AND rm2.user_id = $2
       WHERE r.type = 'direct' LIMIT 1`,
      [alice.id, bob.id]
    );

    let directRoomId;
    if (directCheck.rows.length === 0) {
      const roomRes = await client.query(
        `INSERT INTO rooms (type, created_by) VALUES ('direct', $1) RETURNING id`,
        [alice.id]
      );
      directRoomId = roomRes.rows[0].id;

      await client.query(
        `INSERT INTO room_members (room_id, user_id) VALUES ($1, $2), ($1, $3)`,
        [directRoomId, alice.id, bob.id]
      );

      // Seed messages
      await client.query(
        `INSERT INTO messages (room_id, sender_id, content, created_at)
         VALUES
         ($1, $2, 'Hey Bob! Welcome to our new real-time PERN chat platform 🚀', NOW() - INTERVAL '30 minutes'),
         ($1, $3, 'Hi Alice! It feels super responsive! Socket.IO + PostgreSQL is lightning fast.', NOW() - INTERVAL '25 minutes'),
         ($1, $2, 'Yes, and Material UI gives it a very clean, modern feel!', NOW() - INTERVAL '10 minutes')`,
        [directRoomId, alice.id, bob.id]
      );
    }

    // 3. Create a demo Group chat: "PERN Dev Team"
    const groupCheck = await client.query(
      `SELECT id FROM rooms WHERE type = 'group' AND name = 'PERN Dev Team' LIMIT 1`
    );

    if (groupCheck.rows.length === 0) {
      const groupRes = await client.query(
        `INSERT INTO rooms (name, type, created_by) VALUES ('PERN Dev Team', 'group', $1) RETURNING id`,
        [alice.id]
      );
      const groupId = groupRes.rows[0].id;

      await client.query(
        `INSERT INTO room_members (room_id, user_id, role) VALUES
         ($1, $2, 'admin'),
         ($1, $3, 'member'),
         ($1, $4, 'member'),
         ($1, $5, 'member')`,
        [groupId, alice.id, bob.id, charlie.id, diana.id]
      );

      await client.query(
        `INSERT INTO messages (room_id, sender_id, content, created_at)
         VALUES
         ($1, $2, 'Welcome to the PERN Dev Team channel! 🎉', NOW() - INTERVAL '2 hours'),
         ($1, $3, 'Awesome to be here. The real-time status updates work seamlessly!', NOW() - INTERVAL '1 hour 45 minutes'),
         ($1, $4, 'Loving the clean Material UI theme and message persistence in PostgreSQL.', NOW() - INTERVAL '1 hour 30 minutes'),
         ($1, $5, 'Ready to build great features with everyone! 👋', NOW() - INTERVAL '1 hour')`,
        [groupId, alice.id, bob.id, charlie.id, diana.id]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Seeding completed successfully!');
    console.log('🔑 Demo User Accounts (Password: Password123!):');
    console.log('   - alice / alice@example.com');
    console.log('   - bob / bob@example.com');
    console.log('   - charlie / charlie@example.com');
    console.log('   - diana / diana@example.com');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

if (process.argv[1] === import.meta.url || process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
