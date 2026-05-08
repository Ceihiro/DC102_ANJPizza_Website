// AnJ Pizza - index.js
// Connected to PHP/MySQL backend

var API = {
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

// ── Peso sign
var PESO = '₱';

// ── Data loaded from database
var MENU = [];
var ADDONS = [];

var IMG_MAP = {
    'Cheesy Pizza': 'cp', 'Ham & Cheese': 'hc',
    'Hawaiian': 'h', 'Veggies': 'v',
    'Delight': 'd', 'Pepperoni': 'p',
    'Beef w/ Ham': 'bh', 'Bacon w/ Ham': 'b',
    'Supreme': 's', 'AnJ Pizza': 'anj',
    'Best Overload': 'bo', 'All Meat': 'am'
};

var INGR_MAP = {
    'Cheesy Pizza': 'Homemade dough, tomato sauce, cheese',
    'Ham & Cheese': 'Homemade dough, tomato sauce, cheese, ham slices',
    'Hawaiian': 'Homemade dough, tomato sauce, cheese, pineapple, ham slices',
    'Veggies': 'Homemade dough, tomato sauce, cheese, mushroom, bell pepper, pineapple, onion',
    'Delight': 'Homemade dough, tomato sauce, cheese, mushroom, ham slices, pineapple, bell pepper, onion',
    'Pepperoni': 'Homemade dough, tomato sauce, cheese, pepperoni, bell pepper, pineapple, onion',
    'Beef w/ Ham': 'Homemade dough, tomato sauce, cheese, ham slices, beef, pineapple, bell pepper, onion',
    'Bacon w/ Ham': 'Homemade dough, tomato sauce, cheese, ham slices, bacon, pineapple, bell pepper, onion',
    'Supreme': 'Homemade dough, tomato sauce, cheese, mushroom, beef, pineapple, bell pepper, onion',
    'AnJ Pizza': 'Homemade dough, tomato sauce, cheese, bacon, beef, mushroom, pineapple, bell pepper, onion',
    'Best Overload': 'Homemade dough, tomato sauce, cheese, bacon, beef, ham slices, mushroom, pineapple, bell pepper, onion',
    'All Meat': 'Homemade dough, tomato sauce, ham slices, beef, bacon, pepperoni'
};

function loadMenu() {
    return Promise.all([
        apiGet(API.menu + '?action=get_pizzas'),
        apiGet(API.menu + '?action=get_addons')
    ]).then(function (results) {
        if (results[0].success) {
            MENU = results[0].pizzas.map(function (p) {
                return {
                    id: p.id,
                    name: p.name,
                    price: parseFloat(p.price),
                    badge: p.badge || '',
                    available: p.available,
                    img: 'images/pizzas/' + (IMG_MAP[p.name] || 'cp') + '.jpg',
                    ingr: INGR_MAP[p.name] || 'Homemade dough, tomato sauce, cheese'
                };
            });
        }
        if (results[1].success) {
            ADDONS = results[1].addons.map(function (a) {
                return { id: a.id, name: a.name, price: parseFloat(a.price), available: a.available };
            });
        }
    });
}


// ── Kiosk session via localStorage
function saveKioskSession() {
    localStorage.setItem('anj_kiosk', '1');
}

function clearKioskSession() {
    localStorage.removeItem('anj_kiosk');
    localStorage.removeItem('anj_last_order');
    localStorage.removeItem('anj_last_total');
}

function setKioskOpenState(isOpen) {
    document.body.classList.toggle('kiosk-open', !!isOpen);
}

// Exit kiosk and go back to website
// Called when customer clicks the kiosk logo/name
function exitKiosk() {
    clearKioskSession();
    cart = [];
    renderCart();
    document.getElementById('kiosk-app').classList.remove('open');
    document.getElementById('success-screen').classList.remove('open');
    document.getElementById('summary-screen').classList.remove('open');
    document.getElementById('cust-overlay').classList.remove('open');
    document.getElementById('cart-bg').classList.remove('open');
    document.getElementById('cart-drawer').classList.remove('open');
    setKioskOpenState(false);
    clearTimeout(idleTimer);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// On page load - always load from DB so the menu section reflects live admin data
window.addEventListener('DOMContentLoaded', function () {
    var lastOrder = localStorage.getItem('anj_last_order');
    var inKiosk = localStorage.getItem('anj_kiosk');

    // Always fetch menu so the homepage Pizzas / Ingredients / Add-Ons tabs are live
    loadMenu().then(function () {
        buildMenuSection();

        if (lastOrder) {
            // Just placed an order - show their number again
            document.getElementById('kiosk-app').classList.add('open');
            setKioskOpenState(true);
            showSuccess(lastOrder, localStorage.getItem('anj_last_total') || 0, true);
        } else if (inKiosk) {
            // Was browsing kiosk - bring back to menu without code
            buildKiosk();
            document.getElementById('kiosk-app').classList.add('open');
            setKioskOpenState(true);
            resetIdle();
        }
    });
});


// Idle timeout (5 minutes)
var idleTimer;
var IDLE_MS = 5 * 60 * 1000;

function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
        if (document.getElementById('kiosk-app').classList.contains('open')) {
            showIdleWarning();
        }
    }, IDLE_MS);
}

