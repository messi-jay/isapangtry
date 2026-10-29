<?php
/**
 * COE-Pay: Payment Requests API Endpoint
 * Handles GET (list), POST (create), PUT (authorize/reject)
 */

require_once __DIR__ . '/auth_guard.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetRequests($pdo);
        break;
    case 'POST':
        handleCreateRequest($pdo);
        break;
    case 'PUT':
        handleUpdateRequestStatus($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
}

function handleGetRequests($pdo) {
    requireAuth($pdo, ['admin', 'personnel', 'student']);
    $term_id = $_GET['term_id'] ?? null;
    $status = $_GET['status'] ?? null;

    $sql = "
        SELECT 
            r.*,
            c.category_name,
            t.academic_year,
            t.semester,
            CONCAT('Engr. ', p.first_name, ' ', p.last_name) AS creator_name,
            p.designation AS creator_designation,
            u.username AS authorizer_username
        FROM `payment_requests` r
        JOIN `payment_categories` c ON r.category_id = c.category_id
        JOIN `academic_terms` t ON r.term_id = t.term_id
        JOIN `personnel` p ON r.created_by_personnel_id = p.personnel_id
        LEFT JOIN `users` u ON r.authorized_by_user_id = u.user_id
        WHERE 1=1
    ";

    $params = [];
    if ($term_id) {
        $sql .= " AND r.term_id = ?";
        $params[] = $term_id;
    }
    if ($status) {
        $sql .= " AND r.status = ?";
        $params[] = $status;
    }

    $sql .= " ORDER BY r.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $requests = $stmt->fetchAll();

    echo json_encode(['success' => true, 'data' => $requests]);
}

function handleCreateRequest($pdo) {
    $auth = requireAuth($pdo, ['personnel']);
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['title']) || empty($input['category_id']) || empty($input['amount']) || empty($input['deadline'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
        return;
    }

    $title = trim($input['title']);
    $description = trim($input['description'] ?? '');
    $category_id = (int)$input['category_id'];
    $term_id = (int)($input['term_id'] ?? 2);
    $amount = (float)$input['amount'];
    $deadline = $input['deadline'];
    $target_year_level = !empty($input['target_year_level']) ? (int)$input['target_year_level'] : null;
    $target_section = !empty($input['target_section']) ? trim($input['target_section']) : null;
    $gcash_account_name = trim($input['gcash_account_name']);
    $gcash_account_number = trim($input['gcash_account_number']);
    $gcash_qr_code_path = $input['gcash_qr_code_path'] ?? 'assets/img/qr-coe-org.png';
    $status = !empty($input['submit_for_authorization']) ? 'pending_authorization' : 'draft';
    $personnel_id = (int)$auth['personnel_id'];
    $user_id = $auth['user_id'];
    if ($amount <= 0 || $personnel_id <= 0) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Invalid amount or personnel profile.']);
        return;
    }

    $stmt = $pdo->prepare("
        INSERT INTO `payment_requests` 
        (`title`, `description`, `category_id`, `term_id`, `amount`, `deadline`, `target_year_level`, `target_section`, `gcash_account_name`, `gcash_account_number`, `gcash_qr_code_path`, `status`, `created_by_personnel_id`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $title, $description, $category_id, $term_id, $amount, $deadline,
        $target_year_level, $target_section, $gcash_account_name, $gcash_account_number,
        $gcash_qr_code_path, $status, $personnel_id
    ]);

    $requestId = $pdo->lastInsertId();
    logAudit($pdo, $user_id, 'CREATE_REQUEST', 'payment_requests', $requestId, "Created request: {$title} (PHP {$amount})");

    echo json_encode(['success' => true, 'request_id' => $requestId, 'message' => 'Request created successfully.']);
}

function handleUpdateRequestStatus($pdo) {
    $auth = requireAuth($pdo, ['admin']);
    $input = json_decode(file_get_contents('php://input'), true);

    $requestId = (int)($input['request_id'] ?? 0);
    $action = $input['action'] ?? '';
    $userId = $auth['user_id'];
    $remarks = trim($input['remarks'] ?? '');

    if (!$requestId || !in_array($action, ['authorize', 'reject', 'close'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid parameters.']);
        return;
    }

    $newStatus = ($action === 'authorize') ? 'authorized' : (($action === 'reject') ? 'rejected' : 'closed');

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("
            UPDATE `payment_requests`
            SET `status` = ?, `authorized_by_user_id` = ?, `authorized_at` = NOW(), `authorization_remarks` = ?
            WHERE `request_id` = ? AND (`status` = 'pending_authorization' OR ? = 'closed')
        ");
        $stmt->execute([$newStatus, $userId, $remarks, $requestId, $newStatus]);
        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Request is not awaiting authorization.']);
            return;
        }

        // If authorized, auto-generate assignments for eligible students
        if ($newStatus === 'authorized') {
            $reqStmt = $pdo->prepare("SELECT * FROM `payment_requests` WHERE `request_id` = ?");
            $reqStmt->execute([$requestId]);
            $req = $reqStmt->fetch();

            $studentSql = "SELECT `student_id` FROM `students` WHERE 1=1";
            $params = [];
            if ($req['target_year_level']) {
                $studentSql .= " AND `year_level` = ?";
                $params[] = $req['target_year_level'];
            }
            if ($req['target_section']) {
                $studentSql .= " AND UPPER(`section`) = UPPER(?)";
                $params[] = $req['target_section'];
            }

            $stStmt = $pdo->prepare($studentSql);
            $stStmt->execute($params);
            $students = $stStmt->fetchAll();

            $insertAssign = $pdo->prepare("
                INSERT IGNORE INTO `student_payment_assignments` (`request_id`, `student_id`, `status`)
                VALUES (?, ?, 'unpaid')
            ");

            foreach ($students as $st) {
                $insertAssign->execute([$requestId, $st['student_id']]);
            }
        }

        logAudit($pdo, $userId, strtoupper($action) . '_REQUEST', 'payment_requests', $requestId, "Payment request #{$requestId} updated to {$newStatus}. Remarks: {$remarks}");
        $pdo->commit();

        echo json_encode(['success' => true, 'message' => "Request {$newStatus} successfully."]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update request: ' . $e->getMessage()]);
    }
}
