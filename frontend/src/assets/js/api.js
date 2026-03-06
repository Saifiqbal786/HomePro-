// HomePro API Service Layer
const API_BASE = '/api';

function getToken() {
    return localStorage.getItem('homepro_token');
}

function setToken(token) {
    localStorage.setItem('homepro_token', token);
}

function removeToken() {
    localStorage.removeItem('homepro_token');
    localStorage.removeItem('homepro_user');
}

function getUser() {
    const u = localStorage.getItem('homepro_user');
    return u ? JSON.parse(u) : null;
}

function setUser(user) {
    localStorage.setItem('homepro_user', JSON.stringify(user));
}

async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = { ...options.headers };
    if (!options.isFormData) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        const data = await res.json();
        if (!res.ok) {
            if (res.status === 401) {
                removeToken();
                window.location.href = '/src/pages/auth/login.html';
                return;
            }
            throw new Error(data.error || data.errors?.join(', ') || 'Request failed');
        }
        return data;
    } catch (err) {
        console.error(`API Error [${endpoint}]:`, err.message);
        throw err;
    }
}

// Convenience methods
const api = {
    get: (url) => apiRequest(url, { method: 'GET' }),
    post: (url, body) => apiRequest(url, { method: 'POST', body: JSON.stringify(body) }),
    postForm: (url, formData) => apiRequest(url, { method: 'POST', body: formData, isFormData: true }),
    put: (url, body) => apiRequest(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
    delete: (url) => apiRequest(url, { method: 'DELETE' }),
};

// Toast notification
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
