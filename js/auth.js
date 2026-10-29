/**
 * COE-Pay: Authentication & Session Controller
 * Manages active user session, role-based access control,
 * login/logout, and demo user fast switching.
 */

class CoeAuth {
  constructor() {
    this.SESSION_KEY = 'coepay_active_session_v1';
    this.currentUser = null;
    this.currentProfile = null;
    this.pendingOtpUser = null;
    this.currentOtpCode = null;
    this.init();
  }

  init() {
    const session = localStorage.getItem(this.SESSION_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        // Refresh from DB
        const user = window.coepayDb.getUserById(parsed.user_id);
        if (user && user.is_active === 1) {
          this.setCurrentUser(user, false);
        } else {
          this.logout();
        }
      } catch (e) {
        this.logout();
      }
    } else {
      // Do not auto-login; show the unified login interface for role selection
      this.currentUser = null;
      this.currentProfile = null;
    }
  }

  setCurrentUser(user, logEvent = true) {
    this.currentUser = user;

    if (user.role === 'developer') {
      this.currentProfile = {
        full_name: 'Dave Guiyab',
        designation: 'Lead Full-Stack System Developer',
        department: 'COE-Pay Software Architecture & Systems Lab',
        responsibility: 'Responsible for building a system that works properly and helps people perform their tasks more efficiently.'
      };
    } else if (user.role === 'coordinator' || user.role === 'admin') {
      this.currentProfile = {
        full_name: 'Engr. Ivanlee Mendoza',
        designation: 'Head Engineer & Academic Program Coordinator',
        department: 'College of Engineering and Digital Technology',
        responsibility: 'Approve request, add student, bulk upload masterlist, and monitor compliance.'
      };
    } else if (user.role === 'officer' || user.role === 'personnel') {
      const p = window.coepayDb.getPersonnelByUserId(user.user_id);
      this.currentProfile = p || {
        personnel_id: 1,
        full_name: 'Pearl Catequista',
        designation: 'College Student Officer & Financial Treasurer',
        department: 'College of Engineering Student Council & Organizations',
        responsibility: 'Request for adding items, seminars, and other fees; inspect receipts and verify transactions.'
      };
    } else if (user.role === 'student') {
      const studentProf = window.coepayDb.getStudentByUserId(user.user_id);
      this.currentProfile = studentProf || {
        student_id: 101,
        student_number: user.username,
        full_name: 'Christian Dave Guiyab',
        program: 'BS Computer Engineering',
        year_level: 4,
        section: '4A',
        responsibility: 'Purchase, paying, ordering student fees & obligations.'
      };
    }

    localStorage.setItem(this.SESSION_KEY, JSON.stringify({
      user_id: user.user_id,
      username: user.username,
      role: user.role
    }));

    if (logEvent) {
      window.coepayDb.logAudit(
        user.user_id,
        'LOGIN',
        'users',
        user.user_id,
        `User ${user.username} logged in as ${user.role} (${this.currentProfile ? this.currentProfile.full_name : ''})`
      );
    }

    // Trigger app UI refresh
    if (window.coeApp && typeof window.coeApp.onUserChanged === 'function') {
      window.coeApp.onUserChanged();
    }
  }

  assertSandbox() {
    if (!window.COEPAY_ALLOW_SANDBOX) throw new Error('Demo login is disabled. Please sign in with your email OTP.');
  }

  loginWithUsername(username, logEvent = true) {
    this.assertSandbox();
    const raw = (username || '').toLowerCase().trim();
    const users = window.coepayDb.getUsers();

    // Map common aliases
    let target = raw;
    if (raw === 'developer' || raw === 'dave.guiyab' || raw === 'dave') {
      target = 'developer';
    } else if (raw === 'engr.mendoza' || raw === 'ivanlee' || raw === 'coordinator' || raw === 'head.engineer' || raw === 'admin') {
      const mendoza = users.find(u => u.username === 'engr.mendoza');
      target = mendoza ? 'engr.mendoza' : 'admin';
    } else if (raw === 'officer' || raw === 'pearl.catequista' || raw === 'pearl' || raw === 'engr.santos') {
      const officer = users.find(u => u.username === 'officer');
      target = officer ? 'officer' : 'engr.santos';
    } else if (raw === 'student') {
      const std = users.find(u => u.username === '2023-10001');
      target = std ? '2023-10001' : '2023-10009';
    }

    let user = window.coepayDb.findUserByIdentifier(raw);

    // Dynamic auto-injection fallback for developer role
    if (!user && (target === 'developer' || raw === 'developer')) {
      user = {
        user_id: 100,
        username: "developer",
        email: "dave.guiyab@developer.coepay.edu.ph",
        password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq",
        role: "developer",
        is_active: 1,
        last_login: window.coepayDb.getNowTimestamp(),
        created_at: "2026-01-05 08:00:00",
        updated_at: window.coepayDb.getNowTimestamp()
      };
      if (!window.coepayDb.tables.users) window.coepayDb.tables.users = [];
      window.coepayDb.tables.users.push(user);
      window.coepayDb.save();
    }

    if (!user) {
      throw new Error(`User account "${username}" not found.`);
    }
    if (user.is_active !== 1) {
      throw new Error(`User account "${username}" is currently deactivated.`);
    }

    user.last_login = window.coepayDb.getNowTimestamp();
    window.coepayDb.save();
    this.setCurrentUser(user, logEvent);
    return user;
  }

  /**
   * Flowchart Step: Enter credentials -> Validate credentials -> Send OTP to email
   * Supports authenticating via Email, Username, or Student Number.
   */
  initiateLogin(identifier, password) {
    this.assertSandbox();
    if (!identifier || !identifier.trim()) {
      throw new Error("Please enter your registered Email, Username, or Student Number.");
    }
    if (!password || password.length < 4) {
      throw new Error("Invalid Username/Email or Password.");
    }

    const cleanInput = identifier.trim();
    let user = window.coepayDb.findUserByIdentifier(cleanInput);

    if (!user && window.coepayDb && typeof window.coepayDb.ensureCorePersonas === 'function') {
      window.coepayDb.ensureCorePersonas();
      user = window.coepayDb.findUserByIdentifier(cleanInput);
    }

    // Auto-create developer fallback if testing with developer credentials
    if (!user && (cleanInput.toLowerCase() === 'developer' || cleanInput.toLowerCase() === 'dave.guiyab@developer.coepay.edu.ph')) {
      user = {
        user_id: 100,
        username: "developer",
        email: "dave.guiyab@developer.coepay.edu.ph",
        password_hash: "$2y$10$wT8mQ0ZJ96r1e0aF4CqBku7GZ1Q1D.eD7kM1/9L5pYF7kG6g9Oweq",
        role: "developer",
        is_active: 1,
        last_login: window.coepayDb.getNowTimestamp(),
        created_at: "2026-01-05 08:00:00",
        updated_at: window.coepayDb.getNowTimestamp()
      };
      if (!window.coepayDb.tables.users) window.coepayDb.tables.users = [];
      window.coepayDb.tables.users.push(user);
      window.coepayDb.save();
    }

    if (!user) {
      throw new Error("Invalid Username/Email or Password. Please check your credentials.");
    }

    if (user.is_active !== 1) {
      throw new Error(`User account "${identifier}" is currently deactivated.`);
    }

    // Verify Password: Custom updated password or default password123 (or standard test passwords)
    const validPassword = 
      (user.password_custom && password === user.password_custom) ||
      password === 'password123' ||
      password === 'admin123' ||
      password === 'password' ||
      password === 'developer';

    if (!validPassword) {
      throw new Error("Invalid Username/Email or Password. Please check your credentials.");
    }

    // Generate dynamic 6-digit OTP code (Standard demo fallback also supported: '123456')
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    this.pendingOtpUser = user;
    this.currentOtpCode = otpCode;

    // Send OTP to registered masterlist email and log to audit trail & outbox
    const emailRecord = window.coepayDb.dispatchOtpEmail(user, otpCode);

    return {
      success: true,
      user: user,
      email: user.email,
      maskedEmail: this.maskEmail(user.email),
      otpCode: otpCode,
      emailRecord: emailRecord
    };
  }

  /**
   * Flowchart Step: Input OTP Received from Email -> Is OTP Correct?
   */
  verifyOtp(enteredCode) {
    if (!this.pendingOtpUser) {
      throw new Error("No pending sign-in session found. Please enter your credentials first.");
    }

    const cleanInput = String(enteredCode || '').trim();
    if (!cleanInput) {
      throw new Error("Please enter the 6-digit verification OTP code.");
    }

    // Verify against current generated code or standard test code 123456
    if (cleanInput !== this.currentOtpCode) {
      throw new Error("Invalid OTP (request a new code). The code you entered does not match.");
    }

    // OTP Verified successfully! Check role & log in
    const user = this.pendingOtpUser;
    this.pendingOtpUser = null;
    this.currentOtpCode = null;

    user.last_login = window.coepayDb.getNowTimestamp();
    window.coepayDb.save();

    this.setCurrentUser(user, true);
    return user;
  }

  /**
   * Resend OTP code to the registered email
   */
  resendOtp() {
    if (!this.pendingOtpUser) {
      throw new Error("No pending sign-in session found.");
    }
    const newCode = String(Math.floor(100000 + Math.random() * 900000));
    this.currentOtpCode = newCode;
    const emailRecord = window.coepayDb.dispatchOtpEmail(this.pendingOtpUser, newCode);
    return {
      success: true,
      otpCode: newCode,
      email: this.pendingOtpUser.email,
      maskedEmail: this.maskEmail(this.pendingOtpUser.email),
      emailRecord: emailRecord
    };
  }

  /**
   * Masks email address for privacy (e.g. j***z@student.icct.edu.ph)
   */
  maskEmail(email) {
    if (!email) return 'your registered email';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  }

  // ===========================================================================
  // SUPABASE AUTH (EMAIL OTP INTEGRATION)
  // ===========================================================================

  /**
   * Request Supabase Email OTP for Login
   * Dispatches 6-digit verification code to student's registered institutional email
   */
  async initiateSupabaseLogin(emailOrIdentifier) {
    if (!emailOrIdentifier || !emailOrIdentifier.trim()) {
      throw new Error("Please enter your registered institutional email or student number.");
    }

    const cleanInput = emailOrIdentifier.trim().toLowerCase();
    let targetEmail = cleanInput;
    let resolvedUser = null;

    // Resolve user from MySQL / Database Engine if student number or username was entered
    if (window.coepayDb && typeof window.coepayDb.findUserByIdentifier === 'function') {
      resolvedUser = window.coepayDb.findUserByIdentifier(cleanInput);
      if (resolvedUser && resolvedUser.email) {
        targetEmail = resolvedUser.email.toLowerCase();
      }
    }

    if (!targetEmail.includes('@')) {
      throw new Error(`Student record "${cleanInput}" does not have a valid registered email address. Please contact the Dean's Office.`);
    }

    if (resolvedUser && resolvedUser.is_active !== 1) {
      throw new Error(`Account "${cleanInput}" is currently deactivated.`);
    }

    // Call Supabase Auth Adapter (with shouldCreateUser: true so Supabase dispatches OTP)
    const res = await window.CoeSupabaseAuth.sendEmailOtp(targetEmail, true);

    this.pendingSupabaseEmail = targetEmail;
    this.pendingSupabaseUser = resolvedUser;
    this.supabaseOtpTimestamp = Date.now();

    return {
      success: true,
      email: targetEmail,
      maskedEmail: this.maskEmail(targetEmail),
      user: resolvedUser,
      provider: res.provider,
      isRateLimitFallback: !!res.isRateLimitFallback,
      otpCode: res.otpCode || null,
      message: res.message
    };
  }

  /**
   * Verify Supabase Email OTP for Login
   * Flexible signature: verifySupabaseLogin(enteredCode) or verifySupabaseLogin(email, enteredCode)
   */
  async verifySupabaseLogin(param1, param2) {
    let cleanEmail = '';
    let cleanCode = '';

    if (param2 !== undefined && param2 !== null && String(param2).trim() !== '') {
      cleanEmail = String(param1 || this.pendingSupabaseEmail || '').trim().toLowerCase();
      cleanCode = String(param2 || '').trim();
    } else {
      // Single parameter passed: it is the entered OTP code!
      cleanCode = String(param1 || '').trim();
      cleanEmail = String(this.pendingSupabaseEmail || '').trim().toLowerCase();
    }

    if (!cleanCode || cleanCode.length < 6) {
      throw new Error("Please enter the complete 6-digit verification OTP code.");
    }

    if (!cleanEmail) {
      throw new Error("Missing email address for OTP verification. Please sign in again.");
    }

    // Verify code via Supabase Auth adapter
    const verifyResult = await window.CoeSupabaseAuth.verifyEmailOtp(cleanEmail, cleanCode);

    // Resolve user in MySQL / Database Engine
    let user = this.pendingSupabaseUser || window.coepayDb.findUserByIdentifier(cleanEmail);

    if (!user) {
      // Check if user was registered under their student number or email
      const students = window.coepayDb.getStudents();
      const student = students.find(s => (s.email && s.email.toLowerCase() === cleanEmail));
      if (student) {
        user = window.coepayDb.getUserById(student.user_id);
      }
    }

    if (!user) {
      this.pendingProfile = { email: cleanEmail, uid: verifyResult.supabaseUid };
      this.pendingSupabaseEmail = null;
      return { needsProfile: true, email: cleanEmail };
    }

    // Link Supabase UID to MySQL user if not yet mapped
    if (verifyResult.supabaseUid && (!user.supabase_uid || user.supabase_uid !== verifyResult.supabaseUid)) {
      window.coepayDb.linkSupabaseUid(user.user_id, verifyResult.supabaseUid);
    }

    this.pendingSupabaseEmail = null;
    this.pendingSupabaseUser = null;
    this.pendingOtpUser = null;

    user.last_login = window.coepayDb.getNowTimestamp();
    window.coepayDb.save();

    this.setCurrentUser(user, true);

    window.coepayDb.logAudit(
      user.user_id,
      'LOGIN_SUPABASE_OTP',
      'users',
      user.user_id,
      `User ${user.username} successfully authenticated via Supabase Email OTP (${cleanEmail})`
    );

    return user;
  }

  /**
   * Automatically authenticates user when clicking Supabase Email Link / Magic Link
   */
  async loginWithSupabaseSession(supabaseSession) {
    if (!supabaseSession || !supabaseSession.user) return null;
    const email = (supabaseSession.user.email || '').toLowerCase().trim();
    const uid = supabaseSession.user.id;

    if (!email) return null;

    let user = window.coepayDb.findUserByIdentifier(email);
    if (!user) {
      const students = window.coepayDb.getStudents();
      const student = students.find(s => (s.email && s.email.toLowerCase() === email));
      if (student) {
        user = window.coepayDb.getUserById(student.user_id);
      }
    }

    if (!user) {
      const username = email.split('@')[0];
      user = window.coepayDb.findUserByIdentifier(username);
    }

    // Unknown email: do NOT auto-create. Ask the person to complete their profile first.
    if (!user) {
      this.pendingProfile = { email, uid };
      if (window.coeApp && !this._profileOpen) { this._profileOpen = true; window.coeApp.showCompleteProfileModal(email); }
      return null;
    }

    if (user.is_active !== 1) {
      throw new Error(`Student account for "${email}" is currently deactivated.`);
    }

    if (uid && (!user.supabase_uid || user.supabase_uid !== uid)) {
      window.coepayDb.linkSupabaseUid(user.user_id, uid);
    }

    user.last_login = window.coepayDb.getNowTimestamp();
    window.coepayDb.save();

    this.setCurrentUser(user, true);

    window.coepayDb.logAudit(
      user.user_id,
      'LOGIN_SUPABASE_LINK',
      'users',
      user.user_id,
      `User ${user.username} authenticated via Supabase Email Magic Link (${email})`
    );

    return user;
  }

  /**
   * Initiate Supabase OTP for New Student Self-Registration
   */
  async initiateSupabaseRegistration(registrationData) {
    const studentNumber = (registrationData.student_number || '').trim();
    const email = (registrationData.email || '').trim().toLowerCase();

    if (!studentNumber || !email || !registrationData.first_name || !registrationData.last_name || !registrationData.section) {
      throw new Error("Student Number, Email, First Name, Last Name, and Section are required.");
    }

    // Pre-validate uniqueness in MySQL
    if (window.coepayDb.tables.students.some(s => s.student_number.toLowerCase() === studentNumber.toLowerCase())) {
      throw new Error(`Student Number "${studentNumber}" is already registered. Please sign in instead.`);
    }
    if (window.coepayDb.tables.users.some(u => (u.email || '').toLowerCase() === email)) {
      throw new Error(`Email address "${email}" is already registered. Please sign in instead.`);
    }

    // Dispatch OTP via Supabase Auth
    const res = await window.CoeSupabaseAuth.sendEmailOtp(email, true);

    this.pendingRegistrationData = { ...registrationData, email };
    this.pendingSupabaseEmail = email;

    return {
      success: true,
      email: email,
      maskedEmail: this.maskEmail(email),
      provider: res.provider,
      otpCode: res.otpCode || null,
      message: res.message
    };
  }

  /**
   * Complete Supabase Registration upon successful OTP verification
   */
  async completeSupabaseRegistration(email, enteredCode) {
    if (!this.pendingRegistrationData) {
      throw new Error("No pending registration session found. Please enter your registration details first.");
    }

    const cleanEmail = (email || this.pendingRegistrationData.email).trim().toLowerCase();
    const verifyResult = await window.CoeSupabaseAuth.verifyEmailOtp(cleanEmail, enteredCode);

    // Register student into MySQL through Database Engine
    const regResult = window.coepayDb.registerStudentWithSupabase({
      ...this.pendingRegistrationData,
      supabase_uid: verifyResult.supabaseUid
    });

    const registeredUser = regResult.user;
    this.pendingRegistrationData = null;
    this.pendingSupabaseEmail = null;

    this.setCurrentUser(registeredUser, true);
    return registeredUser;
  }

  /**
   * Flowchart Step: Forgot Password? -> Input email account -> System sends reset code to email
   */
  // ===== Profile completion, password sign-in, set password (Supabase) =====
  async completeProfile(d) {
    const p = this.pendingProfile;
    if (!p) throw new Error('Session expired. Please sign in with OTP again.');
    if (!d.password || d.password.length < 8) throw new Error('Create a password with at least 8 characters.');
    if (d.password !== d.confirm) throw new Error('Passwords do not match.');
    const r = window.coepayDb.registerStudentWithSupabase({ ...d, email: p.email, supabase_uid: p.uid });
    const { error } = await window.CoeSupabaseAuth.client.auth.updateUser({ password: d.password });
    if (error) throw new Error('Profile saved but password was not set: ' + error.message);
    r.student.age = Number(d.age) || null;
    r.user.pw_set = true;
    window.coepayDb.save();
    this.pendingProfile = null; this._profileOpen = false;
    this.setCurrentUser(r.user, true);
    return r.user;
  }

  async loginWithPassword(identifier, password) {
    const id = (identifier || '').trim().toLowerCase();
    if (!id || !password) throw new Error('Enter your email or student number and your password.');
    let u = window.coepayDb.findUserByIdentifier(id);
    const email = (u && u.email) ? u.email.toLowerCase() : id;
    if (!email.includes('@')) throw new Error('Account not found. Use "Email OTP Sign-In" to create your account first.');
    const { data, error } = await window.CoeSupabaseAuth.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Invalid email/student number or password. First time here? Use "Email OTP Sign-In" to create your account.');
    u = u || window.coepayDb.findUserByIdentifier(email);
    if (!u) { this.pendingProfile = { email, uid: data.user.id }; return { needsProfile: true, email }; }
    if (u.is_active !== 1) throw new Error('This account is deactivated.');
    u.last_login = window.coepayDb.getNowTimestamp();
    window.coepayDb.save();
    this.setCurrentUser(u, true);
    return u;
  }

  async setPassword(pw, confirm) {
    if (!pw || pw.length < 8) throw new Error('Password must be at least 8 characters.');
    if (pw !== confirm) throw new Error('Passwords do not match.');
    const { error } = await window.CoeSupabaseAuth.client.auth.updateUser({ password: pw });
    if (error) throw new Error(error.message);
    const cur = this.getUser();
    const dbu = cur && window.coepayDb.getUserById(cur.user_id);
    if (dbu) { dbu.pw_set = true; window.coepayDb.save(); }
  }

  requestPasswordReset(email) {
    return window.coepayDb.dispatchPasswordResetEmail(email);
  }

  /**
   * Completes password reset by verifying reset code and saving new password
   */
  completePasswordReset(email, resetCode, newPassword) {
    return window.coepayDb.completePasswordReset(email, resetCode, newPassword);
  }

  login(username, password) {
    // In our client-side environment, password is authenticated
    // Default test password is 'password123'
    if (password !== 'password123' && password !== 'admin123' && password !== 'password') {
      // For demo convenience, allow any non-empty password or standard password
      if (!password || password.length < 4) {
        throw new Error("Invalid Username or Password.");
      }
    }
    return this.loginWithUsername(username, true);
  }

  /**
   * Flowchart Step: Click Log out -> Are you sure you want to log out? -> Yes/No
   */
  confirmLogout() {
    const modalBody = `
      <div class="text-center py-2">
        <div style="font-size: 3rem; color: #DC2626; margin-bottom: 0.75rem;">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 700; color: #0F172A;">Confirm Session Sign Out</h3>
        <p class="text-muted mt-2">
          Are you sure you want to log out of <strong>COE-Pay</strong>? Any unsaved progress will be cleared.
        </p>
      </div>
    `;

    const footer = `
      <button class="btn btn-outline" onclick="window.coeApp.closeModal()">
        No, Stay Signed In
      </button>
      <button class="btn btn-danger" onclick="window.coeApp.closeModal(); window.coeAuth.logout();">
        <i class="fa-solid fa-arrow-right-from-bracket"></i> Yes, Log Out
      </button>
    `;

    window.coeApp.showModal('COE-Pay Sign Out', modalBody, footer);
  }

  logout() {
    if (this.currentUser) {
      window.coepayDb.logAudit(
        this.currentUser.user_id,
        'LOGOUT',
        'users',
        this.currentUser.user_id,
        `User ${this.currentUser.username} logged out`
      );
    }

    // Call Supabase client sign out
    if (window.CoeSupabaseAuth && typeof window.CoeSupabaseAuth.signOut === 'function') {
      window.CoeSupabaseAuth.signOut();
    }

    this.currentUser = null;
    this.currentProfile = null;
    localStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem('coepay_dev_impersonating');
    sessionStorage.removeItem('coepay_original_dev');

    if (window.coeApp && typeof window.coeApp.onUserChanged === 'function') {
      window.coeApp.onUserChanged();
    }
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  getRole() {
    return this.currentUser ? this.currentUser.role : null;
  }

  getUser() {
    return this.currentUser;
  }

  getProfile() {
    return this.currentProfile;
  }
}

// Global Auth instance
window.coeAuth = new CoeAuth();
