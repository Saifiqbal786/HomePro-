const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Review {
  static async create({ homeowner_id, worker_id, task_id, rating, comment }) {
    const sql = getDb();
    const id = uuidv4();
    await sql`
            INSERT INTO reviews (id, homeowner_id, worker_id, task_id, rating, comment)
            VALUES (${id}, ${homeowner_id}, ${worker_id}, ${task_id}, ${rating}, ${comment || ''})
        `;
    return this.findById(id);
  }

  static async findById(id) {
    const sql = getDb();
    const result = await sql`
            SELECT r.*, u.name as homeowner_name, u.avatar as homeowner_avatar
            FROM reviews r JOIN users u ON u.id = r.homeowner_id
            WHERE r.id = ${id}
        `;
    return result.length > 0 ? result[0] : null;
  }

  static async findByWorker(workerId, limit = 20, offset = 0) {
    const sql = getDb();
    return await sql`
            SELECT r.*, u.name as homeowner_name, u.avatar as homeowner_avatar
            FROM reviews r
            JOIN users u ON u.id = r.homeowner_id
            WHERE r.worker_id = ${workerId}
            ORDER BY r.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
  }

  static async existsForTask(taskId) {
    const sql = getDb();
    const result = await sql`SELECT id FROM reviews WHERE task_id = ${taskId}`;
    return result.length > 0;
  }
}

module.exports = Review;
