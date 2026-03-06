const { initDb, getDb } = require('./config/database');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
    await initDb();
    const sql = getDb();

    try {
        const admins = await sql`SELECT * FROM users WHERE role = 'admin'`;

        if (admins.length > 0) {
            const admin = admins[0];
            const hash = bcrypt.hashSync('admin123', 10);

            await sql`UPDATE users SET password = ${hash}, is_verified = 1 WHERE id = ${admin.id}`;

            console.log("Admin password reset successfully!");
            console.log("Email:", admin.email);
            console.log("Password: admin123");
        } else {
            console.log("No admin found. Please run the creation script.");
        }
    } catch (err) {
        console.error("Error connecting or querying:", err);
    }

    process.exit(0);
}

resetAdmin();
