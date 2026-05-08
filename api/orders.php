<?php
// AnJ Pizza — orders.php  

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';

// VERIFY KIOSK CODE (public)
if ($action === 'verify_code') {
    $body = getBody();
    $code = trim($body['code'] ?? '');

    $stmt = $pdo->query('SELECT code FROM order_code LIMIT 1');
    $row  = $stmt->fetch();

    if ($row && $code === $row['code']) {
        respond(['success' => true]);
    } else {
        respond(['success' => false, 'error' => 'Incorrect code. Please check the code posted at the counter.']);
    }
}

// PLACE ORDER (public — customer kiosk)
if ($action === 'place_order') {
    $body  = getBody();
    $items = $body['items'] ?? [];

    if (empty($items)) {
        respond(['success' => false, 'error' => 'No items in order.']);
    }

    $total = 0;
    foreach ($items as $item) {
        $total += floatval($item['price']) * intval($item['qty']);
    }

    $pdo->beginTransaction();
    try {
        $pdo->exec('UPDATE order_counter SET counter = counter + 1');
        $row      = $pdo->query('SELECT counter FROM order_counter LIMIT 1')->fetch();
        $num      = $row['counter'];
        $orderNum = '#' . str_pad($num, 4, '0', STR_PAD_LEFT);

        $stmt = $pdo->prepare(
            'INSERT INTO orders (order_number, status, total) VALUES (?, "Pending", ?)'
        );
        $stmt->execute([$orderNum, $total]);
        $orderId = $pdo->lastInsertId();

        $itemStmt = $pdo->prepare(
            'INSERT INTO order_items (order_id, item_name, item_type, price, qty) VALUES (?, ?, ?, ?, ?)'
        );
        foreach ($items as $item) {
            $itemStmt->execute([
                $orderId,
                trim($item['name']),
                $item['type'] === 'addon' ? 'addon' : 'pizza',
                floatval($item['price']),
                intval($item['qty'])
            ]);
        }

        $pdo->commit();
        respond([
            'success'      => true,
            'order_number' => $orderNum,
            'order_id'     => $orderId,
            'total'        => $total
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(['success' => false, 'error' => 'Failed to place order. Please try again.']);
    }
}

// GET ORDERS (admin only)
if ($action === 'get_orders') {
    requireAdmin();
    $filter = $_GET['status'] ?? 'all';

    if ($filter === 'all') {
        $stmt = $pdo->query(
            'SELECT * FROM orders ORDER BY 
             FIELD(status,"Pending","Preparing","Ready","Done"), created_at DESC'
        );
    } elseif ($filter === 'active') {
        $stmt = $pdo->query(
            'SELECT * FROM orders WHERE status IN ("Pending","Preparing","Ready")
             ORDER BY FIELD(status,"Pending","Preparing","Ready"), created_at DESC'
        );
    } else {
        $stmt = $pdo->prepare(
            'SELECT * FROM orders WHERE status=? ORDER BY created_at DESC'
        );
        $stmt->execute([$filter]);
    }

    $orders = $stmt->fetchAll();

    $itemStmt = $pdo->prepare('SELECT * FROM order_items WHERE order_id=?');
    foreach ($orders as &$order) {
        $itemStmt->execute([$order['id']]);
        $order['items'] = $itemStmt->fetchAll();
    }

    respond(['success' => true, 'orders' => $orders]);
}

// GET SINGLE ORDER by order_number (public)
if ($action === 'find_order') {
    $num = trim($_GET['number'] ?? '');
    if (!$num) respond(['success' => false, 'error' => 'Order number required.']);

    if ($num[0] !== '#') $num = '#' . $num;

    $stmt = $pdo->prepare('SELECT * FROM orders WHERE order_number=? ORDER BY created_at DESC LIMIT 1');
    $stmt->execute([$num]);
    $order = $stmt->fetch();

    if (!$order) {
        respond(['success' => false, 'error' => 'Order not found.']);
    }

    $itemStmt = $pdo->prepare('SELECT * FROM order_items WHERE order_id=?');
    $itemStmt->execute([$order['id']]);
    $order['items'] = $itemStmt->fetchAll();

    respond(['success' => true, 'order' => $order]);
}

// UPDATE STATUS (admin only)
if ($action === 'update_status') {
    requireAdmin();
    $body   = getBody();
    $id     = intval($body['id']   ?? 0);
    $status = trim($body['status'] ?? '');

    $allowed = ['Pending', 'Preparing', 'Ready', 'Done'];
    if (!$id || !in_array($status, $allowed)) {
        respond(['success' => false, 'error' => 'Invalid request.']);
    }

    $stmt = $pdo->prepare('UPDATE orders SET status=? WHERE id=?');
    $stmt->execute([$status, $id]);
    respond(['success' => true, 'message' => 'Order updated to ' . $status]);
}

// CANCEL / DELETE ORDER (admin only) 
if ($action === 'cancel_order') {
    requireAdmin();
    $body = getBody();
    $id   = intval($body['id'] ?? 0);

    if (!$id) respond(['success' => false, 'error' => 'ID required.']);

    $stmt = $pdo->prepare('DELETE FROM orders WHERE id=?');
    $stmt->execute([$id]);
    respond(['success' => true, 'message' => 'Order cancelled.']);
}

// RESET ORDER COUNTER (admin only)
if ($action === 'reset_counter') {
    requireAdmin();
    $pdo->exec('UPDATE order_counter SET counter=0');
    respond(['success' => true, 'message' => 'Order counter reset to 0.']);
}

// GET / UPDATE KIOSK CODE (admin only)
if ($action === 'get_code') {
    requireAdmin();
    $row = $pdo->query('SELECT code FROM order_code LIMIT 1')->fetch();
    respond(['success' => true, 'code' => $row['code']]);
}

if ($action === 'update_code') {
    requireAdmin();
    $body = getBody();
    $code = trim($body['code'] ?? '');

    if (!$code) respond(['success' => false, 'error' => 'Code cannot be empty.']);

    $pdo->prepare('UPDATE order_code SET code=?')->execute([$code]);
    respond(['success' => true, 'message' => 'Code updated to: ' . $code]);
}

// CLEAR ALL ORDERS (admin only)
if ($action === 'clear_all') {
    requireAdmin();
    $stmt    = $pdo->query('DELETE FROM orders');
    $deleted = $stmt->rowCount();
    respond([
        'success' => true,
        'message' => $deleted . ' order' . ($deleted !== 1 ? 's' : '') . ' deleted.'
    ]);
}

respond(['success' => false, 'error' => 'Unknown action.']);