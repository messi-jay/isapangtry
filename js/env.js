/**
 * COE-Pay: Local Runtime Environment Configuration
 * 
 * To connect COE-Pay directly to your live Supabase project:
 * 1. Set your Supabase Project URL (from Supabase Dashboard > Project Settings > API)
 * 2. Set your Supabase Public Anon Key (from Supabase Dashboard > Project Settings > API)
 * 
 * You can also configure this dynamically in the browser at any time
 * by clicking "Supabase Setup" on the login screen.
 */

window.COEPAY_ENV = window.COEPAY_ENV || {};

// Keep false in production. true enables offline demo logins and visible test OTPs.
window.COEPAY_ENV.allowSandbox = false;

window.COEPAY_ENV.supabase = {
  // Replace with your live project URL (e.g., 'https://abcdefghijklm.supabase.co')
  url: 'https://noxsfrphhdixydgddenp.supabase.co',

  // Replace with your live anon public key (e.g., 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
  anonKey: 'sb_publishable_oKuRIXcBbspf_SBWO5XBUQ_iBq9RK8l'
};
