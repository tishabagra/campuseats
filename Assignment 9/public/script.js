const API_URL = '';

let token = sessionStorage.getItem('catalogueToken');
let currentUser = null;

// Decode the role from the JWT payload.
// The backend still performs the actual authorization checks.
function getUserFromToken(jwtToken) {
    try {
        const payload = jwtToken.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(base64));
        return {
            id: Number(decoded.sub),
            role: decoded.role
        };
    } catch {
        return null;
    }
}

// Escape text before inserting it into HTML.
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function showMessage(message, type = 'info') {
    const box = document.getElementById('message');
    box.textContent = message;
    box.className = `message ${type}`;
}

function hideMessage() {
    document.getElementById('message').className = 'message hidden';
}

// Common API function.
// It automatically attaches the JWT to protected requests.
async function apiRequest(path, options = {}) {
    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (options.body) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(API_URL + path, {
        ...options,
        headers
    });

    if (response.status === 401 && token) {
        logout(false);
        throw new Error('Your session has expired. Please log in again.');
    }

    if (response.status === 204) {
        return null;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
    }

    return data;
}

// Switch between login and dashboard.
function showDashboard() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('userInfo').classList.remove('hidden');

    const role = currentUser.role;

    document.getElementById('roleLabel').textContent = role;
    document.getElementById('welcomeTitle').textContent =
        `Welcome, ${role.charAt(0).toUpperCase() + role.slice(1)}!`;

    if (role === 'customer') {
        document.getElementById('welcomeText').textContent =
            'Browse the menu and view your own orders.';
    } else if (role === 'restaurant') {
        document.getElementById('welcomeText').textContent =
            'Manage the food menu by adding or deleting dishes.';
    } else {
        document.getElementById('welcomeText').textContent =
            'Manage the catalogue and view all customer orders.';
    }

    const canManageMenu = role === 'restaurant' || role === 'admin';
    const canViewOrders = role === 'customer' || role === 'admin';

    document.getElementById('addDishPanel')
        .classList.toggle('hidden', !canManageMenu);

    document.getElementById('ordersPanel')
        .classList.toggle('hidden', !canViewOrders);

    if (canViewOrders) {
        document.getElementById('ordersTitle').textContent =
            role === 'admin' ? 'All Customer Orders' : 'My Orders';

        document.getElementById('ordersDescription').textContent =
            role === 'admin'
                ? 'View orders placed by all customers.'
                : 'Only your own orders are displayed.';
    }

    loadMenu();

    if (canViewOrders) {
        loadOrders();
    }
}

function showLogin() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('userInfo').classList.add('hidden');
}

