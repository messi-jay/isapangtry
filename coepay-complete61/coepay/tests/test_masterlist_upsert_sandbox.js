/**
 * COE-Pay: Isolated Sandbox Test Suite for Student Masterlist Bulk Upsert
 * Safety & Non-Destructive Testing:
 * - Uses a dedicated sandbox storage key ('coepay_db_sandbox_test')
 * - Does NOT mutate production or main development data
 * - Cleans up all test keys upon completion
 */

(function(global) {
  'use strict';

  const SANDBOX_KEY = 'coepay_db_sandbox_test_' + Date.now();

  class TestRunner {
    constructor() {
      this.passed = 0;
      this.failed = 0;
      this.results = [];
    }

    assert(condition, message) {
      if (condition) {
        this.passed++;
        this.results.push({ status: 'PASS', message });
        console.log(`%c[PASS]%c ${message}`, 'color: #10B981; font-weight: bold;', 'color: inherit;');
      } else {
        this.failed++;
        this.results.push({ status: 'FAIL', message });
        console.error(`[FAIL] ${message}`);
      }
    }

    assertEqual(actual, expected, message) {
      const isMatch = actual === expected;
      this.assert(isMatch, `${message} (Expected: ${expected}, Got: ${actual})`);
    }

    getSummary() {
      return {
        passed: this.passed,
        failed: this.failed,
        total: this.passed + this.failed,
        results: this.results
      };
    }
  }

  // Create an isolated engine subclass pointing to a sandbox key
  class SandboxDatabaseEngine extends CoeDatabaseEngine {
    constructor(storageKey) {
      super();
      this.STORAGE_KEY = storageKey;
      this.resetToSeed();
    }
  }

  async function runMasterlistTestSuite() {
    console.log("==================================================================");
    console.log("🧪 STARTING COE-PAY MASTERLIST BULK UPSERT SANDBOX TEST SUITE");
    console.log("🔒 Mode: ISOLATED SANDBOX (Zero production data mutation)");
    console.log("==================================================================");

    const runner = new TestRunner();
    const sandboxDb = new SandboxDatabaseEngine(SANDBOX_KEY);
    const adminUser = { user_id: 1, username: 'admin', role: 'admin' };
    const studentUser = { user_id: 30, username: '2023-10001', role: 'student' };

    // Standard Official Sample Roster (8 Official Students)
    const officialSampleData = [
      { student_number: "2023-10001", first_name: "Christian Dave", middle_name: "D.", last_name: "Guiyab", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "christian.guiyab@students.edu.ph", contact_number: "09123456789" },
      { student_number: "2023-10009", first_name: "Jay-are", middle_name: "", last_name: "Mesias", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "sstephencurryy30@gmail.com", contact_number: "09391439718" },
      { student_number: "2023-10003", first_name: "Jefferson", middle_name: "C.", last_name: "Sadoguio", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "jeffesonsadoguio@gmail.com", contact_number: "09165938156" },
      { student_number: "2023-10004", first_name: "Jerome", middle_name: "R.", last_name: "Opana", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "jerome.opana@students.edu.ph", contact_number: "09123456789" },
      { student_number: "2023-10005", first_name: "Aaron Mikhael", middle_name: "", last_name: "Canonizado", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "aaron.canonizado@students.edu.ph", contact_number: "09123456789" },
      { student_number: "2023-10006", first_name: "John Robin", middle_name: "P.", last_name: "Fernandez", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "johnrobin.fernandez@students.edu.ph", contact_number: "09123456789" },
      { student_number: "2023-10007", first_name: "Ma. Sophia", middle_name: "B.", last_name: "Dimasu-ay", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "sdimasuay13@gmail.com", contact_number: "09636729211" },
      { student_number: "2023-10008", first_name: "Tricia Mae", middle_name: "S.", last_name: "Gonzaga", program: "BS Computer Engineering", year_level: 4, section: "4A", email: "gonzagat634@gmail.com", contact_number: "009501807279" }
    ];

    // Reset students to empty in sandboxDb for a clean batch insert test
    sandboxDb.tables.students = [];
    sandboxDb.tables.users = sandboxDb.tables.users.filter(u => u.role !== 'student');
    const initialStudentCount = 0;

    // -------------------------------------------------------------------------
    // TEST 1: Clean Batch Insert of 8 Official Students
    // -------------------------------------------------------------------------
    console.log("\n▶ Running Test 1: Clean Batch Insert");
    const result1 = sandboxDb.bulkUpsertStudents(officialSampleData, adminUser);
    runner.assertEqual(result1.summary.inserted, 8, "All 8 official students inserted successfully");
    runner.assertEqual(result1.summary.updated, 0, "No records updated on initial upload");
    runner.assertEqual(result1.summary.skipped, 0, "Zero records skipped");
    runner.assertEqual(sandboxDb.getStudents().length, 8, "Total students in sandbox equals 8");

    const studentGuiyab = sandboxDb.getStudents().find(s => s.student_number === "2023-10001");
    runner.assert(!!studentGuiyab, "Student 'Christian Dave Guiyab' retrieved from sandbox");
    runner.assertEqual(studentGuiyab.first_name, "Christian Dave", "First name preserved correctly");
    runner.assertEqual(studentGuiyab.last_name, "Guiyab", "Last name preserved correctly");
    runner.assertEqual(studentGuiyab.section, "4A", "Section set to 4A");

    // Verify automatic obligation assignment for Year 4 Section 4A
    const guiyabAssignments = sandboxDb.getAssignments({ student_id: studentGuiyab.student_id });
    runner.assert(guiyabAssignments.length > 0, "Active authorized dues auto-assigned to newly inserted student");

    // -------------------------------------------------------------------------
    // TEST 2: Idempotent Upsert (Re-uploading same batch with updates)
    // -------------------------------------------------------------------------
    console.log("\n▶ Running Test 2: Idempotent Upsert & Field Update");
    const updatedSampleData = JSON.parse(JSON.stringify(officialSampleData));
    // Update student 2023-10001 email & contact
    updatedSampleData[0].email = "christiandave.updated@students.edu.ph";
    updatedSampleData[0].contact_number = "09999999999";
    // Update student 2023-10009 section
    updatedSampleData[1].section = "4A";

    const result2 = sandboxDb.bulkUpsertStudents(updatedSampleData, adminUser);
    runner.assertEqual(result2.summary.inserted, 0, "0 records inserted on re-upload of existing IDs");
    runner.assertEqual(result2.summary.updated, 8, "All 8 existing records updated");
    runner.assertEqual(sandboxDb.getStudents().length, 8, "No duplicate records created");

    const updatedGuiyab = sandboxDb.getStudents().find(s => s.student_number === "2023-10001");
    runner.assertEqual(updatedGuiyab.contact_number, "09999999999", "Contact number updated successfully");
    const updatedGuiyabUser = sandboxDb.tables.users.find(u => u.username === "2023-10001");
    runner.assertEqual(updatedGuiyabUser.email, "christiandave.updated@students.edu.ph", "User email synchronized on update");

    // -------------------------------------------------------------------------
    // TEST 3: Validation Error Handling & Safe Skipping
    // -------------------------------------------------------------------------
    console.log("\n▶ Running Test 3: Data Validation & Skipping");
    const invalidBatch = [
      // 1. Missing Student ID
      { student_number: "", first_name: "Test", last_name: "Invalid", email: "test@students.edu.ph", year_level: 4, section: "4A" },
      // 2. Invalid Email Format
      { student_number: "2023-99901", first_name: "Bad", last_name: "Email", email: "not-an-email", year_level: 4, section: "4A" },
      // 3. Invalid Year Level (Must be 1-5)
      { student_number: "2023-99902", first_name: "Bad", last_name: "Year", email: "badyear@students.edu.ph", year_level: 8, section: "4A" },
      // 4. Missing Section
      { student_number: "2023-99903", first_name: "No", last_name: "Section", email: "nosection@students.edu.ph", year_level: 2, section: "" },
      // 5. Valid record in the same batch
      { student_number: "2023-88888", first_name: "Valid", last_name: "Survivor", email: "survivor@students.edu.ph", year_level: 3, section: "3A" }
    ];

    const result3 = sandboxDb.bulkUpsertStudents(invalidBatch, adminUser);
    runner.assertEqual(result3.summary.skipped, 4, "4 invalid rows safely skipped");
    runner.assertEqual(result3.summary.inserted, 1, "1 valid row in same batch inserted successfully");
    runner.assertEqual(result3.summary.errors.length, 4, "Detailed validation error messages captured");

    // -------------------------------------------------------------------------
    // TEST 4: Intra-File Duplicate Detection
    // -------------------------------------------------------------------------
    console.log("\n▶ Running Test 4: Intra-File Duplicate Detection");
    const duplicateFileBatch = [
      { student_number: "2023-77777", first_name: "First", last_name: "Instance", email: "first@students.edu.ph", year_level: 1, section: "1A" },
      { student_number: "2023-77777", first_name: "Duplicate", last_name: "Instance", email: "duplicate@students.edu.ph", year_level: 1, section: "1A" }
    ];
    const result4 = sandboxDb.bulkUpsertStudents(duplicateFileBatch, adminUser);
    runner.assertEqual(result4.summary.inserted, 1, "First occurrence inserted");
    runner.assertEqual(result4.summary.skipped, 1, "Duplicate student ID within same file rejected");

    // -------------------------------------------------------------------------
    // TEST 5: Security / Role-Based Access Enforcement
    // -------------------------------------------------------------------------
    console.log("\n▶ Running Test 5: Role-Based Access Enforcement");
    let unauthorizedCaught = false;
    try {
      sandboxDb.bulkUpsertStudents(officialSampleData, studentUser);
    } catch (err) {
      unauthorizedCaught = true;
    }
    runner.assert(unauthorizedCaught, "Non-admin user blocked from calling bulk upload");

    // -------------------------------------------------------------------------
    // TEST 6: Audit Log Ledger Verification
    // -------------------------------------------------------------------------
    console.log("\n▶ Running Test 6: Audit Trail Ledger");
    const bulkAuditLogs = sandboxDb.tables.audit_logs.filter(l => l.action_type === 'BULK_MASTERLIST_UPLOAD');
    runner.assert(bulkAuditLogs.length >= 4, "All bulk operations logged to audit_logs");
    runner.assert(bulkAuditLogs[0].user_id === 1, "Admin user ID recorded in audit log");

    // -------------------------------------------------------------------------
    // TEST 7: Email Authentication & Identifier Resolution
    // -------------------------------------------------------------------------
    console.log("\n▶ Running Test 7: Email Authentication & Identifier Lookup");
    const foundByEmail = sandboxDb.findUserByIdentifier("sdimasuay13@gmail.com");
    runner.assert(foundByEmail !== null, "User resolved via masterlist email (sdimasuay13@gmail.com)");
    runner.assertEqual(foundByEmail.username, "2023-10007", "Email resolves to correct Student ID (2023-10007)");

    const foundByCurryEmail = sandboxDb.findUserByIdentifier("sstephencurryy30@gmail.com");
    runner.assert(foundByCurryEmail !== null, "User resolved via masterlist email (sstephencurryy30@gmail.com)");
    runner.assertEqual(foundByCurryEmail.username, "2023-10009", "Email resolves to correct Student ID (2023-10009)");

    // -------------------------------------------------------------------------
    // TEST 8: Email OTP Dispatch, Default Password & Password Reset Verification
    // -------------------------------------------------------------------------
    console.log("\n▶ Running Test 8: Email OTP Dispatch, Default Password & Password Reset");
    const otpRecord = sandboxDb.dispatchOtpEmail(foundByEmail, "482019");
    runner.assertEqual(otpRecord.email_type, "OTP", "OTP email type recorded");
    runner.assertEqual(otpRecord.recipient_email, "sdimasuay13@gmail.com", "OTP sent to exact masterlist email");

    const defaultPassRecord = sandboxDb.dispatchDefaultPasswordToStudent("2023-10009");
    runner.assertEqual(defaultPassRecord.email_type, "DEFAULT_PASSWORD", "Default password email type recorded");
    runner.assert(defaultPassRecord.body_text.includes("password123"), "Default password included in email body");

    const resetReq = sandboxDb.dispatchPasswordResetEmail("sdimasuay13@gmail.com");
    runner.assert(resetReq.success, "Password reset code dispatched successfully");
    const resetResult = sandboxDb.completePasswordReset("sdimasuay13@gmail.com", resetReq.resetCode, "newSecret2026!");
    runner.assert(resetResult.success, "Password updated successfully with valid reset code");
    runner.assertEqual(foundByEmail.password_custom, "newSecret2026!", "Custom updated password persisted on user account");

    // -------------------------------------------------------------------------
    // CLEANUP SANDBOX
    // -------------------------------------------------------------------------
    localStorage.removeItem(SANDBOX_KEY);
    console.log("\n🧹 Sandbox test key cleaned up from localStorage.");

    const summary = runner.getSummary();
    console.log("==================================================================");
    console.log(`🏁 TEST COMPLETE: ${summary.passed} Passed, ${summary.failed} Failed out of ${summary.total} assertions.`);
    console.log("==================================================================");

    return summary;
  }

  // Export
  global.runMasterlistTestSuite = runMasterlistTestSuite;

  // Auto-run if inside sandbox_runner.html
  if (typeof window !== 'undefined' && window.location && window.location.pathname.includes('sandbox_runner')) {
    window.addEventListener('DOMContentLoaded', () => {
      runMasterlistTestSuite().then(summary => {
        const container = document.getElementById('test-output');
        if (container) {
          container.innerHTML = `
            <div class="test-header ${summary.failed === 0 ? 'test-success' : 'test-failure'}">
              <h2>${summary.failed === 0 ? '✅ ALL SANDBOX TESTS PASSED' : '❌ SOME TESTS FAILED'}</h2>
              <p>Passed: <strong>${summary.passed}</strong> | Failed: <strong>${summary.failed}</strong> | Total: <strong>${summary.total}</strong></p>
            </div>
            <ul class="test-list">
              ${summary.results.map(r => `
                <li class="test-item ${r.status.toLowerCase()}">
                  <span class="test-badge">${r.status}</span>
                  <span class="test-msg">${r.message}</span>
                </li>
              `).join('')}
            </ul>
          `;
        }
      });
    });
  }

})(typeof window !== 'undefined' ? window : this);
