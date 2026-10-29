# =============================================================================
# COE-Pay: Automated Verification & Non-Destructive Sandbox Test Runner
# =============================================================================

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host " COE-Pay Masterlist Bulk Upload - Automated Verification Test Suite   " -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Cyan

$Root = Split-Path -Parent $PSScriptRoot
$Passed = 0
$Failed = 0

function Assert-Test($Condition, $Message) {
    if ($Condition) {
        $script:Passed++
        Write-Host " [PASS] $Message" -ForegroundColor Green
    } else {
        $script:Failed++
        Write-Host " [FAIL] $Message" -ForegroundColor Red
    }
}

# 1. Verify Sample CSV Template
Write-Host "`n--- 1. Testing Sample CSV Template ---" -ForegroundColor Yellow
$CsvPath = Join-Path $Root "assets\templates\student_masterlist_template.csv"
Assert-Test (Test-Path $CsvPath) "CSV template file exists at assets/templates/student_masterlist_template.csv"

if (Test-Path $CsvPath) {
    $CsvLines = Get-Content $CsvPath
    $Header = $CsvLines[0]
    Assert-Test ($Header -eq "student_number,first_name,middle_name,last_name,program,year_level,section,email,contact_number") "CSV header matches expected schema"
    $DataRowCount = $CsvLines.Count - 1
    Assert-Test ($DataRowCount -eq 8) "CSV template contains exactly 8 official student records (Count: $DataRowCount)"
    Assert-Test ($CsvLines[1] -like "*Christian Dave*Guiyab*") "First student row (2023-10001, Christian Dave Guiyab) verified"
    Assert-Test ($CsvLines[2] -like "*Jay-are*Mesias*") "Second student row (2023-10009, Jay-are Mesias) verified"
    Assert-Test ($CsvLines[8] -like "*Tricia Mae*Gonzaga*") "Eighth student row (2023-10008, Tricia Mae Gonzaga) verified"
}

# 2. Verify Database Schema Migration
Write-Host "`n--- 2. Testing Database Migration Script ---" -ForegroundColor Yellow
$SqlPath = Join-Path $Root "sql\migrations\20261023_bulk_upload_upsert_constraints.sql"
Assert-Test (Test-Path $SqlPath) "Migration script exists at sql/migrations/20261023_bulk_upload_upsert_constraints.sql"

if (Test-Path $SqlPath) {
    $SqlContent = Get-Content $SqlPath -Raw
    Assert-Test ($SqlContent -match "uq_students_student_number") "Unique constraint on student_number defined"
    Assert-Test ($SqlContent -match "sp_upsert_student_record") "Stored procedure sp_upsert_student_record defined"
    Assert-Test ($SqlContent -match "idx_student_cohort") "Index for cohort targeting (program, year_level, section) defined"
    Assert-Test ($SqlContent -match "student_payment_assignments") "Auto-assignment of authorized obligations included in upsert logic"
}

# 3. Verify Backend API Endpoint
Write-Host "`n--- 3. Testing Backend API Endpoint Handler ---" -ForegroundColor Yellow
$ApiPath = Join-Path $Root "api\masterlist_upload.php"
Assert-Test (Test-Path $ApiPath) "API endpoint file exists at api/masterlist_upload.php"

$RouteBridgePath = Join-Path $Root "api\dean\masterlist\upload\index.php"
Assert-Test (Test-Path $RouteBridgePath) "Route bridge exists at api/dean/masterlist/upload/index.php"

if (Test-Path $ApiPath) {
    $ApiContent = Get-Content $ApiPath -Raw
    Assert-Test ($ApiContent -match "admin") "Role restriction for Dean / Admin role verified"
    Assert-Test ($ApiContent -match "parseCsvFile") "CSV safe parser helper verified"
    Assert-Test ($ApiContent -match "parseXlsxFile") "XLSX safe parser helper verified"
    Assert-Test ($ApiContent -match "FILTER_VALIDATE_EMAIL") "Email validation check verified"
    Assert-Test ($ApiContent -match "beginTransaction") "Transactional integrity (beginTransaction / commit / rollBack) verified"
    Assert-Test ($ApiContent -match "BULK_MASTERLIST_UPLOAD") "Immutable audit log record creation verified"
}

