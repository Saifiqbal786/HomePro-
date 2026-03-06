document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial Authentication Check
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

    // 2. Fetch Dashboard Statistics
    try {
        const response = await fetch('/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch admin stats');
        }

        const data = await response.json();

        // Update KPI Cards
        document.getElementById('statHomeowners').textContent = data.stats.totalUsers;
        document.getElementById('statWorkers').textContent = data.stats.totalWorkers;
        document.getElementById('statTasks').textContent = data.stats.totalTasks;

        // Format Currency
        const currencyFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        });
        document.getElementById('statRevenue').textContent = currencyFormatter.format(data.stats.totalRevenue);

        // Populate Table
        const tbody = document.getElementById('recentTasksTable');
        tbody.innerHTML = '';

        if (data.recentTasks && data.recentTasks.length > 0) {
            data.recentTasks.forEach(task => {
                const statusColors = {
                    'pending': 'bg-yellow-100 text-yellow-800',
                    'accepted': 'bg-blue-100 text-blue-800',
                    'in_progress': 'bg-indigo-100 text-indigo-800',
                    'completed': 'bg-green-100 text-green-800',
                    'cancelled': 'bg-red-100 text-red-800'
                };

                const statusBadge = `
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status] || 'bg-gray-100 text-gray-800'}">
                        ${task.status.replace('_', ' ')}
                    </span>
                `;

                const dateStr = new Date(task.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">${task.homeowner_name || 'Unknown'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-gray-500">${task.worker_name || 'Unknown'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-gray-500 capitalize">${task.service_type || 'General'}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-gray-500 text-xs">${dateStr}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No recent tasks found on the platform.</td></tr>`;
        }

    } catch (err) {
        console.error(err);
        document.getElementById('recentTasksTable').innerHTML = `
            <tr><td colspan="5" class="px-6 py-8 text-center text-red-500">
                <i class="fas fa-exclamation-triangle mr-2"></i> Error loading dashboard data
            </td></tr>
        `;
    }

    // 3. Handlers
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('homepro_token');
        localStorage.removeItem('homepro_user');
        window.location.href = '../auth/login.html';
    });
});
