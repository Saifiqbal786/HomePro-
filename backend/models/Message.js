const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Message {
    static create({ sender_id, receiver_id, content, message_type = 'text' }) {
        const id = uuidv4();
        getDb().prepare(`
      INSERT INTO messages (id, sender_id, receiver_id, content, message_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, sender_id, receiver_id, content, message_type);
        return getDb().prepare(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m JOIN users u ON u.id = m.sender_id
      WHERE m.id = ?
    `).get(id);
    }

    static getConversation(userId1, userId2, limit = 50, offset = 0) {
        return getDb().prepare(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
      LIMIT ? OFFSET ?
    `).all(userId1, userId2, userId2, userId1, limit, offset);
    }

    static getConversations(userId) {
        return getDb().prepare(`
      SELECT 
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
        u.name as other_user_name,
        u.avatar as other_user_avatar,
        u.is_online as other_user_online,
        u.role as other_user_role,
        m.content as last_message,
        m.created_at as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
      WHERE m.id IN (
        SELECT MAX(id) FROM messages
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
      )
      ORDER BY m.created_at DESC
    `).all(userId, userId, userId, userId, userId, userId);
    }

    static markAsRead(senderId, receiverId) {
        getDb().prepare(`
      UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(senderId, receiverId);
    }
}

module.exports = Message;
