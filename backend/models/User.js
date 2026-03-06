const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User {
    static findById(id) {
        return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
    }

    static findByEmail(email) {
        return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
    }

    static create({ role, name, email, phone, password, gender, location, latitude, longitude, avatar }) {
        const id = uuidv4();
        getDb().prepare(
            `INSERT INTO users (id, role, name, email, phone, password, gender, location, latitude, longitude, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(id, role, name, email, phone, password, gender || null, location || null, latitude || 0, longitude || 0, avatar || null);
        return this.findById(id);
    }

    static update(id, fields) {
        const allowed = ['name', 'phone', 'avatar', 'gender', 'location', 'latitude', 'longitude', 'is_online'];
        const sets = [];
        const vals = [];
        for (const [key, val] of Object.entries(fields)) {
            if (allowed.includes(key)) {
                sets.push(`${key} = ?`);
                vals.push(val);
            }
        }
        if (sets.length === 0) return this.findById(id);
        sets.push("updated_at = datetime('now')");
        vals.push(id);
        getDb().prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
        return this.findById(id);
    }

    static setOnline(id, isOnline) {
        getDb().prepare('UPDATE users SET is_online = ? WHERE id = ?').run(isOnline ? 1 : 0, id);
    }

    static safeUser(user) {
        if (!user) return null;
        const { password, ...safe } = user;
        return safe;
    }
}

module.exports = User;