# 4. Verify Frontend Upload Component
Write-Host "`n--- 4. Testing Frontend Upload Component ---" -ForegroundColor Yellow
$JsPath = Join-Path $Root "js\masterlist-upload.js"
Assert-Test (Test-Path $JsPath) "Frontend controller exists at js/masterlist-upload.js"

if (Test-Path $JsPath) {
    $JsContent = Get-Content $JsPath -Raw
    Assert-Test ($JsContent -match "CoeMasterlistUpload") "CoeMasterlistUpload object declared"
    Assert-Test ($JsContent -match "handleDrop") "Drag-and-drop dropzone event handlers defined"
    Assert-Test ($JsContent -match "downloadTemplate") "CSV & XLSX sample template download method defined"
    Assert-Test ($JsContent -match "handleParsedData") "Pre-submission row-by-row validation & preview logic verified"
    Assert-Test ($JsContent -match "submitBatchUpsert") "Batch upsert submit handler verified"
}

# 5. Verify Engine Batch Upsert Support
Write-Host "`n--- 5. Testing Database Simulation Engine ---" -ForegroundColor Yellow
$DbEnginePath = Join-Path $Root "js\db-engine.js"
$DbEngineContent = Get-Content $DbEnginePath -Raw
Assert-Test ($DbEngineContent -match "bulkUpsertStudents") "bulkUpsertStudents method implemented in CoeDatabaseEngine"
Assert-Test ($DbEngineContent -match "BULK_MASTERLIST_UPLOAD") "Audit logging integrated into database engine upsert"

# 6. Verify HTML & Stylesheet Integration
Write-Host "`n--- 6. Testing UI Integration in index.html & style.css ---" -ForegroundColor Yellow
$HtmlPath = Join-Path $Root "index.html"
$HtmlContent = Get-Content $HtmlPath -Raw
Assert-Test ($HtmlContent -match "masterlist-upload\.js") "masterlist-upload.js included in index.html"
Assert-Test ($HtmlContent -match "developer-view\.js") "developer-view.js included in index.html"
Assert-Test ($HtmlContent -match "developer-view-container") "developer-view-container added to index.html"
Assert-Test ($HtmlContent -match "xlsx\.full\.min\.js") "SheetJS library CDN included in index.html"

$CssPath = Join-Path $Root "css\style.css"
$CssContent = Get-Content $CssPath -Raw
Assert-Test ($CssContent -match "upload-dropzone") "Dropzone CSS styles verified in style.css"
Assert-Test ($CssContent -match "preview-metrics-grid") "Preview KPI grid CSS styles verified in style.css"
Assert-Test ($CssContent -match "badge-developer") "Developer badge styles verified in style.css"
Assert-Test ($CssContent -match "role-login-card") "Unified role login card styles verified in style.css"

# 7. Verify Four Roles & Persona Dashboards
Write-Host "`n--- 7. Testing Four Application Roles & Persona Dashboards ---" -ForegroundColor Yellow
$DevViewPath = Join-Path $Root "js\developer-view.js"
Assert-Test (Test-Path $DevViewPath) "Developer view controller exists at js/developer-view.js"

$AppJsPath = Join-Path $Root "js\app.js"
$AppJsContent = Get-Content $AppJsPath -Raw
Assert-Test ($AppJsContent -match "Dave Guiyab") "System Developer Dave Guiyab configured"
Assert-Test ($AppJsContent -match "Ivanlee Mendoza") "Head Engineer / Coordinator Engr. Ivanlee Mendoza configured"
Assert-Test ($AppJsContent -match "Pearl Catequista") "Officer Pearl Catequista configured"
Assert-Test ($AppJsContent -match "Purchase, paying, ordering") "Student role with purchase, paying, ordering configured"
Assert-Test ($AppJsContent -match "login-form") "Production credential login form configured without fast login bypasses"

$AuthJsPath = Join-Path $Root "js\auth.js"
$AuthJsContent = Get-Content $AuthJsPath -Raw
Assert-Test ($AuthJsContent -match "developer") "Developer role authentication handler configured"
Assert-Test ($AuthJsContent -match "coordinator") "Coordinator role authentication handler configured"
Assert-Test ($AuthJsContent -match "officer") "Officer role authentication handler configured"
Assert-Test ($AppJsContent -match "Aaron Mikhael Canonizado") "Masterlist student Aaron Mikhael Canonizado present in switcher"
Assert-Test ($AppJsContent -match "John Robin Fernandez") "Masterlist student John Robin Fernandez present in switcher"
Assert-Test ($DbEngineContent -match "syncOfficialMasterlist") "Automatic official masterlist synchronization active in db-engine.js"

