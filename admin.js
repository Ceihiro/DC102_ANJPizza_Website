// AnJ Pizza - admin.js
// Connected to PHP/MySQL backend

var API = {
    auth: 'api/auth.php',
    menu: 'api/menu.php',
    orders: 'api/orders.php'
};

function apiPost(url, data) {
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(function (r) { return r.json(); });
}

function apiGet(url) {
    return fetch(url).then(function (r) { return r.json(); });
}


// Login
function doLogin() {
    var user = document.getElementById('login-user').value.trim();
    var pass = document.getElementById('login-pass').value;

    if (!user || !pass) {
        document.getElementById('login-err').textContent = 'Please enter username and password.';
        return;
    }

    var btn = document.querySelector('#login-page .btn-red');
    if (btn) { btn.disabled = true; btn.textContent = 'Signing in...'; }

    apiPost(API.auth + '?action=login', { username: user, password: pass })
        .then(function (res) {
            if (res.success) {
                document.getElementById('login-page').style.display = 'none';
                var ap = document.getElementById('admin-page');
                ap.style.display = 'flex';
                ap.style.flexDirection = 'column';
                loadAllData();
                startAutoRefresh();
            } else {
                document.getElementById('login-err').textContent =
                    res.error || 'Incorrect username or password.';
                document.getElementById('login-pass').value = '';
            }
        })
        .catch(function () {
            document.getElementById('login-err').textContent = 'Connection error. Is XAMPP running?';
        })
        .finally(function () {
            if (btn) { btn.disabled = false; btn.textContent = 'Login'; }
        });
}

function doLogout() {
    apiGet(API.auth + '?action=logout').then(function () {
        stopAutoRefresh();
        document.getElementById('admin-page').style.display = 'none';
        document.getElementById('login-page').style.display = 'flex';
        document.getElementById('login-user').value = '';
        document.getElementById('login-pass').value = '';
        document.getElementById('login-err').textContent = '';
    });
}

// Check if already logged in on page load
window.addEventListener('DOMContentLoaded', function () {
    apiGet(API.auth + '?action=check').then(function (res) {
        if (res.logged_in) {
            document.getElementById('login-page').style.display = 'none';
            var ap = document.getElementById('admin-page');
            ap.style.display = 'flex';
            ap.style.flexDirection = 'column';
            loadAllData();
            startAutoRefresh();
        }
    });
});


