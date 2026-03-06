const postgres = require('postgres');
require('dotenv').config();

let sql = null;

async function initDb() {
    if (sql) return sql;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL must be provided in the environment variables.");
    }

    // We use standard connection options suitable for Supabase/Neon
    sql = postgres(connectionString, {
        max: 10,        // Max number of connections
        idle_timeout: 20, // Max idle time before closing connection (seconds)
        ssl: 'require',
        prepare: false
    });

    try {
        // Quick connection test
        await sql`SELECT 1`;
        console.log('✅ Connected to Cloud PostgreSQL database successfully');

        // Optional: you can run init schema here if needed, but usually 
        // migrations are handled separately for production databases.

    } catch (err) {
        console.error('❌ Failed to connect to Cloud Database:', err);
        throw err;
    }

    return sql;
}

function getDb() {
    if (!sql) throw new Error('Database not initialized. Call initDb() first.');
    return sql;
}

module.exports = { initDb, getDb };
