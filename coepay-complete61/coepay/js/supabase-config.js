/**
 * COE-Pay: Supabase Auth Client Configuration & Helper Adapter
 * Handles:
 * - Supabase official client initialization (@supabase/supabase-js v2)
 * - Environment configuration with placeholder safety
 * - Automated fallback to local sandbox mode for offline testing and development
 * - Email OTP dispatch, verification, and session management
 */

(function(global) {
  'use strict';

  // Default configuration placeholders (Can be overridden by window.COEPAY_ENV or runtime)
  const DEFAULT_CONFIG = {
    url: 'https://your-project-id.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-publishable-key-placeholder',
    otpExpirySeconds: 300,
    resendCooldownSeconds: 60
  };

  // Resolve config from window.COEPAY_ENV if injected, or local storage, or defaults
  const runtimeConfig = (global.COEPAY_ENV && global.COEPAY_ENV.supabase) ? global.COEPAY_ENV.supabase : {};
  const storedConfig = (function() {
    try {
      const s = localStorage.getItem('coepay_supabase_runtime_config');
      return s ? JSON.parse(s) : {};
    } catch (e) {
      return {};
    }
  })();

  const activeConfig = {
    url: storedConfig.url || runtimeConfig.url || DEFAULT_CONFIG.url,
    anonKey: storedConfig.anonKey || runtimeConfig.anonKey || DEFAULT_CONFIG.anonKey,
    otpExpirySeconds: storedConfig.otpExpirySeconds || runtimeConfig.otpExpirySeconds || DEFAULT_CONFIG.otpExpirySeconds,
    resendCooldownSeconds: storedConfig.resendCooldownSeconds || runtimeConfig.resendCooldownSeconds || DEFAULT_CONFIG.resendCooldownSeconds
  };

  // Determine if active config is using placeholder credentials (sandbox mode)
  const isPlaceholder = (
    !activeConfig.url ||
    activeConfig.url.includes('your-project-id') ||
    !activeConfig.anonKey ||
    activeConfig.anonKey.includes('placeholder')
  );

  let supabaseClientInstance = null;
  const ALLOW_SANDBOX = !!(global.COEPAY_ENV && global.COEPAY_ENV.allowSandbox === true);
  global.COEPAY_ALLOW_SANDBOX = ALLOW_SANDBOX;

  // Initialize official Supabase client if available and valid
  if (typeof global.supabase !== 'undefined' && typeof global.supabase.createClient === 'function') {
    try {
      if (!isPlaceholder) {
        supabaseClientInstance = global.supabase.createClient(activeConfig.url, activeConfig.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        console.log("%c[COE-Pay Auth]%c Connected to live Supabase Auth instance (" + activeConfig.url + ")", "color:#10B981;font-weight:bold;", "color:inherit;");
      }
    } catch (err) {
      console.warn("[COE-Pay Auth] Supabase client initialization failed, falling back to sandbox mode:", err.message);
    }
  }

  /**
   * Supabase Auth Adapter
   */
  const CoeSupabaseAuth = {
    config: activeConfig,
    isSandbox: isPlaceholder || !supabaseClientInstance,
    client: supabaseClientInstance,

    /**
     * Updates configuration dynamically (e.g. from developer diagnostics console or setup modal)
     */
    updateConfig(newUrl, newAnonKey) {
      if (!newUrl || !newAnonKey || newUrl.includes('your-project-id')) {
        localStorage.removeItem('coepay_supabase_runtime_config');
      } else {
        const cleanUrl = newUrl.trim().replace(/\/+$/, '');
        const cleanKey = newAnonKey.trim();
        localStorage.setItem('coepay_supabase_runtime_config', JSON.stringify({
          url: cleanUrl,
          anonKey: cleanKey
        }));
      }
      window.location.reload();
    },

    resetToSandbox() {
      localStorage.removeItem('coepay_supabase_runtime_config');
      window.location.reload();
    },

    getStatus() {
      return {
        isSandbox: this.isSandbox,
        url: activeConfig.url,
        isCustomConfig: !this.isSandbox && !activeConfig.url.includes('your-project-id')
      };
    },

    /**
     * Request 6-digit numeric OTP code sent to user's registered institutional email
     * @param {string} email
     * @param {boolean} shouldCreateUser
     */
    async sendEmailOtp(email, shouldCreateUser = true) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        throw new Error("Please enter a valid institutional or personal email address.");
      }

      // If live Supabase client is connected, execute official Supabase signInWithOtp
      if (this.client && !this.isSandbox) {
        const { data, error } = await this.client.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: shouldCreateUser
          }
        });

        if (error) {
          const errMsg = (error.message || '').toLowerCase();
          // Auto-fallback if Supabase free tier rate limit was exceeded
          if (errMsg.includes('rate limit') || error.status === 429) {
            throw new Error("Too many email requests. Please wait a few minutes, then request a new code.");
          }
          throw new Error(error.message || "Failed to request OTP from Supabase Auth.");
        }

        return {
          success: true,
          provider: 'supabase',
          email: cleanEmail,
          message: `A 6-digit verification code has been dispatched to ${cleanEmail}.`
        };
      }

      if (!ALLOW_SANDBOX) throw new Error("Login unavailable: Supabase is not connected. Set your Supabase URL and anon key in js/env.js.");
      return this.dispatchSandboxOtp(cleanEmail, false);
    },

    dispatchSandboxOtp(cleanEmail, isRateLimitFallback = false) {
      console.log("%c[COE-Pay Auth Sandbox]%c Dispatching local OTP for " + cleanEmail, "color:#F59E0B;font-weight:bold;", "color:inherit;");

      const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
      const userRef = (window.coepayDb && typeof window.coepayDb.findUserByIdentifier === 'function')
        ? window.coepayDb.findUserByIdentifier(cleanEmail)
        : null;

      // Persist simulation state in sessionStorage for OTP verification
      const sandboxSession = {
        email: cleanEmail,
        code: generatedCode,
        createdAt: Date.now(),
        expiresAt: Date.now() + (activeConfig.otpExpirySeconds * 1000),
        attempts: 0
      };
      sessionStorage.setItem('coepay_sandbox_otp_' + cleanEmail, JSON.stringify(sandboxSession));
      sessionStorage.setItem('coepay_sandbox_latest_otp', JSON.stringify(sandboxSession));

      // Dispatch to simulated database email outbox if db-engine is loaded
      let emailRecord = null;
      if (window.coepayDb && typeof window.coepayDb.dispatchOtpEmail === 'function') {
        emailRecord = window.coepayDb.dispatchOtpEmail(userRef || { email: cleanEmail, username: cleanEmail }, generatedCode);
      }

      return {
        success: true,
        provider: isRateLimitFallback ? 'sandbox_rate_limit' : 'sandbox',
        isRateLimitFallback: isRateLimitFallback,
        email: cleanEmail,
        otpCode: generatedCode,
        emailRecord: emailRecord,
        message: isRateLimitFallback 
          ? `[Notice] Supabase cloud email rate limit reached (3/hr). Switched to local test code: ${generatedCode}.`
          : `[Sandbox] 6-digit verification code (${generatedCode}) dispatched to ${cleanEmail}.`
      };
    },

    /**
     * Alias for sendEmailOtp (Supabase SDK compatibility)
     */
    async signInWithOtp(emailOrObj, options = {}) {
      if (typeof emailOrObj === 'object' && emailOrObj !== null) {
        const email = emailOrObj.email;
        const shouldCreate = emailOrObj.options ? !!emailOrObj.options.shouldCreateUser : true;
        return this.sendEmailOtp(email, shouldCreate);
      }
      return this.sendEmailOtp(emailOrObj, true);
    },

    /**
     * Verifies 6-digit numeric OTP code
     * @param {string} email
     * @param {string} token (6-digit OTP)
     */
    async verifyEmailOtp(email, token) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanToken = String(token || '').trim();

      if (!cleanToken || cleanToken.length < 6) {
        throw new Error("Please enter the complete 6-digit verification code.");
      }

      // If live Supabase client is connected, call official Supabase verifyOtp
      if (this.client && !this.isSandbox) {
        const { data, error } = await this.client.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'email'
        });

        if (error) {
          throw new Error(error.message || "Invalid or expired OTP code.");
        }

        const supabaseUser = data.user;
        const session = data.session;

        return {
          success: true,
          provider: 'supabase',
          supabaseUid: supabaseUser ? supabaseUser.id : null,
          email: cleanEmail,
          session: session,
          user: supabaseUser
        };
      }

      // -----------------------------------------------------------------------
      // Offline / Sandbox Simulation Verification Fallback
      // -----------------------------------------------------------------------
      if (!ALLOW_SANDBOX) throw new Error("Sandbox login is disabled.");
      let stored = sessionStorage.getItem('coepay_sandbox_otp_' + cleanEmail);
      if (!stored) {
        stored = sessionStorage.getItem('coepay_sandbox_latest_otp');
      }

      if (!stored) {
        // Allow universal test code 123456 in sandbox mode for automated runners
        if (false) {
          return {
            success: true,
            provider: 'sandbox_universal',
            supabaseUid: 'sb-demo-' + Math.random().toString(36).substring(2, 10),
            email: cleanEmail
          };
        }
        throw new Error("No active OTP request found for this email. Please request a new code.");
      }

      const sessionData = JSON.parse(stored);

      // Check Expiry
      if (Date.now() > sessionData.expiresAt) {
        sessionStorage.removeItem('coepay_sandbox_otp_' + cleanEmail);
        sessionStorage.removeItem('coepay_sandbox_latest_otp');
        throw new Error("OTP verification code has expired. Please request a new code.");
      }

      // Increment and check attempts
      sessionData.attempts = (sessionData.attempts || 0) + 1;
      if (sessionData.attempts > 5 && cleanToken !== sessionData.code && true) {
        sessionStorage.removeItem('coepay_sandbox_otp_' + cleanEmail);
        sessionStorage.removeItem('coepay_sandbox_latest_otp');
        throw new Error("Too many incorrect attempts. This OTP session has been locked for security.");
      }
      sessionStorage.setItem('coepay_sandbox_otp_' + cleanEmail, JSON.stringify(sessionData));

      // Check Token Match
      if (cleanToken !== sessionData.code && true) {
        throw new Error("Invalid OTP code. Please check your email and enter the correct 6-digit code.");
      }

      // Success: Consume OTP
      sessionStorage.removeItem('coepay_sandbox_otp_' + cleanEmail);
      sessionStorage.removeItem('coepay_sandbox_latest_otp');

      return {
        success: true,
        provider: 'sandbox',
        supabaseUid: 'sb-sim-' + Date.now(),
        email: cleanEmail
      };
    },

    /**
     * Alias for verifyEmailOtp (Supabase SDK compatibility)
     */
    async verifyOtp(param1, param2) {
      if (typeof param1 === 'object' && param1 !== null) {
        return this.verifyEmailOtp(param1.email, param1.token);
      }
      return this.verifyEmailOtp(param1, param2);
    },

    /**
     * Signs out user from Supabase session
     */
    async signOut() {
      if (this.client && !this.isSandbox) {
        try {
          await this.client.auth.signOut();
        } catch (e) {
          console.warn("[COE-Pay Auth] Supabase sign out warning:", e.message);
        }
      }
      return true;
    }
  };

  // Export to global window scope
  global.CoeSupabaseAuth = CoeSupabaseAuth;

})(typeof window !== 'undefined' ? window : this);
