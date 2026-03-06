const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class WorkerProfile {
    static findByWorkerId(workerId) {
        return getDb().prepare(`
      SELECT wp.*, u.name, u.email, u.phone, u.avatar, u.gender, u.location, u.latitude, u.longitude, u.is_online
      FROM worker_profiles wp
      JOIN users u ON u.id = wp.worker_id
      WHERE wp.worker_id = ?
    `).get(workerId);
    }

    static create(workerId, data) {
        const id = uuidv4();
        getDb().prepare(`
      INSERT INTO worker_profiles (id, worker_id, bio, services, skills, hourly_rate, experience_years, availability, is_verified, portfolio, credentials)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            id, workerId,
            data.bio || '', data.services || '[]', data.skills || '[]',
            data.hourly_rate || 0, data.experience_years || 0,
            data.availability || '{}', data.is_verified ? 1 : 0,
            data.portfolio || '[]', data.credentials || '[]'
        );
        return this.findByWorkerId(workerId);
    }

    static update(workerId, fields) {
        const allowed = ['bio', 'services', 'skills', 'hourly_rate', 'experience_years', 'availability', 'portfolio', 'credentials'];
        const sets = [];
        const vals = [];
        for (const [key, val] of Object.entries(fields)) {
            if (allowed.includes(key)) {
                sets.push(`${key} = ?`);
                vals.push(typeof val === 'object' ? JSON.stringify(val) : val);
            }
        }
        if (sets.length === 0) return this.findByWorkerId(workerId);
        sets.push("updated_at = datetime('now')");
        vals.push(workerId);
        getDb().prepare(`UPDATE worker_profiles SET ${sets.join(', ')} WHERE worker_id = ?`).run(...vals);
        return this.findByWorkerId(workerId);
    }

    static search({ category, minRate, maxRate, minRating, gender, sortBy, page = 1, limit = 12 }) {
        let where = ['u.role = ?'];
        let params = ['worker'];

        if (category) {
            where.push("wp.services LIKE ?");
            params.push(`%${category}%`);
        }
        if (minRate) { where.push("wp.hourly_rate >= ?"); params.push(minRate); }
        if (maxRate) { where.push("wp.hourly_rate <= ?"); params.push(maxRate); }
        if (minRating) { where.push("wp.rating >= ?"); params.push(minRating); }
        if (gender) { where.push("u.gender = ?"); params.push(gender); }

        let orderBy = 'wp.rating DESC, wp.total_jobs DESC';
        if (sortBy === 'price_low') orderBy = 'wp.hourly_rate ASC';
        if (sortBy === 'price_high') orderBy = 'wp.hourly_rate DESC';
        if (sortBy === 'rating') orderBy = 'wp.rating DESC';
        if (sortBy === 'jobs') orderBy = 'wp.total_jobs DESC';

        const offset = (page - 1) * limit;

        const countQuery = `
      SELECT COUNT(*) as total
      FROM worker_profiles wp
      JOIN users u ON u.id = wp.worker_id
      WHERE ${where.join(' AND ')}
    `;
        const total = getDb().prepare(countQuery).get(...params).total;

        const query = `
      SELECT wp.*, u.name, u.email, u.phone, u.avatar, u.gender, u.location, u.latitude, u.longitude, u.is_online
      FROM worker_profiles wp
      JOIN users u ON u.id = wp.worker_id
      WHERE ${where.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
        params.push(limit, offset);
        const workers = getDb().prepare(query).all(...params);

        return { workers, total, page, totalPages: Math.ceil(total / limit) };
    }

    static updateRating(workerId) {
        const result = getDb().prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE worker_id = ?
    `).get(workerId);
        if (result && result.count > 0) {
            getDb().prepare(`
        UPDATE worker_profiles SET rating = ?, total_reviews = ? WHERE worker_id = ?
      `).run(Math.round(result.avg_rating * 10) / 10, result.count, workerId);
        }
    }

    static incrementJobs(workerId) {
        getDb().prepare(`UPDATE worker_profiles SET total_jobs = total_jobs + 1 WHERE worker_id = ?`).run(workerId);
    }
}

module.exports = WorkerProfile;