function showIdleWarning() {
    var overlay = document.getElementById('idle-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
    var countdown = 15;
    var el = document.getElementById('idle-count');
    if (el) el.textContent = countdown;
    var timer = setInterval(function () {
        countdown--;
        if (el) el.textContent = countdown;
        if (countdown <= 0) { clearInterval(timer); resetKiosk(); }
    }, 1000);
    overlay._timer = timer;
}

function cancelIdle() {
    var overlay = document.getElementById('idle-overlay');
    if (overlay) {
        overlay.classList.remove('open');
        if (overlay._timer) clearInterval(overlay._timer);
    }
    resetIdle();
}

function resetKiosk() {
    var overlay = document.getElementById('idle-overlay');
    if (overlay) {
        overlay.classList.remove('open');
        if (overlay._timer) clearInterval(overlay._timer);
    }
    clearKioskSession();
    document.getElementById('kiosk-app').classList.remove('open');
    document.getElementById('cust-overlay').classList.remove('open');
    document.getElementById('success-screen').classList.remove('open');
    document.getElementById('summary-screen').classList.remove('open');
    document.getElementById('cart-bg').classList.remove('open');
    document.getElementById('cart-drawer').classList.remove('open');
    setKioskOpenState(false);
    cart = [];
    renderCart();
    showToast('Session ended due to inactivity.');
}

['click', 'touchstart', 'keydown'].forEach(function (evt) {
    document.addEventListener(evt, function () {
        if (document.getElementById('kiosk-app').classList.contains('open')) {
            resetIdle();
        }
    }, { passive: true });
});


// Homepage menu tab switcher
function showTab(name, btn) {
    document.querySelectorAll('.tab-panel').forEach(function (el) { el.classList.remove('active'); });
    document.querySelectorAll('.tab').forEach(function (el) { el.classList.remove('active'); });
    document.getElementById('tab-' + name).classList.add('active');
    btn.classList.add('active');
}


// Walk-in gate
function openGate() {
    document.getElementById('gate-input').value = '';
    document.getElementById('gate-err').textContent = '';
    document.getElementById('gate-overlay').classList.add('open');
    setTimeout(function () { document.getElementById('gate-input').focus(); }, 100);
}

function closeGate() {
    document.getElementById('gate-overlay').classList.remove('open');
}

function checkCode() {
    var code = document.getElementById('gate-input').value.trim();
    if (!code) return;

    var btn = document.querySelector('#gate-overlay .btn-red');
    if (btn) { btn.disabled = true; btn.textContent = 'Checking...'; }

    apiPost(API.orders + '?action=verify_code', { code: code })
        .then(function (res) {
            if (res.success) {
                closeGate();
                saveKioskSession();
                loadMenu().then(function () {
                    buildKiosk();
                    document.getElementById('kiosk-app').classList.add('open');
                    setKioskOpenState(true);
                    resetIdle();
                });
            } else {
                document.getElementById('gate-err').textContent =
                    res.error || 'Wrong code. Check the code posted at our counter.';
                document.getElementById('gate-input').value = '';
            }
        })
        .catch(function () {
            document.getElementById('gate-err').textContent = 'Connection error. Please try again.';
        })
        .finally(function () {
            if (btn) { btn.disabled = false; btn.textContent = 'Unlock Ordering'; }
        });
}


// Build kiosk pizza grid
function buildKiosk(category) {
    var grid = document.getElementById('kiosk-grid');
    if (!grid) return;
    grid.innerHTML = '';

    var filtered = MENU.filter(function (pizza) {
        if (!category || category === 'All Pizzas') return true;
        if (category === 'Budget') return pizza.price <= 115;
        if (category === '130-140') return pizza.price >= 130 && pizza.price <= 140;
        if (category === '145-160') return pizza.price >= 145 && pizza.price <= 160;
        return true;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="padding:40px;color:#888;text-align:center">No pizzas available.</p>';
        return;
    }

    filtered.forEach(function (pizza) {
        var isAvail = (pizza.available == 1 || pizza.available === undefined);
        var card = document.createElement('div');
        card.className = 'ki-card' + (!isAvail ? ' ki-unavailable' : '');

        if (!isAvail) {
            // Grayed out, not clickable
            card.style.opacity = '0.45';
            card.style.pointerEvents = 'none';
            card.style.filter = 'grayscale(60%)';
        }

        card.innerHTML =
            (pizza.badge && isAvail ? '<div class="ki-badge">' + pizza.badge + '</div>' : '') +
            (!isAvail ? '<div class="ki-badge" style="background:#888;">Unavailable</div>' : '') +
            '<div class="ki-img"><img src="' + pizza.img + '" alt="' + pizza.name +
            '" onerror="this.style.display=\'none\'"/></div>' +
            '<div class="ki-body">' +
            '<div class="ki-name">' + pizza.name + '</div>' +
            '<div class="ki-footer">' +
            '<span class="ki-price">₱' + pizza.price + '</span>' +
            (isAvail ? '<button class="ki-add">+</button>' : '') +
            '</div></div>';

        if (isAvail) {
            card.addEventListener('click', function () { openCustomize(pizza); });
            card.querySelector('.ki-add').addEventListener('click', function (e) {
                e.stopPropagation();
                openCustomize(pizza);
            });
        }
        grid.appendChild(card);
    });
}

// Build the homepage public Menu section from live DB data
function buildMenuSection() {
    // Pizzas tab
    var pizzaGrid = document.getElementById('menu-pizza-grid');
    if (pizzaGrid) {
        var pizzaLoading = document.getElementById('menu-pizza-loading');
        if (pizzaLoading) pizzaLoading.remove();
        pizzaGrid.querySelectorAll('.mc').forEach(function (el) { el.remove(); });

        MENU.forEach(function (pizza) {
            var imgKey = IMG_MAP[pizza.name] || 'cp';
            var mc = document.createElement('div');
            mc.className = 'mc';
            mc.innerHTML =
                '<div class="mc-img">' +
                (pizza.badge ? '<div class="badge">' + pizza.badge + '</div>' : '') +
                '<img src="images/pizzas/' + imgKey + '.jpg" alt="" onerror="this.style.display=\'none\'" />' +
                '<span>' + pizza.name + '</span>' +
                '</div>' +
                '<div class="mc-body">' +
                '<b>' + pizza.name + '</b>' +
                '<span class="price">' + PESO + pizza.price + '</span>' +
                '</div>';
            pizzaGrid.appendChild(mc);
        });
    }

    // Ingredients tab 
    var ingrGrid = document.getElementById('menu-ingr-grid');
    if (ingrGrid) {
        var ingrLoading = document.getElementById('menu-ingr-loading');
        if (ingrLoading) ingrLoading.remove();
        ingrGrid.querySelectorAll('.ic').forEach(function (el) { el.remove(); });

        MENU.forEach(function (pizza) {
            var imgKey = IMG_MAP[pizza.name] || 'cp';
            var ingr = INGR_MAP[pizza.name] || 'Homemade dough, tomato sauce, cheese';
            var ingrItems = ingr.split(', ').map(function (item) {
                return '<li>' + item.charAt(0).toUpperCase() + item.slice(1) + '</li>';
            }).join('');

            var ic = document.createElement('div');
            ic.className = 'ic';
            ic.innerHTML =
                '<div class="ic-img">' +
                '<img src="images/ingredients/' + imgKey + '.jpg" alt="" onerror="this.style.display=\'none\'" />' +
                '<span>' + pizza.name + '</span>' +
                '</div>' +
                '<div class="ic-body">' +
                '<b>' + pizza.name + '</b>' +
                '<ul>' + ingrItems + '</ul>' +
                '</div>';
            ingrGrid.appendChild(ic);
        });
    }

    // Add-Ons tab (price + name from DB) 
    var addonsGrid = document.getElementById('menu-addons-grid');
    if (addonsGrid) {
        var addonsLoading = document.getElementById('menu-addons-loading');
        if (addonsLoading) addonsLoading.remove();
        addonsGrid.querySelectorAll('.addon-card').forEach(function (el) { el.remove(); });

        ADDONS.forEach(function (addon) {
            var card = document.createElement('div');
            card.className = 'addon-card';
            card.innerHTML =
                '<span>' + addon.name + '</span>' +
                '<span class="red">+ ' + PESO + addon.price + '</span>';
            addonsGrid.appendChild(card);
        });
    }
}

function filterKiosk(category) {
    document.querySelectorAll('.ks-btn').forEach(function (btn) {
        btn.classList.remove('active');
        if (btn.textContent.trim().startsWith(category) ||
            (category === 'All Pizzas' && btn.textContent.trim() === 'All Pizzas')) {
            btn.classList.add('active');
        }
    });
    var title = document.getElementById('kiosk-sec-title');
    if (category === 'All Pizzas') title.textContent = 'All Pizzas';
    else if (category === 'Budget') title.textContent = 'Budget Pizzas';
    else title.textContent = 'Pizzas (' + category + ')';
    buildKiosk(category);
}


// Customize modal
var selectedPizza = null;
var selectedAddons = [];
var selectedQty = 1;

function openCustomize(pizza) {
    selectedPizza = pizza;
    selectedAddons = [];
    selectedQty = 1;

    document.getElementById('cust-img').innerHTML =
        '<img src="' + pizza.img + '" alt="' + pizza.name +
        '" onerror="this.style.display=\'none\'"/>';
    document.getElementById('cust-name').textContent = pizza.name;
    document.getElementById('cust-price').textContent = '₱' + pizza.price;
    document.getElementById('qty-num').textContent = 1;

    var checksEl = document.getElementById('addon-checks');
    checksEl.innerHTML = '';
    ADDONS.filter(function(a) { return a.available == 1 || a.available === undefined; }).forEach(function (addon) {
        var btn = document.createElement('div');
        btn.className = 'adc';
        btn.innerHTML = '<span class="ck"></span>' + addon.name + ' +₱' + addon.price;
        btn.addEventListener('click', function () {
            btn.classList.toggle('sel');
            btn.querySelector('.ck').innerHTML = btn.classList.contains('sel') ? '&#10003;' : '';
            if (btn.classList.contains('sel')) {
                selectedAddons.push(addon);
            } else {
                selectedAddons = selectedAddons.filter(function (a) { return a.name !== addon.name; });
            }
            updateTotal();
        });
        checksEl.appendChild(btn);
    });

    updateTotal();
    document.getElementById('cust-overlay').classList.add('open');
}

function updateTotal() {
    var addonTotal = 0;
    selectedAddons.forEach(function (a) { addonTotal += a.price; });
    document.getElementById('run-total').innerHTML =
        '₱' + ((selectedPizza.price + addonTotal) * selectedQty);
}

function changeQty(n) {
    selectedQty = Math.max(1, Math.min(10, selectedQty + n));
    document.getElementById('qty-num').textContent = selectedQty;
    updateTotal();
}


// Cart
var cart = [];

function addToCart() {
    var addonTotal = 0;
    var addonsLabel = selectedAddons.map(function (a) { return a.name; }).join(', ');
    selectedAddons.forEach(function (a) { addonTotal += a.price; });
    var unitPrice = selectedPizza.price + addonTotal;

    var found = null;
    cart.forEach(function (item) {
        if (item.name === selectedPizza.name && item.addonsLabel === addonsLabel) found = item;
    });
    if (found) {
        found.qty += selectedQty;
    } else {
        cart.push({
            name: selectedPizza.name,
            addonsLabel: addonsLabel,
            addons: selectedAddons.slice(),
            unitPrice: unitPrice,
            qty: selectedQty
        });
    }

    document.getElementById('cust-overlay').classList.remove('open');
    renderCart();
    showToast(selectedPizza.name + ' added to order');
}

function renderCart() {
    var total = 0;
    var totalQty = 0;
    cart.forEach(function (item) { total += item.unitPrice * item.qty; totalQty += item.qty; });

    document.getElementById('cart-count').textContent = totalQty;
    document.getElementById('cart-total').innerHTML = '₱' + total.toFixed(2);
    document.getElementById('place-btn').disabled = cart.length === 0;

    var el = document.getElementById('cart-items');
    if (cart.length === 0) {
        el.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
        return;
    }

    el.innerHTML = '';
    cart.forEach(function (item, i) {
        var row = document.createElement('div');
        row.className = 'cart-item-row';
        row.innerHTML =
            '<div class="ci-info">' +
            '<div class="ci-name">' + item.name + '</div>' +
            (item.addonsLabel ? '<div class="ci-mods">+ ' + item.addonsLabel + '</div>' : '') +
            '<div class="ci-price">₱' + (item.unitPrice * item.qty).toFixed(2) + '</div>' +
            '</div>' +
            '<div class="ci-qty">' +
            '<button class="qb" data-i="' + i + '" data-n="-1">-</button>' +
            '<span class="qn">' + item.qty + '</span>' +
            '<button class="qb" data-i="' + i + '" data-n="1">+</button>' +
            '</div>';
        el.appendChild(row);
    });

    el.querySelectorAll('.qb').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var i = parseInt(btn.dataset.i);
            var n = parseInt(btn.dataset.n);
            cart[i].qty += n;
            if (cart[i].qty <= 0) cart.splice(i, 1);
            renderCart();
        });
    });
}

