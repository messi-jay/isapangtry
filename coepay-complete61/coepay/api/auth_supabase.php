<?php
/**
 * COE-Pay: Supabase Auth Verification & MySQL Profile Mapping Endpoint
 * Handles:
 * - Server-side Supabase JWT access token verification
 * - Mapping Supabase Auth identities (UUID) to MySQL `users` and `students`
 * - Secure Student Self-Registration and Session Resolution
 * - Enforcing strict Role-Based Access Control (RBAC)
 */

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed. Use POST.']);
    exit();
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON request payload.']);
    exit();
}

$action = $data['action'] ?? 'verify_session';
$accessToken = trim($data['access_token'] ?? '');
$claimedEmail = trim(strtolower($data['email'] ?? ''));
$claimedUid = trim($data['supabase_uid'] ?? '');

if (empty($claimedEmail) && empty($claimedUid)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Verified email address or Supabase identity is required.']);
    exit();
}

// -----------------------------------------------------------------------------
// 1. Server-Side Supabase Token Verification
// -----------------------------------------------------------------------------
$supabaseUrl = getenv('SUPABASE_URL') ?: 'https://your-project-id.supabase.co';
$supabaseAnonKey = getenv('SUPABASE_ANON_KEY') ?: 'placeholder';
$isPlaceholder = strpos($supabaseUrl, 'your-project-id') !== false || strpos($supabaseAnonKey, 'placeholder') !== false;

$verifiedEmail = $claimedEmail;
$verifiedUid = $claimedUid;

// In live production, verify token directly against Supabase Auth API
if ($isPlaceholder || empty($accessToken)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'A verified Supabase session is required.']);
    exit();
}
if (true) {
    $ch = curl_init("{$supabaseUrl}/auth/v1/user");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer {$accessToken}",
        "apikey: {$supabaseAnonKey}"
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $sbUser = json_decode($response, true);
        if (!empty($sbUser['id']) && !empty($sbUser['email'])) {
            $verifiedUid = $sbUser['id'];
            $verifiedEmail = strtolower($sbUser['email']);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Supabase token payload invalid.']);
            exit();
        }
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Supabase access token verification failed.']);
        exit();
    }
}

