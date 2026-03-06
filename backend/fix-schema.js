require('dotenv').config();
const { initDb } = require('./config/database');

async function fixSchema() {
    try {
        const sql = await initDb();
        console.log("Connected. Removing role constraint...");

        // Remove the hardcoded CHECK constraint on users.role
        await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`;

        console.log("✅ Check constraint removed.");
        process.exit(0);
    } catch (err) {
        console.error("Failed:", err);
        process.exit(1);
    }
}

fixSchema();