function openCart() {
    document.getElementById('cart-bg').classList.add('open');
    document.getElementById('cart-drawer').classList.add('open');
}

function closeCart() {
    document.getElementById('cart-bg').classList.remove('open');
    document.getElementById('cart-drawer').classList.remove('open');
}


// Order summary screen
function placeOrder() {
    if (cart.length === 0) return;

    var total = 0;
    var html = '';
    cart.forEach(function (item) {
        var sub = item.unitPrice * item.qty;
        total += sub;
        html +=
            '<div class="sum-row">' +
            '<div>' +
            '<div class="sum-name">' + item.name + ' x' + item.qty + '</div>' +
            (item.addonsLabel ? '<div class="sum-addons">+ ' + item.addonsLabel + '</div>' : '') +
            '</div>' +
            '<div class="sum-price">₱' + sub.toFixed(2) + '</div>' +
            '</div>';
    });
    html += '<div class="sum-total"><span>Total</span><span>₱' + total.toFixed(2) + '</span></div>';
    document.getElementById('summary-items').innerHTML = html;
    closeCart();
    document.getElementById('summary-screen').classList.add('open');
}

function closeSummary() {
    document.getElementById('summary-screen').classList.remove('open');
    openCart();
}

function confirmOrder() {
    var items = [];
    cart.forEach(function (item) {
        items.push({ name: item.name, type: 'pizza', price: item.unitPrice, qty: item.qty });
        if (item.addons && item.addons.length > 0) {
            item.addons.forEach(function (addon) {
                items.push({ name: addon.name, type: 'addon', price: addon.price, qty: item.qty });
            });
        }
    });

    var btn = document.getElementById('confirm-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Placing Order...'; }

    apiPost(API.orders + '?action=place_order', { items: items })
        .then(function (res) {
            if (res.success) {
                localStorage.setItem('anj_last_order', res.order_number);
                localStorage.setItem('anj_last_total', res.total);
                document.getElementById('summary-screen').classList.remove('open');
                showSuccess(res.order_number, res.total, false);
                cart = [];
                renderCart();
            } else {
                showToast(res.error || 'Failed to place order. Please try again.');
            }
        })
        .catch(function () {
            showToast('Connection error. Please try again.');
        })
        .finally(function () {
            if (btn) { btn.disabled = false; btn.textContent = 'Confirm Order'; }
        });
}

