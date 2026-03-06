document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('homepro_token');
    const user = JSON.parse(localStorage.getItem('homepro_user') || '{}');

    if (!token || user.role !== 'admin') {
        alert('Unauthorized access. Admin privileges required.');
        window.location.href = '../auth/login.html';
        return;
    }

    // Header Display
    document.getElementById('adminNameDisplay').textContent = user.name;
    if (user.avatar) document.getElementById('adminAvatar').src = user.avatar;

    // Load users
    async function loadUsers(role = '') {
        try {
            const tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i> Loading users...</td></tr>';

            const url = role ? `/api/admin/users?role=${role}` : '/api/admin/users';
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });

            if (!response.ok) throw new Error('Failed to fetch users');

            const data = await response.json();

            document.getElementById('totalUsersCount').textContent = `${data.total} Users Found`;
            tbody.innerHTML = '';

            if (data.users && data.users.length > 0) {
                data.users.forEach(u => {
                    const dateStr = new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                    const roleBadgeColor = u.role === 'admin' ? 'bg-purple-100 text-purple-800' : (u.role === 'worker' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800');
                    const statusDot = u.is_online ? '<span class="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></span>' : '<span class="w-2.5 h-2.5 rounded-full bg-gray-300 mr-2"></span>';

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">${u.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-gray-500">${u.email}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-gray-500 capitalize"><span class="px-2 py-1 text-xs font-medium rounded-full ${roleBadgeColor}">${u.role}</span></td>
                        <td class="px-6 py-4 whitespace-nowrap text-gray-500">${u.phone || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-gray-500 flex items-center">${statusDot}${u.is_online ? 'Online' : 'Offline'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-gray-500 text-xs">${dateStr}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No users found.</td></tr>`;
            }
        } catch (err) {
            console.error(err);
            document.getElementById('usersTableBody').innerHTML = `
                <tr><td colspan="6" class="px-6 py-8 text-center text-red-500">
                    <i class="fas fa-exclamation-triangle mr-2"></i> Error loading users data
                </td></tr>
            `;
        }
    }

    // Role filter change
    document.getElementById('roleFilter').addEventListener('change', (e) => {
        loadUsers(e.target.value);
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('homepro_token');
        localStorage.removeItem('homepro_user');
        window.location.href = '../auth/login.html';
    });

    // Add User logic reused from admin.js
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('addUserBtn');
            const originalText = btn.textContent;
            btn.textContent = 'Creating...';
            btn.disabled = true;

            try {
                const res = await fetch('/api/admin/add-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        name: document.getElementById('addUserName').value,
                        email: document.getElementById('addUserEmail').value,
                        password: document.getElementById('addUserPassword').value,
                        phone: document.getElementById('addUserPhone').value,
                        role: document.getElementById('addUserRole').value
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to create user');

                alert(`Success: ${data.message}`);
                document.getElementById('addUserModal').classList.add('hidden');
                addUserForm.reset();
                loadUsers(document.getElementById('roleFilter').value); // Refresh table
            } catch (err) {
                alert(`Error: ${err.message}`);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    loadUsers();
});