// -----------------------------------------------------------------------------
// 2. ROUTE: Student Self-Registration (`register_student`)
// -----------------------------------------------------------------------------
if ($action === 'register_student') {
    $studentNumber = trim($data['student_number'] ?? '');
    $firstName = trim($data['first_name'] ?? '');
    $middleName = trim($data['middle_name'] ?? '');
    $lastName = trim($data['last_name'] ?? '');
    $program = trim($data['program'] ?? 'BSCpE');
    $yearLevel = (int)($data['year_level'] ?? 1);
    $section = trim($data['section'] ?? '');
    $contactNumber = trim($data['contact_number'] ?? '');

    if (empty($studentNumber) || empty($firstName) || empty($lastName) || empty($section)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Student ID, Name, and Section are required for registration.']);
        exit();
    }

    try {
        // Check if student number or email already exists in MySQL
        $stmtChk = $pdo->prepare("
            SELECT u.user_id, u.email, s.student_number 
            FROM `users` u 
            LEFT JOIN `students` s ON u.user_id = s.user_id 
            WHERE LOWER(u.email) = ? OR s.student_number = ?
        ");
        $stmtChk->execute([$verifiedEmail, $studentNumber]);
        $existing = $stmtChk->fetch();

        if ($existing) {
            http_response_code(409);
            echo json_encode([
                'success' => false, 
                'message' => 'An account with this Student Number or Email is already registered. Please sign in instead.'
            ]);
            exit();
        }

        // Execute registration in atomic transaction
        $pdo->beginTransaction();

        // 1. Insert into users table with role strictly set to 'student'
        $stmtUser = $pdo->prepare("
            INSERT INTO `users` (`supabase_uid`, `username`, `email`, `password_hash`, `role`, `auth_provider`, `is_active`, `last_login`, `created_at`)
            VALUES (?, ?, ?, '', 'student', 'supabase_otp', 1, NOW(), NOW())
        ");
        $stmtUser->execute([$verifiedUid ?: null, $studentNumber, $verifiedEmail]);
        $userId = $pdo->lastInsertId();

        // 2. Insert into students table
        $stmtStudent = $pdo->prepare("
            INSERT INTO `students` (`user_id`, `student_number`, `first_name`, `middle_name`, `last_name`, `program`, `year_level`, `section`, `contact_number`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmtStudent->execute([
            $userId, $studentNumber, $firstName, 
            $middleName ?: null, $lastName, $program, 
            $yearLevel, $section, $contactNumber ?: null
        ]);
        $studentId = $pdo->lastInsertId();

        // 3. Automatically link any active authorized payment requests matching student cohort
        $stmtAutoAssign = $pdo->prepare("
            INSERT IGNORE INTO `student_payment_assignments` (`request_id`, `student_id`, `status`)
            SELECT r.request_id, ?, 'unpaid'
            FROM `payment_requests` r
            WHERE r.status = 'authorized'
              AND (r.target_year_level IS NULL OR r.target_year_level = ?)
              AND (r.target_section IS NULL OR r.target_section = ? OR r.target_section = '')
        ");
        $stmtAutoAssign->execute([$studentId, $yearLevel, $section]);

        // 4. Record in audit ledger
        logAudit(
            $pdo, 
            $userId, 
            'REGISTER_SUPABASE_OTP', 
            'students', 
            $studentId, 
            "Student self-registered with Supabase OTP: {$studentNumber} ({$firstName} {$lastName})"
        );

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Registration complete! Welcome to COE-Pay.',
            'user' => [
                'user_id' => $userId,
                'username' => $studentNumber,
                'email' => $verifiedEmail,
                'role' => 'student',
                'supabase_uid' => $verifiedUid
            ],
            'profile' => [
                'student_id' => $studentId,
                'student_number' => $studentNumber,
                'full_name' => trim("{$firstName} {$middleName} {$lastName}"),
                'program' => $program,
                'year_level' => $yearLevel,
                'section' => $section
            ]
        ]);
        exit();

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()]);
        exit();
    }
}

// -----------------------------------------------------------------------------
// 3. ROUTE: Verify Session & Map Identity to MySQL Profile (`verify_session`)
// -----------------------------------------------------------------------------
try {
    // Lookup user by supabase_uid or registered email
    $stmt = $pdo->prepare("
        SELECT u.*, 
               s.student_id, s.student_number, s.first_name AS s_fname, s.middle_name AS s_mname, s.last_name AS s_lname, s.program, s.year_level, s.section,
               p.personnel_id, p.employee_number, p.first_name AS p_fname, p.last_name AS p_lname, p.designation, p.department
        FROM `users` u
        LEFT JOIN `students` s ON u.user_id = s.user_id
        LEFT JOIN `personnel` p ON u.user_id = p.user_id
        WHERE (? != '' AND u.supabase_uid = ?) 
           OR LOWER(u.email) = ?
        LIMIT 1
    ");
    $stmt->execute([$verifiedUid, $verifiedUid, $verifiedEmail]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'needs_registration' => true,
            'email' => $verifiedEmail,
            'supabase_uid' => $verifiedUid,
            'message' => "No student record found for {$verifiedEmail}. Please complete registration to link your student profile."
        ]);
        exit();
    }

    if ((int)$user['is_active'] !== 1) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Your student account is currently deactivated. Please contact the Dean\'s Office.']);
        exit();
    }

    // Link supabase_uid if not yet set
    if (empty($user['supabase_uid']) && !empty($verifiedUid)) {
        $stmtUpd = $pdo->prepare("UPDATE `users` SET `supabase_uid` = ?, `auth_provider` = 'supabase_otp' WHERE `user_id` = ?");
        $stmtUpd->execute([$verifiedUid, $user['user_id']]);
        $user['supabase_uid'] = $verifiedUid;
    }

    // Update last_login
    $pdo->prepare("UPDATE `users` SET `last_login` = NOW() WHERE `user_id` = ?")->execute([$user['user_id']]);

    // Build profile object according to role
    $profile = null;
    if ($user['role'] === 'student') {
        $profile = [
            'student_id' => $user['student_id'],
            'student_number' => $user['student_number'],
            'full_name' => trim("{$user['s_fname']} {$user['s_mname']} {$user['s_lname']}"),
            'program' => $user['program'],
            'year_level' => $user['year_level'],
            'section' => $user['section']
        ];
    } else if ($user['role'] === 'personnel' || $user['role'] === 'officer') {
        $profile = [
            'personnel_id' => $user['personnel_id'],
            'employee_number' => $user['employee_number'],
            'full_name' => trim("{$user['p_fname']} {$user['p_lname']}"),
            'designation' => $user['designation'],
            'department' => $user['department']
        ];
    } else {
        $profile = [
            'full_name' => $user['username'] === 'developer' ? 'Dave Guiyab' : 'Engr. Ivanlee Mendoza',
            'designation' => $user['role'] === 'developer' ? 'System Developer' : 'Head Engineer & Coordinator'
        ];
    }

    // Log login to audit trail
    logAudit($pdo, $user['user_id'], 'LOGIN_SUPABASE_OTP', 'users', $user['user_id'], "User {$user['username']} logged in via Supabase Email OTP ({$verifiedEmail})");

    echo json_encode([
        'success' => true,
        'user' => [
            'user_id' => (int)$user['user_id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'supabase_uid' => $user['supabase_uid']
        ],
        'profile' => $profile
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Authentication processing failed: ' . $e->getMessage()]);
}