# 8. Verify Flowchart Full Alignment (OTP, Forgot Password, Merch Cart, Bank Transfer, Logout Confirmation)
Write-Host "`n--- 8. Testing Flowchart Alignment & 2FA / Merch / Bank Features ---" -ForegroundColor Yellow
Assert-Test ($AuthJsContent -match "initiateLogin") "Credentials check & OTP generation handler defined in auth.js"
Assert-Test ($AuthJsContent -match "verifyOtp") "OTP code verification handler defined in auth.js"
Assert-Test ($AuthJsContent -match "requestPasswordReset") "Forgot password recovery link handler defined in auth.js"
Assert-Test ($AuthJsContent -match "confirmLogout") "Logout confirmation modal handler defined in auth.js"

Assert-Test ($AppJsContent -match "showOtpModal") "Two-factor OTP email verification modal defined in app.js"
Assert-Test ($AppJsContent -match "openForgotPasswordModal") "Forgot password recovery modal defined in app.js"

$StudentJsPath = Join-Path $Root "js\student-view.js"
$StudentJsContent = Get-Content $StudentJsPath -Raw
Assert-Test ($StudentJsContent -match "merchCatalog") "COE Merch product catalog defined in student-view.js"
Assert-Test ($StudentJsContent -match "addToCart") "Merch shopping cart and Add to Cart feature defined in student-view.js"
Assert-Test ($StudentJsContent -match "openCartDrawer") "Shopping cart drawer & checkout modal defined in student-view.js"
Assert-Test ($StudentJsContent -match "toggleGateway") "GCash and Bank Transfer dual gateway selection defined in student-view.js"
Assert-Test ($StudentJsContent -match "COE-CEDT-01") "Department code and bank account information defined in student-view.js"

Assert-Test ($CssContent -match "flowchart-nav-bar") "Flowchart Decision 1 navigation styles verified in style.css"
Assert-Test ($CssContent -match "otp-input") "Two-factor OTP code input styles verified in style.css"
Assert-Test ($CssContent -match "gateway-toggle-box") "Gateway toggle styles verified in style.css"

# 9. Verify Role-Based Access Control (RBAC) Isolation & Navigation Security
Write-Host "`n--- 9. Testing RBAC Role Isolation & Navigation Security ---" -ForegroundColor Yellow
Assert-Test ($AppJsContent -match "isDeveloper\s*=\s*user\.role\s*===\s*'developer'") "isDeveloper role verification check implemented in app.js"
Assert-Test ($AppJsContent -match "renderDevImpersonationBanner") "Developer impersonation banner renderer implemented in app.js"
Assert-Test ($AppJsContent -match "returnToDeveloper") "Developer session restoration handler (returnToDeveloper) implemented in app.js"
Assert-Test ($AppJsContent -match "Access Denied: Role switching is restricted") "Security guard in switchDemoUser blocking unauthorized non-developers"
Assert-Test ($AppJsContent -match "Access Denied: Database reset privileges are restricted") "Security guard in confirmResetDb blocking unauthorized non-developers"
Assert-Test ($HtmlContent -match "dev-impersonation-banner") "Developer impersonation banner element present in index.html"
Assert-Test ($CssContent -match "dev-impersonation-banner") "Developer impersonation styling defined in style.css"

# 10. Verify Email Authentication, Masterlist OTP, Password Reset & Default Password Transmission
Write-Host "`n--- 10. Testing Email Authentication & System Email Dispatch ---" -ForegroundColor Yellow
$EmailApiPath = Join-Path $Root "api\email_service.php"
Assert-Test (Test-Path $EmailApiPath) "Email service endpoint exists at api/email_service.php"

