const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '..', '..', process.env.DB_PATH || 'database/homepro.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

async function seed() {
  const SQL = await initSqlJs();

  // Start fresh
  const sqlDb = new SQL.Database();

  // Run schema
  const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  sqlDb.run(schema);

  const hash = bcrypt.hashSync('password123', 10);

  function run(sql, params) { sqlDb.run(sql, params); }

  // ── Homeowner accounts ──
  const homeowners = [
    { id: uuidv4(), name: 'Alex Thompson', email: 'alex@example.com', phone: '555-0101', gender: 'male', location: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
    { id: uuidv4(), name: 'Maria Garcia', email: 'maria@example.com', phone: '555-0102', gender: 'female', location: 'Austin, TX', lat: 30.2750, lng: -97.7400 },
    { id: uuidv4(), name: 'James Wilson', email: 'james@example.com', phone: '555-0103', gender: 'male', location: 'Austin, TX', lat: 30.2900, lng: -97.7500 },
  ];

  homeowners.forEach(h => {
    run(`INSERT INTO users (id, role, name, email, phone, password, gender, location, latitude, longitude, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [h.id, 'homeowner', h.name, h.email, h.phone, hash, h.gender, h.location, h.lat, h.lng, `https://ui-avatars.com/api/?name=${encodeURIComponent(h.name)}&background=137fec&color=fff&size=128`]);
  });

  // ── Worker accounts ──
  // No dummy workers seeded.

  // Save to file
  const data = sqlDb.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);

  sqlDb.close();

  console.log('✅ Database seeded successfully!');
  console.log(`   - ${homeowners.length} homeowners`);
  console.log(`   - 0 workers`);
  console.log(`   📧 Homeowner demo login: alex@example.com / password123`);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
