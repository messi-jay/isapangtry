# COE-Pay: real email OTP setup (v2 fixes)

1. Supabase: Authentication > Providers > Email ON. Email Templates: put {{ .Token }} in the OTP template.
2. Authentication > SMTP Settings: add your own SMTP (Brevo/Resend). Default Supabase email allows only a few per hour.
3. Put Project URL + anon public key in js/env.js (never the service_role key). Keep allowSandbox: false.
4. Add the student's Gmail to the masterlist (Coordinator > add student / bulk upload). OTP login only works for emails in the masterlist.
5. PHP hosting (not GitHub Pages) needs env vars: SUPABASE_URL, SUPABASE_ANON_KEY, DB_HOST, DB_NAME, DB_USER, DB_PASS, COEPAY_ALLOWED_ORIGIN. Use a limited MySQL user, not root.

Demo mode (offline, visible OTP, demo switcher): set allowSandbox: true in js/env.js. Never in production.

Still demo-grade: data and sessions live in the browser (localStorage). Real multi-user payments need the data moved to Supabase/MySQL behind the PHP API, with Row Level Security.
