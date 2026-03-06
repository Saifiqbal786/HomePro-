require('dotenv').config();
const { initDb } = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const { saltRounds } = require('./config/auth-config');

async function seedAdmin() {
    try {
        await initDb();
        console.log("Connected to Database. Checking for admin user...");

        const adminEmail = 'admin@homepro.com';
        const existingAdmin = await User.findByEmail(adminEmail);

        if (existingAdmin) {
            console.log(`Admin user already exists: ${adminEmail}`);
            process.exit(0);
        }

        const hashedPassword = bcrypt.hashSync('admin123!', saltRounds);

        const admin = await User.create({
            role: 'admin',
            name: 'HomePro Administrator',
            email: adminEmail,
            phone: '555-000-ADMIN',
            password: hashedPassword,
            gender: 'other',
            location: 'System',
            latitude: 0,
            longitude: 0,
            avatar: `https://ui-avatars.com/api/?name=Admin&background=dc2626&color=fff&size=128`
        });

        console.log(`✅ Admin account created successfully!`);
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: admin123!`);
        process.exit(0);
    } catch (err) {
        console.error("Failed to seed admin:", err);
        process.exit(1);
    }
}

seedAdmin();