// Login
document.getElementById('loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    hideMessage();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
        const result = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        token = result.token;
        sessionStorage.setItem('catalogueToken', token);

        currentUser = getUserFromToken(token);

        if (!currentUser) {
            throw new Error('Could not read login information.');
        }

        document.getElementById('loginForm').reset();
        showDashboard();
        showMessage('Login successful!', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Load all menu items.
async function loadMenu() {
    const menuList = document.getElementById('menuList');
    menuList.textContent = 'Loading menu...';

    try {
        const items = await apiRequest('/items');
        const canDelete =
            currentUser.role === 'restaurant' || currentUser.role === 'admin';

        if (items.length === 0) {
            menuList.innerHTML = '<p class="empty">No dishes available.</p>';
            return;
        }

        menuList.innerHTML = items.map(item => `
            <div class="dish">
                <div class="dish-top">
                    <span class="dish-name">${escapeHTML(item.name)}</span>
                    <span class="dish-price">₹${escapeHTML(item.price)}</span>
                </div>
                <p class="muted">Dish ID: ${escapeHTML(item.id)}</p>
                ${canDelete ? `
                    <button class="delete-btn" type="button"
                            data-delete-id="${escapeHTML(item.id)}">
                        Delete dish
                    </button>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        menuList.textContent = error.message;
    }
}

// Add a dish.
document.getElementById('addForm').addEventListener('submit', async event => {
    event.preventDefault();
    hideMessage();

    const name = document.getElementById('name').value.trim();
    const price = Number(document.getElementById('price').value);

    if (!name || !Number.isFinite(price) || price < 0) {
        showMessage('Enter a valid dish name and price.', 'error');
        return;
    }

    try {
        await apiRequest('/items', {
            method: 'POST',
            body: JSON.stringify({ name, price })
        });

        event.target.reset();
        showMessage('Dish added successfully!', 'success');
        await loadMenu();
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Delete a dish using event delegation.
document.getElementById('menuList').addEventListener('click', async event => {
    const button = event.target.closest('[data-delete-id]');

    if (!button) return;

    const id = button.dataset.deleteId;

    if (!confirm('Are you sure you want to delete this dish?')) {
        return;
    }

    try {
        await apiRequest(`/items/${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });

        showMessage('Dish deleted successfully!', 'success');
        await loadMenu();
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Load orders.
// The backend decides which orders the logged-in user is allowed to see.
async function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    ordersList.textContent = 'Loading orders...';

    try {
        const orders = await apiRequest('/orders');

        if (orders.length === 0) {
            ordersList.innerHTML = '<p class="empty">No orders found.</p>';
            return;
        }

        ordersList.innerHTML = orders.map(order => `
            <div class="order-card">
                <p><strong>Order ID:</strong> ${escapeHTML(order.id)}</p>
                <p><strong>Dish:</strong> ${escapeHTML(order.item)}</p>
                <p><strong>Quantity:</strong> ${escapeHTML(order.quantity)}</p>
                <p><strong>Total:</strong> ₹${escapeHTML(order.total)}</p>
                ${currentUser.role === 'admin' ? `
                    <p><strong>Customer ID:</strong>
                        ${escapeHTML(order.customerId)}
                    </p>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        ordersList.textContent = error.message;
    }
}

// Find one order by ID.
// The backend checks whether the customer owns that order.
document.getElementById('orderLookupForm').addEventListener('submit', async event => {
    event.preventDefault();

    const id = document.getElementById('orderId').value.trim();
    const resultBox = document.getElementById('singleOrderResult');

    resultBox.textContent = 'Searching...';

    try {
        const order = await apiRequest(`/orders/${encodeURIComponent(id)}`);

        resultBox.innerHTML = `
            <div class="order-card">
                <p><strong>Order ID:</strong> ${escapeHTML(order.id)}</p>
                <p><strong>Dish:</strong> ${escapeHTML(order.item)}</p>
                <p><strong>Quantity:</strong> ${escapeHTML(order.quantity)}</p>
                <p><strong>Total:</strong> ₹${escapeHTML(order.total)}</p>
                ${currentUser.role === 'admin' ? `
                    <p><strong>Customer ID:</strong>
                        ${escapeHTML(order.customerId)}
                    </p>
                ` : ''}
            </div>
        `;
    } catch (error) {
        resultBox.textContent = error.message;
    }
});

// Refresh buttons.
document.getElementById('refreshMenuBtn').addEventListener('click', loadMenu);
document.getElementById('refreshOrdersBtn').addEventListener('click', loadOrders);

// Logout.
function logout(showMessageAfter = true) {
    token = null;
    currentUser = null;
    sessionStorage.removeItem('catalogueToken');

    showLogin();

    document.getElementById('menuList').innerHTML = '';
    document.getElementById('ordersList').innerHTML = '';
    document.getElementById('singleOrderResult').innerHTML = '';

    if (showMessageAfter) {
        showMessage('You have been logged out.', 'success');
    }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    logout();
});

// Restore the session after a page refresh if the token is still valid.
if (token) {
    currentUser = getUserFromToken(token);

    if (currentUser) {
        showDashboard();
    } else {
        logout(false);
    }
} else {
    showLogin();
}