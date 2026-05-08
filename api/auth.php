<?php
// AnJ Pizza — auth.php
// Handles: login, logout, check session

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';

// LOGIN 
if ($action === 'login') {
    $body = getBody();
    $username = trim($body['username'] ?? '');
    $password = trim($body['password'] ?? '');

    if (!$username || !$password) {
        respond(['success' => false, 'error' => 'Username and password required.']);
    }

    $stmt = $pdo->prepare('SELECT * FROM admin WHERE BINARY username = ? LIMIT 1');
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    if ($admin && password_verify($password, $admin['password'])) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_username']  = $admin['username'];
        respond(['success' => true]);
    } else {
        respond(['success' => false, 'error' => 'Incorrect username or password.']);
    }
}

// LOGOUT
if ($action === 'logout') {
    session_destroy();
    respond(['success' => true]);
}

// CHECK SESSION 
if ($action === 'check') {
    respond([
        'success'      => true,
        'logged_in'    => !empty($_SESSION['admin_logged_in']),
        'username'     => $_SESSION['admin_username'] ?? null,
    ]);
}

// CHANGE PASSWORD 
if ($action === 'change_password') {
    requireAdmin();
    $body    = getBody();
    $current = $body['current'] ?? '';
    $newpw   = $body['new']     ?? '';
    $confirm = $body['confirm'] ?? '';

    if (!$current || !$newpw || !$confirm) {
        respond(['success' => false, 'error' => 'All fields are required.']);
    }
    if (strlen($newpw) < 6) {
        respond(['success' => false, 'error' => 'Password must be at least 6 characters.']);
    }
    if ($newpw !== $confirm) {
        respond(['success' => false, 'error' => 'Passwords do not match.']);
    }

    // Verify current password
    $stmt = $pdo->prepare('SELECT password FROM admin WHERE BINARY username = ? LIMIT 1');
    $stmt->execute([$_SESSION['admin_username']]);
    $admin = $stmt->fetch();

    if (!$admin || !password_verify($current, $admin['password'])) {
        respond(['success' => false, 'error' => 'Current password is incorrect.']);
    }

    $hash = password_hash($newpw, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('UPDATE admin SET password = ? WHERE username = ?');
    $stmt->execute([$hash, $_SESSION['admin_username']]);

    respond(['success' => true, 'message' => 'Password updated successfully.']);
}

// CHANGE USERNAME
if ($action === 'change_username') {
    requireAdmin();
    $body        = getBody();
    $new_username = trim($body['new_username'] ?? '');
    $password    = $body['password'] ?? '';

    if (!$new_username) {
        respond(['success' => false, 'error' => 'New username is required.']);
    }
    if (!$password) {
        respond(['success' => false, 'error' => 'Current password is required.']);
    }

    // Verify current password
    $stmt = $pdo->prepare('SELECT password FROM admin WHERE BINARY username = ? LIMIT 1');
    $stmt->execute([$_SESSION['admin_username']]);
    $admin = $stmt->fetch();

    if (!$admin || !password_verify($password, $admin['password'])) {
        respond(['success' => false, 'error' => 'Current password is incorrect.']);
    }

    // Check if new username is already taken
    $stmt = $pdo->prepare('SELECT id FROM admin WHERE BINARY username = ? LIMIT 1');
    $stmt->execute([$new_username]);
    if ($stmt->fetch()) {
        respond(['success' => false, 'error' => 'That username is already taken.']);
    }

    // Update username in DB
    $stmt = $pdo->prepare('UPDATE admin SET username = ? WHERE username = ?');
    $stmt->execute([$new_username, $_SESSION['admin_username']]);

    // Update session so admin stays logged in
    $_SESSION['admin_username'] = $new_username;

    respond(['success' => true, 'message' => 'Username updated to "' . $new_username . '".']);
}

respond(['success' => false, 'error' => 'Unknown action.']);
