// Auth utilities

async function login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    if (data && data.token) {
        setToken(data.token);
        setUser(data.user);
        redirectByRole(data.user.role);
    }
    return data;
}

async function register(dataOrForm) {
    const isForm = dataOrForm instanceof FormData;
    const data = isForm ? await api.postForm('/auth/register', dataOrForm) : await api.post('/auth/register', dataOrForm);
    // Note: Registration now requires OTP verification, so we don't log in immediately
    return data;
}

async function verifyOtp(email, otp) {
    const data = await api.post('/auth/verify-otp', { email, otp });
    if (data && data.token) {
        setToken(data.token);
        setUser(data.user);
        redirectByRole(data.user.role);
    }
    return data;
}

async function resendOtp(email) {
    return await api.post('/auth/resend-otp', { email });
}

function logout() {
    removeToken();
    window.location.href = '/src/pages/auth/login.html';
}

function redirectByRole(role) {
    if (role === 'homeowner') {
        window.location.href = '/src/pages/homeowner/search-workers.html';
    } else if (role === 'worker') {
        window.location.href = '/src/pages/worker/dashboard.html';
    } else if (role === 'admin') {
        window.location.href = '/src/pages/admin/dashboard.html';
    }
}

function requireAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = '/src/pages/auth/login.html';
        return false;
    }
    return true;
}

function requireRole(role) {
    const user = getUser();
    if (!user || user.role !== role) {
        redirectByRole(user?.role || 'homeowner');
        return false;
    }
    return true;
}

function isLoggedIn() {
    return !!getToken();
}
