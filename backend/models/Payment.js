const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Payment {
    static create({ task_id, homeowner_id, worker_id, amount }) {
        const id = uuidv4();
        getDb().prepare(`
      INSERT INTO payments (id, task_id, homeowner_id, worker_id, amount, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(id, task_id, homeowner_id, worker_id, amount);
        return this.findById(id);
    }

    static findById(id) {
        return getDb().prepare('SELECT * FROM payments WHERE id = ?').get(id);
    }

    static findByTask(taskId) {
        return getDb().prepare('SELECT * FROM payments WHERE task_id = ?').get(taskId);
    }

    static confirm(taskId) {
        getDb().prepare(`
      UPDATE payments SET status = 'confirmed', confirmed_at = datetime('now') WHERE task_id = ?
    `).run(taskId);
        return this.findByTask(taskId);
    }

    static getHistory(userId, role) {
        const column = role === 'homeowner' ? 'homeowner_id' : 'worker_id';
        return getDb().prepare(`
      SELECT p.*, t.service_type, t.description, t.scheduled_date,
        ho.name as homeowner_name, w.name as worker_name
      FROM payments p
      JOIN tasks t ON t.id = p.task_id
      JOIN users ho ON ho.id = p.homeowner_id
      JOIN users w ON w.id = p.worker_id
      WHERE p.${column} = ?
      ORDER BY p.created_at DESC
    `).all(userId);
    }
}

module.exports = Payment;
