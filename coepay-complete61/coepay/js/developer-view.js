/**
 * COE-Pay: System Developer View Controller
 * Persona: Dave Guiyab (System Developer)
 * Responsibility: Building a system that works properly and helps people perform their tasks more efficiently.
 * Features: System health diagnostics, database inspection, audit log monitor,
 * sandbox testing runner, schema integrity, and role impersonation.
 */

const CoeDeveloperView = {
  activeTableTab: 'students',

  render() {
    const container = document.getElementById('developer-view-container');
    if (!container) return;

    const user = window.coeAuth.getUser();
    const profile = window.coeAuth.getProfile();
    const tables = window.coepayDb.tables;

    // Database Metrics
    const totalUsers = (tables.users || []).length;
    const totalStudents = (tables.students || []).length;
    const totalRequests = (tables.payment_requests || []).length;
    const totalAssignments = (tables.student_payment_assignments || []).length;
    const totalTransactions = (tables.payment_transactions || []).length;
    const totalAuditLogs = (tables.audit_logs || []).length;
    const totalEmails = (tables.dispatched_emails || []).length;
    const totalRecords = totalUsers + totalStudents + totalRequests + totalAssignments + totalTransactions + totalAuditLogs + totalEmails;

    container.innerHTML = `
      <!-- Developer Subheader -->
      <div class="view-header">
        <div>
          <span class="badge badge-developer"><i class="fa-solid fa-code"></i> System Developer Console</span>
          <h1 class="page-title">${profile.full_name || 'Dave Guiyab'}</h1>
          <p class="page-subtitle">
            <strong>${profile.designation || 'Lead Full-Stack System Developer'}</strong> • 
            ${profile.responsibility || 'Responsible for building a system that works properly and helps people perform their tasks more efficiently.'}
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" onclick="CoeDeveloperView.dispatchAllDefaultPasswords()" title="Send default password (password123) to all masterlist emails">
            <i class="fa-solid fa-paper-plane text-primary"></i> Dispatch Passwords
          </button>
          <button class="btn btn-outline" onclick="window.coeApp.openEmailDispatchDrawer()" title="View System Email Outbox">
            <i class="fa-solid fa-inbox text-emerald"></i> Outbox (<span id="dev-email-count">${totalEmails}</span>)
          </button>
          <button class="btn btn-outline" onclick="CoeDeveloperView.runSandboxTests()">
            <i class="fa-solid fa-flask-vial text-primary"></i> Run Tests
          </button>
          <button class="btn btn-outline" onclick="CoeAdminView.exportSqlDump()">
            <i class="fa-solid fa-file-code"></i> Export SQL
          </button>
          <button class="btn btn-outline" onclick="CoeDeveloperView.exportDatabaseJson()">
            <i class="fa-solid fa-download"></i> Backup DB
          </button>
          <button class="btn btn-danger btn-sm" onclick="window.coeApp.confirmResetDb()">
            <i class="fa-solid fa-rotate-left"></i> Reset Seed
          </button>
        </div>
      </div>

      <!-- Developer KPI Metrics -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon bg-emerald-subtle">
            <i class="fa-solid fa-server text-emerald"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">System Health & Engine</div>
            <div class="stat-value text-success">Active & Healthy</div>
            <div class="stat-footnote text-muted">Client Simulation + MySQL Schema Active</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-blue-subtle">
            <i class="fa-solid fa-database text-primary"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Simulated Records</div>
            <div class="stat-value">${totalRecords.toLocaleString()}</div>
            <div class="stat-footnote text-muted">Across 9 Relational Tables</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-indigo-subtle">
            <i class="fa-solid fa-shield-virus text-indigo"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Immutable Audit Trail</div>
            <div class="stat-value">${totalAuditLogs} Logs</div>
            <div class="stat-footnote text-success"><i class="fa-solid fa-check-double"></i> 100% Operations Recorded</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-amber-subtle">
            <i class="fa-solid fa-users-gear text-amber"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Active Roles Configured</div>
            <div class="stat-value">4 Roles</div>
            <div class="stat-footnote text-muted">Dev • Coordinator • Officer • Student</div>
          </div>
        </div>
      </div>

      <!-- Quick Role Impersonation Matrix -->
      <div class="card mt-3">
        <div class="card-header flex-between">
          <div>
            <h2 class="card-title"><i class="fa-solid fa-users-viewfinder text-primary"></i> Role Testing & Impersonation Matrix</h2>
            <p class="card-subtitle">Quickly switch between personas to verify role-based permissions, workflows, and dashboard routing.</p>
          </div>
        </div>
        <div class="card-body">
          <div class="role-matrix-grid">
            <!-- 1. System Developer -->
            <div class="role-matrix-card active">
              <div class="role-matrix-header">
                <span class="badge badge-developer"><i class="fa-solid fa-code"></i> Developer</span>
                <span class="current-pill">Current Session</span>
              </div>
              <h4 class="mt-2">Dave Guiyab</h4>
              <p class="text-muted small">Building a system that works properly and helps people perform tasks efficiently.</p>
              <button class="btn btn-xs btn-outline-primary mt-2 w-100" disabled>Active View</button>
            </div>

            <!-- 2. Head Engineer / Coordinator -->
            <div class="role-matrix-card">
              <div class="role-matrix-header">
                <span class="badge badge-admin"><i class="fa-solid fa-user-tie"></i> Head Engineer</span>
                <span class="badge badge-outline">Approver</span>
              </div>
              <h4 class="mt-2">Engr. Ivanlee Mendoza</h4>
              <p class="text-muted small">Approve request, add student, bulk upload masterlist, manage compliance.</p>
              <button class="btn btn-xs btn-primary mt-2 w-100" onclick="window.coeApp.switchDemoUser('engr.mendoza')">
                <i class="fa-solid fa-arrow-right-to-bracket"></i> Switch to Coordinator
              </button>
            </div>

            <!-- 3. Officer -->
            <div class="role-matrix-card">
              <div class="role-matrix-header">
                <span class="badge badge-personnel"><i class="fa-solid fa-clipboard-user"></i> Officer</span>
                <span class="badge badge-outline">Collector</span>
              </div>
              <h4 class="mt-2">Pearl Catequista</h4>
              <p class="text-muted small">Request for adding items, seminars, and other fees; inspect receipts.</p>
              <button class="btn btn-xs btn-primary mt-2 w-100" onclick="window.coeApp.switchDemoUser('officer')">
                <i class="fa-solid fa-arrow-right-to-bracket"></i> Switch to Officer
              </button>
            </div>

            <!-- 4. Student -->
            <div class="role-matrix-card">
              <div class="role-matrix-header">
                <span class="badge badge-student"><i class="fa-solid fa-graduation-cap"></i> Student</span>
                <span class="badge badge-outline">Payer</span>
              </div>
              <h4 class="mt-2">Christian Dave Guiyab</h4>
              <p class="text-muted small">Purchase, paying, ordering; submit GCash payments, get clearance vouchers.</p>
              <button class="btn btn-xs btn-primary mt-2 w-100" onclick="window.coeApp.switchDemoUser('2023-10001')">
                <i class="fa-solid fa-arrow-right-to-bracket"></i> Switch to Student
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Developer Tabs: Database Explorer & Audit Log Feed -->
      <div class="admin-tabs-nav mt-4">
        <button class="tab-btn active" id="dev-tab-btn-tables" onclick="CoeDeveloperView.switchTab('tables')">
          <i class="fa-solid fa-table"></i> Database Tables Explorer (${totalRecords})
        </button>
        <button class="tab-btn" id="dev-tab-btn-audit" onclick="CoeDeveloperView.switchTab('audit')">
          <i class="fa-solid fa-shield-virus"></i> Real-Time Audit Ledger (${totalAuditLogs})
        </button>
        <button class="tab-btn" id="dev-tab-btn-bulk" onclick="CoeDeveloperView.switchTab('bulk')">
          <i class="fa-solid fa-cloud-arrow-up"></i> Bulk Masterlist Integration
        </button>
      </div>

      <!-- TAB 1: Database Explorer -->
      <div id="dev-tab-tables" class="dev-tab-content">
        <div class="card">
          <div class="card-header flex-between">
            <div class="flex-gap">
              <button class="btn btn-xs ${this.activeTableTab === 'students' ? 'btn-primary' : 'btn-outline'}" onclick="CoeDeveloperView.showTable('students')">
                students (${totalStudents})
              </button>
              <button class="btn btn-xs ${this.activeTableTab === 'users' ? 'btn-primary' : 'btn-outline'}" onclick="CoeDeveloperView.showTable('users')">
                users (${totalUsers})
              </button>
              <button class="btn btn-xs ${this.activeTableTab === 'payment_requests' ? 'btn-primary' : 'btn-outline'}" onclick="CoeDeveloperView.showTable('payment_requests')">
                payment_requests (${totalRequests})
              </button>
              <button class="btn btn-xs ${this.activeTableTab === 'payment_transactions' ? 'btn-primary' : 'btn-outline'}" onclick="CoeDeveloperView.showTable('payment_transactions')">
                payment_transactions (${totalTransactions})
              </button>
              <button class="btn btn-xs ${this.activeTableTab === 'student_payment_assignments' ? 'btn-primary' : 'btn-outline'}" onclick="CoeDeveloperView.showTable('student_payment_assignments')">
                assignments (${totalAssignments})
              </button>
              <button class="btn btn-xs ${this.activeTableTab === 'dispatched_emails' ? 'btn-primary' : 'btn-outline'}" onclick="CoeDeveloperView.showTable('dispatched_emails')">
                emails (${totalEmails})
              </button>
            </div>
            <div class="small text-muted font-mono">Table: ${this.activeTableTab}</div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive" style="max-height: 400px; overflow-y: auto;" id="dev-table-viewer-container">
              <!-- Dynamically populated -->
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: Live Audit Trail -->
      <div id="dev-tab-audit" class="dev-tab-content" style="display:none;">
        <div class="card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">Live Audit Stream</h2>
              <p class="card-subtitle">Immutable log entries recorded across all 4 roles.</p>
            </div>
            <button class="btn btn-xs btn-outline" onclick="CoeDeveloperView.renderAuditLogs()">
              <i class="fa-solid fa-rotate"></i> Refresh Feed
            </button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="data-table small">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Timestamp</th>
                    <th>User / Persona</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody id="dev-audit-table-body">
                  <!-- Populated by renderAuditLogs() -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: Masterlist Bulk Upload Sandbox -->
      <div id="dev-tab-bulk" class="dev-tab-content" style="display:none;">
        <div class="card">
          <div class="card-header flex-between">
            <div>
              <h2 class="card-title">Bulk Masterlist Ingestion Tester</h2>
              <p class="card-subtitle">Directly invoke or test the bulk student upload workflow.</p>
            </div>
            <button class="btn btn-sm btn-primary" onclick="CoeMasterlistUpload.openModal()">
              <i class="fa-solid fa-file-arrow-up"></i> Launch Bulk Upload Modal
            </button>
          </div>
          <div class="card-body">
            <div class="alert alert-info">
              <i class="fa-solid fa-circle-info"></i> As System Developer, you can test the bulk upload feature, download sample templates (.csv/.xlsx), and verify that records are correctly upserted and mapped to authorized fees.
            </div>
            <div class="mt-3 flex-gap">
              <button class="btn btn-outline" onclick="CoeMasterlistUpload.downloadTemplate('csv')">
                <i class="fa-solid fa-file-csv text-success"></i> Download Sample CSV
              </button>
              <button class="btn btn-outline" onclick="CoeMasterlistUpload.downloadTemplate('xlsx')">
                <i class="fa-solid fa-file-excel text-emerald"></i> Download Sample Excel (.xlsx)
              </button>
              <button class="btn btn-outline-primary" onclick="CoeDeveloperView.runSandboxTests()">
                <i class="fa-solid fa-flask-vial"></i> Open Visual Test Runner
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.showTable(this.activeTableTab);
    this.renderAuditLogs();
  },

  switchTab(tabName) {
    const tabs = ['tables', 'audit', 'bulk'];
    tabs.forEach(t => {
      const el = document.getElementById(`dev-tab-${t}`);
      const btn = document.getElementById(`dev-tab-btn-${t}`);
      if (el) el.style.display = t === tabName ? 'block' : 'none';
      if (btn) {
        if (t === tabName) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });
  },

  showTable(tableName) {
    this.activeTableTab = tableName;
    const container = document.getElementById('dev-table-viewer-container');
    if (!container) return;

    const rows = window.coepayDb.tables[tableName] || [];
    if (rows.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-muted">Table "${tableName}" is currently empty.</div>`;
      return;
    }

    const headers = Object.keys(rows[0]);
    container.innerHTML = `
      <table class="data-table small">
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.slice(0, 50).map(r => `
            <tr>
              ${headers.map(h => {
                let val = r[h];
                if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                return `<td>${val !== null && val !== undefined ? String(val) : '<span class="text-muted">null</span>'}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${rows.length > 50 ? `<div class="p-2 text-center text-muted small">Showing first 50 of ${rows.length} records.</div>` : ''}
    `;
  },

  renderAuditLogs() {
    const tbody = document.getElementById('dev-audit-table-body');
    if (!tbody) return;

    const logs = window.coepayDb.getAuditLogs(50);
    tbody.innerHTML = logs.map(l => `
      <tr>
        <td>#${l.log_id}</td>
        <td class="small text-muted">${l.created_at}</td>
        <td><strong>${l.username || 'System'}</strong> <span class="badge badge-light">${l.user_role || '-'}</span></td>
        <td><span class="action-tag action-${(l.action_type || '').toLowerCase()}">${l.action_type}</span></td>
        <td><code>${l.entity_name}</code> (${l.entity_id || '-'})</td>
        <td>${l.details}</td>
      </tr>
    `).join('');
  },

  exportDatabaseJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.coepayDb.tables, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `coepay_db_backup_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
    window.coeApp.showToast("Database JSON backup exported successfully!", "success");
  },

  runSandboxTests() {
    window.open('tests/sandbox_runner.html', '_blank');
  },

  dispatchAllDefaultPasswords() {
    if (typeof CoeAdminView !== 'undefined' && typeof CoeAdminView.dispatchDefaultPasswordsToAll === 'function') {
      CoeAdminView.dispatchDefaultPasswordsToAll();
    } else {
      const results = window.coepayDb.dispatchDefaultPasswordsToAllMasterlist();
      window.coeApp.showToast(`Dispatched default passwords to ${results.length} masterlist students!`, 'success');
      window.coeApp.updateEmailDispatchBadge();
    }
  }
};

window.CoeDeveloperView = CoeDeveloperView;
