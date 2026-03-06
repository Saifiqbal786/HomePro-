const { initDb, getDb } = require('./config/database');
const request = require('supertest');
const app = require('./app'); // Assuming there's an app.js exporting the express instance
const User = require('./models/User');

async function testOTPFlow() {
    try {
        await initDb();
        console.log('Connected to DB...');

        const testEmail = 'iqbalsaif817@gmail.com';

        // 1. Clean up old test user if exists
        const sql = getDb();
        await sql`DELETE FROM users WHERE email = ${testEmail}`;
        console.log('Cleaned up old test user.');

        // 2. Register
        console.log('Registering user...');
        const resReg = await request(app)
            .post('/api/auth/register')
            .send({
                role: 'client',
                name: 'Test Setup User',
                email: testEmail,
                password: 'password123'
            });

        console.log('Register Response Status:', resReg.statusCode);
        console.log('Register Response Body:', resReg.body);

        if (resReg.statusCode !== 201) {
            console.error('Registration failed.');
            process.exit(1);
        }

        const userId = resReg.body.userId;

        // 3. Verify DB has OTP
        const user = await User.findByEmail(testEmail);
        console.log('User OTP in DB:', user.otp);
        console.log('User Expiry in DB:', user.otp_expiry);

        console.log('✅ Flow initiated! Check your email for the OTP.');
        process.exit(0);
    } catch (err) {
        console.error('Test error:', err);
        process.exit(1);
    }
}

testOTPFlow();
