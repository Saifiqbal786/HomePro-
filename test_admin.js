require('dotenv').config({ path: './backend/.env' });
const app = require('./backend/app');
const request = require('supertest');
const { initDb, getDb } = require('./backend/config/database');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('./backend/config/auth-config');

async function testSafe() {
    await initDb();
    const sql = getDb();

    // Find a real admin user
    const admins = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
    if (admins.length === 0) {
        console.error("No admin found.");
        process.exit(1);
    }

    const adminId = admins[0].id;
    const adminToken = jwt.sign({ id: adminId, role: 'admin' }, jwtSecret);

    const res = await request(app)
        .post('/api/admin/add-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            name: 'Test New Worker',
            email: 'testnewworker@test.com',
            password: 'password123',
            role: 'worker'
        });

    console.log("Response Status:", res.status);
    console.log("Response Body:", res.body);

    if (res.body && res.body.user) {
        console.log("Deleting test user...");
        await sql`DELETE FROM worker_profiles WHERE worker_id = ${res.body.user.id}`;
        await sql`DELETE FROM users WHERE id = ${res.body.user.id}`;
    }

    process.exit(0);
}

testSafe();