// Tab switcher
function switchTab(name, btn) {
    document.querySelectorAll('.tab-panel').forEach(function (el) { el.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function (el) { el.classList.remove('active'); });
    document.getElementById('tab-' + name).classList.add('active');
    btn.classList.add('active');
}

// Collapse / expand a right pane
function togglePane(paneId, bodyId, iconId) {
    var pane = document.getElementById(paneId);
    var body = document.getElementById(bodyId);
    var icon = document.getElementById(iconId);
    var collapsed = pane.classList.toggle('pane-collapsed');
    body.style.display = collapsed ? 'none' : '';
    icon.innerHTML = collapsed ? '&#9658;' : '&#9660;';
}


// Load all data on login
function loadAllData() {
    renderOrders();
    renderPizzas();
    renderAddons();
    loadCode();
}


// Auto-refresh orders every 10 seconds (active orders tab)
var refreshTimer;

function startAutoRefresh() {
    refreshTimer = setInterval(function () {
        var ordersTab = document.getElementById('tab-orders');
        if (ordersTab && ordersTab.classList.contains('active')) {
            renderOrders(true);
        }
    }, 10000);
}

function stopAutoRefresh() {
    clearInterval(refreshTimer);
}


// Orders — renders into TWO lists: active and all
function renderOrders(silent) {
    var activeList = document.getElementById('orders-active-list');
    var allList = document.getElementById('orders-all-list');
    var activeBadge = document.getElementById('active-count');
    var allBadge = document.getElementById('all-count');

    if (!silent) {
        activeList.innerHTML = '<div class="no-orders">Loading...</div>';
        allList.innerHTML = '<div class="no-orders">Loading...</div>';
    }

    // Fetch ALL orders 
    apiGet(API.orders + '?action=get_orders&status=all')
        .then(function (res) {
            if (!res.success) {
                activeList.innerHTML = '<div class="no-orders">Failed to load orders.</div>';
                allList.innerHTML = '<div class="no-orders">Failed to load orders.</div>';
                return;
            }

            var all = res.orders;
            // Active = orders still being worked on
            var active = all.filter(function (o) {
                return o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready';
            });
            // History = ONLY completed (Done) orders
            var history = all.filter(function (o) {
                return o.status === 'Done';
            });

            // Update badges
            activeBadge.textContent = active.length + ' order' + (active.length !== 1 ? 's' : '');
            allBadge.textContent = history.length + ' order' + (history.length !== 1 ? 's' : '');

            // Render active
            if (active.length === 0) {
                activeList.innerHTML = '<div class="no-orders">No active orders right now.</div>';
            } else {
                activeList.innerHTML = '';
                active.forEach(function (order) {
                    activeList.appendChild(buildOrderCard(order, false));
                });
            }

            // Render history (Done orders only)
            if (history.length === 0) {
                allList.innerHTML = '<div class="no-orders">No completed orders yet.</div>';
            } else {
                allList.innerHTML = '';
                history.forEach(function (order) {
                    allList.appendChild(buildOrderCard(order, true));
                });
            }
        })
        .catch(function () {
            if (!silent) {
                activeList.innerHTML = '<div class="no-orders">Connection error.</div>';
                allList.innerHTML = '<div class="no-orders">Connection error.</div>';
            }
        });
}

function buildOrderCard(order, isHistory) {
    var items = '';
    order.items.forEach(function (item) {
        var sub = (parseFloat(item.price) * parseInt(item.qty)).toFixed(2);
        items += '<div class="oi-row"><span>' + item.item_name + ' x' + item.qty +
            '</span><span>₱' + sub + '</span></div>';
    });
    items += '<div class="oi-total"><span>Total</span><span>₱' +
        parseFloat(order.total).toFixed(2) + '</span></div>';

    var actions = '';
    if (!isHistory || (order.status !== 'Done' && order.status !== 'Cancelled')) {
        if (order.status === 'Pending') {
            actions =
                '<button class="btn-action btn-preparing" onclick="setStatus(' + order.id +
                ',\'Preparing\')">✔ Confirm & Prepare</button>' +
                '<button class="btn-action btn-done" onclick="cancelOrder(' + order.id +
                ')">Cancel</button>';
        } else if (order.status === 'Preparing') {
            actions = '<button class="btn-action btn-ready" onclick="setStatus(' + order.id +
                ',\'Ready\')">Mark as Ready</button>';
        } else if (order.status === 'Ready') {
            actions = '<button class="btn-action btn-done" onclick="setStatus(' + order.id +
                ',\'Done\')">✔ Mark as Done</button>';
        }
    }

    if (!actions && (order.status === 'Done' || order.status === 'Cancelled')) {
        actions = '<span style="font-size:.75rem;color:#aaa">' +
            (order.status === 'Done' ? 'Completed' : 'Cancelled') + '</span>';
    }

    var statusClass = 's-new';
    if (order.status === 'Preparing') statusClass = 's-preparing';
    if (order.status === 'Ready') statusClass = 's-ready';
    if (order.status === 'Done') statusClass = 's-done';
    if (order.status === 'Cancelled') statusClass = 's-cancelled';

    var timeStr = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var dateStr = new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });

    var card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML =
        '<div class="oc-head">' +
        '<div>' +
        '<div class="oc-num">Order ' + order.order_number + '</div>' +
        '<div class="oc-time">' + dateStr + ' · ' + timeStr + '</div>' +
        '</div>' +
        '<span class="oc-status ' + statusClass + '">' + order.status + '</span>' +
        '</div>' +
        '<div class="oc-body">' +
        items +
        (actions ? '<div class="oc-actions">' + actions + '</div>' : '') +
        '</div>';
    return card;
}

function setStatus(id, status) {
    apiPost(API.orders + '?action=update_status', { id: id, status: status })
        .then(function (res) {
            if (res.success) {
                renderOrders();
                showToast('Order marked as ' + status);
            } else {
                showToast(res.error || 'Failed to update.');
            }
        });
}

function cancelOrder(id) {
    if (!confirm('Cancel this order?')) return;
    apiPost(API.orders + '?action=cancel_order', { id: id })
        .then(function (res) {
            if (res.success) {
                renderOrders();
                showToast('Order cancelled.');
            } else {
                showToast(res.error || 'Failed to cancel.');
            }
        });
}


function toggleAddon(id) {
    apiPost(API.menu + '?action=toggle_addon', { id: id })
        .then(function (res) {
            if (res.success) {
                renderAddons();
                showToast(res.message || 'Add-on updated.');
            } else {
                showToast(res.error || 'Failed to update. Make sure the addons table has an "available" column.');
            }
        });
}

