<?php
/**
 * COE-Pay: Database Configuration & PDO Connection
 * Target DBMS: MySQL 8.0+ / MariaDB 10.4+
 * Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
 */

header('Content-Type: application/json; charset=utf-8');
$allowedOrigin = getenv('COEPAY_ALLOWED_ORIGIN') ?: '';
if ($allowedOrigin && ($_SERVER['HTTP_ORIGIN'] ?? '') === $allowedOrigin) {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = getenv('DB_HOST') ?: '127.0.0.1';
$db_port = getenv('DB_PORT') ?: '3306';
$db_name = getenv('DB_NAME') ?: 'coepay_db';
$db_user = getenv('DB_USER') ?: 'coepay_app';   // never use root
$db_pass = getenv('DB_PASS') ?: '';

try {
    $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed.'
    ]);
    exit();
}

/**
 * Audit Logging Helper Function
 */
function logAudit($pdo, $userId, $actionType, $entityName, $entityId, $details) {
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown Agent', 0, 255);
        $stmt = $pdo->prepare("
            INSERT INTO `audit_logs` (`user_id`, `action_type`, `entity_name`, `entity_id`, `details`, `ip_address`, `user_agent`)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $actionType, $entityName, $entityId, $details, $ip, $ua]);
    } catch (Exception $e) {
        error_log("Audit log failed: " . $e->getMessage());
    }
}
