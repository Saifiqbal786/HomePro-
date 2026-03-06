const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Task {
  static findById(id) {
    return getDb().prepare(`
      SELECT t.*, 
        ho.name as homeowner_name, ho.avatar as homeowner_avatar,
        w.name as worker_name, w.avatar as worker_avatar
      FROM tasks t
      JOIN users ho ON ho.id = t.homeowner_id
      JOIN users w ON w.id = t.worker_id
      WHERE t.id = ?
    `).get(id);
  }

  static create({ homeowner_id, worker_id, service_type, description, location, scheduled_date, scheduled_time, hourly_rate }) {
    // Validate against worker availability
    const profile = getDb().prepare('SELECT availability FROM worker_profiles WHERE worker_id = ?').get(worker_id);
    if (profile) {
      try {
        const availability = JSON.parse(profile.availability || '{}');
        const blockedDates = availability.blocked_dates || [];
        if (blockedDates.includes(scheduled_date)) {
          throw new Error('The selected date is no longer available for this worker.');
        }
      } catch (err) {
        if (err.message.includes('selected date')) throw err;
        console.error('Error parsing availability JSON', err);
      }
    }

    const id = uuidv4();
    getDb().prepare(`
      INSERT INTO tasks (id, homeowner_id, worker_id, service_type, description, location, scheduled_date, scheduled_time, hourly_rate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(id, homeowner_id, worker_id, service_type, description || '', location || '', scheduled_date, scheduled_time, hourly_rate);
    return this.findById(id);
  }

  static findByUser(userId, role, status = null) {
    let query = `
      SELECT t.*,
        ho.name as homeowner_name, ho.avatar as homeowner_avatar,
        w.name as worker_name, w.avatar as worker_avatar
      FROM tasks t
      JOIN users ho ON ho.id = t.homeowner_id
      JOIN users w ON w.id = t.worker_id
      WHERE ${role === 'homeowner' ? 't.homeowner_id' : 't.worker_id'} = ?
    `;
    const params = [userId];
    if (status) { query += ' AND t.status = ?'; params.push(status); }
    query += ' ORDER BY t.created_at DESC';
    return getDb().prepare(query).all(...params);
  }

  static updateStatus(id, status) {
    const updates = { status };
    if (status === 'in_progress') updates.start_time = new Date().toISOString();
    if (status === 'completed') {
      const task = this.findById(id);
      updates.end_time = new Date().toISOString();
      if (task && task.start_time) {
        const start = new Date(task.start_time);
        const end = new Date(updates.end_time);
        updates.duration_minutes = Math.round((end - start) / 60000);
        updates.payment_amount = Math.round((task.hourly_rate * updates.duration_minutes / 60) * 100) / 100;
      }
    }

    const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const vals = Object.values(updates);
    vals.push(id);
    getDb().prepare(`UPDATE tasks SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(...vals);
    return this.findById(id);
  }

  static getStats(workerId) {
    const db = getDb();
    const active = db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE worker_id = ? AND status IN ('pending', 'accepted', 'in_progress')`).get(workerId);
    const completed = db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE worker_id = ? AND status = 'completed'`).get(workerId);
    const earnings = db.prepare(`SELECT COALESCE(SUM(payment_amount), 0) as total FROM tasks WHERE worker_id = ? AND status = 'completed'`).get(workerId);
    return {
      active_jobs: active.count,
      completed_jobs: completed.count,
      total_earnings: earnings.total,
    };
  }
}

module.exports = Task;
