const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class WorkerProfile {
    static async findByWorkerId(workerId) {
        const sql = getDb();
        const result = await sql`
      SELECT wp.*, u.name, u.email, u.phone, u.avatar, u.gender, u.location, u.latitude, u.longitude, u.is_online
      FROM worker_profiles wp
      JOIN users u ON u.id = wp.worker_id
      WHERE wp.worker_id = ${workerId}
    `;
        return result.length > 0 ? result[0] : null;
    }

    static async create(workerId, data) {
        const sql = getDb();
        const id = uuidv4();
        await sql`
      INSERT INTO worker_profiles (
          id, worker_id, bio, services, skills, hourly_rate, experience_years, 
          availability, is_verified, portfolio, credentials
      ) VALUES (
          ${id}, ${workerId}, 
          ${data.bio || ''}, ${data.services || '[]'}, ${data.skills || '[]'}, 
          ${data.hourly_rate || 0}, ${data.experience_years || 0}, 
          ${data.availability || '{}'}, ${data.is_verified ? 1 : 0}, 
          ${data.portfolio || '[]'}, ${data.credentials || '[]'}
      )
    `;
        return this.findByWorkerId(workerId);
    }

    static async update(workerId, fields) {
        const sql = getDb();
        const allowed = ['bio', 'services', 'skills', 'hourly_rate', 'experience_years', 'availability', 'portfolio', 'credentials'];

        const updateData = {};
        for (const [key, val] of Object.entries(fields)) {
            if (allowed.includes(key)) {
                updateData[key] = typeof val === 'object' ? JSON.stringify(val) : val;
            }
        }

        if (Object.keys(updateData).length === 0) return this.findByWorkerId(workerId);

        updateData.updated_at = sql`CURRENT_TIMESTAMP`;

        await sql`UPDATE worker_profiles SET ${sql(updateData)} WHERE worker_id = ${workerId}`;
        return this.findByWorkerId(workerId);
    }

    static async search({ category, query, minRate, maxRate, minRating, gender, sortBy, page = 1, limit = 12 }) {
        const sql = getDb();

        const queryLines = ["u.role = 'worker'"];
        const values = [];

        if (query) {
            values.push(`%${query}%`);
            queryLines.push(`(u.name ILIKE $${values.length} OR wp.services ILIKE $${values.length} OR wp.bio ILIKE $${values.length})`);
        }

        if (category) {
            values.push(`%${category}%`);
            queryLines.push(`wp.services ILIKE $${values.length}`);
        }
        if (minRate) {
            values.push(minRate);
            queryLines.push(`wp.hourly_rate >= $${values.length}`);
        }
        if (maxRate) {
            values.push(maxRate);
            queryLines.push(`wp.hourly_rate <= $${values.length}`);
        }
        if (minRating) {
            values.push(minRating);
            queryLines.push(`wp.rating >= $${values.length}`);
        }
        if (gender) {
            values.push(gender);
            queryLines.push(`u.gender = $${values.length}`);
        }

        let orderByColumn = "wp.rating DESC, wp.total_jobs DESC";
        if (sortBy === 'price_low') orderByColumn = "wp.hourly_rate ASC";
        if (sortBy === 'price_high') orderByColumn = "wp.hourly_rate DESC";
        if (sortBy === 'rating') orderByColumn = "wp.rating DESC";
        if (sortBy === 'jobs') orderByColumn = "wp.total_jobs DESC";

        const offset = (page - 1) * limit;

        const whereClause = queryLines.join(' AND ');

        // Execute COUNT Query
        const countQuery = `
            SELECT COUNT(*) as total
            FROM worker_profiles wp
            JOIN users u ON u.id = wp.worker_id
            WHERE ${whereClause}
        `;
        const countResult = await sql.unsafe(countQuery, values);
        const total = parseInt(countResult[0].total, 10);

        // Execute DATA Query
        values.push(limit, offset);
        const dataQuery = `
            SELECT wp.*, u.name, u.email, u.phone, u.avatar, u.gender, u.location, u.latitude, u.longitude, u.is_online
            FROM worker_profiles wp
            JOIN users u ON u.id = wp.worker_id
            WHERE ${whereClause}
            ORDER BY ${orderByColumn}
            LIMIT $${values.length - 1} OFFSET $${values.length}
        `;
        const workers = await sql.unsafe(dataQuery, values);

        return { workers, total, page, totalPages: Math.ceil(total / limit) };
    }

    static async updateRating(workerId) {
        const sql = getDb();
        const result = await sql`
            SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE worker_id = ${workerId}
        `;

        if (result.length > 0 && result[0].count > 0) {
            const count = parseInt(result[0].count, 10);
            const avg = Math.round(parseFloat(result[0].avg_rating) * 10) / 10;
            await sql`
                UPDATE worker_profiles SET rating = ${avg}, total_reviews = ${count} WHERE worker_id = ${workerId}
            `;
        }
    }

    static async incrementJobs(workerId) {
        const sql = getDb();
        await sql`UPDATE worker_profiles SET total_jobs = total_jobs + 1 WHERE worker_id = ${workerId}`;
    }
}

module.exports = WorkerProfile;
