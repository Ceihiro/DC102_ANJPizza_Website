<?php
// AnJ Pizza — Database Connection Template

$host = 'localhost';
$db = 'anj_pizza';     // Your database name
$user = 'root';         // Your MySQL username
$pass = '';             // Your MySQL password (blank for default XAMPP)

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed.']);
    exit;
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

function respond($data)
{
    echo json_encode($data);
    exit;
}

function requireAdmin()
{
    if (empty($_SESSION['admin_logged_in'])) {
        http_response_code(401);
        respond(['success' => false, 'error' => 'Not authenticated.']);
    }
}

function getBody()
{
    return json_decode(file_get_contents('php://input'), true) ?? [];
}