function showSuccess(orderNumber, total, isRestore) {
    document.getElementById('order-num').textContent = orderNumber;
    var html = '';
    if (!isRestore) {
        cart.forEach(function (item) {
            html += '<div class="rct-row"><span>' + item.name +
                (item.addonsLabel ? ' (' + item.addonsLabel + ')' : '') +
                ' x' + item.qty + '</span><span>₱' +
                (item.unitPrice * item.qty).toFixed(2) + '</span></div>';
        });
    }
    html += '<div class="rct-total"><span>Total</span><span>₱' +
        parseFloat(total).toFixed(2) + '</span></div>';
    document.getElementById('receipt').innerHTML = html;
    document.getElementById('success-screen').classList.add('open');
    clearTimeout(idleTimer);
}

// Customer clicks Place New Order - clears session, asks for code again
function orderMore() {
    clearKioskSession();
    document.getElementById('success-screen').classList.remove('open');
    document.getElementById('kiosk-app').classList.remove('open');
    setKioskOpenState(false);
    cart = [];
    renderCart();
    openGate();
}


// Nav helpers
function toggleNav() {
    var links = document.querySelector('.nav-links');
    var open = links.style.display === 'flex';
    if (open) {
        links.style.cssText = '';
    } else {
        links.style.cssText = 'display:flex;flex-direction:column;position:fixed;top:70px;left:0;right:0;background:#fff;padding:18px;gap:4px;z-index:199;list-style:none;border-top:1px solid #eee;border-bottom:3px solid #c0141a;box-shadow:0 8px 20px rgba(0,0,0,0.1)';
    }
}


