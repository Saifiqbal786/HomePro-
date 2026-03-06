const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User {
    static async findById(id) {
        const sql = getDb();
        const result = await sql`SELECT * FROM users WHERE id = ${id}`;
        return result.length > 0 ? result[0] : null;
    }

    static async findByEmail(email) {
        const sql = getDb();
        const result = await sql`SELECT * FROM users WHERE email = ${email}`;
        return result.length > 0 ? result[0] : null;
    }

    static async create({ role, name, email, phone, password, gender, location, latitude, longitude, avatar }) {
        const sql = getDb();
        const id = uuidv4();
        await sql`
            INSERT INTO users (id, role, name, email, phone, password, gender, location, latitude, longitude, avatar)
            VALUES (${id}, ${role}, ${name}, ${email}, ${phone || null}, ${password}, ${gender || null}, ${location || null}, ${latitude || 0}, ${longitude || 0}, ${avatar || null})
        `;
        return this.findById(id);
    }

    static async updateOTP(id, otp, expiry) {
        const sql = getDb();
        await sql`UPDATE users SET otp = ${otp}, otp_expiry = ${expiry} WHERE id = ${id}`;
    }

    static async update(id, fields) {
        const sql = getDb();
        const allowed = ['name', 'phone', 'avatar', 'gender', 'location', 'latitude', 'longitude', 'is_online', 'is_verified'];

        // Filter out fields not allowed
        const updateData = {};
        for (const [key, val] of Object.entries(fields)) {
            if (allowed.includes(key)) updateData[key] = val;
        }

        if (Object.keys(updateData).length === 0) return this.findById(id);

        updateData.updated_at = sql`CURRENT_TIMESTAMP`;

        await sql`UPDATE users SET ${sql(updateData)} WHERE id = ${id}`;
        return this.findById(id);
    }

    static async setOnline(id, isOnline) {
        const sql = getDb();
        await sql`UPDATE users SET is_online = ${isOnline ? 1 : 0} WHERE id = ${id}`;
    }

    // Admin-only update — moderation fields
    static async adminUpdate(id, fields) {
        const sql = getDb();
        const allowed = ['account_status', 'suspension_reason', 'suspended_until', 'is_verified'];
        const updateData = {};
        for (const [key, val] of Object.entries(fields)) {
            if (allowed.includes(key)) updateData[key] = val;
        }
        if (Object.keys(updateData).length === 0) return this.findById(id);
        updateData.updated_at = sql`CURRENT_TIMESTAMP`;
        await sql`UPDATE users SET ${sql(updateData)} WHERE id = ${id}`;
        return this.findById(id);
    }

    static safeUser(user) {
        if (!user) return null;
        const { password, ...safe } = user;
        return safe;
    }
}

module.exports = User;