// Pizza CRUD (edit only)
function editPizza(id, name, price, badge) {
    var rows = document.getElementById('pizza-tbody').querySelectorAll('tr');
    rows.forEach(function (row) {
        if (row.dataset.id == id) {
            row.classList.add('edit-row');
            row.innerHTML =
                '<td><input class="edit-inp" id="ep-n" value="' + escHtml(name) + '"/></td>' +
                '<td><input class="edit-inp" id="ep-p" type="number" value="' + price +
                '" style="width:80px"/></td>' +
                '<td><input class="edit-inp" id="ep-b" value="' + escHtml(badge || '') + '"/></td>' +
                '<td>—</td>' +  // status col placeholder
                '<td><div class="td-actions">' +
                '<button class="btn-save" onclick="savePizza(' + id + ')">Save</button>' +
                '<button class="btn-cancel" onclick="renderPizzas()">Cancel</button>' +
                '</div></td>';
        }
    });
}

function savePizza(id) {
    var n = document.getElementById('ep-n').value.trim();
    var p = document.getElementById('ep-p').value.trim();
    var b = document.getElementById('ep-b').value.trim();
    if (!n || !p) { showToast('Name and price required.'); return; }
    apiPost(API.menu + '?action=edit_pizza', { id: id, name: n, price: p, badge: b })
        .then(function (res) {
            if (res.success) { renderPizzas(); showToast('Pizza updated.'); }
            else showToast(res.error || 'Failed to update.');
        });
}

function togglePizza(id) {
    apiPost(API.menu + '?action=toggle_pizza', { id: id })
        .then(function (res) {
            if (res.success) {
                renderPizzas();
                showToast(res.message || 'Pizza updated.');
            } else {
                showToast(res.error || 'Failed to update.');
            }
        });
}

