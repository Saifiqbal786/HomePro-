// Notification polling
let notifInterval = null;

async function loadNotifications() {
    try {
        const data = await api.get('/notifications');
        updateNotifBadge(data.unread_count);
        return data;
    } catch (err) {
        console.error('Failed to load notifications:', err);
        return { notifications: [], unread_count: 0 };
    }
}

function updateNotifBadge(count) {
    const badges = document.querySelectorAll('.notif-badge');
    badges.forEach(badge => {
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });
}

function startNotifPolling(intervalMs = 30000) {
    if (notifInterval) clearInterval(notifInterval);
    loadNotifications();
    notifInterval = setInterval(loadNotifications, intervalMs);
}

function stopNotifPolling() {
    if (notifInterval) {
        clearInterval(notifInterval);
        notifInterval = null;
    }
}

async function markNotificationRead(id) {
    await api.put(`/notifications/${id}/read`);
    loadNotifications();
}

async function markAllNotificationsRead() {
    await api.put('/notifications/read-all');
    loadNotifications();
}
