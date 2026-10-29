<?php
/**
 * COE-Pay: server-side authentication guard.
 * Verifies the Supabase access token (Authorization: Bearer ...) and maps it to a MySQL user.
 * Fails closed: if Supabase is not configured, every protected endpoint refuses access.
 * Roles returned: admin (admin/coordinator), personnel (personnel/officer), student, developer.
 */
require_once __DIR__ . '/config.php';

function coepayFail($code, $msg) {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $msg]);
    exit();
}

function requireAuth($pdo, array $roles = []) {
    $url = rtrim(getenv('SUPABASE_URL') ?: '', '/');
    $key = getenv('SUPABASE_ANON_KEY') ?: '';
    if (!$url || !$key || strpos($url, 'your-project-id') !== false) {
        coepayFail(503, 'Authentication is not configured on the server.');
    }
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if (!preg_match('/Bearer\s+(\S+)/i', $h, $m)) coepayFail(401, 'Sign in required.');

    $ch = curl_init("{$url}/auth/v1/user");
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => ["Authorization: Bearer {$m[1]}", "apikey: {$key}"]]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $sb = ($code === 200 && $res) ? json_decode($res, true) : null;
    if (empty($sb['id']) || empty($sb['email'])) coepayFail(401, 'Invalid or expired session.');

    $stmt = $pdo->prepare("
        SELECT u.user_id, u.role, u.is_active, s.student_id, p.personnel_id
        FROM `users` u
        LEFT JOIN `students` s ON s.user_id = u.user_id
        LEFT JOIN `personnel` p ON p.user_id = u.user_id
        WHERE u.supabase_uid = ? OR LOWER(u.email) = ? LIMIT 1");
    $stmt->execute([$sb['id'], strtolower($sb['email'])]);
    $u = $stmt->fetch();
    if (!$u || (int)$u['is_active'] !== 1) coepayFail(403, 'No active account for this user.');

    $role = $u['role'];
    if ($role === 'coordinator') $role = 'admin';
    if ($role === 'officer') $role = 'personnel';
    if ($roles && !in_array($role, $roles, true)) coepayFail(403, 'You are not allowed to do this.');

    return ['user_id' => (int)$u['user_id'], 'role' => $role,
            'student_id' => $u['student_id'] ? (int)$u['student_id'] : null,
            'personnel_id' => $u['personnel_id'] ? (int)$u['personnel_id'] : null];
}
