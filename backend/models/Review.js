const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Review {
    static create({ homeowner_id, worker_id, task_id, rating, comment }) {
        const id = uuidv4();
        getDb().prepare(`
      INSERT INTO reviews (id, homeowner_id, worker_id, task_id, rating, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, homeowner_id, worker_id, task_id, rating, comment || '');
        return this.findById(id);
    }

    static findById(id) {
        return getDb().prepare(`
      SELECT r.*, u.name as homeowner_name, u.avatar as homeowner_avatar
      FROM reviews r JOIN users u ON u.id = r.homeowner_id
      WHERE r.id = ?
    `).get(id);
    }

    static findByWorker(workerId, limit = 20, offset = 0) {
        return getDb().prepare(`
      SELECT r.*, u.name as homeowner_name, u.avatar as homeowner_avatar
      FROM reviews r
      JOIN users u ON u.id = r.homeowner_id
      WHERE r.worker_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(workerId, limit, offset);
    }

    static existsForTask(taskId) {
        return getDb().prepare('SELECT id FROM reviews WHERE task_id = ?').get(taskId);
    }
}

module.exports = Review;
