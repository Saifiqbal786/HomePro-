const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Message {
  static async create({ sender_id, receiver_id, content, message_type = 'text' }) {
    const sql = getDb();
    const id = uuidv4();
    await sql`
            INSERT INTO messages (id, sender_id, receiver_id, content, message_type)
            VALUES (${id}, ${sender_id}, ${receiver_id}, ${content}, ${message_type})
        `;
    const result = await sql`
            SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
            FROM messages m JOIN users u ON u.id = m.sender_id
            WHERE m.id = ${id}
        `;
    return result.length > 0 ? result[0] : null;
  }

  static async getConversation(userId1, userId2, limit = 50, offset = 0) {
    const sql = getDb();
    return await sql`
            SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            WHERE (m.sender_id = ${userId1} AND m.receiver_id = ${userId2}) 
               OR (m.sender_id = ${userId2} AND m.receiver_id = ${userId1})
            ORDER BY m.created_at ASC
            LIMIT ${limit} OFFSET ${offset}
        `;
  }

  static async getConversations(userId) {
    const sql = getDb();
    return await sql`
            SELECT 
                CASE WHEN m.sender_id = ${userId} THEN m.receiver_id ELSE m.sender_id END as other_user_id,
                u.name as other_user_name,
                u.avatar as other_user_avatar,
                u.is_online as other_user_online,
                u.role as other_user_role,
                m.content as last_message,
                m.created_at as last_message_time,
                (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = ${userId} AND is_read = 0) as unread_count
            FROM messages m
            JOIN users u ON u.id = CASE WHEN m.sender_id = ${userId} THEN m.receiver_id ELSE m.sender_id END
            WHERE m.id IN (
                SELECT MAX(id) FROM messages
                WHERE sender_id = ${userId} OR receiver_id = ${userId}
                GROUP BY CASE WHEN sender_id = ${userId} THEN receiver_id ELSE sender_id END
            )
            ORDER BY m.created_at DESC
        `;
  }

  static async markAsRead(senderId, receiverId) {
    const sql = getDb();
    await sql`
            UPDATE messages SET is_read = 1 
            WHERE sender_id = ${senderId} AND receiver_id = ${receiverId} AND is_read = 0
        `;
  }
}

module.exports = Message;
