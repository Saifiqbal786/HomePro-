const { initDb, getDb } = require('./config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createOrCheckAdmin() {
    await initDb();
    const sql = getDb();

    try {
        const admins = await sql`SELECT * FROM users WHERE role = 'admin'`;

        if (admins.length > 0) {
            console.log("Admin account already exists:");
            console.log("Email:", admins[0].email);
            console.log("Password is encrypted. If you forgot, please run a script to reset it.");
        } else {
            console.log("No admin found. Creating one...");
            const hash = bcrypt.hashSync('admin123', 10);
            const adminParams = {
                id: uuidv4(),
                role: 'admin',
                name: 'System Admin',
                email: 'admin@homepro.com',
                phone: '000-000-0000',
                password: hash,
                gender: 'other',
                location: 'System',
                latitude: 0,
                longitude: 0,
                avatar: 'https://ui-avatars.com/api/?name=Admin&background=000&color=fff',
                is_verified: 1
            };

            await sql`
                INSERT INTO users (id, role, name, email, phone, password, gender, location, latitude, longitude, avatar, is_verified)
                VALUES (${adminParams.id}, ${adminParams.role}, ${adminParams.name}, ${adminParams.email}, ${adminParams.phone}, ${adminParams.password}, ${adminParams.gender}, ${adminParams.location}, ${adminParams.latitude}, ${adminParams.longitude}, ${adminParams.avatar}, ${adminParams.is_verified})
            `;

            console.log("Admin account created successfully!");
            console.log("Email: admin@homepro.com");
            console.log("Password: admin123");
        }
    } catch (err) {
        console.error("Error connecting or querying:", err);
    }

    process.exit(0);
}

createOrCheckAdmin();