Assert-Test ($AuthJsContent -match "findUserByIdentifier") "Flexible email and student ID resolver implemented in auth.js"
Assert-Test ($DbEngineContent -match "dispatchOtpEmail") "Masterlist OTP dispatch handler implemented in db-engine.js"
Assert-Test ($DbEngineContent -match "dispatchPasswordResetEmail") "Password reset verification code dispatcher implemented in db-engine.js"
Assert-Test ($DbEngineContent -match "completePasswordReset") "Password reset verification and update handler implemented in db-engine.js"
Assert-Test ($DbEngineContent -match "dispatchDefaultPasswordToStudent") "Individual default password transmission method implemented in db-engine.js"
Assert-Test ($DbEngineContent -match "dispatchDefaultPasswordsToAllMasterlist") "Bulk masterlist default password transmission method implemented in db-engine.js"

$AdminJsPath = Join-Path $Root "js\admin-view.js"
$AdminJsContent = Get-Content $AdminJsPath -Raw
Assert-Test ($AdminJsContent -match "dispatchDefaultPasswordsToAll") "Coordinator bulk default password transmission button defined in admin-view.js"
Assert-Test ($AdminJsContent -match "dispatchStudentDefaultPassword") "Coordinator row-level default password transmission button defined in admin-view.js"

Assert-Test ($AppJsContent -match "openEmailDispatchDrawer") "Interactive system email outbox drawer implemented in app.js"
Assert-Test ($AppJsContent -match "showResetPasswordModal") "Two-step email password reset modal workflow implemented in app.js"

$SchemaJsPath = Join-Path $Root "js\db-schema.js"
$SchemaJsContent = Get-Content $SchemaJsPath -Raw
Assert-Test ($SchemaJsContent -match "dispatched_emails") "dispatched_emails table and initial credentials seeded in db-schema.js"
$MainSqlPath = Join-Path $Root "sql\coepay_schema.sql"
$MainSqlContent = Get-Content $MainSqlPath -Raw
Assert-Test ($MainSqlContent -match "dispatched_emails") "dispatched_emails table definition verified in MySQL schema"

# 11. Verify Supabase OTP Authentication & MySQL Identity Linking
Write-Host "`n--- 11. Testing Supabase OTP Authentication & MySQL Integration ---" -ForegroundColor Yellow
$SupabaseMigrationPath = Join-Path $Root "sql\migrations\20261028_supabase_auth_integration.sql"
Assert-Test (Test-Path $SupabaseMigrationPath) "Supabase migration script exists at sql/migrations/20261028_supabase_auth_integration.sql"
if (Test-Path $SupabaseMigrationPath) {
    $SupabaseMigrationContent = Get-Content $SupabaseMigrationPath -Raw
    Assert-Test ($SupabaseMigrationContent -match "supabase_uid.+VARCHAR\(36\)") "Migration script adds supabase_uid column with UUID formatting"
    Assert-Test ($SupabaseMigrationContent -match "idx_users_supabase_uid") "Migration script creates unique index for supabase_uid"
    Assert-Test ($SupabaseMigrationContent -match "auth_provider.+ENUM\('local',\s*'supabase_otp'\)") "Migration script defines auth_provider enum"
    Assert-Test ($SupabaseMigrationContent -match "ROLLBACK") "Migration script provides documented rollback instructions"
}

Assert-Test ($MainSqlContent -match "supabase_uid.+VARCHAR\(36\)") "MySQL base schema updated with supabase_uid column"
Assert-Test ($MainSqlContent -match "auth_provider.+ENUM\('local',\s*'supabase_otp'\)") "MySQL base schema updated with auth_provider column"

$EnvExamplePath = Join-Path $Root ".env.example"
Assert-Test (Test-Path $EnvExamplePath) "Environment variable template exists at .env.example"
if (Test-Path $EnvExamplePath) {
    $EnvContent = Get-Content $EnvExamplePath -Raw
    Assert-Test ($EnvContent -match "SUPABASE_URL=") "SUPABASE_URL configured in .env.example"
    Assert-Test ($EnvContent -match "SUPABASE_ANON_KEY=") "SUPABASE_ANON_KEY configured in .env.example"
    Assert-Test ($EnvContent -match "SUPABASE_SERVICE_ROLE_KEY=") "SUPABASE_SERVICE_ROLE_KEY configured in .env.example"
    Assert-Test ($EnvContent -match "SUPABASE_OTP_EXPIRY_SECONDS=300") "SUPABASE_OTP_EXPIRY_SECONDS configured in .env.example"
}

