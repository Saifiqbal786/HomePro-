// Socket.IO Chat Client
let socket = null;

function initChat() {
    const token = getToken();
    if (!token || socket) return;

    socket = io(window.location.origin, {
        auth: { token },
    });

    socket.on('connect', () => {
        console.log('[Chat] Connected');
    });

    socket.on('newMessage', (message) => {
        // Dispatch custom event so pages can handle it
        window.dispatchEvent(new CustomEvent('chatMessage', { detail: message }));
        // Show notification if not on chat page
        if (!window.location.pathname.includes('chat')) {
            showToast(`New message from ${message.sender_name}`, 'info');
        }
    });

    socket.on('userTyping', (data) => {
        window.dispatchEvent(new CustomEvent('chatTyping', { detail: data }));
    });

    socket.on('userOnline', (data) => {
        window.dispatchEvent(new CustomEvent('userOnline', { detail: data }));
    });

    socket.on('notification', (data) => {
        window.dispatchEvent(new CustomEvent('newNotification', { detail: data }));
        showToast(data.message || 'New notification', 'info');
    });

    socket.on('disconnect', () => {
        console.log('[Chat] Disconnected');
    });
}

function sendMessage(receiverId, content, callback) {
    if (!socket) return;
    socket.emit('sendMessage', { receiver_id: receiverId, content }, callback);
}

function sendTyping(receiverId, typing) {
    if (!socket) return;
    socket.emit('typing', { receiver_id: receiverId, typing });
}

function disconnectChat() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
