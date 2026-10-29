<?php
/**
 * COE-Pay: Dean / Administrator Student Masterlist Bulk Upload Endpoint
 * Endpoint: POST /api/dean/masterlist/upload or POST /api/masterlist_upload.php
 * Target Table: students (with cascading user account synchronization)
 */

require_once __DIR__ . '/config.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method Not Allowed. Use POST to upload student masterlist.'
    ]);
    exit();
}

// =============================================================================
// 1. Role-Based Access Control (Restricted to Dean / Admin)
// =============================================================================
require_once __DIR__ . '/auth_guard.php';
$auth = requireAuth($pdo, ['admin', 'developer']);
$adminUserId = $auth['user_id'];

// =============================================================================
// 2. Extract Records (From Multipart File or JSON payload)
// =============================================================================
$rawRows = [];
$filename = 'unknown';

if (!empty($_FILES['file']['tmp_name'])) {
    $fileTmp = $_FILES['file']['tmp_name'];
    $filename = $_FILES['file']['name'];
    $fileExt = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

    if (!in_array($fileExt, ['csv', 'xlsx', 'txt'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid file format. Please upload a .csv or .xlsx file.'
        ]);
        exit();
    }

    if ($fileExt === 'csv' || $fileExt === 'txt') {
        $rawRows = parseCsvFile($fileTmp);
    } elseif ($fileExt === 'xlsx') {
        $rawRows = parseXlsxFile($fileTmp);
    }
} else {
    // Check if JSON body contains pre-parsed student rows
    $rawInput = file_get_contents('php://input');
    $jsonData = json_decode($rawInput, true);

    if (!empty($jsonData['records']) && is_array($jsonData['records'])) {
        $rawRows = $jsonData['records'];
        $filename = 'payload.json';
    } elseif (!empty($_POST['records'])) {
        $parsed = json_decode($_POST['records'], true);
        if (is_array($parsed)) {
            $rawRows = $parsed;
            $filename = 'form_records.json';
        }
    }
}

if (empty($rawRows)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'No student records detected. Please check file structure or upload a valid masterlist.'
    ]);
    exit();
}

// =============================================================================
// 3. Row-by-Row Validation & Upsert Execution
// =============================================================================
$insertedCount = 0;
$updatedCount = 0;
$skippedCount = 0;
$validationErrors = [];
$processedRecords = [];
$seenStudentNumbers = [];

// Prepare SQL Statements
$stmtFindStudent = $pdo->prepare("SELECT `student_id`, `user_id`, `year_level`, `section` FROM `students` WHERE `student_number` = ? LIMIT 1");
$stmtFindUserByUsername = $pdo->prepare("SELECT `user_id` FROM `users` WHERE `username` = ? LIMIT 1");
$stmtFindUserByEmail = $pdo->prepare("SELECT `user_id` FROM `users` WHERE `email` = ? LIMIT 1");

