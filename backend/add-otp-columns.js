require('dotenv').config();
const { initDb } = require('./config/database');

async function fixSchema() {
    try {
        const sql = await initDb();
        console.log("Adding OTP columns...");
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp VARCHAR(6)`;
        console.log("OTP column added");
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP`;
        console.log("OTP expiry column added");
        process.exit(0);
    } catch (err) {
        console.error("Failed:", err);
        process.exit(1);
    }
}

fixSchema();