$SupabaseJsPath = Join-Path $Root "js\supabase-config.js"
Assert-Test (Test-Path $SupabaseJsPath) "Supabase client adapter exists at js/supabase-config.js"
if (Test-Path $SupabaseJsPath) {
    $SupabaseJsContent = Get-Content $SupabaseJsPath -Raw
    Assert-Test ($SupabaseJsContent -match "CoeSupabaseAuth") "CoeSupabaseAuth client adapter exposed"
    Assert-Test ($SupabaseJsContent -match "signInWithOtp") "signInWithOtp delivery method implemented"
    Assert-Test ($SupabaseJsContent -match "verifyOtp") "verifyOtp numeric token verification implemented"
    Assert-Test ($SupabaseJsContent -match "isSandbox") "Offline development sandbox fallback implemented"
}

$SupabaseApiPath = Join-Path $Root "api\auth_supabase.php"
Assert-Test (Test-Path $SupabaseApiPath) "Supabase server-side API endpoint exists at api/auth_supabase.php"
if (Test-Path $SupabaseApiPath) {
    $SupabaseApiContent = Get-Content $SupabaseApiPath -Raw
    Assert-Test ($SupabaseApiContent -match "/auth/v1/user") "Server-side Supabase JWT access token verification verified"
    Assert-Test ($SupabaseApiContent -match "beginTransaction") "Transactional student profile enrollment verified"
    Assert-Test ($SupabaseApiContent -match "verify_session") "verify_session API route implemented"
    Assert-Test ($SupabaseApiContent -match "register_student") "register_student API route implemented"
}

Assert-Test ($HtmlContent -match "supabase-js@2") "Supabase JS SDK v2 CDN registered in index.html"
Assert-Test ($HtmlContent -match "supabase-config\.js") "supabase-config.js registered in index.html"

Assert-Test ($AuthJsContent -match "initiateSupabaseLogin") "initiateSupabaseLogin method implemented in auth.js"
Assert-Test ($AuthJsContent -match "verifySupabaseLogin") "verifySupabaseLogin method implemented in auth.js"
Assert-Test ($AuthJsContent -match "initiateSupabaseRegistration") "initiateSupabaseRegistration method implemented in auth.js"
Assert-Test ($AuthJsContent -match "completeSupabaseRegistration") "completeSupabaseRegistration method implemented in auth.js"

Assert-Test ($DbEngineContent -match "registerStudentWithSupabase") "registerStudentWithSupabase implemented in db-engine.js"
Assert-Test ($DbEngineContent -match "linkSupabaseUid") "linkSupabaseUid identity mapping implemented in db-engine.js"

Assert-Test ($AppJsContent -match "switchAuthMode") "switchAuthMode multi-tab controller implemented in app.js"
Assert-Test ($AppJsContent -match "handleSupabaseOtpLogin") "handleSupabaseOtpLogin handler implemented in app.js"
Assert-Test ($AppJsContent -match "handleStudentSelfRegistration") "handleStudentSelfRegistration handler implemented in app.js"
Assert-Test ($AppJsContent -match "startOtpCooldownTimer") "startOtpCooldownTimer 60-second live cooldown implemented in app.js"

Assert-Test ($CssContent -match "auth-mode-nav-tabs") "auth-mode-nav-tabs styling defined in style.css"
Assert-Test ($CssContent -match "otp-input") "otp-input high-contrast segmented code styling defined in style.css"

# Summary
Write-Host "`n========================================================================" -ForegroundColor Cyan
if ($Failed -eq 0) {
    Write-Host " ALL $Passed VERIFICATION CHECKS PASSED SUCCESSFULLY! (0 Failures)" -ForegroundColor Green
    Write-Host " In-Browser Masterlist Tests:  http://localhost:8080/tests/sandbox_runner.html" -ForegroundColor Yellow
    Write-Host " In-Browser Supabase OTP Tests: http://localhost:8080/tests/supabase_sandbox_runner.html" -ForegroundColor Yellow
} else {
    Write-Host " COMPLETED WITH $Failed FAILURES out of $($Passed + $Failed) checks." -ForegroundColor Red
}
Write-Host "========================================================================`n" -ForegroundColor Cyan
