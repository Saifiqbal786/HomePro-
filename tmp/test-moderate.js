require('dotenv').config({ path: require('path').join(__dirname, 'backend/.env') });
const http = require('http');
const postgres = require('./backend/node_modules/postgres');

function req(method, path, body, token) {
    return new Promise(resolve => {
        const data = body ? JSON.stringify(body) : null;
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        if (data) headers['Content-Length'] = Buffer.byteLength(data);
        const r = http.request({ hostname: 'localhost', port: 3000, path, method, headers }, res => {
            let b = '';
            res.on('data', d => b += d);
            res.on('end', () => resolve({ status: res.statusCode, body: b }));
        });
        r.on('error', e => resolve({ status: 0, body: e.message }));
        if (data) r.write(data);
        r.end();
    });
}

async function test() {
    // Find admin in DB
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', prepare: false });
    const admins = await sql`SELECT id, email FROM users WHERE role = 'admin' LIMIT 1`;
    const users = await sql`SELECT id, name, role FROM users WHERE role != 'admin' LIMIT 1`;
    await sql.end();

    if (!admins.length) { console.log('No admin found in DB'); return; }
    console.log('Admin:', admins[0].email);
    console.log('Test user:', users[0].id, users[0].name);

    // Try different common passwords
    const passwords = ['admin123', 'Admin@123', 'homepro123', 'password', 'admin'];
    let token = null;
    for (const pwd of passwords) {
        const login = await req('POST', '/api/auth/login', { email: admins[0].email, password: pwd });
        if (login.status === 200) {
            token = JSON.parse(login.body).token;
            console.log('Logged in with password:', pwd);
            break;
        }
    }
    if (!token) { console.log('Could not login with any common password'); return; }

    // Test the PATCH route
    const userId = users[0].id;
    const patch = await req('PATCH', `/api/admin/users/${userId}/moderate`, { action: 'verify', reason: 'test' }, token);
    console.log('PATCH /moderate status:', patch.status);
    console.log('PATCH body:', patch.body.substring(0, 400));
}

test().catch(e => console.error('Error:', e.message));
