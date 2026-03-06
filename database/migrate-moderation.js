const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const { initDb } = require('../backend/config/database');

async function migrateModeration() {
    try {
        console.log('Connecting to database...');
        const sql = await initDb();
        console.log('Adding account_status, suspension_reason, suspended_until, is_verified to users...');

        // Add account status column
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified INTEGER DEFAULT 0`;

        console.log('✅ Moderation columns added successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}
migrateModeration();