function renderPizzas() {
    var tbody = document.getElementById('pizza-tbody');
    var badge = document.getElementById('pizza-count');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:#aaa">Loading...</td></tr>';

    apiGet(API.menu + '?action=get_pizzas').then(function (res) {
        tbody.innerHTML = '';
        if (!res.success || res.pizzas.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No pizzas found.</td></tr>';
            if (badge) badge.textContent = '0 items';
            return;
        }
        if (badge) badge.textContent = res.pizzas.length + ' items';

        res.pizzas.forEach(function (p) {
            var safeName = p.name.replace(/'/g, "\\'");
            var safeBadge = (p.badge || '').replace(/'/g, "\\'");
            var isAvail = (p.available == 1 || p.available === undefined);

            var tr = document.createElement('tr');
            tr.dataset.id = p.id;
            if (!isAvail) tr.style.opacity = '0.55';

            var availBtn = isAvail
                ? '<button class="avail-toggle-on" onclick="togglePizza(' + p.id + ')">Available</button>'
                : '<button class="avail-toggle-off" onclick="togglePizza(' + p.id + ')">Unavailable</button>';

            tr.innerHTML =
                '<td class="td-name">' + escHtml(p.name) +
                (!isAvail ? '<span class="unavail-tag">[HIDDEN]</span>' : '') +
                '</td>' +
                '<td class="td-price">₱' + parseFloat(p.price).toFixed(2) + '</td>' +
                '<td class="td-badge">' +
                (p.badge ? '<span>' + escHtml(p.badge) + '</span>' : '<span style="color:#ccc">—</span>') +
                '</td>' +
                '<td>' + availBtn + '</td>' +
                '<td><div class="td-actions">' +
                '<button class="btn-edit" onclick="editPizza(' + p.id + ',\'' + safeName +
                '\',' + p.price + ',\'' + safeBadge + '\')">Edit</button>' +
                '</div></td>';
            tbody.appendChild(tr);
        });
    });
}


// Add-on CRUD (edit only)
function editAddon(id, name, price) {
    var rows = document.getElementById('addon-tbody').querySelectorAll('tr');
    rows.forEach(function (row) {
        if (row.dataset.id == id) {
            row.classList.add('edit-row');
            row.innerHTML =
                '<td><input class="edit-inp" id="ea-n" value="' + escHtml(name) + '"/></td>' +
                '<td><input class="edit-inp" id="ea-p" type="number" value="' + price +
                '" style="width:90px"/></td>' +
                '<td>—</td>' +
                '<td><div class="td-actions">' +
                '<button class="btn-save" onclick="saveAddon(' + id + ')">Save</button>' +
                '<button class="btn-cancel" onclick="renderAddons()">Cancel</button>' +
                '</div></td>';
        }
    });
}

function saveAddon(id) {
    var n = document.getElementById('ea-n').value.trim();
    var p = document.getElementById('ea-p').value.trim();
    if (!n || !p) { showToast('Name and price required.'); return; }
    apiPost(API.menu + '?action=edit_addon', { id: id, name: n, price: p })
        .then(function (res) {
            if (res.success) { renderAddons(); showToast('Add-on updated.'); }
            else showToast(res.error || 'Failed to update.');
        });
}

function renderAddons() {
    var tbody = document.getElementById('addon-tbody');
    var badge = document.getElementById('addon-count');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:#aaa;font-size:var(--text-base)">Loading...</td></tr>';

    apiGet(API.menu + '?action=get_addons').then(function (res) {
        tbody.innerHTML = '';
        if (!res.success || res.addons.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No add-ons found.</td></tr>';
            if (badge) badge.textContent = '0 items';
            return;
        }
        if (badge) badge.textContent = res.addons.length + ' items';

        res.addons.forEach(function (a) {
            var safeName = a.name.replace(/'/g, "\\'");
            var isAvail = (a.available == 1 || a.available === undefined);

            var availBtn = isAvail
                ? '<button class="avail-toggle-on"  onclick="toggleAddon(' + a.id + ')">Available</button>'
                : '<button class="avail-toggle-off" onclick="toggleAddon(' + a.id + ')">Unavailable</button>';

            var tr = document.createElement('tr');
            tr.dataset.id = a.id;
            if (!isAvail) tr.style.opacity = '0.55';
            tr.innerHTML =
                '<td class="td-name">' + escHtml(a.name) +
                (!isAvail ? '<span class="unavail-tag">[HIDDEN]</span>' : '') +
                '</td>' +
                '<td class="td-price">₱' + parseFloat(a.price).toFixed(2) + '</td>' +
                '<td>' + availBtn + '</td>' +
                '<td><div class="td-actions">' +
                '<button class="btn-edit" onclick="editAddon(' + a.id + ',\'' + safeName +
                '\',' + a.price + ')">Edit</button>' +
                '</div></td>';
            tbody.appendChild(tr);
        });
    });
}


// Settings
function loadCode() {
    apiGet(API.orders + '?action=get_code').then(function (res) {
        if (res.success) document.getElementById('code-display').textContent = res.code;
    });
}

function updateCode() {
    var val = document.getElementById('new-code').value.trim();
    if (!val) { showToast('Please enter a new code.'); return; }
    apiPost(API.orders + '?action=update_code', { code: val })
        .then(function (res) {
            if (res.success) {
                document.getElementById('code-display').textContent = val;
                document.getElementById('new-code').value = '';
                showToast('Order code updated to: ' + val);
            } else {
                showToast(res.error || 'Failed to update code.');
            }
        });
}

function changePassword() {
    var curr = document.getElementById('pw-curr').value;
    var newpw = document.getElementById('pw-new').value;
    var conf = document.getElementById('pw-conf').value;
    var msg = document.getElementById('pw-msg');
    apiPost(API.auth + '?action=change_password', { current: curr, new: newpw, confirm: conf })
        .then(function (res) {
            if (res.success) {
                msg.className = 'pw-msg ok';
                msg.textContent = res.message || 'Password updated successfully.';
                document.getElementById('pw-curr').value = '';
                document.getElementById('pw-new').value = '';
                document.getElementById('pw-conf').value = '';
            } else {
                msg.className = 'pw-msg err';
                msg.textContent = res.error || 'Failed to update password.';
            }
        });
}

function changeUsername() {
    var newun = document.getElementById('un-new').value.trim();
    var pass = document.getElementById('un-pass').value;
    var msg = document.getElementById('un-msg');
    if (!newun) {
        msg.className = 'pw-msg err';
        msg.textContent = 'Please enter a new username.';
        return;
    }
    apiPost(API.auth + '?action=change_username', { new_username: newun, password: pass })
        .then(function (res) {
            if (res.success) {
                msg.className = 'pw-msg ok';
                msg.textContent = res.message || 'Username updated successfully.';
                document.getElementById('un-new').value = '';
                document.getElementById('un-pass').value = '';
            } else {
                msg.className = 'pw-msg err';
                msg.textContent = res.error || 'Failed to update username.';
            }
        });
}

function resetOrderCounter() {
    if (!confirm('Reset order counter to 0? Next order will be #0001. This does NOT delete existing orders.')) return;
    apiPost(API.orders + '?action=reset_counter', {})
        .then(function (res) {
            if (res.success) showToast('Order counter reset.');
            else showToast(res.error || 'Failed to reset.');
        });
}

function clearAllHistory() {
    if (!confirm('Delete ALL orders from the database? This cannot be undone.')) return;
    if (!confirm('Are you sure? ALL order history will be permanently deleted.')) return;
    apiPost(API.orders + '?action=clear_all', {})
        .then(function (res) {
            if (res.success) {
                renderOrders();
                showToast(res.message || 'All orders cleared.');
            } else {
                showToast(res.error || 'Failed to clear orders.');
            }
        });
}


// Helpers
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}


// Toast
var toastTimer;
function showToast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2400);
}