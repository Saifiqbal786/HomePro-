const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Task {
  static async findById(id) {
    const sql = getDb();
    const result = await sql`
      SELECT t.*, 
        ho.name as homeowner_name, ho.avatar as homeowner_avatar,
        w.name as worker_name, w.avatar as worker_avatar
      FROM tasks t
      JOIN users ho ON ho.id = t.homeowner_id
      JOIN users w ON w.id = t.worker_id
      WHERE t.id = ${id}
    `;
    return result.length > 0 ? result[0] : null;
  }

  static async create({ homeowner_id, worker_id, service_type, description, location, scheduled_date, scheduled_time, hourly_rate }) {
    const sql = getDb();
    // Validate against worker availability
    const profileResult = await sql`SELECT availability FROM worker_profiles WHERE worker_id = ${worker_id}`;
    if (profileResult.length > 0) {
      const profile = profileResult[0];
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
    await sql`
      INSERT INTO tasks (
          id, homeowner_id, worker_id, service_type, description, 
          location, scheduled_date, scheduled_time, hourly_rate, status
      ) VALUES (
          ${id}, ${homeowner_id}, ${worker_id}, ${service_type}, 
          ${description || ''}, ${location || ''}, ${scheduled_date}, 
          ${scheduled_time}, ${hourly_rate}, 'pending'
      )
    `;
    return this.findById(id);
  }

  static async findByUser(userId, role, status = null) {
    const sql = getDb();
    const roleColumn = role === 'homeowner' ? sql('t.homeowner_id') : sql('t.worker_id');

    if (status) {
      return await sql`
          SELECT t.*,
            ho.name as homeowner_name, ho.avatar as homeowner_avatar,
            w.name as worker_name, w.avatar as worker_avatar
          FROM tasks t
          JOIN users ho ON ho.id = t.homeowner_id
          JOIN users w ON w.id = t.worker_id
          WHERE ${roleColumn} = ${userId} AND t.status = ${status}
          ORDER BY t.created_at DESC
        `;
    } else {
      return await sql`
          SELECT t.*,
            ho.name as homeowner_name, ho.avatar as homeowner_avatar,
            w.name as worker_name, w.avatar as worker_avatar
          FROM tasks t
          JOIN users ho ON ho.id = t.homeowner_id
          JOIN users w ON w.id = t.worker_id
          WHERE ${roleColumn} = ${userId}
          ORDER BY t.created_at DESC
        `;
    }
  }

  static async updateStatus(id, status) {
    const sql = getDb();
    const updates = { status };

    if (status === 'in_progress') updates.start_time = new Date().toISOString();

    if (status === 'completed') {
      const task = await this.findById(id);
      updates.end_time = new Date().toISOString();
      if (task && task.start_time) {
        const start = new Date(task.start_time);
        const end = new Date(updates.end_time);
        updates.duration_minutes = Math.round((end - start) / 60000);
        updates.payment_amount = Math.round((task.hourly_rate * updates.duration_minutes / 60) * 100) / 100;
      }
    }

    updates.updated_at = sql`CURRENT_TIMESTAMP`;
    await sql`UPDATE tasks SET ${sql(updates)} WHERE id = ${id}`;

    return this.findById(id);
  }

  static async getStats(workerId) {
    const sql = getDb();
    const active = await sql`
        SELECT COUNT(*) as count FROM tasks 
        WHERE worker_id = ${workerId} AND status IN ('pending', 'accepted', 'in_progress')
    `;
    const completed = await sql`
        SELECT COUNT(*) as count FROM tasks 
        WHERE worker_id = ${workerId} AND status = 'completed'
    `;
    const earnings = await sql`
        SELECT COALESCE(SUM(payment_amount), 0) as total FROM tasks 
        WHERE worker_id = ${workerId} AND status = 'completed'
    `;

    return {
      active_jobs: parseInt(active[0].count, 10),
      completed_jobs: parseInt(completed[0].count, 10),
      total_earnings: parseFloat(earnings[0].total) || 0,
    };
  }
}

module.exports = Task;