// Toast
var toastTimer;
function showToast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
}


// Scroll reveal
(function initScrollReveal() {
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal, .reveal-group').forEach(function (el) {
        observer.observe(el);
    });
    var heroReveals = document.querySelectorAll('#home .reveal, #home .reveal-group');
    setTimeout(function () {
        heroReveals.forEach(function (el) { el.classList.add('visible'); });
    }, 100);
})();


// Nav scroll shadow
(function initNavScroll() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    function checkScroll() {
        nav.classList.toggle('scrolled', window.scrollY > 10);
    }
    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
})();


// Mark today store hours
(function markToday() {
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var today = days[new Date().getDay()];
    document.querySelectorAll('.hr-row').forEach(function (row) {
        var d = row.querySelector('.day');
        if (d && d.textContent.includes(today)) {
            row.classList.add('today');
            var tag = document.createElement('span');
            tag.className = 'today-tag';
            tag.textContent = 'TODAY';
            d.appendChild(tag);
        }
    });
})();


// Float CTA hide near footer
(function floatCTA() {
    var btn = document.getElementById('float-cta');
    var footer = document.querySelector('footer');
    if (!btn || !footer) return;
    function checkVisibility() {
        btn.classList.toggle('hidden', footer.getBoundingClientRect().top < window.innerHeight + 80);
    }
    window.addEventListener('scroll', checkVisibility, { passive: true });
    checkVisibility();
})();