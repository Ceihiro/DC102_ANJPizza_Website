<?php
// AnJ Pizza - menu.php

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';

// GET all pizzas (public - kiosk and admin)
if ($action === 'get_pizzas') {
    $stmt = $pdo->query('SELECT * FROM pizzas ORDER BY price ASC');
    respond(['success' => true, 'pizzas' => $stmt->fetchAll()]);
}

// ADD pizza (admin only)
if ($action === 'add_pizza') {
    requireAdmin();
    $body = getBody();
    $name = trim($body['name'] ?? '');
    $price = floatval($body['price'] ?? 0);
    $badge = trim($body['badge'] ?? '');

    if (!$name || $price <= 0) {
        respond(['success' => false, 'error' => 'Name and valid price required.']);
    }

    $stmt = $pdo->prepare('INSERT INTO pizzas (name, price, badge, available) VALUES (?, ?, ?, 1)');
    $stmt->execute([$name, $price, $badge]);
    respond(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => $name . ' added.']);
}

// EDIT pizza price/badge (admin only)
if ($action === 'edit_pizza') {
    requireAdmin();
    $body = getBody();
    $id = intval($body['id'] ?? 0);
    $name = trim($body['name'] ?? '');
    $price = floatval($body['price'] ?? 0);
    $badge = trim($body['badge'] ?? '');

    if (!$id || !$name || $price <= 0) {
        respond(['success' => false, 'error' => 'ID, name and valid price required.']);
    }

    $stmt = $pdo->prepare('UPDATE pizzas SET name=?, price=?, badge=? WHERE id=?');
    $stmt->execute([$name, $price, $badge, $id]);
    respond(['success' => true, 'message' => 'Pizza updated.']);
}

// TOGGLE available/unavailable (admin only)
if ($action === 'toggle_pizza') {
    requireAdmin();
    $body = getBody();
    $id = intval($body['id'] ?? 0);

    if (!$id)
        respond(['success' => false, 'error' => 'ID required.']);

    $stmt = $pdo->prepare('UPDATE pizzas SET available = IF(available=1, 0, 1) WHERE id=?');
    $stmt->execute([$id]);

    $row = $pdo->prepare('SELECT available FROM pizzas WHERE id=?');
    $row->execute([$id]);
    $pizza = $row->fetch();

    $state = $pizza['available'] ? 'Available' : 'Unavailable';
    respond(['success' => true, 'available' => (int) $pizza['available'], 'message' => 'Pizza marked as ' . $state . '.']);
}

// GET all addons (public)
if ($action === 'get_addons') {
    $stmt = $pdo->query('SELECT * FROM addons ORDER BY price ASC');
    respond(['success' => true, 'addons' => $stmt->fetchAll()]);
}

// ADD addon (admin only)
if ($action === 'add_addon') {
    requireAdmin();
    $body = getBody();
    $name = trim($body['name'] ?? '');
    $price = floatval($body['price'] ?? 0);

    if (!$name || $price <= 0) {
        respond(['success' => false, 'error' => 'Name and valid price required.']);
    }

    $stmt = $pdo->prepare('INSERT INTO addons (name, price) VALUES (?, ?)');
    $stmt->execute([$name, $price]);
    respond(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => $name . ' added.']);
}

// EDIT addon (admin only)
if ($action === 'edit_addon') {
    requireAdmin();
    $body = getBody();
    $id = intval($body['id'] ?? 0);
    $name = trim($body['name'] ?? '');
    $price = floatval($body['price'] ?? 0);

    if (!$id || !$name || $price <= 0) {
        respond(['success' => false, 'error' => 'ID, name and valid price required.']);
    }

    $stmt = $pdo->prepare('UPDATE addons SET name=?, price=? WHERE id=?');
    $stmt->execute([$name, $price, $id]);
    respond(['success' => true, 'message' => 'Add-on updated.']);
}

// DELETE addon (admin only)
if ($action === 'delete_addon') {
    requireAdmin();
    $body = getBody();
    $id = intval($body['id'] ?? 0);

    if (!$id)
        respond(['success' => false, 'error' => 'ID required.']);

    $stmt = $pdo->prepare('DELETE FROM addons WHERE id=?');
    $stmt->execute([$id]);
    respond(['success' => true, 'message' => 'Add-on deleted.']);
}

// TOGGLE addon available/unavailable (admin only)
if ($action === 'toggle_addon') {
    requireAdmin();
    $body = getBody();
    $id = intval($body['id'] ?? 0);

    if (!$id)
        respond(['success' => false, 'error' => 'ID required.']);

    $stmt = $pdo->prepare('UPDATE addons SET available = IF(available=1, 0, 1) WHERE id=?');
    $stmt->execute([$id]);

    $row = $pdo->prepare('SELECT available FROM addons WHERE id=?');
    $row->execute([$id]);
    $addon = $row->fetch();

    $state = $addon['available'] ? 'Available' : 'Unavailable';
    respond(['success' => true, 'available' => (int) $addon['available'], 'message' => 'Add-on marked as ' . $state . '.']);
}

respond(['success' => false, 'error' => 'Unknown action.']);