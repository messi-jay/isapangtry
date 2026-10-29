/**
 * COE-Pay: Supabase Auth & OTP In-Browser Sandbox Test Suite
 * Non-destructive verification of Supabase client adapter,
 * OTP lifecycle, MySQL profile linking, and student registration.
 */

(function(global) {
  'use strict';

  const SANDBOX_KEY = 'coepay_supabase_test_db_' + Date.now();

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

  // Isolated DB Engine instance
  class IsolatedEngine extends CoeDatabaseEngine {
    constructor(key) {
      super();
      this.STORAGE_KEY = key;
      this.resetToSeed();
    }
  }

  async function runSupabaseTestSuite() {
    console.log("==================================================================");
    console.log("🧪 STARTING COE-PAY SUPABASE AUTH & OTP SANDBOX TEST SUITE");
    console.log("🔒 Mode: ISOLATED LOCAL SANDBOX (Zero production data mutation)");
    console.log("==================================================================");

    const runner = new TestRunner();
    const sandboxDb = new IsolatedEngine(SANDBOX_KEY);

    // 1. Adapter initialization
    runner.assert(!!window.CoeSupabaseAuth, "CoeSupabaseAuth adapter singleton is loaded and available on window");
    runner.assert(typeof window.CoeSupabaseAuth.signInWithOtp === 'function', "signInWithOtp method is exposed");
    runner.assert(typeof window.CoeSupabaseAuth.verifyOtp === 'function', "verifyOtp method is exposed");
    runner.assert(typeof window.CoeSupabaseAuth.signOut === 'function', "signOut method is exposed");

    // 2. Request OTP for existing student
    const testEmail = "christian.guiyab@students.edu.ph";
    let reqRes = null;
    try {
      reqRes = await window.CoeSupabaseAuth.signInWithOtp(testEmail);
      runner.assert(reqRes.success === true, "OTP dispatch request returns success");
      runner.assert(reqRes.email === testEmail, "Returned email matches target institutional email");
      runner.assert(typeof reqRes.otpCode === 'string' && reqRes.otpCode.length === 6, "OTP code is exactly 6 digits: " + reqRes.otpCode);
    } catch (e) {
      runner.assert(false, "OTP request failed: " + e.message);
    }

    // 3. Verify OTP with incorrect code fails
    try {
      await window.CoeSupabaseAuth.verifyOtp(testEmail, "000000");
      runner.assert(false, "Verification with incorrect code should throw error");
    } catch (e) {
      runner.assert(e.message.includes("Invalid OTP") || e.message.includes("failed"), "Invalid OTP code is rejected with security message: " + e.message);
    }

    // 4. Verify OTP with correct code succeeds
    let verifyRes = null;
    try {
      verifyRes = await window.CoeSupabaseAuth.verifyOtp(testEmail, reqRes.otpCode);
      runner.assert(verifyRes.success === true, "Verification with correct OTP succeeds");
      runner.assert(!!verifyRes.supabaseUid, "Supabase UID is generated: " + verifyRes.supabaseUid);
    } catch (e) {
      runner.assert(false, "Verification with correct OTP failed: " + e.message);
    }

    // 5. Link Supabase UID in database engine
    try {
      const user = sandboxDb.getUserByEmail(testEmail);
      runner.assert(!!user, "Found existing student user in database engine: " + (user ? user.username : 'none'));
      
      const linkRes = sandboxDb.linkSupabaseUid(user.user_id, verifyRes.supabaseUid);
      runner.assert(linkRes.success === true, "linkSupabaseUid successfully mapped identity");
      
      const updatedUser = sandboxDb.getUserById(user.user_id);
      runner.assertEqual(updatedUser.supabase_uid, verifyRes.supabaseUid, "supabase_uid is persisted in user profile");
      runner.assertEqual(updatedUser.auth_provider, 'supabase_otp', "auth_provider is set to 'supabase_otp'");
    } catch (e) {
      runner.assert(false, "Identity linking failed: " + e.message);
    }

    // 6. Student Self-Registration Flow
    const newStudentEmail = "test.supabase." + Date.now() + "@students.edu.ph";
    const newStudentNumber = "2026-99" + Math.floor(Math.random() * 899 + 100);
    const newStudentData = {
      student_number: newStudentNumber,
      first_name: "Supabase",
      middle_name: "Auth",
      last_name: "Tester",
      program: "BS Computer Engineering",
      year_level: 2,
      section: "2B",
      email: newStudentEmail,
      contact_number: "09998887777",
      supabase_uid: "sb-uuid-" + Date.now()
    };

    try {
      const regRes = sandboxDb.registerStudentWithSupabase(newStudentData);
      runner.assert(regRes.success === true, "registerStudentWithSupabase successfully created student profile");
      runner.assert(!!regRes.user && regRes.user.role === 'student', "New account role strictly set to student");
      runner.assertEqual(regRes.user.supabase_uid, newStudentData.supabase_uid, "Supabase UID mapped on registration");

      // Verify obligations assigned
      const obligations = sandboxDb.getStudentObligations(regRes.student.student_id);
      runner.assert(obligations.length > 0, "Authorized obligations automatically assigned to new student (Count: " + obligations.length + ")");
    } catch (e) {
      runner.assert(false, "Student self-registration failed: " + e.message);
    }

    // 7. Duplicate Student Registration Prevention
    try {
      sandboxDb.registerStudentWithSupabase(newStudentData);
      runner.assert(false, "Duplicate registration must be rejected");
    } catch (e) {
      runner.assert(e.message.includes("already registered") || e.message.includes("already exists"), "Duplicate registration blocked: " + e.message);
    }

    // 8. Sign Out
    try {
      const signOutRes = await window.CoeSupabaseAuth.signOut();
      runner.assert(signOutRes === true, "Sign out successfully invalidates Supabase session");
    } catch (e) {
      runner.assert(false, "Sign out failed: " + e.message);
    }

    // Clean up sandbox storage
    try {
      localStorage.removeItem(SANDBOX_KEY);
    } catch (e) {}

    // Render results in DOM
    const summary = runner.getSummary();
    const container = document.getElementById('test-output');
    if (container) {
      const isSuccess = summary.failed === 0;
      container.innerHTML = `
        <div class="test-header ${isSuccess ? 'test-success' : 'test-failure'}">
          <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.25rem;">
            ${isSuccess ? '✓ All Supabase Auth & OTP Sandbox Tests Passed' : '✗ Tests Completed with Failures'}
          </h2>
          <p style="font-size: 0.85rem; margin: 0;">
            Passed: <strong>${summary.passed}</strong> / ${summary.total} assertions (${summary.failed} failed)
          </p>
        </div>
        <ul class="test-list">
          ${summary.results.map(r => `
            <li class="test-item ${r.status === 'PASS' ? 'pass' : 'fail'}">
              <span class="test-badge">${r.status}</span>
              <span>${r.message}</span>
            </li>
          `).join('')}
        </ul>
      `;
    }

    console.log("==================================================================");
    console.log(`🏁 TESTS COMPLETED: ${summary.passed} Passed, ${summary.failed} Failed`);
    console.log("==================================================================");
    return summary;
  }

  // Auto-run if DOM loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runSupabaseTestSuite);
  } else {
    runSupabaseTestSuite();
  }

  global.runSupabaseTestSuite = runSupabaseTestSuite;
})(typeof window !== 'undefined' ? window : this);
