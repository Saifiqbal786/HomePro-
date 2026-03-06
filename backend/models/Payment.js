const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Payment {
  static async create({ task_id, homeowner_id, worker_id, amount }) {
    const sql = getDb();
    const id = uuidv4();
    await sql`
            INSERT INTO payments (id, task_id, homeowner_id, worker_id, amount, status)
            VALUES (${id}, ${task_id}, ${homeowner_id}, ${worker_id}, ${amount}, 'pending')
        `;
    return this.findById(id);
  }

  static async findById(id) {
    const sql = getDb();
    const result = await sql`SELECT * FROM payments WHERE id = ${id}`;
    return result.length > 0 ? result[0] : null;
  }

  static async findByTask(taskId) {
    const sql = getDb();
    const result = await sql`SELECT * FROM payments WHERE task_id = ${taskId}`;
    return result.length > 0 ? result[0] : null;
  }

  static async confirm(taskId) {
    const sql = getDb();
    await sql`
            UPDATE payments SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP WHERE task_id = ${taskId}
        `;
    return this.findByTask(taskId);
  }

  static async getHistory(userId, role) {
    const sql = getDb();
    const column = role === 'homeowner' ? sql('p.homeowner_id') : sql('p.worker_id');

    return await sql`
            SELECT p.*, t.service_type, t.description, t.scheduled_date,
                ho.name as homeowner_name, w.name as worker_name
            FROM payments p
            JOIN tasks t ON t.id = p.task_id
            JOIN users ho ON ho.id = p.homeowner_id
            JOIN users w ON w.id = p.worker_id
            WHERE ${column} = ${userId}
            ORDER BY p.created_at DESC
        `;
  }
}

module.exports = Payment;