$stmtInsertUser = $pdo->prepare("
    INSERT INTO `users` (`username`, `email`, `password_hash`, `role`, `is_active`)
    VALUES (?, ?, ?, 'student', 1)
");
$stmtUpdateUserEmail = $pdo->prepare("
    UPDATE `users` SET `email` = ?, `updated_at` = NOW() WHERE `user_id` = ?
");

$stmtInsertStudent = $pdo->prepare("
    INSERT INTO `students` (
        `user_id`, `student_number`, `first_name`, `middle_name`, `last_name`, 
        `program`, `year_level`, `section`, `contact_number`
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$stmtUpdateStudent = $pdo->prepare("
    UPDATE `students` SET 
        `first_name` = ?, 
        `middle_name` = ?, 
        `last_name` = ?, 
        `program` = ?, 
        `year_level` = ?, 
        `section` = ?, 
        `contact_number` = ?,
        `updated_at` = NOW()
    WHERE `student_id` = ?
");

// Prepared statement to auto-assign active authorized dues to student
$stmtAssignRequests = $pdo->prepare("
    INSERT INTO `student_payment_assignments` (`request_id`, `student_id`, `status`, `assigned_at`)
    SELECT r.`request_id`, ?, 'unpaid', NOW()
    FROM `payment_requests` r
    WHERE r.`status` = 'authorized'
      AND (r.`target_year_level` IS NULL OR r.`target_year_level` = ?)
      AND (r.`target_section` IS NULL OR LOWER(r.`target_section`) = LOWER(?))
      AND NOT EXISTS (
          SELECT 1 FROM `student_payment_assignments` a 
          WHERE a.`request_id` = r.`request_id` AND a.`student_id` = ?
      )
");

$defaultHash = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT); // random, never shown; students sign in with email OTP

// Begin Transaction
$pdo->beginTransaction();

try {
    foreach ($rawRows as $idx => $row) {
        $rowNum = $idx + 2; // Assuming line 1 is header

        // Field Normalization
        $studentNumber = trim($row['student_number'] ?? $row['student_id'] ?? $row['id_number'] ?? '');
        $firstName     = trim($row['first_name'] ?? $row['firstname'] ?? '');
        $middleName    = trim($row['middle_name'] ?? $row['middlename'] ?? '');
        $lastName      = trim($row['last_name'] ?? $row['lastname'] ?? '');
        $email         = strtolower(trim($row['email'] ?? $row['student_email'] ?? ''));
        $program       = trim($row['program'] ?? $row['course'] ?? '');
        $yearLevelRaw  = trim($row['year_level'] ?? $row['year'] ?? '');
        $section       = trim($row['section'] ?? $row['class_section'] ?? '');
        $contactNumber = trim($row['contact_number'] ?? $row['contact'] ?? '');

        // Default Program to 'BSCOE' if missing
        if (empty($program)) {
            $program = 'BSCOE';
        }

        // Parse Year Level (handles "4", "4th Year", "Year 4", etc.)
        $yearLevel = null;
        if (preg_match('/(\d+)/', $yearLevelRaw, $m)) {
            $yearLevel = intval($m[1]);
        }

        // --- Validation Rules ---
        $rowErrors = [];

        if (empty($studentNumber)) {
            $rowErrors[] = "Missing Student ID / Number";
        } elseif (!preg_match('/^[A-Za-z0-9-]+$/', $studentNumber)) {
            $rowErrors[] = "Invalid Student ID format";
        }

        if (empty($firstName)) {
            $rowErrors[] = "First name is required";
        }

        if (empty($lastName)) {
            $rowErrors[] = "Last name is required";
        }

        if (empty($email)) {
            $rowErrors[] = "Email address is required";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $rowErrors[] = "Invalid email format ($email)";
        }

        if ($yearLevel === null || $yearLevel < 1 || $yearLevel > 5) {
            $rowErrors[] = "Year level must be between 1 and 5";
        }

        if (empty($section)) {
            $rowErrors[] = "Section is required";
        }

        // Check file internal duplicate
        if (!empty($studentNumber) && isset($seenStudentNumbers[$studentNumber])) {
            $rowErrors[] = "Duplicate student ID within the same upload file (first seen on line {$seenStudentNumbers[$studentNumber]})";
        }

        if (!empty($rowErrors)) {
            $skippedCount++;
            $validationErrors[] = [
                'row' => $rowNum,
                'student_id' => $studentNumber ?: 'N/A',
                'name' => trim("$firstName $lastName") ?: 'N/A',
                'errors' => $rowErrors
            ];
            continue;
        }

        $seenStudentNumbers[$studentNumber] = $rowNum;

        // --- Database Upsert Logic ---
        $stmtFindStudent->execute([$studentNumber]);
        $existing = $stmtFindStudent->fetch();

        if ($existing) {
            // ==========================================
            // ACTION: UPDATE EXISTING RECORD
            // ==========================================
            $targetStudentId = $existing['student_id'];
            $targetUserId = $existing['user_id'];

            // Update student demographic info
            $stmtUpdateStudent->execute([
                $firstName,
                $middleName ?: null,
                $lastName,
                $program,
                $yearLevel,
                $section,
                $contactNumber ?: null,
                $targetStudentId
            ]);

            // Update user email
            if (!empty($email)) {
                $stmtUpdateUserEmail->execute([$email, $targetUserId]);
            }

            // Sync any newly matched authorized dues
            $stmtAssignRequests->execute([$targetStudentId, $yearLevel, $section, $targetStudentId]);

            $updatedCount++;
            $processedRecords[] = [
                'student_id' => $studentNumber,
                'action' => 'updated',
                'name' => "$firstName $lastName",
                'cohort' => "$program - Year $yearLevel ($section)"
            ];
        } else {
            // ==========================================
            // ACTION: INSERT NEW RECORD
            // ==========================================
            // Check if user already exists
            $stmtFindUserByUsername->execute([$studentNumber]);
            $existingUser = $stmtFindUserByUsername->fetch();

            if ($existingUser) {
                $userId = $existingUser['user_id'];
            } else {
                // Ensure email is not colliding with another user
                $stmtFindUserByEmail->execute([$email]);
                $emailOwner = $stmtFindUserByEmail->fetch();
                if ($emailOwner) {
                    $emailParts = explode('@', $email);
                    $email = $emailParts[0] . '+' . str_replace('-', '', $studentNumber) . '@' . $emailParts[1];
                }

                $stmtInsertUser->execute([$studentNumber, $email, $defaultHash]);
                $userId = $pdo->lastInsertId();
            }

            $stmtInsertStudent->execute([
                $userId,
                $studentNumber,
                $firstName,
                $middleName ?: null,
                $lastName,
                $program,
                $yearLevel,
                $section,
                $contactNumber ?: null
            ]);
            $newStudentId = $pdo->lastInsertId();

            // Auto-assign matching cohort payment requests
            $stmtAssignRequests->execute([$newStudentId, $yearLevel, $section, $newStudentId]);

            $insertedCount++;
            $processedRecords[] = [
                'student_id' => $studentNumber,
                'action' => 'inserted',
                'name' => "$firstName $lastName",
                'cohort' => "$program - Year $yearLevel ($section)"
            ];
        }
    }

    // Commit Transaction
    $pdo->commit();

    // Audit Logging
    $totalProcessed = $insertedCount + $updatedCount;
    logAudit(
        $pdo,
        $adminUserId,
        'BULK_MASTERLIST_UPLOAD',
        'students',
        $insertedCount,
        "Processed student masterlist '$filename'. Inserted: $insertedCount, Updated: $updatedCount, Skipped: $skippedCount."
    );

    echo json_encode([
        'success' => true,
        'message' => "Masterlist processed successfully! Inserted {$insertedCount} new, updated {$updatedCount} existing, skipped {$skippedCount}.",
        'summary' => [
            'total_parsed' => count($rawRows),
            'inserted' => $insertedCount,
            'updated' => $updatedCount,
            'skipped' => $skippedCount,
            'errors' => $validationErrors
        ],
        'processed_records' => $processedRecords
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Transaction failed during masterlist processing: ' . $e->getMessage()
    ]);
}

// =============================================================================
// Helper: CSV File Parser
// =============================================================================
function parseCsvFile($filePath) {
    $rows = [];
    $handle = fopen($filePath, 'r');
    if (!$handle) return [];

    // Strip UTF-8 BOM if present
    $bom = fread($handle, 3);
    if ($bom !== "\xEF\xBB\xBF") {
        rewind($handle);
    }

    // Detect delimiter (comma or semicolon)
    $firstLine = fgets($handle);
    rewind($handle);
    if ($bom === "\xEF\xBB\xBF") {
        fseek($handle, 3);
    }
    $delimiter = (substr_count($firstLine, ';') > substr_count($firstLine, ',')) ? ';' : ',';

    $headers = fgetcsv($handle, 2048, $delimiter);
    if (!$headers) {
        fclose($handle);
        return [];
    }

    // Normalize headers
    $normalizedHeaders = array_map(function($h) {
        $clean = strtolower(trim($h));
        $clean = preg_replace('/[^a-z0-9_]/', '_', $clean);
        return trim($clean, '_');
    }, $headers);

    while (($data = fgetcsv($handle, 2048, $delimiter)) !== false) {
        if (count($data) === 1 && empty($data[0])) continue; // Skip blank lines
        $row = [];
        foreach ($normalizedHeaders as $i => $key) {
            $row[$key] = isset($data[$i]) ? trim($data[$i]) : '';
        }
        $rows[] = $row;
    }

    fclose($handle);
    return $rows;
}

// =============================================================================
// Helper: Basic XLSX Parser (Unzips sheet1.xml & sharedStrings.xml)
// =============================================================================
function parseXlsxFile($filePath) {
    $rows = [];
    if (!class_exists('ZipArchive')) {
        return [];
    }

    $zip = new ZipArchive();
    if ($zip->open($filePath) !== true) {
        return [];
    }

    // Read shared strings
    $sharedStrings = [];
    $stringsXml = $zip->getFromName('xl/sharedStrings.xml');
    if ($stringsXml) {
        $xml = simplexml_load_string($stringsXml);
        if ($xml) {
            foreach ($xml->si as $val) {
                $sharedStrings[] = (string)($val->t ?? ($val->r ? $val->r->t : ''));
            }
        }
    }

    // Read sheet1
    $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
    $zip->close();
    if (!$sheetXml) return [];

    $xml = simplexml_load_string($sheetXml);
    if (!$xml || !isset($xml->sheetData->row)) return [];

    $headers = [];
    $isFirst = true;

    foreach ($xml->sheetData->row as $r) {
        $rowData = [];
        foreach ($r->c as $c) {
            $type = (string)$c['t'];
            $val = (string)$c->v;
            if ($type === 's' && isset($sharedStrings[intval($val)])) {
                $val = $sharedStrings[intval($val)];
            }
            $rowData[] = trim($val);
        }

        if ($isFirst) {
            $headers = array_map(function($h) {
                $clean = strtolower(trim($h));
                $clean = preg_replace('/[^a-z0-9_]/', '_', $clean);
                return trim($clean, '_');
            }, $rowData);
            $isFirst = false;
        } else {
            if (empty(array_filter($rowData))) continue;
            $row = [];
            foreach ($headers as $i => $key) {
                $row[$key] = $rowData[$i] ?? '';
            }
            $rows[] = $row;
        }
    }

    return $rows;
}
