<?php
/**
 * COE-Pay: Transactions API Endpoint
 * Handles GCash payment submission, unique reference enforcement, and verification workflow
 */

require_once __DIR__ . '/auth_guard.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetTransactions($pdo);
        break;
    case 'POST':
        handleSubmitTransaction($pdo);
        break;
    case 'PUT':
        handleVerifyTransaction($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
}

function handleGetTransactions($pdo) {
    $status = $_GET['status'] ?? null;
    $student_id = $_GET['student_id'] ?? null;
    $request_id = $_GET['request_id'] ?? null;
    $auth = requireAuth($pdo, ['admin', 'personnel', 'student']);
    if ($auth['role'] === 'student') $student_id = $auth['student_id'] ?: 0;

    $sql = "
        SELECT 
            t.*,
            s.student_number,
            CONCAT(s.last_name, ', ', s.first_name, ' ', COALESCE(s.middle_name, '')) AS student_name,
            s.program,
            s.year_level,
            s.section,
            r.title AS request_title,
            r.amount AS expected_amount,
            CONCAT('Engr. ', p.first_name, ' ', p.last_name) AS verifier_name
        FROM `payment_transactions` t
        JOIN `students` s ON t.student_id = s.student_id
        JOIN `payment_requests` r ON t.request_id = r.request_id
        LEFT JOIN `personnel` p ON t.verified_by_personnel_id = p.personnel_id
        WHERE 1=1
    ";

    $params = [];
    if ($status) {
        $sql .= " AND t.status = ?";
        $params[] = $status;
    }
    if ($student_id) {
        $sql .= " AND t.student_id = ?";
        $params[] = $student_id;
    }
    if ($request_id) {
        $sql .= " AND t.request_id = ?";
        $params[] = $request_id;
    }

    $sql .= " ORDER BY t.submitted_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $transactions = $stmt->fetchAll();

    echo json_encode(['success' => true, 'data' => $transactions]);
}

function handleSubmitTransaction($pdo) {
    $auth = requireAuth($pdo, ['student']);
    $input = json_decode(file_get_contents('php://input'), true);

    $assignment_id = (int)($input['assignment_id'] ?? 0);
    $ref_no = trim($input['gcash_reference_number'] ?? '');
    $sender_name = trim($input['gcash_sender_name'] ?? '');
    $sender_number = trim($input['gcash_sender_number'] ?? '');
    $amount_paid = (float)($input['amount_paid'] ?? 0);
    $payment_time = $input['payment_timestamp'] ?? date('Y-m-d H:i:s');
    $receipt_path = $input['receipt_image_path'] ?? 'uploads/receipts/default.png';
    $notes = trim($input['student_notes'] ?? '');
    $user_id = $auth['user_id'];

    if (!$assignment_id || empty($ref_no) || empty($sender_name) || empty($sender_number) || $amount_paid <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All transaction fields are required.']);
        return;
    }

    // Check duplicate reference number
    $chk = $pdo->prepare("SELECT `transaction_id` FROM `payment_transactions` WHERE `gcash_reference_number` = ? AND `status` != 'rejected'");
    $chk->execute([$ref_no]);
    if ($chk->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => "GCash Reference Number '{$ref_no}' has already been submitted."]);
        return;
    }

    // Fetch assignment particulars
    $assignStmt = $pdo->prepare("SELECT * FROM `student_payment_assignments` WHERE `assignment_id` = ?");
    $assignStmt->execute([$assignment_id]);
    $assignment = $assignStmt->fetch();

    if (!$assignment) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Assignment not found.']);
        return;
    }

    if ((int)$assignment['student_id'] !== (int)$auth['student_id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'This obligation does not belong to you.']);
        return;
    }
    if (!in_array($assignment['status'], ['unpaid', 'overdue'], true)) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'This obligation is not open for payment.']);
        return;
    }
    $rq = $pdo->prepare("SELECT `amount` FROM `payment_requests` WHERE `request_id` = ?");
    $rq->execute([$assignment['request_id']]);
    $expected = (float)$rq->fetchColumn();
    if (abs($expected - $amount_paid) > 0.009) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Amount must be exactly PHP ' . number_format($expected, 2) . '.']);
        return;
    }

    $pdo->beginTransaction();
    try {
        $ins = $pdo->prepare("
            INSERT INTO `payment_transactions`
            (`assignment_id`, `request_id`, `student_id`, `gcash_reference_number`, `gcash_sender_name`, `gcash_sender_number`, `amount_paid`, `payment_timestamp`, `receipt_image_path`, `student_notes`, `status`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        ");
        $ins->execute([
            $assignment_id,
            $assignment['request_id'],
            $assignment['student_id'],
            $ref_no,
            $sender_name,
            $sender_number,
            $amount_paid,
            $payment_time,
            $receipt_path,
            $notes
        ]);
        $transId = $pdo->lastInsertId();

        // Update assignment status
        $upAssign = $pdo->prepare("UPDATE `student_payment_assignments` SET `status` = 'pending_verification' WHERE `assignment_id` = ?");
        $upAssign->execute([$assignment_id]);

        logAudit($pdo, $user_id, 'SUBMIT_PAYMENT', 'payment_transactions', $transId, "Submitted payment Ref #{$ref_no} (PHP {$amount_paid})");
        $pdo->commit();

        echo json_encode(['success' => true, 'transaction_id' => $transId, 'message' => 'Payment submitted for verification.']);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleVerifyTransaction($pdo) {
    $auth = requireAuth($pdo, ['admin', 'personnel']);
    $input = json_decode(file_get_contents('php://input'), true);

    $transId = (int)($input['transaction_id'] ?? 0);
    $action = $input['action'] ?? ''; // 'verify' or 'reject'
    $personnelId = $auth['personnel_id'] ?: null;
    $userId = $auth['user_id'];
    $remarks = trim($input['remarks'] ?? '');

    if (!$transId || !in_array($action, ['verify', 'reject'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid transaction action.']);
        return;
    }

    $pdo->beginTransaction();
    try {
        $transStmt = $pdo->prepare("SELECT * FROM `payment_transactions` WHERE `transaction_id` = ?");
        $transStmt->execute([$transId]);
        $trans = $transStmt->fetch();

        if (!$trans) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Transaction not found.']);
            $pdo->rollBack();
            return;
        }
        if ($trans['status'] !== 'pending') {
            $pdo->rollBack();
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Transaction was already processed.']);
            return;
        }

        $newTransStatus = ($action === 'verify') ? 'verified' : 'rejected';
        $newAssignStatus = ($action === 'verify') ? 'paid' : 'unpaid';

        $upTrans = $pdo->prepare("
            UPDATE `payment_transactions`
            SET `status` = ?, `verified_by_personnel_id` = ?, `verified_at` = NOW(), `verification_remarks` = ?
            WHERE `transaction_id` = ?
        ");
        $upTrans->execute([$newTransStatus, $personnelId, $remarks, $transId]);

        $upAssign = $pdo->prepare("
            UPDATE `student_payment_assignments`
            SET `status` = ?
            WHERE `assignment_id` = ?
        ");
        $upAssign->execute([$newAssignStatus, $trans['assignment_id']]);

        logAudit($pdo, $userId, strtoupper($action) . '_PAYMENT', 'payment_transactions', $transId, "Payment transaction #{$transId} marked as {$newTransStatus}. Remarks: {$remarks}");
        $pdo->commit();

        echo json_encode(['success' => true, 'message' => "Transaction marked as {$newTransStatus}."]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Verification failed: ' . $e->getMessage()]);
    }
}
