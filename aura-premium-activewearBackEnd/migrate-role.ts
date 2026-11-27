import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { query, closePool } from './db.js';

dotenv.config();

async function migrate() {
  try {
    console.log('Connected to Neon DB. Ensuring role column on users table...');
    await query`ALTER TABLE users ADD COLUMN IF NOT EXISTS role INTEGER NOT NULL DEFAULT 2`;
    console.log('Role column ready.');

    console.log('Seeding admin user...');
    const email = 'admin@darvk.com';
    const password = process.env.ADMIN_PASSWORD || 'yasas';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const existing = await query`SELECT id FROM users WHERE email = ${email}`;
    if (existing.rows.length > 0) {
      await query`UPDATE users SET role = 1, password_hash = ${passwordHash} WHERE email = ${email}`;
      console.log('Admin user updated.');
    } else {
      await query`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES (${email}, ${passwordHash}, 'Admin', 'User', 1)
      `;
      console.log('Admin user created.');
    }

    await closePool();
    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    await closePool().catch(() => {});
    process.exit(1);
  }
}

migrate();
